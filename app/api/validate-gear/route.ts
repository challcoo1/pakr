// app/api/validate-gear/route.ts

import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const VALIDATE_PROMPT = `You are an experienced outdoor guide validating gear choices.

CRITICAL: Consider the ACTUAL trip context, not just category matching.

Examples of GOOD validation:

Trip: "Platypus Trail day hike" (easy, maintained trail, 4 hours)
Requirement: "Hiking boots"
User has: "Arc'teryx Norvan trail runners"
→ SUITABLE - Trail runners are excellent for easy day hikes. Good grip, lightweight, appropriate for maintained trails.

Trip: "Overland Track" (multi-day, muddy, variable weather)
Requirement: "Hiking boots"
User has: "Arc'teryx Norvan trail runners"
→ MARGINAL - Trail runners work but boots provide better ankle support and waterproofing for 6 days of mud.

Trip: "Matterhorn via Hörnli Ridge" (alpine climbing, glacier, technical)
Requirement: "Mountaineering boots"
User has: "Arc'teryx Norvan trail runners"
→ UNSUITABLE - Need crampon-compatible boots for glacier travel and mixed climbing.

VALIDATION RULES:
1. Easy day hikes: Trail runners, approach shoes, light hikers are ALL suitable
2. Multi-day treks: Consider ankle support, waterproofing, durability
3. Technical terrain: Specific gear requirements matter (crampon compatibility, etc.)
4. Be practical, not pedantic - real hikers often use lighter gear than "required"

Return ONLY valid JSON:
{
  "status": "suitable" | "marginal" | "unsuitable",
  "reasons": ["reason1"]
}

Keep reasons SHORT (1 sentence max).`;

export async function POST(request: Request) {
  try {
    const { userGear, requirement, tripContext } = await request.json();

    if (!userGear || !requirement) {
      return NextResponse.json({ status: 'empty', reasons: [] });
    }

    // Build context string
    let contextStr = '';
    if (tripContext) {
      contextStr = `Trip: "${tripContext.name}" (${tripContext.region}, ${tripContext.duration})`;
      if (tripContext.conditions?.length) {
        contextStr += `\nConditions: ${tripContext.conditions.join(', ')}`;
      }
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: VALIDATE_PROMPT },
        {
          role: 'user',
          content: `${contextStr}\n\nRequirement: ${requirement.item}\nSpecs: ${requirement.specs}\n\nUser has: "${userGear}"`
        }
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
    return NextResponse.json({
      status: data.status || 'empty',
      reasons: data.reasons || []
    });

  } catch (error) {
    console.error('Validate error:', error);
    return NextResponse.json({ status: 'empty', reasons: [] });
  }
}
