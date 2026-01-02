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
    const { query, category, online } = await request.json();

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ results: [] });
    }

    const searchTerm = query.trim().toLowerCase();

    // DB search only by default
    if (!online) {
      const dbResults = await searchDatabase(searchTerm);
      return NextResponse.json({ results: dbResults });
    }

    // Online search triggered explicitly - search both and dedupe
    const [dbResults, onlineResults] = await Promise.all([
      searchDatabase(searchTerm),
      searchOnline(query.trim(), category)
    ]);

    console.log('DB results:', dbResults.length, 'Online results:', onlineResults.length);

    // Build seen set from DB names for deduplication
    const dbNames = new Set(dbResults.map((g: any) => g.name.toLowerCase()));

    // Mark online results that are new (not in DB)
    const newOnline = onlineResults
      .filter((g: any) => !dbNames.has(g.name.toLowerCase()))
      .map((g: any) => ({ ...g, isNew: true }));

    console.log('After dedupe, new online:', newOnline.length);

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

    console.log('Online search:', query, category);

    const response = await openai.responses.create({
      model: 'gpt-4o',
      tools: [{ type: 'web_search' }],
      input: [
        { role: 'system', content: GEAR_SEARCH_SKILL },
        { role: 'user', content: prompt }
      ],
    });

    // Extract text from response
    const textOutput = (response.output as any[]).find((o: any) => o.type === 'message');
    if (textOutput?.content) {
      const content = textOutput.content.map((c: any) => c.text).join('');
      console.log('Online search response length:', content.length);

      // Extract balanced JSON array using bracket counting
      const extracted = extractJsonArray(content);
      if (extracted) {
        try {
          const parsed = JSON.parse(extracted);
          console.log('Online search parsed:', parsed.length, 'results');
          return parsed.map((item: any) => ({
            ...item,
            source: 'online'
          }));
        } catch (parseError) {
          console.error('JSON parse error:', parseError, 'Content:', extracted.slice(0, 200));
        }
      } else {
        console.log('No JSON array found in response');
      }
    } else {
      console.log('No text output in response');
    }

    return [];
  } catch (error) {
    console.error('Online search error:', error);
    return [];
  }
}

// Extract balanced JSON array from text (handles nested brackets)
function extractJsonArray(text: string): string | null {
  const startIdx = text.indexOf('[');
  if (startIdx === -1) return null;

  let bracketCount = 0;
  let inString = false;
  let escape = false;

  for (let i = startIdx; i < text.length; i++) {
    const char = text[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (char === '\\' && inString) {
      escape = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === '[') bracketCount++;
      if (char === ']') bracketCount--;

      if (bracketCount === 0) {
        return text.slice(startIdx, i + 1);
      }
    }
  }

  return null;
}

function formatSpecs(specs: any): string {
  if (!specs) return '';

  const parts = [];
  if (specs.weight?.value) parts.push(`${specs.weight.value}${specs.weight.unit}`);
  if (specs.waterproofing) parts.push(specs.waterproofing);
  if (specs.crampon_compatibility) parts.push(`crampon: ${specs.crampon_compatibility}`);

  return parts.join(', ') || JSON.stringify(specs).slice(0, 100);
}
