// lib/validate-gear.ts

export type ValidationStatus = 'suitable' | 'marginal' | 'unsuitable';

export interface GearSpec {
  temperature_rating_c?: number;
  waterproof_rating_mm?: number;
  weight_g?: number;
  crampon_compatible?: boolean;
  gore_tex?: boolean;
  insulated?: boolean;
  category?: string;
  [key: string]: unknown;
}

export interface GearRequirement {
  item: string;
  category?: string;
  priority?: 'critical' | 'recommended' | 'optional';
  requirements?: Record<string, string>;
  reasoning?: string;
}

export interface UserGear {
  name: string;
  manufacturer?: string;
  category?: string;
  specs?: GearSpec;
}

export interface ValidationResult {
  status: ValidationStatus;
  reasons: string[];
  score: number; // 0-100
}

/**
 * Validate user's gear against a trip requirement
 */
export function validateGearForRequirement(
  userGear: UserGear,
  requirement: GearRequirement
): ValidationResult {
  const reasons: string[] = [];
  let score = 100;

  // Category match check
  const categoryScore = checkCategoryMatch(userGear, requirement);
  if (categoryScore.deduction > 0) {
    score -= categoryScore.deduction;
    reasons.push(...categoryScore.reasons);
  }

  // Parse and check specific requirements
  if (requirement.requirements) {
    for (const [key, value] of Object.entries(requirement.requirements)) {
      const check = checkRequirement(userGear, key, value);
      if (check.deduction > 0) {
        score -= check.deduction;
        reasons.push(...check.reasons);
      }
    }
  }

  // Determine status based on score
  let status: ValidationStatus;
  if (score >= 80) {
    status = 'suitable';
  } else if (score >= 50) {
    status = 'marginal';
  } else {
    status = 'unsuitable';
  }

  return { status, reasons, score: Math.max(0, score) };
}

/**
 * Check if gear category matches requirement category
 */
function checkCategoryMatch(
  userGear: UserGear,
  requirement: GearRequirement
): { deduction: number; reasons: string[] } {
  if (!requirement.category || !userGear.category) {
    return { deduction: 0, reasons: [] };
  }

  const reqParts = requirement.category.toLowerCase().split('/');
  const gearParts = userGear.category.toLowerCase().split('/');

  // Exact match
  if (requirement.category.toLowerCase() === userGear.category.toLowerCase()) {
    return { deduction: 0, reasons: [] };
  }

  // Check for category hierarchy match (e.g., footwear/alpine_boots vs footwear/hiking_boots)
  if (reqParts[0] === gearParts[0]) {
    // Same top-level category
    if (reqParts.length > 1 && gearParts.length > 1 && reqParts[1] !== gearParts[1]) {
      // Different sub-category - check severity
      const severity = getCategoryMismatchSeverity(reqParts[1], gearParts[1]);
      return {
        deduction: severity.deduction,
        reasons: severity.reasons
      };
    }
    return { deduction: 0, reasons: [] };
  }

  // Completely different category
  return {
    deduction: 60,
    reasons: [`Wrong category: ${userGear.category} vs required ${requirement.category}`]
  };
}

/**
 * Get severity of category mismatch within same top-level category
 */
function getCategoryMismatchSeverity(
  required: string,
  actual: string
): { deduction: number; reasons: string[] } {
  // Footwear mismatches
  const footwearSeverity: Record<string, Record<string, number>> = {
    'alpine_boots': {
      'hiking_boots': 40,      // Hiking boots unsuitable for alpine
      'approach_shoes': 50,
      'trail_runners': 60
    },
    '4_season': {
      '3_season': 30,          // 3-season marginal for 4-season requirement
      'hiking_boots': 50
    },
    'mountaineering': {
      'hiking_boots': 40,
      'backpacking': 35
    }
  };

  // Check if we have a specific severity mapping
  if (footwearSeverity[required]?.[actual]) {
    const deduction = footwearSeverity[required][actual];
    return {
      deduction,
      reasons: [`${actual.replace(/_/g, ' ')} may not meet ${required.replace(/_/g, ' ')} requirements`]
    };
  }

  // Default minor mismatch
  return {
    deduction: 20,
    reasons: [`Category mismatch: ${actual.replace(/_/g, ' ')} vs ${required.replace(/_/g, ' ')}`]
  };
}

/**
 * Check a specific requirement against user gear specs
 */
