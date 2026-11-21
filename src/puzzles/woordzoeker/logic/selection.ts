import { type Cell, DIRECTION_VECTORS, wordCells } from './directions';

export { cellFromPoint, type Rect, sameCell } from '@/shared/grid/cells';
import type { Direction, FoundWord, PlacedWord, Puzzle } from './types';

export type { FoundWord };

/** A straight selection of cells in the grid. */
export interface Line {
  cells: Cell[];
  /** null for a single cell. */
  direction: Direction | null;
}

/** Index 0 = angle 0 (east), then clockwise in 45° steps (rows grow downwards). */
const OCTANTS: readonly Direction[] = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'];

/**
 * Snaps a selection from `start` towards `end` to the nearest of the 8 directions and
 * clips it to the grid.
 */
export function snapLine(start: Cell, end: Cell, width: number, height: number): Line {
  const dRow = end.row - start.row;
  const dCol = end.col - start.col;
  if (dRow === 0 && dCol === 0) return { cells: [start], direction: null };

  const octant = Math.round(Math.atan2(dRow, dCol) / (Math.PI / 4));
  const direction = OCTANTS[(octant + 8) % 8] as Direction;
  const { dRow: stepRow, dCol: stepCol } = DIRECTION_VECTORS[direction];

  const wanted = Math.max(Math.abs(dRow), Math.abs(dCol)) + 1;
  const cells: Cell[] = [];
  for (let i = 0; i < wanted; i++) {
    const row = start.row + stepRow * i;
    const col = start.col + stepCol * i;
    if (row < 0 || col < 0 || row >= height || col >= width) break;
    cells.push({ row, col });
  }
  return { cells, direction };
}

export function lineLetters(puzzle: Puzzle, line: Line): string {
  return line.cells.map((c) => puzzle.grid[c.row]?.[c.col] ?? '').join('');
}

/**
 * Returns the not-yet-found word spelled by the selection (forwards or backwards).
 * Matching is by letters, so a legitimate second occurrence (KAT inside KATER) counts too.
 */
export function matchWord(
  puzzle: Puzzle,
  line: Line,
  found: ReadonlySet<string>,
): PlacedWord | undefined {
  if (line.cells.length < 2) return undefined;
  const letters = lineLetters(puzzle, line);
  const reversed = [...letters].reverse().join('');
  return puzzle.words.find(
    (w) => !found.has(w.letters) && (w.letters === letters || w.letters === reversed),
  );
}

/** Cells that are not part of any placed word (they spell the solution, if there is one). */
export function leftoverCells(puzzle: Puzzle): Cell[] {
  const used = new Set<number>();
  for (const w of puzzle.words) {
    for (const c of wordCells(w.row, w.col, w.direction, w.length)) {
      used.add(c.row * puzzle.width + c.col);
    }
  }
  const leftover: Cell[] = [];
  for (let row = 0; row < puzzle.height; row++) {
    for (let col = 0; col < puzzle.width; col++) {
      if (!used.has(row * puzzle.width + col)) leftover.push({ row, col });
    }
  }
  return leftover;
}
