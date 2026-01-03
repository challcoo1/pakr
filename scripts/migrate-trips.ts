import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

dotenv.config({ path: '.env.local' });

const sql = neon(process.env.POSTGRES_URL!);

async function migrate() {
  console.log('Creating trips tables...\n');

  try {
    // User trips - saved trip setups
    await sql`
      CREATE TABLE IF NOT EXISTS user_trips (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        trip_name TEXT NOT NULL,
        trip_region TEXT,
        trip_duration TEXT,
        trip_terrain TEXT,
        trip_conditions JSONB,
        trip_grading JSONB,
        trip_hazards TEXT,
        status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'completed', 'cancelled')),
        planned_date DATE,
        completed_date DATE,
        actual_duration TEXT,
        notes TEXT,
        missing_gear JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    console.log('✓ Created user_trips table');

    // Trip gear - gear linked to each trip
    await sql`
      CREATE TABLE IF NOT EXISTS trip_gear (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id UUID NOT NULL REFERENCES user_trips(id) ON DELETE CASCADE,
        gear_catalog_id UUID REFERENCES gear_catalog(id),
        user_gear_id UUID REFERENCES user_gear(id),
        gear_name TEXT NOT NULL,
        gear_category TEXT,
        is_owned BOOLEAN DEFAULT false,
        is_recommended BOOLEAN DEFAULT false,
        added_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    console.log('✓ Created trip_gear table');

    // Indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_user_trips_user ON user_trips(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_trips_status ON user_trips(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_trip_gear_trip ON trip_gear(trip_id)`;
    console.log('✓ Created indexes');

    console.log('\n✓ Migration completed!');
  } catch (error) {
    console.error('\n✗ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
