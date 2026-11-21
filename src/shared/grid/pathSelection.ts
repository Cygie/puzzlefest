import { type Cell, isNeighbour, sameCell } from './cells';

/**
 * Free path selection (woordslang): each step goes to one of the 8 neighbouring cells,
 * the direction may change, and no cell is used twice.
 */

/** Drag step: append a neighbour, step back onto the second-last cell to undo, else ignore. */
export function extendPath(path: readonly Cell[], cell: Cell): Cell[] {
  const last = path[path.length - 1];
  if (!last) return [cell];
  if (sameCell(last, cell)) return [...path];
  if (sameCell(path[path.length - 2], cell)) return path.slice(0, -1);
  if (!isNeighbour(last, cell) || path.some((c) => sameCell(c, cell))) return [...path];
  return [...path, cell];
}

export interface TapResult {
  path: Cell[];
  /** The path to submit (tapping the last cell again), otherwise null. */
  submit: Cell[] | null;
}

/**
 * Tap step: the first tap starts a path, a neighbour extends it, the second-last cell
 * undoes, tapping the last cell again submits, any other cell starts a new path.
 */
export function tapPath(path: readonly Cell[], cell: Cell): TapResult {
  const last = path[path.length - 1];
  if (last && sameCell(last, cell)) return { path: [], submit: [...path] };
  const extended = extendPath(path, cell);
  const changed = extended.length !== path.length || extended.some((c, i) => !sameCell(c, path[i]));
  return { path: changed ? extended : [cell], submit: null };
}
