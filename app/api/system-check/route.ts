// app/api/system-check/route.ts
// Analyzes gear system compatibility

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { readFileSync } from 'fs';
import { join } from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Load the system check skill
function loadSkill(): string {
  const skillPath = join(process.cwd(), 'skills', 'system-check', 'SKILL.md');
  return readFileSync(skillPath, 'utf-8');
}

const SYSTEM_CHECK_SKILL = loadSkill();

interface MatchedGearItem {
  requirement: string;
  name: string;
  specs?: string;
}

interface TripContext {
  name: string;
  terrain?: string;
  conditions?: string[];
}

interface CompatibilityNote {
  items: string[];
  status: 'compatible' | 'incompatible' | 'check';
  note: string;
}

interface Warning {
  items: string[];
  issue: string;
  suggestion: string;
}

interface SystemCheckResult {
  systemScore: number;
  systemLevel: 'excellent' | 'good' | 'fair' | 'poor';
  summary: string;
  compatibilityNotes: CompatibilityNote[];
  warnings: Warning[];
  gaps: string[];
}

export async function POST(request: Request) {
  try {
    const { matchedGear, trip } = await request.json();

    if (!matchedGear || !Array.isArray(matchedGear) || matchedGear.length === 0) {
      return NextResponse.json({
        systemScore: 0,
        systemLevel: 'poor',
        summary: 'No gear to analyze',
        compatibilityNotes: [],
        warnings: [],
        gaps: []
      });
    }

    const input = {
      matchedGear,
      trip: trip || { name: 'Unknown trip' }
    };

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_CHECK_SKILL },
        { role: 'user', content: JSON.stringify(input) }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
      max_tokens: 1500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 });
    }

    const result: SystemCheckResult = JSON.parse(content);

    return NextResponse.json(result);
  } catch (error) {
    console.error('System check error:', error);
    return NextResponse.json({ error: 'System check failed' }, { status: 500 });
  }
}
