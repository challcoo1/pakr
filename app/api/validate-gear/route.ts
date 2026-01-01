// app/api/validate-gear/route.ts

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { readFileSync } from 'fs';
import { join } from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Load the gear validation skill
function loadSkill(): string {
  const skillPath = join(process.cwd(), 'skills', 'gear-validation', 'SKILL.md');
  return readFileSync(skillPath, 'utf-8');
}

const GEAR_VALIDATION_SKILL = loadSkill();

export async function POST(request: Request) {
  try {
    const { userGear, requirement, tripContext } = await request.json();

    if (!userGear || !requirement) {
      return NextResponse.json({ status: 'empty', reasons: [] });
    }

    // Build comprehensive context with deep trip understanding
    const contextParts: string[] = [];

    if (tripContext) {
      contextParts.push(`TRIP: ${tripContext.name}`);
      if (tripContext.region) contextParts.push(`Location: ${tripContext.region}`);
      if (tripContext.duration) contextParts.push(`Duration: ${tripContext.duration}`);
      if (tripContext.difficulty) contextParts.push(`Difficulty: ${tripContext.difficulty}`);
      if (tripContext.terrain) contextParts.push(`Terrain: ${tripContext.terrain}`);
      if (tripContext.hazards) contextParts.push(`Hazards: ${tripContext.hazards}`);
      if (tripContext.conditions?.length) {
        contextParts.push(`Conditions: ${tripContext.conditions.join(', ')}`);
      }
    }

    const prompt = `${contextParts.join('\n')}

USER HAS: "${userGear}"

Can they do ${tripContext?.name || 'this trip'} in ${userGear}? Answer like a friend asking.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: GEAR_VALIDATION_SKILL },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 200,
    });

    const content = response.choices[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return NextResponse.json({ status: 'empty', reasons: [] });
    }

    const data = JSON.parse(jsonMatch[0]);

    // Handle both "reason" (singular) and "reasons" (array)
    const reasons = data.reasons || (data.reason ? [data.reason] : []);

    return NextResponse.json({
      status: data.status || 'empty',
      reasons
    });

  } catch (error) {
    console.error('Validate error:', error);
    return NextResponse.json({ status: 'empty', reasons: [] });
  }
}
