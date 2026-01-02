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
    const { query, category, online, tripContext, requirement, userLocation } = await request.json();

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ results: [] });
    }

    const searchTerm = query.trim().toLowerCase();

    // DB search only by default
    if (!online) {
      const dbResults = await searchDatabase(searchTerm);
      return NextResponse.json({ results: dbResults });
    }

    // Recommendation mode: has trip context
    if (tripContext && requirement) {
      const recommendation = await getRecommendation(query.trim(), category, tripContext, requirement, userLocation);
      return NextResponse.json({ recommendation });
    }

    // Regular online search - search both and dedupe
    const [dbResults, onlineResults] = await Promise.all([
      searchDatabase(searchTerm),
      searchOnline(query.trim(), category)
    ]);

    console.log('DB results:', dbResults.length, 'Online results:', onlineResults.length);

    // Build seen set from DB names for deduplication
    const dbNames = new Set(dbResults.map((g: any) => g.name.toLowerCase()));

    // Filter to truly new online results
    const newOnline = onlineResults
      .filter((g: any) => !dbNames.has(g.name.toLowerCase()));

    // Combine: DB first, then new online results
    const results = [...dbResults, ...newOnline];

    return NextResponse.json({ results });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ results: [], error: String(error) });
  }
}

async function searchDatabase(searchTerm: string) {
  // Split search into words
  const words = searchTerm.toLowerCase().split(/\s+/).filter(w => w.length > 1);

  if (words.length === 0) {
    return [];
  }

  // Search using first word, then filter by all words
  const firstWord = words[0];
  const dbResults = await sql`
    SELECT id, name, manufacturer, category, specs
    FROM gear_catalog
    WHERE
      LOWER(name) LIKE ${'%' + firstWord + '%'}
      OR LOWER(manufacturer) LIKE ${'%' + firstWord + '%'}
    LIMIT 50
  `;

  // Filter to only include results that match ALL words
  const filtered = dbResults.filter((row: any) => {
    const searchable = `${row.name} ${row.manufacturer || ''}`.toLowerCase();
    return words.every(word => searchable.includes(word));
  });

  return filtered.slice(0, 20).map((row: any) => ({
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

    console.log('Online search:', query);

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

async function getRecommendation(query: string, category: string, tripContext: any, requirement: any, userLocation?: { code: string; name: string }) {
  try {
    const locationNote = userLocation
      ? `\nUser location: ${userLocation.name} (${userLocation.code}) - When specs are equivalent, prefer brands with local presence for better shipping/support. Don't sacrifice quality for locality.`
      : '';

    const prompt = `Trip: ${tripContext.name} (${tripContext.region})
Duration: ${tripContext.duration}
Grading: ${tripContext.grading?.local || ''} ${tripContext.grading?.international ? `(${tripContext.grading.international})` : ''}
Conditions: ${tripContext.conditions?.join(', ') || 'varied'}
Terrain: ${tripContext.terrain || 'mixed'}
Hazards: ${tripContext.hazards || 'none noted'}${locationNote}

Need: ${requirement.item}
Requirements: ${requirement.specs}

Recommend the best ${requirement.item} for this specific trip.`;

    console.log('Getting recommendation for:', requirement.item);

    const response = await openai.responses.create({
      model: 'gpt-4o',
      tools: [{ type: 'web_search' }],
      input: [
        { role: 'system', content: GEAR_SEARCH_SKILL },
        { role: 'user', content: prompt }
      ],
    });

    const textOutput = (response.output as any[]).find((o: any) => o.type === 'message');
    if (textOutput?.content) {
      const content = textOutput.content.map((c: any) => c.text).join('');
      console.log('Recommendation response length:', content.length);

      // Try to extract JSON object (recommendation format)
      const extracted = extractJsonObject(content);
      if (extracted) {
        try {
          const parsed = JSON.parse(extracted);
          console.log('Recommendation parsed:', parsed.topPick?.name);
          return {
            topPick: parsed.topPick ? {
              name: parsed.topPick.name,
              brand: parsed.topPick.brand,
              reason: parsed.topPick.reason,
              source: 'online'
            } : null,
            alternatives: (parsed.alternatives || []).map((alt: any) => ({
              name: alt.name,
              brand: alt.brand,
              comparison: alt.comparison,
              source: 'online'
            }))
          };
        } catch (parseError) {
          console.error('Recommendation parse error:', parseError);
        }
      }

      // Fallback: try to extract as array and convert
      const arrayExtracted = extractJsonArray(content);
      if (arrayExtracted) {
        try {
          const parsed = JSON.parse(arrayExtracted);
          if (parsed.length > 0) {
            return {
              topPick: {
                name: parsed[0].name,
                brand: parsed[0].brand,
                reason: parsed[0].specs || 'Recommended for this trip',
                source: 'online'
              },
              alternatives: parsed.slice(1, 3).map((alt: any) => ({
                name: alt.name,
                brand: alt.brand,
                comparison: alt.specs || '',
                source: 'online'
              }))
            };
          }
        } catch {
          // Ignore
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Recommendation error:', error);
    return null;
  }
}

// Extract balanced JSON object from text
function extractJsonObject(text: string): string | null {
  const startIdx = text.indexOf('{');
  if (startIdx === -1) return null;

  let braceCount = 0;
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
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;

      if (braceCount === 0) {
        return text.slice(startIdx, i + 1);
      }
    }
  }

  return null;
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
