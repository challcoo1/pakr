import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

dotenv.config({ path: '.env.local' });

const sql = neon(process.env.POSTGRES_URL!);

// Normalize a gear name for matching
// Removes punctuation, extra spaces, common suffixes, and lowercases
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[''`]/g, '')        // Remove apostrophes
    .replace(/[^a-z0-9\s]/g, ' ') // Replace other punctuation with space
    .replace(/\s+/g, ' ')         // Collapse multiple spaces
    .trim();
}

async function migrate() {
  console.log('Adding normalized_name column for deduplication...\n');

  try {
    // 1. Add normalized_name column if it doesn't exist
    const columnExists = await sql`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'gear_catalog' AND column_name = 'normalized_name'
    `;

    if (columnExists.length === 0) {
      console.log('Adding normalized_name column...');
      await sql`ALTER TABLE gear_catalog ADD COLUMN normalized_name TEXT`;
      console.log('✓ Added normalized_name column');
    } else {
      console.log('○ normalized_name column already exists');
    }

    // 2. Populate normalized_name for existing records
    console.log('Fetching existing gear...');
    const gear = await sql`SELECT id, name FROM gear_catalog WHERE normalized_name IS NULL`;
    console.log(`Found ${gear.length} items to update`);

    for (const item of gear) {
      const normalized = normalizeName(item.name);
      await sql`UPDATE gear_catalog SET normalized_name = ${normalized} WHERE id = ${item.id}`;
    }
    console.log('✓ Updated normalized names');

    // 3. Find and merge duplicates
    console.log('\nFinding duplicates...');
    const duplicates = await sql`
      SELECT normalized_name, array_agg(id) as ids, array_agg(name) as names
      FROM gear_catalog
      WHERE normalized_name IS NOT NULL
      GROUP BY normalized_name
      HAVING COUNT(*) > 1
    `;

    if (duplicates.length === 0) {
      console.log('○ No duplicates found');
    } else {
      console.log(`Found ${duplicates.length} duplicate groups:`);
      for (const dup of duplicates) {
        console.log(`  - "${dup.normalized_name}": ${dup.names.join(', ')}`);

        // Keep the first ID, merge others into it
        const keepId = dup.ids[0];
        const removeIds = dup.ids.slice(1);

        // Update references in user_gear
        for (const removeId of removeIds) {
          await sql`UPDATE user_gear SET gear_id = ${keepId} WHERE gear_id = ${removeId}`;
          await sql`UPDATE trip_gear SET gear_catalog_id = ${keepId} WHERE gear_catalog_id = ${removeId}`;
          await sql`UPDATE gear_reviews SET gear_id = ${keepId} WHERE gear_id = ${removeId}`;
        }

        // Delete duplicate entries
        for (const removeId of removeIds) {
          await sql`DELETE FROM gear_catalog WHERE id = ${removeId}`;
        }
        console.log(`    ✓ Merged into ${keepId}`);
      }
    }

    // 4. Create unique index on normalized_name to prevent future duplicates
    console.log('\nCreating unique index...');
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_gear_catalog_normalized_name ON gear_catalog(normalized_name)`;
    console.log('✓ Created unique index');

    console.log('\n✓ Deduplication migration completed!');
  } catch (error) {
    console.error('\n✗ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
