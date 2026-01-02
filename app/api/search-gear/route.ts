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

    // Search DB and online in parallel
    const [dbResults, onlineResults] = await Promise.all([
      searchDatabase(searchTerm),
      searchOnline(query.trim(), category)
    ]);

    // Build seen set from DB names for deduplication
    const dbNames = new Set(dbResults.map((g: any) => g.name.toLowerCase()));

    // Mark online results that are new (not in DB)
    const onlineWithNew = onlineResults.map((g: any) => ({
      ...g,
      isNew: !dbNames.has(g.name.toLowerCase())
    }));

    // Filter to only truly new online results
    const newOnline = onlineWithNew.filter((g: any) => g.isNew);

    // Combine: DB first, then new online results
    const results = [...dbResults, ...newOnline];

    return NextResponse.json({ results });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ results: [], error: String(error) });
  }
}

async function searchDatabase(searchTerm: string) {
  const dbResults = await sql`
    SELECT id, name, manufacturer, category, specs
    FROM gear_catalog
    WHERE
      LOWER(name) LIKE ${'%' + searchTerm + '%'}
      OR LOWER(manufacturer) LIKE ${'%' + searchTerm + '%'}
    LIMIT 20
  `;

  return dbResults.map((row: any) => ({
    id: row.id,
    name: row.name,
    brand: row.manufacturer,
    specs: formatSpecs(row.specs),
    source: 'database'
  }));
}

async function searchOnline(query: string, category?: string) {
  try {
    const prompt = category
      ? `Category: "${category}"\nQuery: "${query}"\n\nFind current products available for purchase.`
      : `Query: "${query}"\n\nFind current products available for purchase.`;

    const response = await openai.responses.create({
      model: 'gpt-4o',
      tools: [{ type: 'web_search' }],
      input: [
        { role: 'system', content: GEAR_SEARCH_SKILL },
        { role: 'user', content: prompt }
      ],
    });

    // Extract text from response
    const textOutput = response.output.find((o: any) => o.type === 'message');
    if (textOutput?.content) {
      const content = textOutput.content.map((c: any) => c.text).join('');
      const jsonMatch = content.match(/\[[\s\S]*\]/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.map((item: any) => ({
          ...item,
          source: 'online'
        }));
      }
    }

    return [];
  } catch (error) {
    console.error('Online search error:', error);
    return [];
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
