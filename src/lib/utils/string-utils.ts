// src/lib/utils/string-utils.ts

/**
 * Calculate similarity between two strings (0 to 1)
 * @param str1 First string to compare
 * @param str2 Second string to compare
 * @returns Number between 0 (completely different) and 1 (identical)
 */
export function stringSimilarity(str1: string, str2: string): number {
    // Normalize strings
    const s1 = str1.toLowerCase().replace(/[^a-z0-9]/g, '');
    const s2 = str2.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Check for exact match or one string containing the other
    if (s1 === s2) return 1;
    if (s1.includes(s2) || s2.includes(s1)) return 0.9;
    
    // Calculate Levenshtein distance
    const matrix = Array(s2.length + 1).fill(null).map(() => 
      Array(s1.length + 1).fill(null)
    );
  
    for (let i = 0; i <= s1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= s2.length; j++) matrix[j][0] = j;
  
    for (let j = 1; j <= s2.length; j++) {
      for (let i = 1; i <= s1.length; i++) {
        const substitutionCost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + substitutionCost // substitution
        );
      }
    }
  
    // Calculate similarity score based on Levenshtein distance
    const maxLength = Math.max(s1.length, s2.length);
    const distance = matrix[s2.length][s1.length];
    return maxLength === 0 ? 1 : 1 - (distance / maxLength);
  }
  
  /**
   * Extract domain name from URL
   * @param url URL to extract domain from
   * @returns Domain name without www. prefix
   */
  export function extractDomain(url: string): string {
    try {
      const domain = new URL(url).hostname;
      return domain.replace(/^www\./, '');
    } catch {
      return '';
    }
  }
  
  /**
   * Convert string to slug format
   * @param str String to convert
   * @returns URL-friendly slug
   */
  export function toSlug(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  
  /**
   * Normalize string for comparison
   * @param str String to normalize
   * @returns Normalized string with only alphanumeric characters
   */
  export function normalizeString(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  }
  
  /**
   * Compare two strings ignoring case, spaces, and special characters
   * @param str1 First string to compare
   * @param str2 Second string to compare
   * @returns true if strings match after normalization
   */
  export function looseMatch(str1: string, str2: string): boolean {
    return normalizeString(str1) === normalizeString(str2);
  }