import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

dotenv.config({ path: '.env.local' });

const sql = neon(process.env.POSTGRES_URL!);

async function migrate() {
  console.log('Cleaning up unused tables...\n');

  try {
    // Drop unused trip_gear_requirements table
    // This was replaced by the trip_gear table which has a better schema
    console.log('Dropping trip_gear_requirements table...');
    await sql`DROP TABLE IF EXISTS trip_gear_requirements CASCADE`;
    console.log('✓ Dropped trip_gear_requirements');

    // Drop the old trips table if it exists
    // This was replaced by user_trips which has more fields
    console.log('Dropping old trips table...');
    await sql`DROP TABLE IF EXISTS trips CASCADE`;
    console.log('✓ Dropped trips');

    // Drop unused indexes
    console.log('Dropping unused indexes...');
    await sql`DROP INDEX IF EXISTS idx_trip_gear_requirements_trip_id`;
    console.log('✓ Dropped idx_trip_gear_requirements_trip_id');

    console.log('\n✓ Cleanup completed!');
  } catch (error) {
    console.error('\n✗ Cleanup failed:', error);
    process.exit(1);
  }
}

migrate();
