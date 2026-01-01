import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// Intent detection patterns
const INTENT_PATTERNS = {
  tripPlanning: [
    /\b(climbing|hiking|trekking|camping|backpacking)\b.*\b(in|at|on|to)\b/i,
    /\b(matterhorn|everest|kilimanjaro|mont blanc|overland|kokoda|annapurna)\b/i,
    /\b(trip|expedition|adventure|journey)\b.*\b(to|in|at)\b/i,
    /\bgoing to\b/i,
    /\bplanning\b.*\b(trip|hike|climb)\b/i,
  ],
  showGear: [
    /\b(show|list|display|what)\b.*\b(my|gear|equipment|kit)\b/i,
    /\bmy gear\b/i,
    /\bwhat do i (have|own)\b/i,
  ],
  addGear: [
    /\bi have\b.*\b(a|the|my)?\b/i,
    /\bi own\b/i,
    /\bjust (got|bought|purchased)\b/i,
    /\badd\b.*\b(to my|gear)\b/i,
  ],
  gearQuestion: [
    /\bwhat (boots|jacket|pack|tent|bag)\b/i,
    /\bwhich\b.*\bshould\b/i,
    /\brecommend\b/i,
  ],
};

function detectIntent(message: string): 'tripPlanning' | 'showGear' | 'addGear' | 'gearQuestion' | 'unknown' {
  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(message)) {
        return intent as keyof typeof INTENT_PATTERNS;
      }
    }
  }
  return 'unknown';
}

// Extract trip details from message
function extractTripDetails(message: string) {
  const locations: Record<string, { region: string; altitude?: number; activity: string }> = {
    matterhorn: { region: 'Swiss Alps', altitude: 4478, activity: 'alpine_climbing' },
    'mont blanc': { region: 'French Alps', altitude: 4808, activity: 'mountaineering' },
    'overland track': { region: 'Tasmania', activity: 'trekking' },
    kilimanjaro: { region: 'Tanzania', altitude: 5895, activity: 'trekking' },
    everest: { region: 'Nepal', altitude: 8849, activity: 'expedition' },
    annapurna: { region: 'Nepal', altitude: 8091, activity: 'trekking' },
    kokoda: { region: 'Papua New Guinea', activity: 'trekking' },
    patagonia: { region: 'Chile/Argentina', activity: 'backpacking' },
    dolomites: { region: 'Italian Alps', activity: 'hiking' },
  };

  const months = ['january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'];

  const lowerMessage = message.toLowerCase();

  // Find location
  let location = null;
  for (const [key, details] of Object.entries(locations)) {
    if (lowerMessage.includes(key)) {
      location = { name: key, ...details };
      break;
    }
  }

  // Find month
  let month = null;
  for (const m of months) {
    if (lowerMessage.includes(m)) {
      month = m;
      break;
    }
  }

  return { location, month };
}

// Extract gear name from "I have X" messages
function extractGearName(message: string): string | null {
  const patterns = [
    /i have (?:a |the |my )?(.+?)(?:\.|$)/i,
    /i own (?:a |the |my )?(.+?)(?:\.|$)/i,
    /just (?:got|bought) (?:a |the |my )?(.+?)(?:\.|$)/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    const intent = detectIntent(message);

    switch (intent) {
      case 'tripPlanning':
        return handleTripPlanning(message);

      case 'showGear':
        return handleShowGear();

      case 'addGear':
        return handleAddGear(message);

      case 'gearQuestion':
        return handleGearQuestion(message);

      default:
        return handleUnknown(message);
    }
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({
      content: 'Sorry, something went wrong. Please try again.',
    });
  }
}

async function handleTripPlanning(message: string) {
  const { location, month } = extractTripDetails(message);

  if (!location) {
    return NextResponse.json({
      content: "That sounds like an adventure! Could you tell me more about where you're headed? I can help you figure out what gear you'll need.",
    });
  }

  // Generate gear requirements based on location
  const gearRequirements = generateGearRequirements(location, month);

  return NextResponse.json({
    content: `${location.name.charAt(0).toUpperCase() + location.name.slice(1)}${month ? ` in ${month.charAt(0).toUpperCase() + month.slice(1)}` : ''} — excellent choice. Here's what you'll need:`,
    tripAnalysis: {
      location: location.region,
      activity: location.activity.replace(/_/g, ' '),
      conditions: getConditions(location, month),
    },
    gear: gearRequirements,
  });
}

async function handleShowGear() {
  // For now, show gear from catalog (in real app, would filter by user)
  try {
    const gear = await sql`
      SELECT name, manufacturer, category, specs
      FROM gear_catalog
      ORDER BY enriched_at DESC
      LIMIT 10
    `;

    if (gear.length === 0) {
      return NextResponse.json({
        content: "You haven't added any gear yet. Tell me what you own — for example, \"I have La Sportiva Trango Tower GTX boots\"",
      });
    }

    return NextResponse.json({
      content: 'Here\'s your gear collection:',
      gear: gear.map((item) => ({
        name: item.name,
        manufacturer: item.manufacturer,
        category: item.category,
        specs: item.specs,
        owned: true,
      })),
    });
  } catch {
    return NextResponse.json({
      content: "You haven't added any gear yet. Tell me what you own — for example, \"I have La Sportiva Trango Tower GTX boots\"",
    });
  }
}

