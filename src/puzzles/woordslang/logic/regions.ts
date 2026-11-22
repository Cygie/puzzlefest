/** Owner value of a cell that no word covers yet. */
export const EMPTY = -1;

/** For each cell index, the indexes of its (up to 8) neighbours. */
export function neighbourTable(width: number, height: number): number[][] {
  const table: number[][] = [];
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const list: number[] = [];
      for (let dRow = -1; dRow <= 1; dRow++) {
        for (let dCol = -1; dCol <= 1; dCol++) {
          if (dRow === 0 && dCol === 0) continue;
          const r = row + dRow;
          const c = col + dCol;
          if (r >= 0 && r < height && c >= 0 && c < width) list.push(r * width + c);
        }
      }
      table.push(list);
    }
  }
  return table;
}

/**
 * Labels the connected regions of empty cells (8-neighbour flood fill). Writes the region
 * number of each empty cell into `labels` (−1 for covered cells) and returns the region sizes.
 */
export function labelRegions(
  owner: ArrayLike<number>,
  neighbours: readonly (readonly number[])[],
  labels: Int16Array,
): number[] {
  labels.fill(-1);
  const sizes: number[] = [];
  const stack: number[] = [];
  for (let start = 0; start < owner.length; start++) {
    if (owner[start] !== EMPTY || labels[start] !== -1) continue;
    const region = sizes.length;
    let size = 0;
    labels[start] = region;
    stack.push(start);
    while (stack.length > 0) {
      const cell = stack.pop()!;
      size++;
      for (const next of neighbours[cell]!) {
        if (owner[next] === EMPTY && labels[next] === -1) {
          labels[next] = region;
          stack.push(next);
        }
      }
    }
    sizes.push(size);
  }
  return sizes;
}

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