function checkRequirement(
  userGear: UserGear,
  key: string,
  requiredValue: string
): { deduction: number; reasons: string[] } {
  const specs = userGear.specs || {};
  const keyLower = key.toLowerCase();

  // Temperature rating checks
  if (keyLower.includes('temperature') || keyLower.includes('temp') || keyLower.includes('rating')) {
    return checkTemperatureRating(specs, requiredValue);
  }

  // Crampon compatibility
  if (keyLower.includes('crampon')) {
    return checkCramponCompatibility(specs, requiredValue);
  }

  // Waterproof rating
  if (keyLower.includes('waterproof')) {
    return checkWaterproofRating(specs, requiredValue);
  }

  // Gore-Tex or membrane
  if (keyLower.includes('gore') || keyLower.includes('membrane')) {
    return checkMembrane(specs, requiredValue);
  }

  // Weight check
  if (keyLower.includes('weight')) {
    return checkWeight(specs, requiredValue);
  }

  // Generic feature check
  return checkGenericFeature(specs, key, requiredValue);
}

/**
 * Check temperature rating
 */
function checkTemperatureRating(
  specs: GearSpec,
  required: string
): { deduction: number; reasons: string[] } {
  // Parse required temp (e.g., "-15°C minimum", "-10°C")
  const reqMatch = required.match(/-?\d+/);
  if (!reqMatch) return { deduction: 0, reasons: [] };
  const reqTemp = parseInt(reqMatch[0]);

  // Check if gear has temp rating
  if (specs.temperature_rating_c === undefined) {
    return {
      deduction: 30,
      reasons: [`Unknown temperature rating (${reqTemp}°C required)`]
    };
  }

  const gearTemp = specs.temperature_rating_c;
  const diff = gearTemp - reqTemp; // Positive = gear is warmer than needed (bad)

  if (diff <= 0) {
    // Gear is rated colder or equal - suitable
    return { deduction: 0, reasons: [] };
  } else if (diff <= 5) {
    // Slightly under-rated - marginal
    return {
      deduction: 25,
      reasons: [`Temperature rating ${gearTemp}°C vs ${reqTemp}°C required (${diff}°C gap)`]
    };
  } else if (diff <= 10) {
    // Significantly under-rated
    return {
      deduction: 45,
      reasons: [`Temperature rating insufficient: ${gearTemp}°C vs ${reqTemp}°C required`]
    };
  } else {
    // Way under-rated
    return {
      deduction: 60,
      reasons: [`Temperature rating inadequate: ${gearTemp}°C vs ${reqTemp}°C required`]
    };
  }
}

/**
 * Check crampon compatibility
 */
function checkCramponCompatibility(
  specs: GearSpec,
  required: string
): { deduction: number; reasons: string[] } {
  const reqLower = required.toLowerCase();
  const needsAutomatic = reqLower.includes('automatic') || reqLower.includes('auto');
  const needsSemiAuto = reqLower.includes('semi-auto') || reqLower.includes('semi auto');

  if (specs.crampon_compatible === false) {
    return {
      deduction: 50,
      reasons: ['Not crampon compatible']
    };
  }

  if (specs.crampon_compatible === undefined) {
    return {
      deduction: 30,
      reasons: ['Crampon compatibility unknown']
    };
  }

  // Has crampon compatibility - check type if needed
  if (needsAutomatic && specs.crampon_compatible === true) {
    // We don't know if it's automatic, semi-auto, or strap
    return {
      deduction: 15,
      reasons: ['Crampon compatible but binding type unverified']
    };
  }

  return { deduction: 0, reasons: [] };
}

/**
 * Check waterproof rating
 */
