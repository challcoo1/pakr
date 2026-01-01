import { sql } from './db';

// ============================================================================
// BRAND & TIER CLASSIFICATIONS
// ============================================================================

const BRAND_TIERS: Record<string, 'premium' | 'mid' | 'budget'> = {
  // Premium brands
  "Arc'teryx": 'premium',
  'Arcteryx': 'premium',
  'La Sportiva': 'premium',
  'Petzl': 'premium',
  'Black Diamond': 'premium',
  'Rab': 'premium',
  'Mountain Hardwear': 'premium',
  'Hilleberg': 'premium',
  'Western Mountaineering': 'premium',
  'Grivel': 'premium',
  'Scarpa': 'premium',
  'Dynafit': 'premium',

  // Mid-tier brands
  'Osprey': 'mid',
  'Salomon': 'mid',
  'Mammut': 'mid',
  'The North Face': 'mid',
  'Patagonia': 'mid',
  'Gregory': 'mid',
  'MSR': 'mid',
  'Big Agnes': 'mid',
  'NEMO': 'mid',
  'Sea to Summit': 'mid',
  'Outdoor Research': 'mid',
  'Lowa': 'mid',
  'Marmot': 'mid',
  'Deuter': 'mid',

  // Budget brands
  'Macpac': 'budget',
  'Kathmandu': 'budget',
  'Anaconda': 'budget',
  'Decathlon': 'budget',
  'Quechua': 'budget',
  'Forclaz': 'budget',
  'Columbia': 'budget',
  'Merrell': 'budget',
  'Naturehike': 'budget',
  'Kelty': 'budget',
};

// Gear categories that indicate expertise level
const ADVANCED_GEAR_CATEGORIES = [
  'footwear/alpine_boots/4_season',
  'climbing/crampons',
  'climbing/ice_axe',
  'climbing/harness',
  'climbing/rope',
  'climbing/protection',
  'shelter/tents/4_season',
  'snow_gear/avalanche',
];

const INTERMEDIATE_GEAR_CATEGORIES = [
  'footwear/alpine_boots/3_season',
  'footwear/hiking_boots/mid',
  'footwear/hiking_boots/heavy',
  'climbing/helmet',
  'shelter/tents/3_season',
  'sleep_system/sleeping_bags/down',
  'packs/backpacks/multiday',
];

const BEGINNER_GEAR_CATEGORIES = [
  'footwear/hiking_boots/light',
  'footwear/trail_runners',
  'packs/backpacks/daypacks',
  'clothing/shells/rain',
];

// Category to activity type mapping
const CATEGORY_TO_ACTIVITY: Record<string, string[]> = {
  'footwear/alpine_boots': ['alpine_climbing', 'mountaineering'],
  'climbing/crampons': ['alpine_climbing', 'ice_climbing', 'mountaineering'],
  'climbing/ice_axe': ['alpine_climbing', 'ice_climbing', 'mountaineering'],
  'climbing/harness': ['alpine_climbing', 'rock_climbing', 'ice_climbing'],
  'climbing/rope': ['alpine_climbing', 'rock_climbing'],
  'footwear/hiking_boots': ['hiking', 'trekking', 'backpacking'],
  'footwear/trail_runners': ['trail_running', 'hiking'],
  'packs/backpacks/multiday': ['backpacking', 'trekking'],
  'packs/backpacks/expedition': ['mountaineering', 'expedition'],
  'shelter/tents/4_season': ['winter_camping', 'mountaineering', 'expedition'],
  'shelter/tents/3_season': ['backpacking', 'camping'],
  'snow_gear': ['backcountry_skiing', 'mountaineering'],
};

// ============================================================================
// TYPES
// ============================================================================

export interface UserProfile {
  price_sensitivity: 'premium' | 'mid' | 'budget';
  expertise_level: 'beginner' | 'intermediate' | 'advanced';
  brand_affinity: Record<string, number>;
  activity_types: string[];
  gear_count: number;
  top_brands: string[];
  analysis_metadata: {
    analyzed_at: string;
    gear_items_analyzed: number;
    confidence: 'low' | 'medium' | 'high';
  };
}

