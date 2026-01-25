// app/api/optimize-gear/route.ts
// Matches user's gear portfolio to trip requirements

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';
import OpenAI from 'openai';
import { readFileSync } from 'fs';
import { join } from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Load the gear matching skill
function loadSkill(): string {
  const skillPath = join(process.cwd(), 'skills', 'gear-matching', 'SKILL.md');
  return readFileSync(skillPath, 'utf-8');
}

const GEAR_MATCHING_SKILL = loadSkill();

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

// Convert score to match level
function getMatchLevel(score: number): 'excellent' | 'good' | 'adequate' | 'poor' {
  if (score >= 90) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'adequate';
  return 'poor';
}

async function matchGearToRequirements(
  requirements: GearRequirement[],
  userGear: UserGear[],
  tripContext: TripContext
): Promise<Record<string, { gearId: string; name: string; score: number; matchLevel: string; reason: string; specs?: string; weightG?: number | null } | null>> {

  const input = {
    trip: {
      name: tripContext.name,
      region: tripContext.region,
      duration: tripContext.duration,
      terrain: tripContext.terrain,
      hazards: tripContext.hazards,
      conditions: tripContext.conditions || []
    },
    userGear: userGear.map(g => ({
      id: g.id,
      name: g.name,
      specs: g.specs,
      category: g.category
    })),
    requirements: requirements.map(r => ({
      item: r.item,
      specs: r.specs,
      priority: r.priority
    }))
  };

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: GEAR_MATCHING_SKILL },
        { role: 'user', content: JSON.stringify(input) }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content || '';
    const aiMatches = JSON.parse(content);

    // Enrich matches with weightG and ensure matchLevel
    const enrichedMatches: Record<string, { gearId: string; name: string; score: number; matchLevel: string; reason: string; specs?: string; weightG?: number | null } | null> = {};
    for (const [reqItem, match] of Object.entries(aiMatches)) {
      if (match && typeof match === 'object' && 'gearId' in match) {
        const m = match as { gearId: string; name: string; score: number; matchLevel?: string; reason: string };
        const gear = userGear.find(g => g.id === m.gearId);
        enrichedMatches[reqItem] = {
          ...m,
          matchLevel: m.matchLevel || getMatchLevel(m.score),
          specs: gear?.specs ? formatSpecs(gear.specs) : undefined,
          weightG: gear?.weightG || null,
        };
      } else {
        enrichedMatches[reqItem] = null;
      }
    }
    return enrichedMatches;

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
