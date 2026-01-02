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
  console.log('Adding auth columns to users table...\n');

  try {
    // Add OAuth columns to users table
    console.log('Adding image column...');
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS image TEXT`;

    console.log('Adding provider column...');
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS provider TEXT`;

    console.log('Adding provider_id column...');
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS provider_id TEXT`;

    console.log('Adding updated_at column...');
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`;

    console.log('\n✓ Auth migration completed successfully!');
  } catch (error) {
    console.error('\n✗ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
