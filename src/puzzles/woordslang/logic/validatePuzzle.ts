import { type Cell, cellIndex, inGrid, isNeighbour } from '@/shared/grid/cells';
import { err, ok, type Result } from '@/shared/result';

import { normalizeWord } from '../../woordzoeker/logic/normalize';
import { MAX_GRID_SIZE, MIN_GRID_SIZE, type SlangWord, type WoordslangPuzzle } from './types';

export type ValidationCode =
  | 'letter-count'
  | 'path-length'
  | 'out-of-bounds'
  | 'not-adjacent'
  | 'repeated-cell'
  | 'overlap'
  | 'uncovered'
  | 'letter-mismatch'
  | 'key-word'
  | 'key-edges'
  | 'crossing'
  | 'word-normalization';

export interface ValidationError {
  code: ValidationCode;
  /** Dutch explanation for the admin page. */
  message: string;
}

type Obj = Record<string, unknown>;
const isObject = (v: unknown): v is Obj => typeof v === 'object' && v !== null;
const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v);
const isSize = (v: unknown): v is number => isInt(v) && v >= MIN_GRID_SIZE && v <= MAX_GRID_SIZE;
const isCell = (v: unknown): v is Cell => isObject(v) && isInt(v.row) && isInt(v.col);
const LETTERS = /^[A-Z]+$/;

function isSlangWord(v: unknown): v is SlangWord {
  if (!isObject(v)) return false;
  const { display, letters, path, key } = v;
  return (
    typeof display === 'string' &&
    typeof letters === 'string' &&
    LETTERS.test(letters) &&
    Array.isArray(path) &&
    path.every(isCell) &&
    (key === undefined || typeof key === 'boolean')
  );
}

/**
 * Checks the shape of untrusted JSON. Rule checks (coverage, adjacency, …) are done by
 * `validatePuzzle`.
 */
export function isWoordslangPuzzle(value: unknown): value is WoordslangPuzzle {
  if (!isObject(value)) return false;
  const { version, id, theme, hint, width, height, grid, words } = value;
  return (
    version === 1 &&
    typeof id === 'string' &&
    /^[a-z0-9-]+$/.test(id) &&
    typeof theme === 'string' &&
    typeof hint === 'string' &&
    isSize(width) &&
    isSize(height) &&
    Array.isArray(grid) &&
    grid.length === height &&
    grid.every((row) => typeof row === 'string' && row.length === width && LETTERS.test(row)) &&
    Array.isArray(words) &&
    words.length > 0 &&
    words.every(isSlangWord)
  );
}

/** Checks every woordslang rule; returns all problems found, not just the first. */
export function validatePuzzle(
  puzzle: WoordslangPuzzle,
): Result<WoordslangPuzzle, ValidationError[]> {
  const { width, height, grid, words } = puzzle;
  const errors: ValidationError[] = [];
  const add = (code: ValidationCode, message: string) => errors.push({ code, message });

  const cells = width * height;
  const letterCount = words.reduce((sum, w) => sum + w.letters.length, 0);
  if (letterCount !== cells) {
    add(
      'letter-count',
      `De woorden hebben samen ${letterCount} letters, het raster heeft ${cells} vakjes.`,
    );
  }

  const owner = new Map<number, string>();
  for (const word of words) {
    checkWord(word, puzzle, owner, add);
  }
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      if (!owner.has(row * width + col)) {
        add('uncovered', `Vakje (${row + 1}, ${col + 1}) hoort bij geen enkel woord.`);
      }
    }
  }

  const keys = words.filter((w) => w.key);
  if (keys.length !== 1) {
    add('key-word', `Er moet precies één sleutelwoord zijn (nu ${keys.length}).`);
  }
  for (const key of keys) {
    if (!spansGrid(key.path, width, height)) {
      add(
        'key-edges',
        `Het sleutelwoord "${key.display}" moet twee tegenoverliggende randen raken.`,
      );
    }
  }

  const crossings = findCrossings(words);
  for (const square of crossings) {
    add(
      'crossing',
      `Twee paden kruisen elkaar diagonaal bij vakje (${square.row + 1}, ${square.col + 1}).`,
    );
  }

  // The grid letters must match the words on their paths.
  for (const word of words) {
    word.path.forEach((cell, i) => {
      const letter = grid[cell.row]?.[cell.col];
      if (letter !== undefined && word.letters[i] !== undefined && letter !== word.letters[i]) {
        add(
          'letter-mismatch',
          `In het raster staat "${letter}" op vakje (${cell.row + 1}, ${cell.col + 1}), ` +
            `maar "${word.display}" verwacht "${word.letters[i]}".`,
        );
      }
    });
  }

  return errors.length === 0 ? ok(puzzle) : err(errors);
}

