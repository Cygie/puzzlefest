import { type Cell, DIRECTION_VECTORS, wordCells } from './directions';
import type { Direction, FoundWord, PlacedWord, Puzzle } from './types';

export type { FoundWord };

export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** A straight selection of cells in the grid. */
export interface Line {
  cells: Cell[];
  /** null for a single cell. */
  direction: Direction | null;
}

/** Index 0 = angle 0 (east), then clockwise in 45° steps (rows grow downwards). */
const OCTANTS: readonly Direction[] = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'];

/**
 * Converts a screen point to a grid cell. With `clamp`, points outside the grid snap to
 * the nearest edge cell (useful while swiping); otherwise they return null.
 */
export function cellFromPoint(
  x: number,
  y: number,
  rect: Rect,
  width: number,
  height: number,
  clamp = false,
): Cell | null {
  if (rect.width <= 0 || rect.height <= 0) return null;
  const col = Math.floor(((x - rect.left) / rect.width) * width);
  const row = Math.floor(((y - rect.top) / rect.height) * height);
  if (clamp) {
    return {
      row: Math.min(height - 1, Math.max(0, row)),
      col: Math.min(width - 1, Math.max(0, col)),
    };
  }
  if (row < 0 || col < 0 || row >= height || col >= width) return null;
  return { row, col };
}

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

export function sameCell(a: Cell | null | undefined, b: Cell | null | undefined): boolean {
  return !!a && !!b && a.row === b.row && a.col === b.col;
}
