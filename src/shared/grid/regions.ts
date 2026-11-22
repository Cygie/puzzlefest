/** Shared region helpers for 8-neighbour grids (flood fill over empty cells). */

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
