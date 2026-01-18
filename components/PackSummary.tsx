'use client';

import { formatWeightSmart } from '@/lib/parse-weight';

interface GearItem {
  item: string;
  specs: string;
  weightG?: number | null;
  status?: 'empty' | 'ideal' | 'suitable' | 'adequate' | 'unsuitable';
}

interface PackSummaryProps {
  gear: GearItem[];
  isMatching?: boolean;
}

// Weight classification thresholds (in grams) for multi-day hiking
const WEIGHT_THRESHOLDS = {
  ultralight: 4500,  // Under 4.5kg base weight
  lightweight: 6800, // Under 6.8kg (15lbs)
  traditional: 9000, // Under 9kg (20lbs)
};

function getWeightClass(totalGrams: number): { label: string; color: string } {
  if (totalGrams <= WEIGHT_THRESHOLDS.ultralight) {
    return { label: 'Ultralight', color: 'var(--forest)' };
  }
  if (totalGrams <= WEIGHT_THRESHOLDS.lightweight) {
    return { label: 'Lightweight', color: 'var(--forest)' };
  }
  if (totalGrams <= WEIGHT_THRESHOLDS.traditional) {
    return { label: 'Traditional', color: 'var(--burnt)' };
  }
  return { label: 'Heavy', color: 'var(--muted)' };
}

export default function PackSummary({ gear, isMatching = false }: PackSummaryProps) {
  // Only count gear that has been selected (not empty)
  const selectedGear = gear.filter(g => g.status && g.status !== 'empty');

  if (selectedGear.length === 0) {
    return null; // Don't show until gear is selected
  }

  // Calculate totals
  const withWeight = selectedGear.filter(g => g.weightG);
  const totalWeight = withWeight.reduce((sum, g) => sum + (g.weightG || 0), 0);
  const unknownCount = selectedGear.length - withWeight.length;

  const weightClass = getWeightClass(totalWeight);

  return (
    <div className="pack-summary">
      <div className="pack-summary-header">
        <span className="pack-summary-label">PACK WEIGHT</span>
        {isMatching && (
          <span className="pack-summary-loading">
            <span className="inline-block w-2 h-2 border border-muted border-t-burnt rounded-full animate-spin mr-1" />
            updating...
          </span>
        )}
      </div>

      <div className="pack-summary-main">
        <span className="pack-summary-weight">{formatWeightSmart(totalWeight) || '0g'}</span>
        <span className="pack-summary-class" style={{ color: weightClass.color }}>
          {weightClass.label}
        </span>
      </div>

      <div className="pack-summary-details">
        <span className="pack-summary-count">
          {withWeight.length} item{withWeight.length !== 1 ? 's' : ''} weighed
        </span>
        {unknownCount > 0 && (
          <span className="pack-summary-unknown">
            · {unknownCount} unknown
          </span>
        )}
      </div>
    </div>
  );
}
