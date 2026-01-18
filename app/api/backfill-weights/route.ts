// app/api/backfill-weights/route.ts
// One-time backfill of weight_g column from specs strings

import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { parseWeightGrams } from '@/lib/parse-weight';

export async function POST() {
  try {
    // Step 1: Add weight_g column if it doesn't exist
    await sql`
      ALTER TABLE gear_catalog
      ADD COLUMN IF NOT EXISTS weight_g INTEGER
    `;
    console.log('Ensured weight_g column exists');

    // Step 2: Get all gear with specs
    const gear = await sql`
      SELECT id, name, specs
      FROM gear_catalog
      WHERE specs IS NOT NULL
    `;
    console.log(`Found ${gear.length} gear items to process`);

    let updated = 0;
    let skipped = 0;
    const results: { name: string; specs: string; weight_g: number | null }[] = [];

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

      results.push({
        name: item.name,
        specs: specsStr.substring(0, 50),
        weight_g: weightG
      });

      if (weightG !== null) {
        await sql`
          UPDATE gear_catalog
          SET weight_g = ${weightG}
          WHERE id = ${item.id}
        `;
        updated++;
        console.log(`Updated ${item.name}: ${weightG}g`);
      } else {
        skipped++;
        console.log(`Skipped ${item.name}: no weight found in "${specsStr.substring(0, 30)}..."`);
      }
    }

    return NextResponse.json({
      success: true,
      total: gear.length,
      updated,
      skipped,
      results
    });

  } catch (error) {
    console.error('Backfill error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
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
