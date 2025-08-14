export function damerauLevenshtein(a: string, b: string): number {
  const alen = a.length;
  const blen = b.length;
  const dp: number[][] = Array.from({ length: alen + 1 }, () => Array(blen + 1).fill(0));

  for (let i = 0; i <= alen; i++) dp[i][0] = i;
  for (let j = 0; j <= blen; j++) dp[0][j] = j;

  for (let i = 1; i <= alen; i++) {
    for (let j = 1; j <= blen; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let best = Math.min(
        dp[i - 1][j] + 1,      // deletion
        dp[i][j - 1] + 1,      // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        best = Math.min(best, dp[i - 2][j - 2] + 1); // transposition
      }
      dp[i][j] = best;
    }
  }
  return dp[alen][blen];
}
