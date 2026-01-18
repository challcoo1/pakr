// app/api/backfill-weights/route.ts
// Backfill weight_g column - parse from specs, estimate with AI if needed

import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { parseWeightGrams } from '@/lib/parse-weight';
import OpenAI from 'openai';
import { readFileSync } from 'fs';
import { join } from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

function loadSkill(): string {
  const skillPath = join(process.cwd(), 'skills', 'gear-enrichment', 'SKILL.md');
  return readFileSync(skillPath, 'utf-8');
}

const GEAR_ENRICHMENT_SKILL = loadSkill();

export async function POST(request: Request) {
  try {
    const { estimateMissing = false } = await request.json().catch(() => ({}));

    // Step 1: Add columns if they don't exist
    await sql`
      ALTER TABLE gear_catalog
      ADD COLUMN IF NOT EXISTS weight_g INTEGER
    `;
    await sql`
      ALTER TABLE gear_catalog
      ADD COLUMN IF NOT EXISTS weight_estimated BOOLEAN DEFAULT false
    `;
    console.log('Ensured weight columns exist');

    // Step 2: Get all gear with specs
    const gear = await sql`
      SELECT id, name, category, specs, weight_g, weight_estimated
      FROM gear_catalog
      WHERE specs IS NOT NULL
    `;
    console.log(`Found ${gear.length} gear items to process`);

    let parsed = 0;
    let estimated = 0;
    let skipped = 0;
    const results: { name: string; specs: string; weight_g: number | null; estimated: boolean }[] = [];

    // Batch items needing estimation
    const needsEstimate: { id: string; name: string; category: string; specs: string }[] = [];

    // Step 3: Parse and update each item
    for (const item of gear) {
      let specsStr = '';
      if (typeof item.specs === 'string') {
        specsStr = item.specs;
      } else if (item.specs?.raw) {
        specsStr = item.specs.raw;
      } else if (typeof item.specs === 'object') {
        specsStr = JSON.stringify(item.specs);
      }

      const weightG = parseWeightGrams(specsStr);

      if (weightG !== null) {
        await sql`
          UPDATE gear_catalog
          SET weight_g = ${weightG}, weight_estimated = false
          WHERE id = ${item.id}
        `;
        parsed++;
        console.log(`Parsed ${item.name}: ${weightG}g`);
        results.push({ name: item.name, specs: specsStr.substring(0, 50), weight_g: weightG, estimated: false });
      } else if (estimateMissing && !item.weight_g) {
        // Queue for AI estimation
        needsEstimate.push({ id: item.id, name: item.name, category: item.category, specs: specsStr });
      } else {
        skipped++;
        results.push({ name: item.name, specs: specsStr.substring(0, 50), weight_g: item.weight_g, estimated: item.weight_estimated });
      }
    }

    // Step 4: Estimate missing weights with AI in batches
    if (estimateMissing && needsEstimate.length > 0) {
      console.log(`Estimating weights for ${needsEstimate.length} items...`);

      // Process in batches of 20
      for (let i = 0; i < needsEstimate.length; i += 20) {
        const batch = needsEstimate.slice(i, i + 20);
        const estimates = await estimateWeights(batch);

        for (const est of estimates) {
          if (est.weight_g) {
            await sql`
              UPDATE gear_catalog
              SET weight_g = ${est.weight_g}, weight_estimated = true
              WHERE id = ${est.id}
            `;
            estimated++;
            console.log(`Estimated ${est.name}: ~${est.weight_g}g`);
            results.push({ name: est.name, specs: '', weight_g: est.weight_g, estimated: true });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      total: gear.length,
      parsed,
      estimated,
      skipped: skipped + (needsEstimate.length - estimated),
      results
    });

  } catch (error) {
    console.error('Backfill error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

async function estimateWeights(items: { id: string; name: string; category: string; specs: string }[]): Promise<{ id: string; name: string; weight_g: number | null; confidence?: string }[]> {
  try {
    const prompt = `You are a gear weight estimation expert. Using the WEIGHT ESTIMATION section of the skill below, estimate weights for these items.

${GEAR_ENRICHMENT_SKILL}

---

Items to estimate:
${items.map((item, i) => `${i + 1}. ${item.name} (${item.category || 'gear'}) - ${item.specs.substring(0, 150)}`).join('\n')}

Return JSON object with estimates array:
{
  "estimates": [
    {"index": 0, "weight_g": 180, "confidence": "medium", "basis": "Similar merino base layers"},
    {"index": 1, "weight_g": null, "confidence": null, "basis": "Insufficient reference data"}
  ]
}

Rules:
- Estimate for Medium/Regular size
- Round to nearest 5g
- Use null if no reasonable estimate possible
- Include confidence: "high", "medium", or "low"`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content || '';
    const parsed = JSON.parse(content);
    const estimates = parsed.estimates || [];

    // Map back to our items by index
    return items.map((item, i) => {
      const est = estimates.find((e: any) => e.index === i) || estimates[i];
      return {
        id: item.id,
        name: item.name,
        weight_g: est?.weight_g || null,
        confidence: est?.confidence || null
      };
    });
  } catch (error) {
    console.error('AI estimation error:', error);
    return items.map(item => ({ id: item.id, name: item.name, weight_g: null }));
  }
}

// GET to check current state
export async function GET() {
  try {
    const stats = await sql`
      SELECT
        COUNT(*) as total,
        COUNT(weight_g) as with_weight,
        COUNT(*) - COUNT(weight_g) as without_weight
      FROM gear_catalog
    `;

    const samples = await sql`
      SELECT name, specs, weight_g
      FROM gear_catalog
      LIMIT 10
    `;

    return NextResponse.json({
      stats: stats[0],
      samples: samples.map((s: any) => ({
        name: s.name,
        specs: typeof s.specs === 'object' ? s.specs?.raw || JSON.stringify(s.specs) : s.specs,
        weight_g: s.weight_g
      }))
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
