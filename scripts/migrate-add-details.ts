import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

dotenv.config({ path: '.env.local' });

const POSTGRES_URL = process.env.POSTGRES_URL;

if (!POSTGRES_URL) {
  console.error('Error: POSTGRES_URL environment variable is not set');
  process.exit(1);
}

const sql = neon(POSTGRES_URL);

async function migrate() {
  console.log('Adding detail columns to gear_catalog...\n');

  try {
    await sql`ALTER TABLE gear_catalog ADD COLUMN IF NOT EXISTS description TEXT`;
    console.log('✓ Added description column');

    await sql`ALTER TABLE gear_catalog ADD COLUMN IF NOT EXISTS product_url TEXT`;
    console.log('✓ Added product_url column');

    await sql`ALTER TABLE gear_catalog ADD COLUMN IF NOT EXISTS reviews JSONB`;
    console.log('✓ Added reviews column (JSONB)');

    console.log('\n✓ Migration completed successfully!');
  } catch (error) {
    console.error('\n✗ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
