// app/api/chat/route.ts

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { readFileSync } from 'fs';
import { join } from 'path';

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

const SYSTEM_PROMPT = `You are pakr, a gear gap analyzer for serious outdoor people.

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

// Function definitions for structured extraction
const functions: OpenAI.Chat.Completions.ChatCompletionCreateParams.Function[] = [
  {
    name: 'analyze_trip',
    description: 'Analyze a trip/objective and generate gear requirements',
    parameters: {
      type: 'object',
      properties: {
        trip: {
          type: 'object',
          properties: {
            description: { type: 'string', description: 'Original user input' },
            activity_type: {
              type: 'string',
              enum: ['alpine_climbing', 'mountaineering', 'hiking', 'trekking', 'backpacking', 'ski_touring', 'ice_climbing'],
              description: 'Type of outdoor activity'
            },
            location: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Specific route or area name' },
                region: { type: 'string', description: 'Geographic region' },
                country: { type: 'string', description: 'Country' },
                altitude_m: { type: 'number', description: 'Maximum altitude in meters' }
              },
              required: ['name', 'region', 'country']
            },
            season: { type: 'string', description: 'Season or month' },
            duration_days: { type: 'number', description: 'Trip duration in days' },
            technical_grade: { type: 'string', description: 'Technical difficulty grade if applicable' }
          },
          required: ['description', 'activity_type', 'location']
        },
        conditions: {
          type: 'object',
          properties: {
            temperature: {
              type: 'object',
              properties: {
                day_high_c: { type: 'number' },
                night_low_c: { type: 'number' },
                summit_c: { type: 'number' }
              }
            },
            hazards: { type: 'array', items: { type: 'string' } },
            terrain: { type: 'array', items: { type: 'string' } }
          }
        },
        gear_requirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              item: { type: 'string', description: 'Gear item name' },
              category: { type: 'string', description: 'Gear category path' },
              priority: { type: 'string', enum: ['critical', 'recommended', 'optional'] },
              requirements: {
                type: 'object',
                additionalProperties: { type: 'string' },
                description: 'Specific specs required'
              },
              reasoning: { type: 'string', description: 'Why this item is needed for this trip' }
            },
            required: ['item', 'priority']
          }
        },
        notes: { type: 'array', items: { type: 'string' }, description: 'Important trip-specific notes' }
      },
      required: ['trip', 'conditions', 'gear_requirements']
    }
  },
  {
    name: 'ask_clarification',
    description: 'Ask user for clarification when location or trip details are ambiguous',
    parameters: {
      type: 'object',
      properties: {
        question: { type: 'string', description: 'Short, direct clarifying question' },
        options: {
          type: 'array',
          items: { type: 'string' },
          description: 'Possible options if applicable'
        }
      },
      required: ['question']
    }
  }
];

export async function POST(request: Request) {
  try {
    const { message, history } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Invalid message' }, { status: 400 });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
      organization: process.env.OPENAI_ORG_ID
    });

    // Build messages array
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT }
    ];

    // Add history
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      }
    }

    // Add current message
    messages.push({ role: 'user', content: message });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      functions,
      function_call: 'auto',
      temperature: 0.7,
      max_tokens: 4000
    });

    const choice = response.choices[0];

    // Handle function calls
    if (choice.message.function_call) {
      const fnName = choice.message.function_call.name;
      const fnArgs = JSON.parse(choice.message.function_call.arguments);

      if (fnName === 'analyze_trip') {
        // Structured trip analysis
        const displayContent = formatTripAnalysis(fnArgs);
        return NextResponse.json({
          content: displayContent,
          tripData: fnArgs
        });
      }

      if (fnName === 'ask_clarification') {
        // Clarifying question
        let content = fnArgs.question;
        if (fnArgs.options?.length) {
          content += '\n\nOptions:\n' + fnArgs.options.map((o: string) => `- ${o}`).join('\n');
        }
        return NextResponse.json({ content });
      }
    }

    // Regular text response
    const rawContent = choice.message.content || '';
    return NextResponse.json({ content: rawContent });

  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({
      content: 'Error. Check OPENAI_API_KEY.'
    }, { status: 500 });
  }
}

function formatTripAnalysis(data: {
  trip?: {
    description?: string;
    activity_type?: string;
    location?: { name?: string; region?: string; country?: string; altitude_m?: number };
    season?: string;
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
    requirements?: Record<string, string>;
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
    if (t.location?.country) header += ` (${t.location.country})`;
    if (t.location?.altitude_m) header += ` · ${t.location.altitude_m}m`;
    lines.push(header);

    const meta: string[] = [];
    if (t.activity_type) meta.push(t.activity_type.replace(/_/g, ' '));
    if (t.duration_days) meta.push(`${t.duration_days} days`);
    if (t.season) meta.push(t.season);
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

function formatSpecs(requirements?: Record<string, string>): string {
  if (!requirements) return '';
  const specs = Object.values(requirements).slice(0, 3);
  return specs.join(', ');
}