async function handleAddGear(message: string) {
  const gearName = extractGearName(message);

  if (!gearName) {
    return NextResponse.json({
      content: "I didn't catch the gear name. Could you tell me the specific product? For example, \"I have Arc'teryx Alpha SV jacket\"",
    });
  }

  // Check if it's already in catalog
  const existing = await sql`
    SELECT name, manufacturer, category, specs
    FROM gear_catalog
    WHERE LOWER(name) LIKE ${`%${gearName.toLowerCase()}%`}
    LIMIT 1
  `;

  if (existing.length > 0) {
    return NextResponse.json({
      content: `Got it — I've noted your ${existing[0].name}. This is a solid piece of kit.`,
      gear: [{
        name: existing[0].name,
        manufacturer: existing[0].manufacturer,
        category: existing[0].category,
        specs: existing[0].specs,
        owned: true,
      }],
    });
  }

  // Gear not in catalog — would trigger enrichment
  return NextResponse.json({
    content: `I'll add "${gearName}" to your collection. Let me look up the specs for that...`,
  });
}

async function handleGearQuestion(message: string) {
  return NextResponse.json({
    content: "Good question. To give you the best recommendation, could you tell me more about what you'll be using it for? Where are you headed?",
  });
}

async function handleUnknown(message: string) {
  return NextResponse.json({
    content: "I'm here to help you prepare for your adventures. You can:\n\n• Tell me about a trip you're planning\n• Show me what gear you already own\n• Ask for recommendations\n\nWhere would you like to start?",
  });
}

// Generate gear requirements based on trip
function generateGearRequirements(
  location: { name: string; region: string; altitude?: number; activity: string },
  month: string | null
) {
  const gear = [];

  // Alpine climbing gear
  if (location.activity === 'alpine_climbing' || location.activity === 'mountaineering') {
    gear.push({
      name: 'Mountaineering Boots',
      manufacturer: 'Various',
      category: 'footwear/alpine_boots/4_season',
      priority: 'critical' as const,
      requirements: {
        crampon_compatibility: 'semi-automatic or automatic',
        temperature_rating: '-15°C minimum',
        waterproofing: 'Gore-Tex required',
      },
      reasoning: `Essential for ${location.region} conditions. Need secure crampon attachment.`,
    });

    gear.push({
      name: 'Crampons',
      manufacturer: 'Various',
      category: 'climbing/crampons',
      priority: 'critical' as const,
      requirements: {
        points: '12-point',
        type: 'semi-automatic',
        anti_balling: 'required',
      },
      reasoning: 'Glacier travel and snow/ice sections.',
    });

    gear.push({
      name: 'Ice Axe',
      manufacturer: 'Various',
      category: 'climbing/ice_axe',
      priority: 'critical' as const,
      requirements: {
        length: '50-60cm',
        type: 'general mountaineering',
      },
      reasoning: 'Self-arrest and support on steep terrain.',
    });

    gear.push({
      name: 'Climbing Helmet',
      manufacturer: 'Various',
      category: 'climbing/helmet',
      priority: 'critical' as const,
      requirements: {
        certification: 'UIAA/CE',
        weight: '<300g',
      },
      reasoning: 'Rockfall protection is essential.',
    });
  }

  // Trekking gear
  if (location.activity === 'trekking' || location.activity === 'backpacking') {
    gear.push({
      name: 'Hiking Boots',
      manufacturer: 'Various',
      category: 'footwear/hiking_boots/mid',
      priority: 'critical' as const,
      requirements: {
        waterproofing: 'Gore-Tex or similar',
        ankle_support: 'mid-cut',
        sole: 'Vibram or equivalent',
      },
      reasoning: `${location.region} terrain requires good traction and waterproofing.`,
    });

    gear.push({
      name: 'Backpack',
      manufacturer: 'Various',
      category: 'packs/backpacks/multiday',
      priority: 'critical' as const,
      requirements: {
        capacity: '50-65L',
        frame: 'internal',
        rain_cover: 'included',
      },
      reasoning: 'Multi-day capacity with weather protection.',
    });
  }

  // Common items
  gear.push({
    name: 'Hardshell Jacket',
    manufacturer: 'Various',
    category: 'clothing/shells/hardshell',
    priority: 'critical' as const,
    requirements: {
      waterproof_rating: '20,000mm+',
      breathability: '20,000g+',
      hood: 'helmet-compatible',
    },
    reasoning: 'Weather protection is critical in mountain environments.',
  });

  gear.push({
    name: 'Insulated Jacket',
    manufacturer: 'Various',
    category: 'clothing/insulation/down',
    priority: 'recommended' as const,
    requirements: {
      fill_power: '800+ if down',
      weight: '<400g',
      packability: 'compressible',
    },
    reasoning: 'Warmth for cold mornings and summit conditions.',
  });

  return gear;
}

function getConditions(
  location: { name: string; region: string; altitude?: number; activity: string },
  month: string | null
): string[] {
  const conditions = [];

  if (location.altitude && location.altitude > 4000) {
    conditions.push('high altitude');
  }

  if (location.activity === 'alpine_climbing') {
    conditions.push('glacier', 'rock', 'mixed terrain');
  }

  if (location.region.includes('Tasmania')) {
    conditions.push('mud', 'rain likely', 'variable weather');
  }

  if (month && ['december', 'january', 'february'].includes(month.toLowerCase())) {
    if (location.region.includes('Alps')) {
      conditions.push('winter conditions', 'deep snow');
    }
  }

  if (month && ['july', 'august'].includes(month.toLowerCase())) {
    if (location.region.includes('Alps')) {
      conditions.push('afternoon storms', 'rockfall risk');
    }
  }

  return conditions.length > 0 ? conditions : ['variable conditions'];
}
