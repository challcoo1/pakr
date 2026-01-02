// app/api/search-gear/route.ts

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { sql } from '@/lib/db';
import { readFileSync } from 'fs';
import { join } from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

function loadSkill(): string {
  const skillPath = join(process.cwd(), 'skills', 'gear-search', 'SKILL.md');
  return readFileSync(skillPath, 'utf-8');
}

const GEAR_SEARCH_SKILL = loadSkill();

export async function POST(request: Request) {
  try {
    const { query, category } = await request.json();

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ results: [] });
    }

    const searchTerm = query.trim().toLowerCase();

    // Step 1: Search database first
    const dbResults = await sql`
      SELECT id, name, manufacturer, category, specs
      FROM gear_catalog
      WHERE
        LOWER(name) LIKE ${'%' + searchTerm + '%'}
        OR LOWER(manufacturer) LIKE ${'%' + searchTerm + '%'}
      LIMIT 20
    `;

    // Format DB results
    const dbGear = dbResults.map((row: any) => ({
      id: row.id,
      name: row.name,
      brand: row.manufacturer,
      specs: formatSpecs(row.specs),
      source: 'database'
    }));

    // Step 2: If not enough DB results, search online via LLM
    let onlineGear: any[] = [];
    if (dbGear.length < 5) {
      const prompt = category
        ? `Category: "${category}"\nQuery: "${query.trim()}"\n\nSearch online for matching products.`
        : `Query: "${query.trim()}"\n\nSearch online for matching products.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: GEAR_SEARCH_SKILL },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content || '';
      const jsonMatch = content.match(/\[[\s\S]*\]/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        onlineGear = parsed.map((item: any) => ({
          ...item,
          source: 'online'
        }));
      }
    }

    // Combine results - DB first, then online
    const results = [...dbGear, ...onlineGear];

    return NextResponse.json({ results });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ results: [] });
  }
}

function formatSpecs(specs: any): string {
  if (!specs) return '';

  const parts = [];
  if (specs.weight?.value) parts.push(`${specs.weight.value}${specs.weight.unit}`);
  if (specs.waterproofing) parts.push(specs.waterproofing);
  if (specs.crampon_compatibility) parts.push(`crampon: ${specs.crampon_compatibility}`);

  return parts.join(', ') || JSON.stringify(specs).slice(0, 100);
}
