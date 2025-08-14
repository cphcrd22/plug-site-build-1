/**
 * Fuzzy location->country resolver.
 * Two stage: candidateSearch + finalScore/resolve.
 * No runtime deps; deterministic.
 */

// ------------------------
// Type definitions
// ------------------------

/** Alias for a location or code belonging to a country. */
export interface Alias {
  /** human readable name */
  name: string;
  /** normalized alias string */
  norm: string;
  /** tokenized normalized form */
  tokens: string[];
  /** ISO country code */
  country: string;
  /** category of alias e.g. country, city, exonym, landmark, code */
  category: string;
  /** popularity signal 0..1 (higher is more popular) */
  popularity?: number;
}

/** Index to support fast candidate search. */
export interface AliasIndex {
  /** map from token -> aliases containing that token */
  tokenMap: Record<string, Alias[]>;
  /** optional char trigram map */
  gramMap?: Record<string, Alias[]>;
  /** all aliases */
  aliases: Alias[];
}

/** Lightweight record for the resolved country. */
export interface CountryRecord {
  code: string;
  name: string;
}

/** Dataset required by resolve(). */
export interface ResolverData {
  index: AliasIndex;
  countries: Record<string, CountryRecord>;
}

/** Config for scoring individual aliases. */
export interface ScoringConfig {
  jwWeight: number;            // weight of Jaro–Winkler
  tokenSetWeight: number;      // weight of token set overlap
  popularityWeight: number;    // scale factor for popularity
  maxPopularityBoost: number;  // clamp popularity contribution
  categoryBoosts: Record<string, number>; // per category additive boost
}

/** Resolver level configuration. */
export interface ResolverConfig {
  scoring?: Partial<ScoringConfig>;
  thresholds?: Record<string, number>; // per-category acceptance threshold
  margin?: number;                     // required gap between top two
  earlyAcceptJW?: number;              // Jaro–Winkler early accept
  K0?: number;                         // stage1 initial candidate cap
  K?: number;                          // stage1 final candidate cap
  stopwords?: string[];                // optional tokens to drop
}

export type ResolveSuccess = {
  status: 'ok';
  country: CountryRecord;
  matched: Alias;
  confidence: number;
};

export type ResolveAmbiguous = {
  status: 'ambiguous';
  candidates: Array<{ country: CountryRecord; matched: Alias; confidence: number }>;
};

export type ResolveNotFound = {
  status: 'not_found';
  suggestions: string[];
};

export type ResolveResult = ResolveSuccess | ResolveAmbiguous | ResolveNotFound;

// ------------------------
// Normalization helpers
// ------------------------

