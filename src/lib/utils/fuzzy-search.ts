// src/lib/utils/fuzzy-search.ts
// Fuzzy search utilities for artist/venue matching (FS-12)
// Handles prefix stripping, typo tolerance, and partial matching

/**
 * Common article prefixes to strip from names for matching
 * Order matters: longer prefixes first to avoid partial matches
 */
const ARTICLE_PREFIXES = [
  /^the\s+/i,
  /^an'\s+/i,  // Apostrophe variant (e.g., "An' Other")
  /^an\s+/i,
  /^a\s+/i,
];

// Standalone prefix words (when string is only the prefix)
const PREFIX_ONLY_WORDS = ['the', 'a', 'an', "an'"];

/**
 * Strip common article prefixes from a name
 * "The Torrists" -> "Torrists"
 * "A Perfect Circle" -> "Perfect Circle"
 */
export function stripPrefix(name: string): string {
  let result = name.trim();

  // If the entire string is just a prefix word, return empty
  if (PREFIX_ONLY_WORDS.includes(result.toLowerCase())) {
    return '';
  }

  for (const prefix of ARTICLE_PREFIXES) {
    if (prefix.test(result)) {
      result = result.replace(prefix, '');
      break; // Only strip one prefix
    }
  }

  return result.trim();
}

/**
 * Normalize a string for search comparison
 * - Lowercase
 * - Strip article prefixes
 * - Normalize & to "and"
 * - Remove apostrophes
 * - Collapse whitespace
 */
export function normalizeForSearch(text: string): string {
  let result = text.toLowerCase().trim();

  // Normalize & to "and"
  result = result.replace(/&/g, 'and');

  // Remove apostrophes
  result = result.replace(/'/g, '');

  // Strip prefix after lowercase
  result = stripPrefix(result);

  // Collapse multiple spaces to single space
  result = result.replace(/\s+/g, ' ').trim();

  return result;
}

/**
 * Calculate Levenshtein distance between two strings
 * Returns the minimum number of single-character edits needed
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;

  // Create matrix
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  // Initialize first row and column
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  // Fill the matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // deletion
        dp[i][j - 1] + 1,      // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return dp[m][n];
}

/**
 * Calculate maximum allowed edit distance based on string length
 * Shorter strings need exact or near-exact matches
 * Longer strings can tolerate more typos
 */
function getMaxEditDistance(length: number): number {
  if (length <= 3) return 0;  // Very short: exact match only
  if (length <= 5) return 1;  // Short: 1 typo allowed
  if (length <= 8) return 2;  // Medium: 2 typos allowed
  return 3;                    // Long: 3 typos allowed
}

/**
 * Check if searchTerm fuzzy-matches target
 *
 * Matching strategies (in order):
 * 1. Exact match after normalization
 * 2. Partial match (search term contained in target)
 * 3. Typo tolerance via Levenshtein distance
 *
 * @param searchTerm - The user's search input
 * @param target - The name to match against (artist/venue name)
 * @returns true if searchTerm matches target
 */
export function fuzzyMatch(searchTerm: string, target: string): boolean {
  // Handle empty/whitespace inputs
  if (!searchTerm || !searchTerm.trim() || !target || !target.trim()) {
    return false;
  }

  const normalizedSearch = normalizeForSearch(searchTerm);
  const normalizedTarget = normalizeForSearch(target);

  // Empty after normalization
  if (!normalizedSearch || !normalizedTarget) {
    return false;
  }

  // Strategy 1: Exact match after normalization
  if (normalizedSearch === normalizedTarget) {
    return true;
  }

  // Strategy 2: Partial match (search contained in target)
  if (normalizedTarget.includes(normalizedSearch)) {
    return true;
  }

  // Strategy 3: Typo tolerance
  // For partial matches with typos, check if any word matches with tolerance
  const searchWords = normalizedSearch.split(' ').filter(w => w.length > 0);
  const targetWords = normalizedTarget.split(' ').filter(w => w.length > 0);

  // If search is single word, check against full target and individual words
  if (searchWords.length === 1) {
    const searchWord = searchWords[0];
    const maxDistance = getMaxEditDistance(searchWord.length);

    // Check against full normalized target
    if (levenshteinDistance(searchWord, normalizedTarget) <= maxDistance) {
      return true;
    }

    // Check against each word in target
    for (const targetWord of targetWords) {
      if (levenshteinDistance(searchWord, targetWord) <= maxDistance) {
        return true;
      }
    }
  }

  // Multi-word search: check if normalized strings are similar
  const maxDistance = getMaxEditDistance(normalizedSearch.length);
  if (levenshteinDistance(normalizedSearch, normalizedTarget) <= maxDistance) {
    return true;
  }

  // Check if all search words match target words (with typo tolerance)
  if (searchWords.length > 1) {
    const unmatchedSearchWords = [...searchWords];

    for (const searchWord of searchWords) {
      const wordMaxDistance = getMaxEditDistance(searchWord.length);

      for (const targetWord of targetWords) {
        if (levenshteinDistance(searchWord, targetWord) <= wordMaxDistance) {
          const idx = unmatchedSearchWords.indexOf(searchWord);
          if (idx > -1) {
            unmatchedSearchWords.splice(idx, 1);
          }
          break;
        }
      }
    }

    // If most search words matched, consider it a match
    const matchRatio = (searchWords.length - unmatchedSearchWords.length) / searchWords.length;
    if (matchRatio >= 0.7) {
      return true;
    }
  }

  return false;
}
