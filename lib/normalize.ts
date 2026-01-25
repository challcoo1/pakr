/**
 * Normalize a gear name for matching to prevent duplicates
 * Removes punctuation, extra spaces, common suffixes, and lowercases
 *
 * Examples:
 *   "Arc'teryx" -> "arcteryx"
 *   "GORE-TEX Pro" -> "gore tex pro"
 *   "Osprey Atmos AG 65" -> "osprey atmos ag 65"
 */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[''`]/g, '')        // Remove apostrophes
    .replace(/[^a-z0-9\s]/g, ' ') // Replace other punctuation with space
    .replace(/\s+/g, ' ')         // Collapse multiple spaces
    .trim();
}
