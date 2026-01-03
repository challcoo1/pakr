// app/api/add-gear/route.ts

import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import OpenAI from 'openai';
import { readFileSync } from 'fs';
import { join } from 'path';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function loadSkill(): string {
  try {
    return readFileSync(join(process.cwd(), 'skills', 'gear-search', 'SKILL.md'), 'utf-8');
  } catch {
    return '';
  }
}

async function enrichItem(id: string, name: string) {
  try {
    const skill = loadSkill();
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
    const parsed = JSON.parse(content);
    const item = parsed.results?.[0] || parsed;

    if (item.imageUrl || item.reviews) {
      await sql`
        UPDATE gear_catalog SET
          image_url = COALESCE(${item.imageUrl || null}, image_url),
          reviews = COALESCE(${item.reviews ? JSON.stringify(item.reviews) : null}::jsonb, reviews),
          description = COALESCE(${item.description || null}, description),
          product_url = COALESCE(${item.productUrl || null}, product_url)
        WHERE id = ${id}
      `;
      console.log('Enriched item:', name);
    }
  } catch (error) {
    console.error('Enrichment failed:', name, error);
  }
}

export async function POST(request: Request) {
  try {
    const { name, brand, specs, category } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Name required' }, { status: 400 });
    }

    // Check if already exists
    const existing = await sql`
      SELECT id, image_url, reviews FROM gear_catalog
      WHERE LOWER(name) = ${name.toLowerCase()}
      LIMIT 1
    `;

    if (existing.length > 0) {
      // Check if incomplete - enrich if missing image or reviews
      if (!existing[0].image_url || !existing[0].reviews) {
        console.log('Item incomplete, enriching:', name);
        await enrichItem(existing[0].id, name);
      }
      return NextResponse.json({ id: existing[0].id, exists: true });
    }

    // Insert new gear
    const result = await sql`
      INSERT INTO gear_catalog (name, manufacturer, category, specs)
      VALUES (${name}, ${brand || null}, ${category || null}, ${specs ? JSON.stringify(specs) : null})
      RETURNING id
    `;

    return NextResponse.json({ id: result[0].id, exists: false });

  } catch (error) {
    console.error('Add gear error:', error);
    return NextResponse.json({ error: 'Failed to add gear' }, { status: 500 });
  }
}
