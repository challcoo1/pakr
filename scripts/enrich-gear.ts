// scripts/enrich-gear.ts
// Backfill missing images, descriptions, and reviews for existing gear

import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';
import OpenAI from 'openai';
import { readFileSync } from 'fs';
import { join } from 'path';

dotenv.config({ path: '.env.local' });

const POSTGRES_URL = process.env.POSTGRES_URL;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!POSTGRES_URL || !OPENAI_API_KEY) {
  console.error('Error: POSTGRES_URL and OPENAI_API_KEY required');
  process.exit(1);
}

const sql = neon(POSTGRES_URL);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const SKILL = readFileSync(join(process.cwd(), 'skills', 'gear-search', 'SKILL.md'), 'utf-8');

async function enrichGear() {
  console.log('Finding gear items missing enrichment data...\n');

  // Find items missing image_url OR description OR reviews
  const items = await sql`
    SELECT id, name, manufacturer, category, image_url, description, reviews
    FROM gear_catalog
    WHERE image_url IS NULL
       OR description IS NULL
       OR reviews IS NULL
    ORDER BY name
  `;

  console.log(`Found ${items.length} items to enrich\n`);

  for (const item of items) {
    console.log(`\nEnriching: ${item.name}`);
    console.log(`  - Has image: ${!!item.image_url}`);
    console.log(`  - Has description: ${!!item.description}`);
    console.log(`  - Has reviews: ${!!item.reviews}`);

    try {
      const enriched = await fetchEnrichment(item.name, item.manufacturer);

      if (enriched) {
        await sql`
          UPDATE gear_catalog SET
            image_url = COALESCE(NULLIF(${enriched.imageUrl || null}, ''), image_url),
            description = COALESCE(NULLIF(${enriched.description || null}, ''), description),
            product_url = COALESCE(NULLIF(${enriched.productUrl || null}, ''), product_url),
            reviews = COALESCE(${enriched.reviews ? JSON.stringify(enriched.reviews) : null}::jsonb, reviews),
            category = COALESCE(NULLIF(${enriched.category || null}, ''), category),
            subcategory = COALESCE(NULLIF(${enriched.subcategory || null}, ''), subcategory),
            gender = COALESCE(NULLIF(${enriched.gender || null}, ''), gender)
          WHERE id = ${item.id}
        `;
        console.log(`  ✓ Updated with:`);
        console.log(`    - Image: ${enriched.imageUrl ? 'Yes' : 'No'}`);
        console.log(`    - Description: ${enriched.description ? 'Yes' : 'No'}`);
        console.log(`    - Reviews: ${enriched.reviews?.length || 0}`);
      } else {
        console.log(`  ✗ No enrichment data found`);
      }
    } catch (error) {
      console.error(`  ✗ Error:`, error);
    }

    // Rate limit - wait between requests
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log('\n\nEnrichment complete!');
}

async function fetchEnrichment(name: string, brand?: string) {
  const query = brand ? `${brand} ${name}` : name;

  const prompt = `Query: "${query}"

Find this specific product and return its details. I need the exact product, not alternatives.`;

  try {
    const response = await openai.responses.create({
      model: 'gpt-4o',
      tools: [{ type: 'web_search' }],
      input: [
        { role: 'system', content: SKILL },
        { role: 'user', content: prompt }
      ],
    });

    const textOutput = (response.output as any[]).find((o: any) => o.type === 'message');
    if (textOutput?.content) {
      const content = textOutput.content.map((c: any) => c.text).join('');
      const extracted = extractJsonArray(content);
      if (extracted) {
        const parsed = JSON.parse(extracted);
        // Return first match (should be the product we asked for)
        return parsed[0] || null;
      }
    }
  } catch (error) {
    console.error('LLM error:', error);
  }

  return null;
}

function extractJsonArray(text: string): string | null {
  const startIdx = text.indexOf('[');
  if (startIdx === -1) return null;

  let bracketCount = 0;
  let inString = false;
  let escape = false;

  for (let i = startIdx; i < text.length; i++) {
    const char = text[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (char === '\\' && inString) {
      escape = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === '[') bracketCount++;
      if (char === ']') bracketCount--;

      if (bracketCount === 0) {
        return text.slice(startIdx, i + 1);
      }
    }
  }

  return null;
}

enrichGear();
