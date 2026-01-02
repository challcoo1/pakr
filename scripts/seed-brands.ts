import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';
import OpenAI from 'openai';
import { readFileSync } from 'fs';
import { join } from 'path';

dotenv.config({ path: '.env.local' });

const sql = neon(process.env.POSTGRES_URL!);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const SKILL = readFileSync(join(process.cwd(), 'skills', 'gear-search', 'SKILL.md'), 'utf-8');

const BRANDS = ['Arc\'teryx', 'Patagonia', 'The North Face', 'Osprey', 'Salomon', 'Black Diamond'];
const CATEGORIES = ['jackets', 'footwear', 'backpacks', 'sleeping bags', 'tents'];

async function searchProducts(brand: string, category: string): Promise<any[]> {
  try {
    const prompt = `Query: "${brand} ${category}"\n\nFind current products available for purchase.`;

    const response = await openai.responses.create({
      model: 'gpt-4o',
      tools: [{ type: 'web_search' as const }],
      input: [
        { role: 'system', content: SKILL },
        { role: 'user', content: prompt }
      ],
    });

    const textOutput = (response.output as any[]).find((o: any) => o.type === 'message');
    if (textOutput?.content) {
      const content = textOutput.content.map((c: any) => c.text).join('');
      const jsonMatch = content.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch {
          // Try to find a valid JSON array
          const lines = content.split('\n');
          let jsonStr = '';
          let inArray = false;
          let bracketCount = 0;

          for (const line of lines) {
            if (line.includes('[')) inArray = true;
            if (inArray) {
              jsonStr += line + '\n';
              bracketCount += (line.match(/\[/g) || []).length;
              bracketCount -= (line.match(/\]/g) || []).length;
              if (bracketCount === 0 && jsonStr.trim()) {
                try {
                  return JSON.parse(jsonStr);
                } catch {
                  continue;
                }
              }
            }
          }
        }
      }
    }
    return [];
  } catch (error) {
    console.error(`Error searching ${brand} ${category}:`, error);
    return [];
  }
}

async function insertGear(product: any, category: string) {
  try {
    // Check if exists
    const existing = await sql`
      SELECT id FROM gear_catalog WHERE LOWER(name) = ${product.name.toLowerCase()} LIMIT 1
    `;

    if (existing.length > 0) {
      console.log(`  Skip (exists): ${product.name}`);
      return;
    }

    await sql`
      INSERT INTO gear_catalog (name, manufacturer, category, specs)
      VALUES (${product.name}, ${product.brand}, ${category}, ${JSON.stringify({ summary: product.specs })})
    `;
    console.log(`  Added: ${product.name}`);
  } catch (error) {
    console.error(`  Error inserting ${product.name}:`, error);
  }
}

async function seed() {
  console.log('Seeding database with popular brands...\n');

  for (const brand of BRANDS) {
    console.log(`\n${brand}:`);

    for (const category of CATEGORIES) {
      console.log(`  Searching ${category}...`);
      const products = await searchProducts(brand, category);

      for (const product of products) {
        await insertGear(product, category);
      }

      // Small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  console.log('\n✓ Seeding complete!');
}

seed();
