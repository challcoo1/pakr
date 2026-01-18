// app/api/optimize-gear/route.ts
// Matches user's gear portfolio to trip requirements

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

interface GearRequirement {
  item: string;
  specs: string;
  priority: string;
}

interface UserGear {
  id: string;
  name: string;
  brand: string;
  category: string;
  specs: any;
  weightG?: number | null;
}

interface TripContext {
  name: string;
  region: string;
  duration: string;
  terrain: string;
  hazards: string;
  conditions: string[];
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ matches: {} });
    }

    const { requirements, tripContext } = await request.json();

    if (!requirements || !Array.isArray(requirements)) {
      return NextResponse.json({ error: 'Requirements array required' }, { status: 400 });
    }

    // Get user ID
    const userResult = await sql`
      SELECT id FROM users WHERE email = ${session.user.email}
    `;
    if (!userResult[0]) {
      return NextResponse.json({ matches: {} });
    }
    const userId = userResult[0].id;

    // Get user's gear
    const userGear = await sql`
      SELECT
        ug.id,
        ug.category as user_category,
        gc.name,
        gc.manufacturer as brand,
        gc.category as catalog_category,
        gc.specs,
        gc.weight_g
      FROM user_gear ug
      JOIN gear_catalog gc ON ug.gear_id = gc.id
      WHERE ug.user_id = ${userId}
    `;

    if (userGear.length === 0) {
      return NextResponse.json({ matches: {} });
    }

    // Format gear for AI
    const gearList = userGear.map((g: any) => ({
      id: g.id,
      name: g.name,
      brand: g.brand,
      category: g.user_category || g.catalog_category,
      specs: formatSpecs(g.specs),
      weightG: g.weight_g,
    }));

    // Use AI to match gear to requirements with compatibility consideration
    const matches = await matchGearToRequirements(
      requirements,
      gearList,
      tripContext
    );

    return NextResponse.json({ matches });
  } catch (error) {
    console.error('Optimize gear error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

async function matchGearToRequirements(
  requirements: GearRequirement[],
  userGear: UserGear[],
  tripContext: TripContext
): Promise<Record<string, { gearId: string; name: string; score: number; reason: string; weightG?: number | null } | null>> {

  const prompt = `You are a gear optimization expert. Match the user's gear to trip requirements.

TRIP: ${tripContext.name} (${tripContext.region})
Duration: ${tripContext.duration}
Terrain: ${tripContext.terrain}
Hazards: ${tripContext.hazards}
Conditions: ${tripContext.conditions?.join(', ') || 'varied'}

USER'S GEAR:
${userGear.map((g, i) => `${i + 1}. [${g.id}] ${g.name} - ${g.specs} (category: ${g.category})`).join('\n')}

REQUIREMENTS:
${requirements.map((r, i) => `${i + 1}. ${r.item}: ${r.specs} (${r.priority})`).join('\n')}

For each requirement, select the BEST matching gear from the user's collection.
Consider:
1. Specs match (weight, warmth, waterproofing, features)
2. Category match (footwear->footwear, etc.)
3. COMPATIBILITY between items:
   - Crampons must match boot type (automatic/semi-auto/strap-on with boot compatibility)
   - Rope diameter affects belay device compatibility
   - Layering systems should work together (no redundant insulation)
   - Ice axe length for user height/terrain
4. Trip conditions (don't over/under spec)

Return JSON:
{
  "[requirement item name]": {
    "gearId": "[user gear id]",
    "name": "[gear name]",
    "score": [1-100],
    "reason": "[brief explanation]"
  },
  ...
}

If no suitable match exists for a requirement, use null.
Only return the JSON object, no other text.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content || '';

    // Extract JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const aiMatches = JSON.parse(jsonMatch[0]);

      // Enrich matches with weightG from user gear
      const enrichedMatches: Record<string, { gearId: string; name: string; score: number; reason: string; weightG?: number | null } | null> = {};
      for (const [reqItem, match] of Object.entries(aiMatches)) {
        if (match && typeof match === 'object' && 'gearId' in match) {
          const m = match as { gearId: string; name: string; score: number; reason: string };
          const gear = userGear.find(g => g.id === m.gearId);
          enrichedMatches[reqItem] = {
            ...m,
            weightG: gear?.weightG || null,
          };
        } else {
          enrichedMatches[reqItem] = null;
        }
      }
      return enrichedMatches;
    }

    return {};
  } catch (error) {
    console.error('AI matching error:', error);
    return {};
  }
}

function formatSpecs(specs: any): string {
  if (!specs) return '';
  if (typeof specs === 'string') return specs;
  if (specs.raw) return specs.raw;

  const parts = [];
  if (specs.weight?.value) parts.push(`${specs.weight.value}${specs.weight.unit || 'g'}`);
  if (specs.waterproofing) parts.push(specs.waterproofing);
  if (specs.warmth) parts.push(specs.warmth);
  if (specs.material) parts.push(specs.material);
  if (specs.crampon_compatibility) parts.push(`crampon: ${specs.crampon_compatibility}`);

  return parts.join(', ') || JSON.stringify(specs).slice(0, 100);
}
