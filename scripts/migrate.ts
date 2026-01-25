import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

// Load .env.local (Next.js convention)
dotenv.config({ path: '.env.local' });

const POSTGRES_URL = process.env.POSTGRES_URL;

if (!POSTGRES_URL) {
  console.error('Error: POSTGRES_URL environment variable is not set');
  console.error('Please create a .env.local file with your POSTGRES_URL');
  process.exit(1);
}

const sql = neon(POSTGRES_URL);

async function migrate() {
  console.log('Starting database migration...\n');

  try {
    // Enable uuid-ossp extension for UUID generation
    console.log('Enabling uuid-ossp extension...');
    await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

    // 1. Users table
    console.log('Creating users table...');
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        country TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // 2. Gear catalog table
    console.log('Creating gear_catalog table...');
    await sql`
      CREATE TABLE IF NOT EXISTS gear_catalog (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        category TEXT,
        manufacturer TEXT,
        specs JSONB,
        pricing JSONB,
        reviews JSONB,
        enriched_at TIMESTAMP
      )
    `;

    // 3. User gear table
    console.log('Creating user_gear table...');
    await sql`
      CREATE TABLE IF NOT EXISTS user_gear (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        gear_id UUID REFERENCES gear_catalog(id) ON DELETE CASCADE,
        acquired_date DATE,
        condition TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // 4. User trips table (renamed from trips with enhanced schema)
    console.log('Creating user_trips table...');
    await sql`
      CREATE TABLE IF NOT EXISTS user_trips (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        trip_name TEXT NOT NULL,
        trip_region TEXT,
        trip_duration TEXT,
        trip_terrain TEXT,
        trip_conditions JSONB,
        trip_grading JSONB,
        trip_hazards TEXT,
        status TEXT DEFAULT 'planned',
        planned_date DATE,
        completed_date DATE,
        actual_duration TEXT,
        notes TEXT,
        missing_gear JSONB,
        completion_status TEXT CHECK (completion_status IN ('full', 'partial', 'bailed')),
        trail_rating INTEGER CHECK (trail_rating >= 1 AND trail_rating <= 5),
        trail_review TEXT,
        max_elevation NUMERIC,
        conditions_encountered TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // 5. Trip gear table
    console.log('Creating trip_gear table...');
    await sql`
      CREATE TABLE IF NOT EXISTS trip_gear (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        trip_id UUID REFERENCES user_trips(id) ON DELETE CASCADE,
        gear_catalog_id UUID REFERENCES gear_catalog(id) ON DELETE SET NULL,
        user_gear_id UUID REFERENCES user_gear(id) ON DELETE SET NULL,
        gear_name TEXT NOT NULL,
        gear_category TEXT,
        is_owned BOOLEAN DEFAULT false,
        is_recommended BOOLEAN DEFAULT false,
        was_used BOOLEAN,
        would_bring_again BOOLEAN,
        usage_notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // 6. Gear reviews table
    console.log('Creating gear_reviews table...');
    await sql`
      CREATE TABLE IF NOT EXISTS gear_reviews (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        gear_id UUID NOT NULL REFERENCES gear_catalog(id) ON DELETE CASCADE,
        trip_id UUID REFERENCES user_trips(id) ON DELETE SET NULL,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        title TEXT,
        review TEXT,
        conditions TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, gear_id)
      )
    `;

    // 7. User profile signals table
    console.log('Creating user_profile_signals table...');
    await sql`
      CREATE TABLE IF NOT EXISTS user_profile_signals (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        price_sensitivity TEXT,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create indexes for common queries
    console.log('Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_user_gear_user_id ON user_gear(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_gear_gear_id ON user_gear(gear_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_trips_user_id ON user_trips(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_trip_gear_trip_id ON trip_gear(trip_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_gear_catalog_category ON gear_catalog(category)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_gear_reviews_user ON gear_reviews(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_gear_reviews_gear ON gear_reviews(gear_id)`;

    console.log('\n✓ Database migration completed successfully!');
  } catch (error) {
    console.error('\n✗ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
