import { type Cell, cellIndex, inGrid, isNeighbour } from './cells';

export type PathProblemKind = 'out-of-bounds' | 'not-adjacent' | 'repeated-cell';

/** The first thing wrong with a path; `index` is the offending step in the path. */
export interface PathProblem {
  kind: PathProblemKind;
  index: number;
}

/**
 * Checks an 8-neighbour path: every cell inside the grid, each step to a touching cell,
 * no cell visited twice. Returns the first problem, or null for a valid (or empty) path.
 */
export function findPathProblem(
  path: readonly Cell[],
  width: number,
  height: number,
): PathProblem | null {
  const seen = new Set<number>();
  for (let i = 0; i < path.length; i++) {
    const cell = path[i]!;
    if (!inGrid(cell, width, height)) return { kind: 'out-of-bounds', index: i };
    const previous = path[i - 1];
    if (previous && !isNeighbour(previous, cell)) return { kind: 'not-adjacent', index: i };
    const at = cellIndex(cell, width);
    if (seen.has(at)) return { kind: 'repeated-cell', index: i };
    seen.add(at);
  }
  return null;
}

/** True when the path has no problem according to `findPathProblem`. */
export function isValidPath(path: readonly Cell[], width: number, height: number): boolean {
  return findPathProblem(path, width, height) === null;
}
