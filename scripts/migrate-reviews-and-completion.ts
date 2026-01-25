import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

dotenv.config({ path: '.env.local' });

const sql = neon(process.env.POSTGRES_URL!);

// Helper to safely add a column (ignores if exists)
async function addColumnIfNotExists(table: string, column: string, type: string) {
  try {
    // Check if column exists
    const result = await sql`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = ${table} AND column_name = ${column}
    `;

    if (result.length > 0) {
      console.log(`○ ${table}.${column} already exists`);
      return;
    }

    // Add column using raw SQL (type contains CHECK constraints)
    await sql.unsafe(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
    console.log(`✓ Added ${table}.${column}`);
  } catch (e: any) {
    if (e.message?.includes('already exists')) {
      console.log(`○ ${table}.${column} already exists`);
    } else {
      throw e;
    }
  }
}

async function migrate() {
  console.log('Adding gear reviews table and trip completion fields...\n');

  try {
    // 1. Create gear_reviews table
    await sql`
      CREATE TABLE IF NOT EXISTS gear_reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        gear_id UUID NOT NULL REFERENCES gear_catalog(id) ON DELETE CASCADE,
        trip_id UUID REFERENCES user_trips(id) ON DELETE SET NULL,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        title TEXT,
        review TEXT,
        conditions TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, gear_id)
      )
    `;
    console.log('✓ Created gear_reviews table');

    // Create indexes for gear_reviews
    await sql`CREATE INDEX IF NOT EXISTS idx_gear_reviews_user ON gear_reviews(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_gear_reviews_gear ON gear_reviews(gear_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_gear_reviews_trip ON gear_reviews(trip_id)`;
    console.log('✓ Created gear_reviews indexes');

    // 2. Add missing columns to user_trips for trip completion
    await addColumnIfNotExists('user_trips', 'completion_status', "TEXT CHECK (completion_status IN ('full', 'partial', 'bailed'))");
    await addColumnIfNotExists('user_trips', 'trail_rating', 'INTEGER CHECK (trail_rating >= 1 AND trail_rating <= 5)');
    await addColumnIfNotExists('user_trips', 'trail_review', 'TEXT');
    await addColumnIfNotExists('user_trips', 'max_elevation', 'NUMERIC');
    await addColumnIfNotExists('user_trips', 'conditions_encountered', 'TEXT');

    // 3. Add missing columns to trip_gear for gear usage tracking
    await addColumnIfNotExists('trip_gear', 'was_used', 'BOOLEAN');
    await addColumnIfNotExists('trip_gear', 'would_bring_again', 'BOOLEAN');
    await addColumnIfNotExists('trip_gear', 'usage_notes', 'TEXT');

    console.log('\n✓ Migration completed!');
  } catch (error) {
    console.error('\n✗ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
