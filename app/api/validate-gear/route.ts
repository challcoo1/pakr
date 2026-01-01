// app/api/validate-gear/route.ts

import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const VALIDATE_PROMPT = `You are an experienced outdoor guide with 20+ years of real-world experience.

Your job: Determine if the user's gear is ACTUALLY appropriate for THIS SPECIFIC trip.

DO NOT mechanically compare specs. THINK about whether this gear will work in practice.

CONTEXT MATTERS:

1. TRIP DIFFICULTY
   - Maintained trail with signs → lightweight gear is fine
   - Off-trail scrambling → need sturdier gear
   - Technical alpine → specific safety gear required

2. DURATION
   - Day hike (4-8 hours) → minimal requirements
   - Overnight → shelter, sleep system matter
   - Multi-day → durability, capacity, comfort important

3. CONDITIONS
   - Mild weather → wide gear tolerance
   - Rain likely → waterproofing important
   - Extreme cold → specific ratings matter
   - Remote/no bailout → reliability critical

4. GEAR INTERACTIONS
   - Has water filter → doesn't need to carry 3L, refill points work
   - Ultralight tent → fine for fair weather, risky in storms
   - Trail runners → great for maintained trails, risky on scree/snow

EXAMPLES OF GOOD THINKING:

Trip: "Platypus Trail day hike" (maintained trail, 4 hours, mild)
Requirement: "2-3L water capacity"
User has: "1L bottle + Sawyer filter"
→ SUITABLE. With filter and water sources on trail, 1L is plenty. Can refill.

Trip: "Overland Track" (6 days, mud, rain, remote)
Requirement: "Hiking boots"
User has: "Altra Lone Peak trail runners"
→ MARGINAL. Many people do Overland in trail runners, but boots give better ankle support in mud. Personal preference - experienced hikers often prefer runners.

Trip: "Mt Blanc" (glacier, altitude, technical)
Requirement: "Mountaineering boots"
User has: "Salomon hiking boots"
→ UNSUITABLE. Need crampon-compatible boots for glacier travel. Safety issue.

YOUR RESPONSE:
Return ONLY valid JSON:
{
  "status": "suitable" | "marginal" | "unsuitable",
  "reason": "One clear sentence explaining your thinking"
}

Be practical. Real hikers often use lighter gear than guidebooks suggest.
Only mark "unsuitable" if there's a genuine safety concern or the gear simply won't work.`;

export async function POST(request: Request) {
  try {
    const { userGear, requirement, tripContext } = await request.json();

    if (!userGear || !requirement) {
      return NextResponse.json({ status: 'empty', reasons: [] });
    }

    // Build comprehensive context
    const contextParts: string[] = [];

    if (tripContext) {
      contextParts.push(`TRIP: ${tripContext.name}`);
      if (tripContext.region) contextParts.push(`Location: ${tripContext.region}`);
      if (tripContext.duration) contextParts.push(`Duration: ${tripContext.duration}`);
      if (tripContext.conditions?.length) {
        contextParts.push(`Conditions: ${tripContext.conditions.join(', ')}`);
      }
    }

    const prompt = `${contextParts.join('\n')}

REQUIREMENT: ${requirement.item}
Specs suggested: ${requirement.specs || 'not specified'}

USER HAS: "${userGear}"

Is this gear appropriate for this specific trip? Think holistically.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: VALIDATE_PROMPT },
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
