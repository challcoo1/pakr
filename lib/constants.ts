// lib/constants.ts
// Shared constants used across the app

export const COUNTRIES = [
  { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'JP', name: 'Japan' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'AT', name: 'Austria' },
  { code: 'KR', name: 'South Korea' },
  { code: 'NO', name: 'Norway' },
  { code: 'SE', name: 'Sweden' },
  { code: 'FI', name: 'Finland' },
  { code: 'CL', name: 'Chile' },
  { code: 'AR', name: 'Argentina' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'IN', name: 'India' },
  { code: 'CN', name: 'China' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'PL', name: 'Poland' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'PT', name: 'Portugal' },
  { code: 'IE', name: 'Ireland' },
  { code: 'SG', name: 'Singapore' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'TW', name: 'Taiwan' },
] as const;

export type Country = typeof COUNTRIES[number];

export const getFlagUrl = (code: string) =>
  `https://flagcdn.com/24x18/${code.toLowerCase()}.png`;

// Category display configuration for gear portfolio
// Icons are now SVG components - use getCategoryIcon() from components/CategoryIcons.tsx
export const CATEGORY_CONFIG: Record<string, { label: string }> = {
  'footwear': { label: 'FOOTWEAR' },
  'clothing_base': { label: 'BASE LAYERS' },
  'clothing_mid': { label: 'MID LAYERS' },
  'clothing_outer': { label: 'OUTER LAYERS' },
  'clothing_accessories': { label: 'ACCESSORIES' },
  'backpacks': { label: 'BACKPACKS' },
  'shelter': { label: 'SHELTER' },
  'sleep': { label: 'SLEEP SYSTEM' },
  'climbing': { label: 'CLIMBING GEAR' },
  'safety': { label: 'SAFETY & NAVIGATION' },
  'cooking': { label: 'COOKING' },
  'other': { label: 'OTHER' },
};
