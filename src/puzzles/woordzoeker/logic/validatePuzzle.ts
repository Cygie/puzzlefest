import { ALL_DIRECTIONS, wordCells } from './directions';
import { MAX_SIZE, MIN_SIZE } from './generateGrid';
import type { Difficulty, Direction, PlacedWord, PlayProgress, Puzzle } from './types';

const DIFFICULTIES: readonly Difficulty[] = ['makkelijk', 'normaal', 'moeilijk'];
const LETTERS = /^[A-Z]+$/;

type Obj = Record<string, unknown>;

const isObject = (v: unknown): v is Obj => typeof v === 'object' && v !== null;
const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v);
const isSize = (v: unknown): v is number => isInt(v) && v >= MIN_SIZE && v <= MAX_SIZE;
const isCell = (v: unknown): boolean => isObject(v) && isInt(v.row) && isInt(v.col);

function isPlacedWord(v: unknown, puzzle: { width: number; height: number; grid: string[] }) {
  if (!isObject(v)) return false;
  const { display, letters, row, col, direction, length } = v;
  if (typeof display !== 'string' || typeof letters !== 'string' || !LETTERS.test(letters)) {
    return false;
  }
  if (!isInt(row) || !isInt(col) || !isInt(length) || length !== letters.length) return false;
  if (!ALL_DIRECTIONS.includes(direction as Direction)) return false;
  // The grid must actually spell the word at the recorded position.
  const cells = wordCells(row, col, direction as Direction, length);
  return cells.every(
    (c, i) =>
      c.row >= 0 &&
      c.col >= 0 &&
      c.row < puzzle.height &&
      c.col < puzzle.width &&
      puzzle.grid[c.row]?.[c.col] === letters[i],
  );
}

/** Validates an untrusted value (storage, share link) as a complete, consistent puzzle. */
export function isPuzzle(value: unknown): value is Puzzle {
  if (!isObject(value)) return false;
  const { version, width, height, difficulty, seed, grid, words, solution, themeId } = value;
  if (version !== 1 || !isSize(width) || !isSize(height)) return false;
  if (!DIFFICULTIES.includes(difficulty as Difficulty) || typeof seed !== 'number') return false;
  if (!Array.isArray(grid) || grid.length !== height) return false;
  if (!grid.every((row) => typeof row === 'string' && row.length === width && LETTERS.test(row))) {
    return false;
  }
  const shape = { width, height, grid: grid as string[] };
  if (!Array.isArray(words) || words.length === 0) return false;
  if (!words.every((w) => isPlacedWord(w, shape))) return false;
  if (new Set((words as PlacedWord[]).map((w) => w.letters)).size !== words.length) return false;
  if (solution !== undefined) {
    if (!isObject(solution) || typeof solution.display !== 'string') return false;
    if (typeof solution.letters !== 'string' || !LETTERS.test(solution.letters)) return false;
  }
  return themeId === undefined || typeof themeId === 'string';
}

/** Validates stored progress (optionally against the puzzle's words). */
export function isPlayProgress(value: unknown, puzzle?: Puzzle): value is PlayProgress {
  if (!isObject(value)) return false;
  const { found, elapsedMs } = value;
  if (typeof elapsedMs !== 'number' || !Number.isFinite(elapsedMs) || elapsedMs < 0) return false;
  if (!Array.isArray(found)) return false;
  const words = puzzle ? new Set(puzzle.words.map((w) => w.letters)) : undefined;
  return found.every(
    (f) =>
      isObject(f) &&
      typeof f.letters === 'string' &&
      (!words || words.has(f.letters)) &&
      isCell(f.start) &&
      isCell(f.end),
  );
}
