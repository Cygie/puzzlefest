import { type Cell, sameCell } from '@/shared/grid/cells';

import type { SlangWord, WoordslangPuzzle } from './types';

export type SelectionMatch =
  | { kind: 'found'; word: SlangWord }
  | { kind: 'already'; word: SlangWord }
  | { kind: 'elsewhere' }
  | { kind: 'none' }
  /** A single cell: nothing to report. */
  | { kind: 'ignore' };

const samePath = (a: readonly Cell[], b: readonly Cell[]) =>
  a.length === b.length && a.every((cell, i) => sameCell(cell, b[i]));

/**
 * Checks a selected path against the puzzle. A word counts only along its own cells (read
 * forwards or backwards), because the words together cover the grid exactly once.
 */
export function matchSelection(
  puzzle: WoordslangPuzzle,
  selection: readonly Cell[],
  found: ReadonlySet<string>,
): SelectionMatch {
  if (selection.length < 2) return { kind: 'ignore' };
  const reversed = [...selection].reverse();
  const word = puzzle.words.find((w) => samePath(w.path, selection) || samePath(w.path, reversed));
  if (word) return found.has(word.letters) ? { kind: 'already', word } : { kind: 'found', word };

  const usedCells = puzzle.words.filter((w) => found.has(w.letters)).flatMap((w) => w.path);
  if (selection.some((cell) => usedCells.some((used) => sameCell(used, cell)))) {
    return { kind: 'none' };
  }
  const letters = selection.map(({ row, col }) => puzzle.grid[row]?.[col] ?? '').join('');
  const backwards = [...letters].reverse().join('');
  const spelled = puzzle.words.some(
    (w) => !found.has(w.letters) && (w.letters === letters || w.letters === backwards),
  );
  return spelled ? { kind: 'elsewhere' } : { kind: 'none' };
}

/** True when the found words cover every cell (they never overlap). */
export function isSolved(puzzle: WoordslangPuzzle, found: ReadonlySet<string>): boolean {
  return puzzle.words.every((w) => found.has(w.letters));
}
