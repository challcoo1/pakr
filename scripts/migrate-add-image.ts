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
  console.log('Adding image_url column to gear_catalog...\n');

  try {
    await sql`ALTER TABLE gear_catalog ADD COLUMN IF NOT EXISTS image_url TEXT`;
    console.log('✓ Added image_url column to gear_catalog');

    await sql`ALTER TABLE gear_catalog ADD COLUMN IF NOT EXISTS subcategory TEXT`;
    console.log('✓ Added subcategory column to gear_catalog');

    await sql`ALTER TABLE gear_catalog ADD COLUMN IF NOT EXISTS gender TEXT`;
    console.log('✓ Added gender column to gear_catalog');

    console.log('\n✓ Migration completed successfully!');
  } catch (error) {
    console.error('\n✗ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
