// app/api/validate-gear/route.ts

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { readFileSync } from 'fs';
import { join } from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Load gear enrichment skill for context
function loadSkill(): string {
  const skillPath = join(process.cwd(), 'skills', 'gear-enrichment', 'SKILL.md');
  return readFileSync(skillPath, 'utf-8');
}

const GEAR_SKILL = loadSkill();

const VALIDATE_PROMPT = `You are a gear validation expert. Given a user's gear and a requirement, determine if it's suitable.

Use this gear knowledge:
${GEAR_SKILL}

Return ONLY valid JSON:
{
  "status": "suitable" | "marginal" | "unsuitable",
  "reasons": ["reason1", "reason2"]
}

Rules:
- "suitable": Gear meets or exceeds all requirements
- "marginal": Gear works but has gaps (e.g., temp rating close but not ideal)
- "unsuitable": Gear doesn't meet critical requirements

Be specific in reasons. Example reasons:
- "Temperature rated -10°C, requirement is -15°C (5°C gap)"
- "Not crampon compatible"
- "Waterproof rating 10k, need 20k for heavy rain"`;

export async function POST(request: Request) {
  try {
    const { userGear, requirement } = await request.json();

    if (!userGear || !requirement) {
      return NextResponse.json({ status: 'empty', reasons: [] });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Faster for validation
      messages: [
        { role: 'system', content: VALIDATE_PROMPT },
        {
          role: 'user',
          content: `User has: "${userGear}"\n\nRequirement: ${requirement.item}\nSpecs needed: ${requirement.specs}`
        }
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return NextResponse.json({ status: 'empty', reasons: [] });
    }

    const data = JSON.parse(jsonMatch[0]);
    return NextResponse.json({
      status: data.status || 'empty',
      reasons: data.reasons || []
    });

  } catch (error) {
    console.error('Validate error:', error);
    return NextResponse.json({ status: 'empty', reasons: [] });
  }
}
