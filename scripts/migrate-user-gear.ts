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
  console.log('Adding columns to user_gear table...\n');

  try {
    // Add category column (user can override catalog category)
    console.log('Adding category column...');
    await sql`ALTER TABLE user_gear ADD COLUMN IF NOT EXISTS category TEXT`;

    // Add subcategory column (activity type: Run, Alpine, etc.)
    console.log('Adding subcategory column...');
    await sql`ALTER TABLE user_gear ADD COLUMN IF NOT EXISTS subcategory TEXT`;

    // Add gender column (Men, Women, Unisex)
    console.log('Adding gender column...');
    await sql`ALTER TABLE user_gear ADD COLUMN IF NOT EXISTS gender TEXT`;

    // Add notes column
    console.log('Adding notes column...');
    await sql`ALTER TABLE user_gear ADD COLUMN IF NOT EXISTS notes TEXT`;

    // Add unique constraint to prevent duplicates
    console.log('Adding unique constraint...');
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_user_gear_unique
      ON user_gear(user_id, gear_id)
    `;

    console.log('\n✓ User gear migration completed successfully!');
  } catch (error) {
    console.error('\n✗ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
