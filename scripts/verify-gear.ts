import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

dotenv.config({ path: '.env.local' });

const sql = neon(process.env.POSTGRES_URL!);

async function verifyGear() {
  const result = await sql`
    SELECT id, name, category, manufacturer, enriched_at,
           specs->>'waterproofing' as waterproofing,
           specs->'weight'->>'value' as weight_value,
           specs->'weight'->>'unit' as weight_unit,
           jsonb_array_length(reviews->'sources') as review_count
    FROM gear_catalog
    WHERE name = 'La Sportiva Trango Tower GTX'
  `;

  console.log('✓ Verified in database:\n');
  console.table(result);
}

verifyGear();