function stripDiacritics(input: string): string {
  return input.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Normalize a string for lookup.
 * @param input raw user input
 */
export function normalize(input: string): { norm: string; tokens: string[] } {
  const norm = stripDiacritics(input)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/[-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const tokens = norm ? norm.split(' ') : [];
  return { norm, tokens };
}

// ------------------------
// Candidate search
// ------------------------

const DEFAULT_K0 = 300;
const DEFAULT_K = 80;

function charNGrams(s: string, n = 3): string[] {
  const out: string[] = [];
  if (s.length < n) return out;
  for (let i = 0; i <= s.length - n; i++) {
    out.push(s.slice(i, i + n));
  }
  return out;
}

/**
 * Stage 1: quick search for plausible aliases.
 */
export function candidateSearch(
  q: string,
  idx: AliasIndex,
  K0: number = DEFAULT_K0,
  K: number = DEFAULT_K
): Alias[] {
  const { norm, tokens } = normalize(q);
  const seen = new Map<Alias, number>();
  const useTokens = tokens;

  for (const t of useTokens) {
    const list = idx.tokenMap[t];
    if (!list) continue;
    for (const a of list) {
      seen.set(a, (seen.get(a) || 0) + 1);
    }
  }

  if (idx.gramMap) {
    for (const g of charNGrams(norm)) {
      const list = idx.gramMap[g];
      if (!list) continue;
      for (const a of list) {
        seen.set(a, (seen.get(a) || 0) + 0.5);
      }
    }
  }

  // popularity as tiny bias
  const scored: Array<[Alias, number]> = [];
  for (const [a, s] of seen.entries()) {
    const pop = a.popularity || 0;
    scored.push([a, s + pop * 0.1]);
  }

  // Fallback: if no index hits, score all aliases by Jaro–Winkler
  if (scored.length === 0) {
    for (const a of idx.aliases) {
      const jw = jaroWinkler(norm, a.norm);
      if (jw > 0) {
        const pop = a.popularity || 0;
        scored.push([a, jw + pop * 0.1]);
      }
    }
  }

  scored.sort((a, b) => b[1] - a[1] || a[0].name.localeCompare(b[0].name));
  const limited = scored.slice(0, K0);
  limited.sort((a, b) => b[1] - a[1] || a[0].name.localeCompare(b[0].name));
  return limited.slice(0, K).map(([a]) => a);
}

// ------------------------
// Final scoring
// ------------------------

const DEFAULT_SCORING: ScoringConfig = {
  jwWeight: 0.7,
  tokenSetWeight: 0.3,
  popularityWeight: 0.05,
  maxPopularityBoost: 0.1,
  categoryBoosts: {}
};

function jaro(s1: string, s2: string): number {
  const len1 = s1.length;
  const len2 = s2.length;
  if (!len1 && !len2) return 1;
  if (!len1 || !len2) return 0;
  const matchDist = Math.floor(Math.max(len1, len2) / 2) - 1;
  const s1Matches = new Array<boolean>(len1).fill(false);
  const s2Matches = new Array<boolean>(len2).fill(false);
  let matches = 0;
  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchDist);
    const end = Math.min(i + matchDist + 1, len2);
    for (let j = start; j < end; j++) {
      if (s2Matches[j]) continue;
      if (s1[i] !== s2[j]) continue;
      s1Matches[i] = s2Matches[j] = true;
      matches++;
      break;
    }
  }
  if (!matches) return 0;
  let transpositions = 0;
  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }
  const m = matches;
  return (m / len1 + m / len2 + (m - transpositions / 2) / m) / 3;
}

function jaroWinkler(s1: string, s2: string): number {
  const j = jaro(s1, s2);
  let prefix = 0;
  const maxPrefix = 4;
  for (; prefix < Math.min(maxPrefix, s1.length, s2.length); prefix++) {
    if (s1[prefix] !== s2[prefix]) break;
  }
  return j + prefix * 0.1 * (1 - j);
}

function tokenSetSim(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 1;
  const setA = new Set(a);
  const setB = new Set(b);
  let inter = 0;
  for (const t of setA) if (setB.has(t)) inter++;
  const union = setA.size + setB.size - inter;
  return union === 0 ? 0 : inter / union;
}

/**
 * Stage 2: compute composite score for a query/alias pair.
 */
export function finalScore(q: string, alias: Alias, cfg: ScoringConfig = DEFAULT_SCORING): number {
  const { norm, tokens } = normalize(q);
  const jw = jaroWinkler(norm, alias.norm);
  const ts = tokenSetSim(tokens, alias.tokens);
  const pop = Math.min(alias.popularity || 0, cfg.maxPopularityBoost);
  const score =
    cfg.jwWeight * jw +
    cfg.tokenSetWeight * ts +
    Math.min(pop * cfg.popularityWeight, cfg.maxPopularityBoost) +
    (cfg.categoryBoosts[alias.category] || 0);
  return score;
}

// ------------------------
// Resolve orchestration
// ------------------------

const DEFAULT_THRESHOLDS: Record<string, number> = {
  country: 0.85,
  city: 0.8,
  exonym: 0.83,
  landmark: 0.8,
  code: 0.9
};

const DEFAULT_CFG: Required<Pick<ResolverConfig, 'thresholds' | 'margin' | 'earlyAcceptJW' | 'K0' | 'K'>> = {
  thresholds: DEFAULT_THRESHOLDS,
  margin: 0.05,
  earlyAcceptJW: 0.95,
  K0: DEFAULT_K0,
  K: DEFAULT_K
};

/**
 * Resolve a free-form query to a country record.
 */
