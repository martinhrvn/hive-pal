/**
 * Distribute 100 percentage points across values using the largest-remainder
 * method so the rounded integers always sum to exactly 100.
 */
export function largestRemainder(counts: number[], total: number): number[] {
  const raw     = counts.map(c => (c / total) * 100);
  const floored = raw.map(v => Math.floor(v));
  const deficit = 100 - floored.reduce((a, b) => a + b, 0);

  const byRemainder = raw
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);

  const result = [...floored];
  for (let k = 0; k < deficit; k++) result[byRemainder[k].i]++;
  return result;
}
