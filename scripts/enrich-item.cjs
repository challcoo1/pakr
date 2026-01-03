const { neon } = require('@neondatabase/serverless');
const OpenAI = require('openai');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.POSTGRES_URL);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const skill = fs.readFileSync('./skills/gear-search/SKILL.md', 'utf-8');

async function enrich() {
  const id = 'c703c0b1-60b0-413b-aadb-c50536b0465a';
  const name = "Arc'teryx Norvan 4 GTX";

  console.log('Enriching:', name);
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: skill },
      { role: 'user', content: `Query: "${name}"\n\nFind this exact product with image and reviews.` }
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' }
  });

  const content = response.choices[0]?.message?.content || '';
  console.log('Response:', content.substring(0, 500));

  const parsed = JSON.parse(content);
  const item = parsed.results?.[0] || parsed;

  console.log('Image:', item.imageUrl);
  console.log('Reviews:', JSON.stringify(item.reviews, null, 2));

  if (item.imageUrl || item.reviews) {
    await sql`UPDATE gear_catalog SET
      image_url = ${item.imageUrl || null},
      reviews = ${item.reviews ? JSON.stringify(item.reviews) : null}::jsonb
      WHERE id = ${id}`;
    console.log('Updated DB!');
  }
}

enrich().catch(console.error);
