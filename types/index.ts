// types/index.ts
// Shared TypeScript interfaces

export interface GearRequirement {
  item: string;
  specs: string;
  category?: string;
  priority: 'critical' | 'recommended' | 'optional';
}

export interface TripMatch {
  name: string;
  location: string;
  difficulty: string;
  duration: string;
  distance: string;
  terrain: string;
  elevation: string;
  hazards: string;
  summary: string;
}

export interface TripGrading {
  local: string;
  international: string;
  description: string;
}

export interface TripAnalysis {
  name: string;
  region: string;
  timeOfYear: string;
  duration: string;
  distance: string;
  elevation: string;
  grading: TripGrading;
  terrain: string;
  hazards: string;
  conditions: string[];
  gear: GearRequirement[];
}

export interface UserGearEntry {
  input: string;
  status: 'ideal' | 'suitable' | 'adequate' | 'unsuitable' | 'empty';
  reasons: string[];
  weightG?: number | null;
  weightEstimated?: boolean;
}

export interface ProductMatch {
  id?: string;
  name: string;
  brand: string;
  specs: string;
  source?: 'database' | 'online';
  isNew?: boolean;
  weightG?: number | null;
}

export interface CommunityRating {
  avgRating: number;
  reviewCount: number;
}

export interface WeatherDay {
  date: string;
  tempHigh: number;
  tempLow: number;
  precipitation: number;
}

export interface WeatherDistribution {
  month: string;
  tempMean: number;
  tempStdDev: number;
  tempMin: number;
  tempMax: number;
  precipMean: number;
  precipStdDev: number;
}

export interface WeatherData {
  type: 'forecast' | 'historical';
  location: string;
  tempHigh: number;
  tempLow: number;
  precipitation: number;
  description: string;
  days?: WeatherDay[];
  distribution?: WeatherDistribution;
}

export interface Recommendation {
  topPick: {
    name: string;
    brand: string;
    reason: string;
    source: string;
    communityRating?: CommunityRating | null;
  } | null;
  alternatives: {
    name: string;
    brand: string;
    comparison: string;
    source: string;
    communityRating?: CommunityRating | null;
  }[];
}

export interface GearSearchState {
  isSearching: boolean;
  isSearchingOnline: boolean;
  results: ProductMatch[];
  recommendation: Recommendation | null;
  showResults: boolean;
}

export interface Country {
  code: string;
  name: string;
}

export interface TripConfirm {
  place: string;
  timeOfYear: string;
  activity: string;
  duration: string;
}

// Gear portfolio types
export interface GearItem {
  id: string;
  gearCatalogId: string;
  name: string;
  brand: string;
  category: string;
  subcategory?: string;
  gender?: string;
  imageUrl?: string;
  description?: string;
  productUrl?: string;
  reviews?: {
    rating?: number;
    count?: number;
    summary?: string;
  };
  specs?: string;
  notes?: string;
  addedAt: string;
  weightG?: number | null;
  weightEstimated?: boolean;
  userReview?: {
    rating: number;
    title?: string;
    review?: string;
    conditions?: string;
    created_at: string;
  } | null;
}

// Activity types for trip planning
export const ACTIVITY_TYPES = [
  { value: 'hiking', label: 'Hiking / Tramping' },
  { value: 'mountaineering', label: 'Mountaineering' },
  { value: 'ski-touring', label: 'Ski Touring' },
  { value: 'ski-mountaineering', label: 'Ski Mountaineering' },
  { value: 'climbing', label: 'Rock Climbing' },
  { value: 'snowshoeing', label: 'Snowshoeing' },
] as const;
