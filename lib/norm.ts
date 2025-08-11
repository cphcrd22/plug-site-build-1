// Deterministic normalization used for BOTH dataset keys and incoming queries.
export function norm(s: string): string {
    return s
      .normalize('NFKD')                // 1) Unicode normalize
      .replace(/[\u0300-\u036f]/g, '')  // 2) Strip diacritics
      .toLowerCase()                    // 3) Lowercase
      .replace(/[^a-z0-9 -]/g, ' ')     // 4) Remove punctuation except spaces/hyphens
      .replace(/\s+/g, ' ')             // 5) Collapse spaces
      .trim()                           // 6) Trim
  }
  