// app/api/search-gear/route.ts
// Pattern: DB is source of truth. LLM populates DB, never displays directly.

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { sql } from '@/lib/db';
import { readFileSync } from 'fs';
import { join } from 'path';

console.log('[PAKR] OpenAI key prefix:', process.env.OPENAI_API_KEY?.substring(0, 15) || 'UNDEFINED');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
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

    // Recommendation mode: has trip context (this still uses LLM directly for now)
    if (tripContext && requirement) {
      const recommendation = await getRecommendation(query.trim(), category, tripContext, requirement, userLocation);
      return NextResponse.json({ recommendation });
    }

    // Step 1: Always search DB first
    let dbResults = await searchDatabase(searchTerm);

    // Step 2: If online mode, check if we need to populate/enrich
    if (online) {
      // Check if results are missing key data (image or reviews)
      const needsEnrichment = dbResults.length < 3 ||
        dbResults.some((r: any) => !r.imageUrl || !r.reviews);

      if (needsEnrichment) {
        console.log('DB has', dbResults.length, 'results, enriching from LLM...');
        const onlineResults = await fetchFromLLM(query.trim(), category);

        // Save each result to DB (will update existing items with missing data)
        for (const item of onlineResults) {
          await saveToDatabase(item);
        }

        // Step 3: Re-search DB to get updated results
        dbResults = await searchDatabase(searchTerm);
        console.log('After enriching, DB has', dbResults.length, 'results');
      }
    }

    // Always return from DB - never return LLM results directly
    return NextResponse.json({ results: dbResults });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ results: [], error: String(error) });
  }
}

async function searchDatabase(searchTerm: string) {
  const words = searchTerm.toLowerCase().split(/\s+/).filter(w => w.length > 1);

  if (words.length === 0) {
    return [];
  }

  const firstWord = words[0];
  const dbResults = await sql`
    SELECT id, name, manufacturer, category, subcategory, gender, image_url, description, product_url, reviews, specs
    FROM gear_catalog
    WHERE
      LOWER(name) LIKE ${'%' + firstWord + '%'}
      OR LOWER(manufacturer) LIKE ${'%' + firstWord + '%'}
    ORDER BY
      CASE WHEN LOWER(name) LIKE ${searchTerm + '%'} THEN 0 ELSE 1 END,
      name
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
    category: row.category,
    subcategory: row.subcategory,
    gender: row.gender,
    imageUrl: row.image_url,
    description: row.description,
    productUrl: row.product_url,
    reviews: row.reviews,
    specs: formatSpecs(row.specs),
    source: 'database'
  }));
}

async function saveToDatabase(item: any) {
  try {
    // Check if already exists
    const existing = await sql`
      SELECT id FROM gear_catalog WHERE LOWER(name) = ${item.name.toLowerCase()} LIMIT 1
    `;

    if (existing[0]) {
      // Update with new data (only if we have better data)
      await sql`
        UPDATE gear_catalog SET
          image_url = COALESCE(NULLIF(${item.imageUrl || null}, ''), image_url),
          description = COALESCE(NULLIF(${item.description || null}, ''), description),
          product_url = COALESCE(NULLIF(${item.productUrl || null}, ''), product_url),
          reviews = COALESCE(${item.reviews ? JSON.stringify(item.reviews) : null}::jsonb, reviews),
          category = COALESCE(NULLIF(${item.category || null}, ''), category),
          subcategory = COALESCE(NULLIF(${item.subcategory || null}, ''), subcategory),
          gender = COALESCE(NULLIF(${item.gender || null}, ''), gender)
        WHERE id = ${existing[0].id}
      `;
      console.log('Updated existing gear:', item.name);
    } else {
      // Insert new
      await sql`
        INSERT INTO gear_catalog (name, manufacturer, category, subcategory, gender, image_url, description, product_url, reviews, specs)
        VALUES (
          ${item.name},
          ${item.brand || null},
          ${item.category || null},
          ${item.subcategory || null},
          ${item.gender || null},
          ${item.imageUrl || null},
          ${item.description || null},
          ${item.productUrl || null},
          ${item.reviews ? JSON.stringify(item.reviews) : null}::jsonb,
          ${JSON.stringify({ raw: item.specs || '' })}
        )
      `;
      console.log('Inserted new gear:', item.name);
    }
  } catch (error) {
    console.error('Failed to save gear to DB:', item.name, error);
  }
}

async function fetchFromLLM(query: string, category?: string) {
  try {
    const prompt = category
      ? `Category: "${category}"\nQuery: "${query}"\n\nFind current products available for purchase.`
      : `Query: "${query}"\n\nFind current products available for purchase.`;

    console.log('LLM search:', query);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: GEAR_SEARCH_SKILL },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content || '';
    // With json_object format, try parsing directly first
    let parsed;
    try {
      parsed = JSON.parse(content);
      // Handle if wrapped in object with results array
      const results = parsed.results || parsed.products || parsed.items || (Array.isArray(parsed) ? parsed : [parsed]);
      if (results.length > 0) {
        console.log('LLM returned', results.length, 'results');
        return results;
      }
    } catch {
      // Fallback to extraction
    }
    const extracted = extractJsonArray(content);
    if (extracted) {
      try {
        const parsed = JSON.parse(extracted);
        console.log('LLM returned', parsed.length, 'results');
        return parsed;
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
      }
    }

    return [];
  } catch (error) {
    console.error('LLM fetch error:', error);
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

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: GEAR_SEARCH_SKILL },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content || '';
    if (content) {
      // Try direct parse first with json_object format
      try {
        const parsed = JSON.parse(content);
        if (parsed.topPick) {
          return {
            topPick: {
              name: parsed.topPick.name,
              brand: parsed.topPick.brand,
              reason: parsed.topPick.reason,
              source: 'online'
            },
            alternatives: (parsed.alternatives || []).map((alt: any) => ({
              name: alt.name,
              brand: alt.brand,
              comparison: alt.comparison,
              source: 'online'
            }))
          };
        }
      } catch {
        // Fallback to extraction
      }

      const extracted = extractJsonObject(content);
      if (extracted) {
        try {
          const parsed = JSON.parse(extracted);
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
  if (typeof specs === 'string') return specs;
  if (specs.raw) return specs.raw;

  const parts = [];
  if (specs.weight?.value) parts.push(`${specs.weight.value}${specs.weight.unit}`);
  if (specs.waterproofing) parts.push(specs.waterproofing);
  if (specs.crampon_compatibility) parts.push(`crampon: ${specs.crampon_compatibility}`);

  return parts.join(', ') || JSON.stringify(specs).slice(0, 100);
}