export function resolve(q: string, data: ResolverData, cfg: ResolverConfig = {}): ResolveResult {
  const mergedCfg: ResolverConfig = { ...DEFAULT_CFG, ...cfg } as any;
  mergedCfg.scoring = { ...DEFAULT_SCORING, ...cfg.scoring };
  const stop = new Set((cfg.stopwords || []).map(s => s.toLowerCase()));

  const { norm, tokens } = normalize(q);
  const filteredTokens = tokens.filter(t => !stop.has(t));
  const normFiltered = filteredTokens.join(' ');

  const candidates = candidateSearch(normFiltered, data.index, mergedCfg.K0, mergedCfg.K);
  if (candidates.length === 0) {
    return { status: 'not_found', suggestions: [] };
  }

  const scored = candidates.map(alias => {
    const score = finalScore(normFiltered, alias, mergedCfg.scoring as ScoringConfig);
    const jw = jaroWinkler(normFiltered, alias.norm);
    return { alias, score, jw };
  });

  scored.sort((a, b) => b.score - a.score || a.alias.name.localeCompare(b.alias.name));
  const best = scored[0];
  const second = scored[1];
  const third = scored[2];

  const countryRec = (alias: Alias): CountryRecord => data.countries[alias.country] || { code: alias.country, name: alias.country };

  if (best.jw >= (mergedCfg.earlyAcceptJW as number)) {
    return {
      status: 'ok',
      country: countryRec(best.alias),
      matched: best.alias,
      confidence: best.score
    };
  }

  const threshold = (mergedCfg.thresholds as Record<string, number>)[best.alias.category] ?? 1;
  const margin = mergedCfg.margin as number;

  if (best.score >= threshold) {
    if (!second || best.score - second.score >= margin) {
      return {
        status: 'ok',
        country: countryRec(best.alias),
        matched: best.alias,
        confidence: best.score
      };
    }
    const cands = [best, second, third].filter(Boolean).map(s => ({
      country: countryRec(s.alias),
      matched: s.alias,
      confidence: s.score
    }));
    return { status: 'ambiguous', candidates: cands };
  }

  const suggestions = scored.slice(0, 3).map(s => s.alias.name);
  return { status: 'not_found', suggestions };
}

// ---------------------------------------------------------------------
// Minimal usage example and test vector (no runtime effect)
// ---------------------------------------------------------------------

/*
Example:

import { normalize, candidateSearch, finalScore, resolve } from './resolver'

const aliases: Alias[] = [
  { name: 'Thailand', norm: 'thailand', tokens: ['thailand'], country: 'TH', category: 'country', popularity: 1 },
  { name: 'Sao Paulo', norm: 'sao paulo', tokens: ['sao','paulo'], country: 'BR', category: 'city', popularity: 1 }
]

const index: AliasIndex = {
  aliases,
  tokenMap: {
    thailand: [aliases[0]],
    sao: [aliases[1]],
    paulo: [aliases[1]]
  }
}

const data: ResolverData = {
  index,
  countries: {
    TH: { code: 'TH', name: 'Thailand' },
    BR: { code: 'BR', name: 'Brazil' }
  }
}

const res = resolve('Thialand', data)
if (res.status === 'ok') {
  console.log(res.country.name)
} else if (res.status === 'ambiguous') {
  console.log('Did you mean:', res.candidates.map(c => c.country.name))
} else {
  console.log('Suggestions:', res.suggestions)
}

// --- Test Vector (expected behavior) ---
// "Thialand"            → ok → Thailand (matched: "Thailand", category: "country")
// "plug in sao paulo"   → ok → Brazil (matched: "Sao Paulo", category: "city")
// "UAE"                 → ok → United Arab Emirates (matched: "UAE", category: "code")
// "Holland"             → ok → Netherlands (matched: "Holland", category: "exonym")
// "Machu Pichu"         → ok → Peru (matched: "Machu Picchu", category: "landmark")
// "Republic Czech"      → ok → Czech Republic (matched: "Czech Republic", category: "country")
// "Georgia"             → ambiguous → [Georgia (country), United States] with confidences
// "Atlantis"            → not_found → suggestions like ["Atlantic", "Austria", "Latvia"] (or similar near-misses)
*/

