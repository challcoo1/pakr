// scripts/enrich-images.ts
// Focused: just get product images from manufacturer sites

import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';
import OpenAI from 'openai';

dotenv.config({ path: '.env.local' });

const sql = neon(process.env.POSTGRES_URL!);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

async function enrichImages() {
  console.log('Finding gear missing images...\n');

  const items = await sql`
    SELECT id, name, manufacturer
    FROM gear_catalog
    WHERE image_url IS NULL
    ORDER BY name
    LIMIT 20
  `;

  console.log(`Processing ${items.length} items\n`);

  for (const item of items) {
    const searchName = item.manufacturer
      ? `${item.manufacturer} ${item.name}`
      : item.name;

    console.log(`\n${searchName}`);

    try {
      const response = await openai.responses.create({
        model: 'gpt-4o-mini',
        tools: [{ type: 'web_search' }],
        input: [
          {
            role: 'system',
            content: 'Find the official product image URL. Return ONLY a JSON object: {"imageUrl": "https://..."} or {"imageUrl": null} if not found. Use manufacturer site (arcteryx.com, patagonia.com, etc) or REI/Backcountry. Must be direct image URL ending in .jpg/.png/.webp'
          },
          { role: 'user', content: `Find product image for: ${searchName}` }
        ],
      });

      const textOutput = (response.output as any[]).find((o: any) => o.type === 'message');
      if (textOutput?.content) {
        const content = textOutput.content.map((c: any) => c.text).join('');

        // Extract JSON
        const match = content.match(/\{[^}]+\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          if (parsed.imageUrl) {
            await sql`UPDATE gear_catalog SET image_url = ${parsed.imageUrl} WHERE id = ${item.id}`;
            console.log(`  ✓ ${parsed.imageUrl.slice(0, 60)}...`);
          } else {
            console.log(`  - No image found`);
          }
        } else {
          console.log(`  - No JSON in response`);
        }
      }
    } catch (error: any) {
      console.error(`  ✗ Error: ${error.message?.slice(0, 50)}`);
    }

    // Small delay between requests
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\n\nDone!');
}

enrichImages();
