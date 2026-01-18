// lib/parse-weight.ts
// Parse weight from specs strings like "550g, Gore-Tex" or "1.2kg waterproof"

export function parseWeightGrams(specs: string | null | undefined): number | null {
  if (!specs) return null;

  // Handle structured specs object
  if (typeof specs === 'object') {
    const s = specs as any;
    if (s.weight_g) return s.weight_g;
    if (s.weight?.value) {
      const unit = (s.weight.unit || 'g').toLowerCase();
      return convertToGrams(s.weight.value, unit);
    }
    if (s.raw) specs = s.raw;
    else return null;
  }

  const specStr = String(specs);

  // Match patterns: 550g, 550 g, 1.2kg, 1.2 kg, 19oz, 19 oz, 2 lbs, 2lb, etc.
  // Also handles: "Weight: 550g" or "(550g)"
  const match = specStr.match(/(\d+\.?\d*)\s*(g|kg|oz|lbs?)\b/i);
  if (!match) return null;

  const value = parseFloat(match[1]);
  const unit = match[2].toLowerCase();

  return convertToGrams(value, unit);
}

function convertToGrams(value: number, unit: string): number {
  switch (unit) {
    case 'kg':
      return Math.round(value * 1000);
    case 'oz':
      return Math.round(value * 28.35);
    case 'lb':
    case 'lbs':
      return Math.round(value * 453.6);
    default:
      return Math.round(value); // assume grams
  }
}

export function formatWeight(grams: number | null | undefined, preferredUnit: 'g' | 'kg' | 'oz' | 'lbs' = 'g'): string {
  if (!grams) return '';

  switch (preferredUnit) {
    case 'kg':
      return `${(grams / 1000).toFixed(2)}kg`;
    case 'oz':
      return `${(grams / 28.35).toFixed(1)}oz`;
    case 'lbs':
      return `${(grams / 453.6).toFixed(2)}lbs`;
    default:
      return `${grams}g`;
  }
}

export function formatWeightSmart(grams: number | null | undefined): string {
  if (!grams) return '';

  if (grams >= 1000) {
    return `${(grams / 1000).toFixed(2)}kg`;
  }
  return `${grams}g`;
}
