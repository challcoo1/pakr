/**
 * Test script for profile learning system
 * Run with: npx tsx scripts/test-profile-learning.ts
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.POSTGRES_URL!);

// Inline the analysis functions for testing
// (In production, import from lib/profile-learning)

const BRAND_TIERS: Record<string, 'premium' | 'mid' | 'budget'> = {
  "Arc'teryx": 'premium',
  'La Sportiva': 'premium',
  'Petzl': 'premium',
  'Black Diamond': 'premium',
  'Osprey': 'mid',
  'Salomon': 'mid',
  'Mammut': 'mid',
  'Macpac': 'budget',
  'Kathmandu': 'budget',
};

async function testProfileLearning() {
  console.log('=== Profile Learning System Test ===\n');

  // 1. Create a test user
  console.log('1. Creating test user...');
  const [user] = await sql`
    INSERT INTO users (email, name, country)
    VALUES ('test-profile@example.com', 'Test User', 'AU')
    ON CONFLICT (email) DO UPDATE SET name = 'Test User'
    RETURNING id, email
  `;
  console.log(`   User: ${user.email} (${user.id})\n`);

  // 2. Add some test gear to catalog
  console.log('2. Adding test gear to catalog...');

  const testGear = [
    {
      name: "Arc'teryx Alpha SV Jacket",
      category: 'clothing/shells/hardshell',
      manufacturer: "Arc'teryx",
    },
    {
      name: "Arc'teryx Beta AR Pants",
      category: 'clothing/shells/hardshell',
      manufacturer: "Arc'teryx",
    },
    {
      name: 'Petzl Sirocco Helmet',
      category: 'climbing/helmet',
      manufacturer: 'Petzl',
    },
    {
      name: 'Black Diamond Sabretooth Crampons',
      category: 'climbing/crampons',
      manufacturer: 'Black Diamond',
    },
    {
      name: 'Osprey Atmos AG 65',
      category: 'packs/backpacks/multiday',
      manufacturer: 'Osprey',
    },
  ];

  const gearIds: string[] = [];
  for (const gear of testGear) {
    const [inserted] = await sql`
      INSERT INTO gear_catalog (name, category, manufacturer, specs)
      VALUES (${gear.name}, ${gear.category}, ${gear.manufacturer}, '{}')
      ON CONFLICT DO NOTHING
      RETURNING id
    `;
    if (inserted) {
      gearIds.push(inserted.id);
      console.log(`   Added: ${gear.name}`);
    } else {
      // Get existing
      const [existing] = await sql`
        SELECT id FROM gear_catalog WHERE name = ${gear.name}
      `;
      if (existing) gearIds.push(existing.id);
    }
  }

  // 3. Add gear to user's collection
  console.log('\n3. Adding gear to user collection...');
  for (const gearId of gearIds) {
    await sql`
      INSERT INTO user_gear (user_id, gear_id, condition)
      VALUES (${user.id}, ${gearId}, 'good')
      ON CONFLICT DO NOTHING
    `;
  }
  console.log(`   Added ${gearIds.length} items to user's gear\n`);

  // 4. Analyze user's gear
  console.log('4. Analyzing user gear...');
  const gearItems = await sql`
    SELECT
      gc.name,
      gc.category,
      gc.manufacturer
    FROM user_gear ug
    JOIN gear_catalog gc ON ug.gear_id = gc.id
    WHERE ug.user_id = ${user.id}
  `;

  console.log('\n   User\'s gear:');
  for (const item of gearItems) {
    const tier = BRAND_TIERS[item.manufacturer] || 'mid';
    console.log(`   - ${item.name} (${item.manufacturer}) [${tier}]`);
  }

  // 5. Calculate profile
  console.log('\n5. Inferred Profile:');

  // Count brand tiers
  const tierCounts = { premium: 0, mid: 0, budget: 0 };
  const brandCounts: Record<string, number> = {};

  for (const item of gearItems) {
    const tier = BRAND_TIERS[item.manufacturer] || 'mid';
    tierCounts[tier]++;
    brandCounts[item.manufacturer] = (brandCounts[item.manufacturer] || 0) + 1;
  }

  // Determine price sensitivity
  const total = gearItems.length;
  let priceSensitivity: string;
  if (tierCounts.premium / total >= 0.5) priceSensitivity = 'premium';
  else if (tierCounts.budget / total >= 0.5) priceSensitivity = 'budget';
  else priceSensitivity = 'mid';

  // Determine expertise (has crampons = advanced)
  const hasAdvancedGear = gearItems.some((g: { category: string }) =>
    g.category?.includes('crampons') || g.category?.includes('ice_axe')
  );
  const expertiseLevel = hasAdvancedGear ? 'advanced' : 'intermediate';

  // Get top brands
  const topBrands = Object.entries(brandCounts)
    .filter(([_, count]) => count >= 2)
    .sort(([, a], [, b]) => b - a)
    .map(([brand]) => brand);

  console.log(`   Price Sensitivity: ${priceSensitivity}`);
  console.log(`   Expertise Level: ${expertiseLevel}`);
  console.log(`   Brand Affinity: ${JSON.stringify(brandCounts)}`);
  console.log(`   Top Brands (2+ items): ${topBrands.join(', ') || 'None yet'}`);
  console.log(`   Gear Count: ${total}`);

  // 6. What this means for recommendations
  console.log('\n6. Recommendation implications:');
  console.log(`   → Show Arc'teryx options first (owns 2+ items)`);
  console.log(`   → Filter to premium tier by default`);
  console.log(`   → Include technical/advanced gear options`);

  // Cleanup
  console.log('\n7. Cleaning up test data...');
  await sql`DELETE FROM user_gear WHERE user_id = ${user.id}`;
  await sql`DELETE FROM users WHERE id = ${user.id}`;
  console.log('   Done!\n');

  console.log('=== Test Complete ===');
}

testProfileLearning().catch(console.error);
