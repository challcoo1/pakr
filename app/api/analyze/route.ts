// app/api/analyze/route.ts

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { readFileSync } from 'fs';
import { join } from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Load the trip analysis skill
function loadSkill(): string {
  const skillPath = join(process.cwd(), 'skills', 'trip-analysis', 'SKILL.md');
  return readFileSync(skillPath, 'utf-8');
}

const TRIP_SKILL = loadSkill();

export async function POST(request: Request) {
  try {
    const { objective } = await request.json();

    if (!objective) {
      return NextResponse.json({ error: 'No objective provided' }, { status: 400 });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: TRIP_SKILL },
        { role: 'user', content: objective }
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const content = response.choices[0]?.message?.content || '';

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to parse response' }, { status: 500 });
    }

    const data = JSON.parse(jsonMatch[0]);

    // Transform to frontend format
    const trip = {
      name: data.trip?.name || data.trip?.location?.name || objective,
      region: data.trip?.region || data.trip?.location?.region || '',
      timeOfYear: data.trip?.timeOfYear || '',
      duration: data.trip?.duration || '',
      distance: data.trip?.distance || '',
      elevation: data.trip?.elevation || '',
      grading: {
        local: data.trip?.grading?.local || '',
        international: data.trip?.grading?.international || '',
        description: data.trip?.grading?.description || ''
      },
      terrain: data.conditions?.terrain?.join(', ') || '',
      hazards: data.conditions?.hazards?.join(', ') || '',
      conditions: data.conditions?.hazards || [],
      gear: (data.gear_requirements || []).map((g: {
        item?: string;
        requirements?: Record<string, string>;
        priority?: string;
        category?: string;
      }) => ({
        item: g.item,
        specs: g.requirements ? Object.values(g.requirements).slice(0, 3).join(', ') : '',
        category: g.category,
        priority: g.priority || 'recommended'
      }))
    };

    return NextResponse.json({ trip });

  } catch (error) {
    console.error('Analyze error:', error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
