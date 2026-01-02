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

    // Step 2: Always search online to get current products
    const prompt = category
      ? `Category: "${category}"\nQuery: "${query.trim()}"\n\nFind current products available for purchase.`
      : `Query: "${query.trim()}"\n\nFind current products available for purchase.`;

    // Use OpenAI with web search enabled
    const response = await openai.responses.create({
      model: 'gpt-4o',
      tools: [{ type: 'web_search' }],
      input: [
        { role: 'system', content: GEAR_SEARCH_SKILL },
        { role: 'user', content: prompt }
      ],
    });

    let onlineGear: any[] = [];

    // Extract text from response
    const textOutput = response.output.find((o: any) => o.type === 'message');
    if (textOutput?.content) {
      const content = textOutput.content.map((c: any) => c.text).join('');
      const jsonMatch = content.match(/\[[\s\S]*\]/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        onlineGear = parsed.map((item: any) => ({
          ...item,
          source: 'online'
        }));
      }
    }

    // Combine results - DB first, then online (deduplicated)
    const seenNames = new Set(dbGear.map((g: any) => g.name.toLowerCase()));
    const uniqueOnline = onlineGear.filter((g: any) => !seenNames.has(g.name.toLowerCase()));

    const results = [...dbGear, ...uniqueOnline];

    return NextResponse.json({ results });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ results: [], error: String(error) });
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