function checkWaterproofRating(
  specs: GearSpec,
  required: string
): { deduction: number; reasons: string[] } {
  // Parse required rating (e.g., "20,000mm+", "20k")
  const reqMatch = required.match(/(\d+)[,.]?(\d*)/);
  if (!reqMatch) {
    // Check for Gore-Tex requirement
    if (required.toLowerCase().includes('gore')) {
      return checkMembrane(specs, required);
    }
    return { deduction: 0, reasons: [] };
  }

  let reqRating = parseInt(reqMatch[1]);
  if (reqMatch[2]) {
    reqRating = reqRating * 1000 + parseInt(reqMatch[2]);
  } else if (reqRating < 100) {
    // Probably in thousands (e.g., "20k")
    reqRating *= 1000;
  }

  if (specs.waterproof_rating_mm === undefined) {
    if (specs.gore_tex) {
      // Gore-Tex is typically 28,000mm+
      return { deduction: 0, reasons: [] };
    }
    return {
      deduction: 25,
      reasons: [`Waterproof rating unknown (${reqRating}mm required)`]
    };
  }

  const gearRating = specs.waterproof_rating_mm;
  if (gearRating >= reqRating) {
    return { deduction: 0, reasons: [] };
  } else if (gearRating >= reqRating * 0.7) {
    return {
      deduction: 20,
      reasons: [`Waterproof ${gearRating}mm vs ${reqRating}mm recommended`]
    };
  } else {
    return {
      deduction: 40,
      reasons: [`Waterproof ${gearRating}mm insufficient (${reqRating}mm required)`]
    };
  }
}

/**
 * Check membrane/Gore-Tex
 */
function checkMembrane(
  specs: GearSpec,
  required: string
): { deduction: number; reasons: string[] } {
  const reqLower = required.toLowerCase();
  const needsGoreTex = reqLower.includes('gore-tex') || reqLower.includes('gore tex');

  if (needsGoreTex && specs.gore_tex === false) {
    return {
      deduction: 25,
      reasons: ['No Gore-Tex membrane (alternative membrane may suffice)']
    };
  }

  if (specs.gore_tex === undefined && specs.waterproof_rating_mm === undefined) {
    return {
      deduction: 20,
      reasons: ['Waterproof membrane unverified']
    };
  }

  return { deduction: 0, reasons: [] };
}

/**
 * Check weight requirement
 */
function checkWeight(
  specs: GearSpec,
  required: string
): { deduction: number; reasons: string[] } {
  // Parse required weight (e.g., "<400g", "under 500g")
  const reqMatch = required.match(/(\d+)\s*(g|kg)/i);
  if (!reqMatch) return { deduction: 0, reasons: [] };

  let reqWeight = parseInt(reqMatch[1]);
  if (reqMatch[2].toLowerCase() === 'kg') {
    reqWeight *= 1000;
  }

  if (specs.weight_g === undefined) {
    return {
      deduction: 10,
      reasons: ['Weight unverified']
    };
  }

  const gearWeight = specs.weight_g;
  if (gearWeight <= reqWeight) {
    return { deduction: 0, reasons: [] };
  } else if (gearWeight <= reqWeight * 1.2) {
    return {
      deduction: 10,
      reasons: [`Weight ${gearWeight}g exceeds ${reqWeight}g target`]
    };
  } else {
    return {
      deduction: 20,
      reasons: [`Weight ${gearWeight}g significantly over ${reqWeight}g target`]
    };
  }
}

/**
 * Generic feature check
 */
function checkGenericFeature(
  specs: GearSpec,
  key: string,
  required: string
): { deduction: number; reasons: string[] } {
  // Check if specs has this key
  const specValue = specs[key.toLowerCase().replace(/\s+/g, '_')];

  if (specValue === undefined) {
    // Unknown - small deduction
    return {
      deduction: 10,
      reasons: [`${key.replace(/_/g, ' ')} unverified`]
    };
  }

  // Simple boolean check
  if (typeof specValue === 'boolean') {
    if (specValue) {
      return { deduction: 0, reasons: [] };
    } else {
      return {
        deduction: 25,
        reasons: [`Missing: ${key.replace(/_/g, ' ')}`]
      };
    }
  }

  // String comparison (basic)
  if (typeof specValue === 'string') {
    if (specValue.toLowerCase().includes(required.toLowerCase())) {
      return { deduction: 0, reasons: [] };
    }
  }

  return { deduction: 0, reasons: [] };
}

/**
 * Format validation result for display
 */
export function formatValidationResult(result: ValidationResult): {
  indicator: string;
  color: string;
  label: string;
} {
  switch (result.status) {
    case 'suitable':
      return {
        indicator: '●',
        color: '#2C5530',
        label: 'SUITABLE'
      };
    case 'marginal':
      return {
        indicator: '◐',
        color: '#CC5500',
        label: 'MARGINAL'
      };
    case 'unsuitable':
      return {
        indicator: '○',
        color: '#2B2B2B',
        label: 'UNSUITABLE'
      };
  }
}