interface GearItem {
  id: string;
  name: string;
  category: string;
  manufacturer: string;
  specs: Record<string, unknown>;
  acquired_date: string;
  condition: string;
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Analyze all gear owned by a user to infer their profile
 */
export async function analyzeUserGear(userId: string): Promise<UserProfile> {
  // Query all user gear joined with catalog
  const gearItems = await sql`
    SELECT
      ug.id,
      gc.name,
      gc.category,
      gc.manufacturer,
      gc.specs,
      ug.acquired_date,
      ug.condition
    FROM user_gear ug
    JOIN gear_catalog gc ON ug.gear_id = gc.id
    WHERE ug.user_id = ${userId}
  ` as GearItem[];

  // Handle empty gear case
  if (gearItems.length === 0) {
    return {
      price_sensitivity: 'mid',
      expertise_level: 'beginner',
      brand_affinity: {},
      activity_types: [],
      gear_count: 0,
      top_brands: [],
      analysis_metadata: {
        analyzed_at: new Date().toISOString(),
        gear_items_analyzed: 0,
        confidence: 'low',
      },
    };
  }

  // Analyze patterns
  const priceTier = analyzePriceTier(gearItems);
  const expertiseLevel = analyzeExpertiseLevel(gearItems);
  const brandAffinity = analyzeBrandAffinity(gearItems);
  const activityTypes = analyzeActivityTypes(gearItems);
  const topBrands = getTopBrands(brandAffinity, 3);

  // Determine confidence based on gear count
  let confidence: 'low' | 'medium' | 'high' = 'low';
  if (gearItems.length >= 10) confidence = 'high';
  else if (gearItems.length >= 5) confidence = 'medium';

  return {
    price_sensitivity: priceTier,
    expertise_level: expertiseLevel,
    brand_affinity: brandAffinity,
    activity_types: activityTypes,
    gear_count: gearItems.length,
    top_brands: topBrands,
    analysis_metadata: {
      analyzed_at: new Date().toISOString(),
      gear_items_analyzed: gearItems.length,
      confidence,
    },
  };
}

/**
 * Update profile signals when user adds new gear
 * Uses incremental learning to blend with existing profile
 */
export async function updateProfileSignals(
  userId: string,
  newGearId: string
): Promise<UserProfile> {
  // Get existing profile (if any)
  const existingProfile = await sql`
    SELECT profile_data FROM user_profile_signals WHERE user_id = ${userId}
  `;

  // Re-analyze all gear
  const newProfile = await analyzeUserGear(userId);

  // If existing profile, blend signals (80% new, 20% old for recency bias)
  if (existingProfile.length > 0 && existingProfile[0].profile_data) {
    const oldProfile = existingProfile[0].profile_data as UserProfile;

    // Blend brand affinity (keeps historical preferences but weights recent)
    if (oldProfile.brand_affinity) {
      for (const [brand, count] of Object.entries(oldProfile.brand_affinity)) {
        if (newProfile.brand_affinity[brand]) {
          // Weighted average: 80% current gear count, 20% historical
          newProfile.brand_affinity[brand] = Math.round(
            newProfile.brand_affinity[brand] * 0.8 + count * 0.2
          );
        }
      }
    }
  }

  // Upsert profile signals
  await sql`
    INSERT INTO user_profile_signals (
      user_id,
      price_sensitivity,
      expertise_level,
      preferred_brands,
      activity_types,
      gear_count,
      profile_data,
      updated_at
    ) VALUES (
      ${userId},
      ${newProfile.price_sensitivity},
      ${newProfile.expertise_level},
      ${JSON.stringify(newProfile.brand_affinity)},
      ${JSON.stringify(newProfile.activity_types)},
      ${newProfile.gear_count},
      ${JSON.stringify(newProfile)},
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      price_sensitivity = ${newProfile.price_sensitivity},
      expertise_level = ${newProfile.expertise_level},
      preferred_brands = ${JSON.stringify(newProfile.brand_affinity)},
      activity_types = ${JSON.stringify(newProfile.activity_types)},
      gear_count = ${newProfile.gear_count},
      profile_data = ${JSON.stringify(newProfile)},
      updated_at = NOW()
  `;

  return newProfile;
}

/**
 * Get user profile formatted for recommendation filtering
 */
export async function getRecommendationContext(userId: string): Promise<{
  price_sensitivity: 'premium' | 'mid' | 'budget';
  expertise_level: 'beginner' | 'intermediate' | 'advanced';
  brand_affinity: Record<string, number>;
  activity_types: string[];
  preferred_brands: string[];
} | null> {
  // Try to get cached profile first
  const cached = await sql`
    SELECT
      price_sensitivity,
      expertise_level,
      preferred_brands,
      activity_types,
      profile_data
    FROM user_profile_signals
    WHERE user_id = ${userId}
  `;

  if (cached.length > 0 && cached[0].profile_data) {
    const profile = cached[0].profile_data as UserProfile;
    return {
      price_sensitivity: profile.price_sensitivity,
      expertise_level: profile.expertise_level,
      brand_affinity: profile.brand_affinity,
      activity_types: profile.activity_types,
      preferred_brands: profile.top_brands,
    };
  }

  // No cached profile, analyze on-demand
  const profile = await analyzeUserGear(userId);

  if (profile.gear_count === 0) {
    return null; // No gear, no profile
  }

  // Cache the profile for future use
  await sql`
    INSERT INTO user_profile_signals (
      user_id,
      price_sensitivity,
      expertise_level,
      preferred_brands,
      activity_types,
      gear_count,
      profile_data,
      updated_at
    ) VALUES (
      ${userId},
      ${profile.price_sensitivity},
      ${profile.expertise_level},
      ${JSON.stringify(profile.brand_affinity)},
      ${JSON.stringify(profile.activity_types)},
      ${profile.gear_count},
      ${JSON.stringify(profile)},
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      price_sensitivity = ${profile.price_sensitivity},
      expertise_level = ${profile.expertise_level},
      preferred_brands = ${JSON.stringify(profile.brand_affinity)},
      activity_types = ${JSON.stringify(profile.activity_types)},
      gear_count = ${profile.gear_count},
      profile_data = ${JSON.stringify(profile)},
      updated_at = NOW()
  `;

  return {
    price_sensitivity: profile.price_sensitivity,
    expertise_level: profile.expertise_level,
    brand_affinity: profile.brand_affinity,
    activity_types: profile.activity_types,
    preferred_brands: profile.top_brands,
  };
}

// ============================================================================
// ANALYSIS HELPER FUNCTIONS
// ============================================================================

/**
 * Analyze price tier based on brand distribution
 */
function analyzePriceTier(
  gearItems: GearItem[]
): 'premium' | 'mid' | 'budget' {
  const tierCounts = { premium: 0, mid: 0, budget: 0 };

  for (const item of gearItems) {
    const brand = normalizeBrandName(item.manufacturer);
    const tier = BRAND_TIERS[brand] || 'mid'; // Default to mid if unknown
    tierCounts[tier]++;
  }

  const total = gearItems.length;

  // If 50%+ premium → premium buyer
  if (tierCounts.premium / total >= 0.5) return 'premium';

  // If 50%+ budget → budget conscious
  if (tierCounts.budget / total >= 0.5) return 'budget';

  // Mixed or mostly mid → mid tier (pragmatic buyer)
  return 'mid';
}

/**
 * Analyze expertise level based on gear categories
 */
function analyzeExpertiseLevel(
  gearItems: GearItem[]
): 'beginner' | 'intermediate' | 'advanced' {
  let advancedCount = 0;
  let intermediateCount = 0;

  for (const item of gearItems) {
    const category = item.category || '';

    // Check for advanced gear
    if (ADVANCED_GEAR_CATEGORIES.some((c) => category.startsWith(c))) {
      advancedCount++;
    }
    // Check for intermediate gear
    else if (INTERMEDIATE_GEAR_CATEGORIES.some((c) => category.startsWith(c))) {
      intermediateCount++;
    }
  }

  // If owns any advanced gear → likely advanced
  // (you don't buy crampons and ice axes casually)
  if (advancedCount >= 2) return 'advanced';
  if (advancedCount >= 1) return 'intermediate';

  // If has intermediate gear → intermediate
  if (intermediateCount >= 2) return 'intermediate';

  return 'beginner';
}

/**
 * Count items per brand to find affinity
 */
function analyzeBrandAffinity(gearItems: GearItem[]): Record<string, number> {
  const brandCounts: Record<string, number> = {};

  for (const item of gearItems) {
    const brand = normalizeBrandName(item.manufacturer);
    if (brand) {
      brandCounts[brand] = (brandCounts[brand] || 0) + 1;
    }
  }

  return brandCounts;
}

/**
 * Extract activity types from gear categories
 */
function analyzeActivityTypes(gearItems: GearItem[]): string[] {
  const activities = new Set<string>();

  for (const item of gearItems) {
    const category = item.category || '';

    // Check each category mapping
    for (const [categoryPrefix, activityList] of Object.entries(
      CATEGORY_TO_ACTIVITY
    )) {
      if (category.startsWith(categoryPrefix)) {
        activityList.forEach((activity) => activities.add(activity));
      }
    }
  }

  return Array.from(activities);
}

/**
 * Get top N brands by count
 */
function getTopBrands(
  brandAffinity: Record<string, number>,
  n: number
): string[] {
  return Object.entries(brandAffinity)
    .filter(([_, count]) => count >= 2) // Only brands with 2+ items
    .sort(([, a], [, b]) => b - a)
    .slice(0, n)
    .map(([brand]) => brand);
}

/**
 * Normalize brand name for consistent matching
 */
function normalizeBrandName(brand: string | null): string {
  if (!brand) return '';

  // Common normalizations
  const normalized = brand.trim();

  // Handle Arc'teryx variations
  if (normalized.toLowerCase().includes('arcteryx')) return "Arc'teryx";

  return normalized;
}

// ============================================================================
// UTILITY FUNCTIONS FOR RECOMMENDATIONS
// ============================================================================

/**
 * Score a gear item for a user based on their profile
 * Higher score = better match
 */
export function scoreGearForUser(
  gear: { manufacturer: string; category: string },
  profile: UserProfile
): number {
  let score = 50; // Base score

  const brand = normalizeBrandName(gear.manufacturer);

  // Brand affinity bonus (+20 for preferred brand)
  if (profile.brand_affinity[brand] && profile.brand_affinity[brand] >= 2) {
    score += 20;
  }

  // Price tier match bonus (+15)
  const gearTier = BRAND_TIERS[brand] || 'mid';
  if (gearTier === profile.price_sensitivity) {
    score += 15;
  }

  // Activity match bonus (+10 per matching activity)
  const gearCategory = gear.category || '';
  for (const [categoryPrefix, activities] of Object.entries(
    CATEGORY_TO_ACTIVITY
  )) {
    if (gearCategory.startsWith(categoryPrefix)) {
      const matchingActivities = activities.filter((a) =>
        profile.activity_types.includes(a)
      );
      score += matchingActivities.length * 10;
    }
  }

  return Math.min(score, 100); // Cap at 100
}

/**
 * Filter and sort gear recommendations based on user profile
 */
export function rankRecommendations<
  T extends { manufacturer: string; category: string }
>(items: T[], profile: UserProfile): T[] {
  return items
    .map((item) => ({
      item,
      score: scoreGearForUser(item, profile),
    }))
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
}
