import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { join } from 'path';

const anthropic = new Anthropic();

// Load the trip analysis skill
function loadTripAnalysisSkill(): string {
  try {
    const skillPath = join(process.cwd(), 'skills', 'trip-analysis', 'SKILL.md');
    return readFileSync(skillPath, 'utf-8');
  } catch {
    return '';
  }
}

const TRIP_ANALYSIS_SKILL = loadTripAnalysisSkill();

const SYSTEM_PROMPT = `You are pakr, a gear gap analyzer.

You have access to this trip analysis skill:

${TRIP_ANALYSIS_SKILL}

BEHAVIOR:
1. When user describes a trip/objective: Run the trip analysis skill and return the JSON output
2. When user says they have gear: Ask "What [item]?" to get specifics
3. When user provides gear details: Confirm, then show remaining gaps from the current trip requirements

OUTPUT FORMAT:
- For trip analysis: Return valid JSON matching the skill output schema
- For gear questions: Short, direct text
- No enthusiasm. No "That sounds amazing!"
- Treat users like competent adults.

CRITICAL: When analyzing a trip, you MUST output valid JSON matching the skill schema. Start with { and end with }. No markdown code fences.`;

export async function POST(request: NextRequest) {
  try {
    const { message, history } = await request.json();

    // Build conversation history
    const messages: Array<{role: 'user' | 'assistant', content: string}> = [];

    if (history && history.length > 0) {
      for (const msg of history) {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    messages.push({
      role: 'user',
      content: message,
    });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages,
    });

    const textContent = response.content.find(c => c.type === 'text');
    const rawContent = textContent ? textContent.text : '';

    // Try to parse as JSON (trip analysis response)
    let tripData = null;
    let displayContent = rawContent;

    try {
      // Check if response is JSON
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        tripData = JSON.parse(jsonMatch[0]);

        // Format display content from structured data
        displayContent = formatTripAnalysis(tripData);
      }
    } catch {
      // Not JSON, use raw content
    }

    return NextResponse.json({
      content: displayContent,
      tripData,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({
      content: 'Error. Check ANTHROPIC_API_KEY.',
    });
  }
}

function formatTripAnalysis(data: {
  trip?: {
    description?: string;
    activity_type?: string;
    location?: { name?: string; region?: string; altitude_m?: number };
    duration_days?: number;
    technical_grade?: string;
  };
  conditions?: {
    temperature?: { day_high_c?: number; night_low_c?: number; summit_c?: number };
    hazards?: string[];
    terrain?: string[];
  };
  gear_requirements?: Array<{
    item?: string;
    category?: string;
    requirements?: Record<string, string | string[] | boolean>;
    reasoning?: string;
    priority?: string;
  }>;
  notes?: string[];
}): string {
  const lines: string[] = [];

  // Trip header
  if (data.trip) {
    const t = data.trip;
    let header = t.location?.name || t.description || 'Trip Analysis';
    if (t.location?.region) header += `, ${t.location.region}`;
    if (t.location?.altitude_m) header += ` (${t.location.altitude_m}m)`;
    lines.push(header);

    const meta: string[] = [];
    if (t.activity_type) meta.push(t.activity_type.replace(/_/g, ' '));
    if (t.duration_days) meta.push(`${t.duration_days} days`);
    if (t.technical_grade) meta.push(`grade ${t.technical_grade}`);
    if (meta.length) lines.push(meta.join(' · '));
  }

  // Conditions
  if (data.conditions) {
    lines.push('');
    const c = data.conditions;
    if (c.temperature) {
      const temps: string[] = [];
      if (c.temperature.day_high_c !== undefined) temps.push(`day ${c.temperature.day_high_c}°C`);
      if (c.temperature.night_low_c !== undefined) temps.push(`night ${c.temperature.night_low_c}°C`);
      if (c.temperature.summit_c !== undefined) temps.push(`summit ${c.temperature.summit_c}°C`);
      if (temps.length) lines.push(`Temps: ${temps.join(', ')}`);
    }
    if (c.hazards?.length) lines.push(`Hazards: ${c.hazards.join(', ')}`);
    if (c.terrain?.length) lines.push(`Terrain: ${c.terrain.join(', ')}`);
  }

  // Gear requirements
  if (data.gear_requirements?.length) {
    const critical = data.gear_requirements.filter(g => g.priority === 'critical');
    const recommended = data.gear_requirements.filter(g => g.priority === 'recommended');
    const optional = data.gear_requirements.filter(g => g.priority === 'optional');

    if (critical.length) {
      lines.push('');
      lines.push('Required:');
      for (const g of critical) {
        const specs = formatSpecs(g.requirements);
        lines.push(`- ${g.item}${specs ? ': ' + specs : ''}`);
      }
    }

    if (recommended.length) {
      lines.push('');
      lines.push('Recommended:');
      for (const g of recommended) {
        const specs = formatSpecs(g.requirements);
        lines.push(`- ${g.item}${specs ? ': ' + specs : ''}`);
      }
    }

    if (optional.length) {
      lines.push('');
      lines.push('Optional:');
      for (const g of optional) {
        lines.push(`- ${g.item}`);
      }
    }
  }

  // Notes
  if (data.notes?.length) {
    lines.push('');
    lines.push('Notes:');
    for (const note of data.notes) {
      lines.push(`- ${note}`);
    }
  }

  lines.push('');
  lines.push('What do you already have?');

  return lines.join('\n');
}

function formatSpecs(requirements?: Record<string, string | string[] | boolean>): string {
  if (!requirements) return '';

  const specs: string[] = [];
  for (const [key, value] of Object.entries(requirements)) {
    if (typeof value === 'boolean') continue;
    if (Array.isArray(value)) {
      specs.push(value.join(', '));
    } else {
      // Skip verbose keys, just show value
      if (key.includes('_')) {
        specs.push(String(value));
      } else {
        specs.push(String(value));
      }
    }
  }
  return specs.slice(0, 3).join(', '); // Limit to 3 specs per line
}