function checkWord(
  word: SlangWord,
  puzzle: WoordslangPuzzle,
  owner: Map<number, string>,
  add: (code: ValidationCode, message: string) => void,
) {
  const { width, height } = puzzle;
  const normalized = normalizeWord(word.display);
  if (!normalized.ok || normalized.word.letters !== word.letters) {
    add(
      'word-normalization',
      `"${word.display}" hoort als letters "${normalized.ok ? normalized.word.letters : '?'}" ` +
        `te hebben, niet "${word.letters}".`,
    );
  }
  if (word.path.length !== word.letters.length) {
    add(
      'path-length',
      `"${word.display}" heeft ${word.letters.length} letters maar een pad van ${word.path.length} vakjes.`,
    );
  }
  const own = new Set<number>();
  word.path.forEach((cell, i) => {
    if (!inGrid(cell, width, height)) {
      add('out-of-bounds', `Het pad van "${word.display}" gaat buiten het raster.`);
      return;
    }
    const previous = word.path[i - 1];
    if (previous && !isNeighbour(previous, cell)) {
      add('not-adjacent', `In "${word.display}" liggen letter ${i} en ${i + 1} niet naast elkaar.`);
    }
    const index = cellIndex(cell, width);
    if (own.has(index)) {
      add('repeated-cell', `"${word.display}" gebruikt een vakje twee keer.`);
      return;
    }
    own.add(index);
    const other = owner.get(index);
    if (other !== undefined) {
      add(
        'overlap',
        `"${word.display}" en "${other}" delen vakje (${cell.row + 1}, ${cell.col + 1}).`,
      );
    } else {
      owner.set(index, word.display);
    }
  });
}

/** True when the path touches the left and right edge, or the top and bottom edge. */
export function spansGrid(path: readonly Cell[], width: number, height: number): boolean {
  const cols = path.map((c) => c.col);
  const rows = path.map((c) => c.row);
  return (
    (cols.includes(0) && cols.includes(width - 1)) ||
    (rows.includes(0) && rows.includes(height - 1))
  );
}

/**
 * Diagonal steps that cross inside the same 2×2 square (one "\" and one "/"), between
 * words or within one word. Returns the top-left cell of each such square.
 */
export function findCrossings(words: readonly SlangWord[]): Cell[] {
  const squares = new Map<string, { cell: Cell; down: boolean; up: boolean }>();
  for (const word of words) {
    word.path.forEach((cell, i) => {
      const next = word.path[i + 1];
      if (!next || Math.abs(next.row - cell.row) !== 1 || Math.abs(next.col - cell.col) !== 1) {
        return;
      }
      const top = { row: Math.min(cell.row, next.row), col: Math.min(cell.col, next.col) };
      const key = `${top.row},${top.col}`;
      const entry = squares.get(key) ?? { cell: top, down: false, up: false };
      // "\" runs from top-left to bottom-right; "/" from bottom-left to top-right.
      if ((next.row - cell.row) * (next.col - cell.col) > 0) entry.down = true;
      else entry.up = true;
      squares.set(key, entry);
    });
  }
  return [...squares.values()].filter((s) => s.down && s.up).map((s) => s.cell);
}
