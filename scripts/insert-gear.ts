import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

dotenv.config({ path: '.env.local' });

const sql = neon(process.env.POSTGRES_URL!);

const gearData = {
  name: "La Sportiva Trango Tower GTX",
  category: "footwear/alpine_boots/4_season",
  manufacturer: "La Sportiva",
  specs: {
    weight: {
      value: 745,
      unit: "g",
      per: "boot",
      size_reference: "EU 42"
    },
    materials: {
      upper: "High tenacity Nylon with Honey-Comb Guard and Flextec3",
      lining: "Gore-Tex Performance Comfort",
      midsole: "PU with EVA inserts",
      outsole: "Vibram Cube with Impact Brake System"
    },
    waterproofing: "Gore-Tex membrane",
    crampon_compatibility: "semi-automatic",
    ankle_system: "3D Flex",
    insole: "4mm graded Nylon",
    use_cases: [
      "alpine climbing",
      "via ferrata",
      "glacier travel",
      "winter hillwalking",
      "scrambling"
    ]
  },
  reviews: {
    consensus: {
      pros: [
        "Excellent grip on rock and mixed terrain",
        "Lightweight for the category (745g/boot)",
        "Precise feel and edging capability",
        "Versatile 3-season performance",
        "Good ankle support with lateral flexibility"
      ],
      cons: [
        "Outsole wears relatively quickly",
        "Limited insulation for extreme cold",
        "Premium price point"
      ],
      best_for: "3-season alpine climbing, technical scrambling, via ferrata, and glacier travel where weight matters",
      not_ideal_for: "Extreme cold conditions or extended winter expeditions requiring maximum insulation"
    },
    sources: [
      {
        publication: "Advnture",
        credibility_tier: 2,
        rating: "4.5/5",
        url: "https://www.advnture.com/reviews/la-sportiva-trango-tower-gtx"
      },
      {
        publication: "UK Climbing",
        credibility_tier: 2,
        rating: "Recommended",
        url: "https://www.ukclimbing.com/gear/footwear/mountain_boots/la_sportiva_trango_tower_gtx-9600"
      },
      {
        publication: "Weigh My Rack",
        credibility_tier: 3,
        rating: "N/A",
        url: "https://weighmyrack.com/MountaineeringBoot/la-sportiva-trango-tower-gtx"
      }
    ]
  }
};

async function insertGear() {
  console.log('Inserting gear into database...\n');
  console.log('Data:', JSON.stringify(gearData, null, 2));
  console.log('\n');

  try {
    const result = await sql`
      INSERT INTO gear_catalog (name, category, manufacturer, specs, reviews, enriched_at)
      VALUES (
        ${gearData.name},
        ${gearData.category},
        ${gearData.manufacturer},
        ${JSON.stringify(gearData.specs)},
        ${JSON.stringify(gearData.reviews)},
        NOW()
      )
      RETURNING *
    `;

    console.log('✓ Gear inserted successfully!\n');
    console.log('Inserted record:');
    console.log(JSON.stringify(result[0], null, 2));
  } catch (error) {
    console.error('✗ Insert failed:', error);
    process.exit(1);
  }
}

insertGear();
