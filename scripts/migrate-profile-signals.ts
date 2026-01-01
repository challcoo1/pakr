import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

dotenv.config({ path: '.env.local' });

const sql = neon(process.env.POSTGRES_URL!);

async function migrate() {
  console.log('Expanding user_profile_signals table...\n');

  try {
    // Add new columns if they don't exist
    await sql`
      ALTER TABLE user_profile_signals
      ADD COLUMN IF NOT EXISTS expertise_level TEXT,
      ADD COLUMN IF NOT EXISTS preferred_brands JSONB DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS activity_types JSONB DEFAULT '[]',
      ADD COLUMN IF NOT EXISTS gear_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS profile_data JSONB DEFAULT '{}'
    `;

    console.log('✓ user_profile_signals table expanded successfully!');
  } catch (error) {
    console.error('✗ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
