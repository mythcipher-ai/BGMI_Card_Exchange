// Tiny fuzzy-match helpers. Purposely no dependency.
// Used to match search queries that have 1-2 char typos
// against card names, types, and wanted-card names.

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const al = a.length;
  const bl = b.length;
  if (al === 0) return bl;
  if (bl === 0) return al;

  // Use a rolling one-row buffer to save memory on long strings.
  const prev: number[] = new Array(bl + 1);
  for (let j = 0; j <= bl; j++) prev[j] = j;

  for (let i = 1; i <= al; i++) {
    let curr = i;
    let topLeft = prev[0];
    prev[0] = i;
    for (let j = 1; j <= bl; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      const top = prev[j];
      curr = Math.min(
        prev[j] + 1,       // deletion
        prev[j - 1] + 1,   // insertion (current row, prior column)
        topLeft + cost     // substitution
      );
      topLeft = top;
      prev[j - 1] = curr === i && j === 1 ? prev[j - 1] : prev[j - 1]; // keep prev[j-1] for next iter
      prev[j] = curr;
    }
  }
  return prev[bl];
}

// Allow more typo slack for longer words.
function allowedDistance(token: string): number {
  if (token.length <= 3) return 0;
  if (token.length <= 5) return 1;
  return 2;
}

/**
 * Returns true if any token in the search query is found within `haystack`
 * either as a substring or within Levenshtein distance of `allowedDistance`
 * of some word in the haystack.
 *
 * Empty query matches everything.
 */
export function fuzzyMatch(query: string, haystack: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const h = haystack.toLowerCase();
  if (!h) return false;

  // Fast path: full-string substring match (covers the common case).
  if (h.includes(q)) return true;

  const haystackWords = h.split(/[^a-z0-9]+/).filter(Boolean);
  const queryTokens = q.split(/\s+/).filter(Boolean);

  // Every search token must find at least one fuzzy hit in the haystack.
  return queryTokens.every((qt) => {
    if (h.includes(qt)) return true;
    const maxDist = allowedDistance(qt);
    if (maxDist === 0) return false;
    return haystackWords.some((hw) => {
      // Don't compare hugely-different lengths; it saves work.
      if (Math.abs(hw.length - qt.length) > maxDist) return false;
      return levenshtein(hw, qt) <= maxDist;
    });
  });
}

/**
 * Match a search query against any of several candidate strings.
 */
export function fuzzyMatchAny(query: string, candidates: string[]): boolean {
  if (!query.trim()) return true;
  return candidates.some((c) => fuzzyMatch(query, c));
}
