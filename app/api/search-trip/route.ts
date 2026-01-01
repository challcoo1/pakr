// app/api/search-trip/route.ts

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { readFileSync } from 'fs';
import { join } from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Load the trip search skill
function loadSkill(): string {
  const skillPath = join(process.cwd(), 'skills', 'trip-search', 'SKILL.md');
  return readFileSync(skillPath, 'utf-8');
}

const TRIP_SEARCH_SKILL = loadSkill();

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ results: [] });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: TRIP_SEARCH_SKILL },
        { role: 'user', content: `Search: "${query.trim()}"` }
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const content = response.choices[0]?.message?.content || '';
    const jsonMatch = content.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      return NextResponse.json({ results: [] });
    }

    const results = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ results });

  } catch (error) {
    console.error('Trip search error:', error);
    return NextResponse.json({ results: [] });
  }
}
