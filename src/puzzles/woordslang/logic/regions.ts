/**
 * Can the word lengths be split over the regions so that each region is filled exactly?
 * (Bin packing with exact sums; small inputs, memoized on the remaining capacities.)
 */
export function canPartition(sizes: readonly number[], lengths: readonly number[]): boolean {
  const caps = sizes.filter((s) => s > 0);
  const total = caps.reduce((a, b) => a + b, 0);
  if (lengths.reduce((a, b) => a + b, 0) !== total) return false;
  if (caps.length <= 1) return true;

  const sorted = [...lengths].sort((a, b) => b - a);
  const shortest = sorted[sorted.length - 1]!;
  const failed = new Set<string>();

  const fill = (i: number): boolean => {
    if (i === sorted.length) return true;
    const key = `${i}:${[...caps].sort((a, b) => a - b).join(',')}`;
    if (failed.has(key)) return false;
    const length = sorted[i]!;
    const tried = new Set<number>();
    for (let j = 0; j < caps.length; j++) {
      const cap = caps[j]!;
      if (cap < length || tried.has(cap)) continue;
      tried.add(cap);
      const rest = cap - length;
      if (rest > 0 && rest < shortest) continue;
      caps[j] = rest;
      if (fill(i + 1)) return true;
      caps[j] = cap;
    }
    failed.add(key);
    return false;
  };
  return fill(0);
}
