import { createRng } from '@/shared/random';
import { err, ok, type Result } from '@/shared/result';

import { normalizeWord } from '../../woordzoeker/logic/normalize';
import { canPartition, EMPTY, labelRegions, neighbourTable } from './regions';
import { MAX_GRID_SIZE, MIN_GRID_SIZE, type SlangWord, type WoordslangPuzzle } from './types';
import { validatePuzzle } from './validatePuzzle';

export const DEFAULT_TIMEOUT_MS = 5_000;
/** Search effort in path steps; decides "no solution" so a seed gives the same result everywhere. */
export const DEFAULT_MAX_STEPS = 400_000;
/** Steps per restart: a fresh random order escapes dead ends faster than deep backtracking. */
const STEPS_PER_RESTART = 20_000;
/** Word lengths tried at a cell (and key word starts per restart) before backtracking further. */
const MAX_WORD_TRIES = 3;
/** Random spread added to the Warnsdorff order of neighbours (in neighbour counts). */
const JITTER = 1.5;
/** Preference of the key word for steps towards the opposite edge (in neighbour counts). */
const KEY_BIAS = 1.5;

export interface GenerateInput {
  id: string;
  theme: string;
  hint: string;
  /** The key word (display form); spans two opposite edges. */
  keyWord: string;
  /** The other theme words (display forms). */
  words: readonly string[];
  width: number;
  height: number;
  seed: number;
}

export interface GenerateOptions {
  timeoutMs?: number;
  maxSteps?: number;
  /** Clock in milliseconds (injectable for tests). */
  now?: () => number;
}

export type GenerateErrorCode =
  | 'invalid-word'
  | 'duplicate-word'
  | 'letter-count'
  | 'word-too-long'
  | 'key-too-short'
  | 'grid-size'
  | 'no-solution'
  | 'timeout';

export interface GenerateError {
  code: GenerateErrorCode;
  /** Dutch explanation for the admin page. */
  message: string;
}

interface Word {
  display: string;
  letters: string;
}

const fail = (code: GenerateErrorCode, message: string) => err<GenerateError>({ code, message });

function checkInput(input: GenerateInput): Result<Word[], GenerateError> {
  const { width, height } = input;
  const isSize = (n: number) => Number.isInteger(n) && n >= MIN_GRID_SIZE && n <= MAX_GRID_SIZE;
  if (!isSize(width) || !isSize(height)) {
    return fail(
      'grid-size',
      `Breedte en hoogte moeten tussen ${MIN_GRID_SIZE} en ${MAX_GRID_SIZE} liggen.`,
    );
  }
  const words: Word[] = [];
  const seen = new Map<string, string>();
  for (const display of [input.keyWord, ...input.words]) {
    const result = normalizeWord(display);
    if (!result.ok) {
      const { code } = result.error;
      const shown = display.trim();
      return fail(
        'invalid-word',
        code === 'empty'
          ? 'Er staat een leeg woord in de lijst.'
          : code === 'too-short'
            ? `"${shown}" is te kort: een woord heeft minstens 2 letters.`
            : `"${shown}" bevat tekens die geen letter zijn.`,
      );
    }
    const { letters } = result.word;
    const earlier = seen.get(letters);
    if (earlier !== undefined) {
      return fail(
        'duplicate-word',
        `"${result.word.display}" staat dubbel (zelfde letters als "${earlier}").`,
      );
    }
    seen.set(letters, result.word.display);
    words.push(result.word);
  }
  const cells = width * height;
  const tooLong = words.find((w) => w.letters.length > cells);
  if (tooLong) {
    return fail(
      'word-too-long',
      `"${tooLong.display}" is langer dan het raster (${cells} vakjes).`,
    );
  }
  const letters = words.reduce((sum, w) => sum + w.letters.length, 0);
  if (letters !== cells) {
    return fail(
      'letter-count',
      `De woorden hebben samen ${letters} letters, maar het raster heeft ${cells} vakjes ` +
        `(${width} × ${height}). ${letters < cells ? 'Voeg letters toe' : 'Haal letters weg'} ` +
        `of kies een ander formaat.`,
    );
  }
  const key = words[0]!;
  if (key.letters.length < Math.min(width, height)) {
    return fail(
      'key-too-short',
      `Het sleutelwoord "${key.display}" heeft ${key.letters.length} letters; ` +
        `om van rand tot rand te lopen zijn er minstens ${Math.min(width, height)} nodig.`,
    );
  }
  return ok(words);
}

type Stop = 'restart' | 'timeout' | null;

/**
 * Lays the words out as paths that cover the grid exactly once: the key word first (edge to
 * edge), then each other word from the most constrained empty cell, with backtracking,
 * region pruning and restarts. See the design doc `woordslang-generator-design.md`.
 */
export function generatePuzzle(
  input: GenerateInput,
  options: GenerateOptions = {},
): Result<WoordslangPuzzle, GenerateError> {
  const checked = checkInput(input);
  if (!checked.ok) return checked;
  const words = checked.value;
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    maxSteps = DEFAULT_MAX_STEPS,
    now = () => performance.now(),
  } = options;
  const { width, height } = input;
  const total = width * height;
  const rng = createRng(input.seed);
  const lengths = words.map((w) => w.letters.length);
  const neighbours = neighbourTable(width, height);

  // Search state.
  const owner = new Int16Array(total).fill(EMPTY);
  /** Per 2×2 square (by its top-left cell): 1 = "\" diagonal used, 2 = "/" diagonal used. */
  const diagonals = new Uint8Array(total);
  const labels = new Int16Array(total);
  const used = new Array<boolean>(words.length).fill(false);
  const paths: number[][] = words.map(() => []);
  const reversed = new Array<boolean>(words.length).fill(false);

  const started = now();
  let steps = 0;
  let restartAt = 0;
  let stop: Stop = null;

  const tick = (): boolean => {
    steps++;
    if (steps >= restartAt) stop = 'restart';
    else if (now() - started > timeoutMs) stop = 'timeout';
    return stop !== null;
  };

  const diagonal = (from: number, to: number) => {
    const dRow = Math.floor(to / width) - Math.floor(from / width);
    const dCol = (to % width) - (from % width);
    if (dRow === 0 || dCol === 0) return null;
    const top = Math.min(Math.floor(from / width), Math.floor(to / width));
    const left = Math.min(from % width, to % width);
    return { square: top * width + left, bit: dRow === dCol ? 1 : 2 };
  };

  const canStep = (from: number, to: number): boolean => {
    if (owner[to] !== EMPTY) return false;
    const d = diagonal(from, to);
    return d === null || (diagonals[d.square]! & (3 ^ d.bit)) === 0;
  };

  const setStep = (from: number, to: number, on: boolean) => {
    const d = diagonal(from, to);
    if (d === null) return;
    diagonals[d.square] = on ? diagonals[d.square]! | d.bit : diagonals[d.square]! & ~d.bit;
  };

  const emptyDegree = (cell: number): number => {
    let n = 0;
    for (const next of neighbours[cell]!) if (owner[next] === EMPTY) n++;
    return n;
  };

  const restLengths = (except: number): number[] => {
    const rest: number[] = [];
    for (let w = 0; w < words.length; w++) if (!used[w] && w !== except) rest.push(lengths[w]!);
    return rest;
  };

  /**
   * Can the rest still be filled? `remaining` letters of the current word must continue from
   * `head` into one adjacent region; the other words must fill all regions exactly.
   */
  const regionsOk = (head: number, remaining: number, rest: readonly number[]): boolean => {
    const sizes = labelRegions(owner, neighbours, labels);
    if (remaining === 0) return canPartition(sizes, rest);
    const tried = new Set<number>();
    for (const next of neighbours[head]!) {
      const region = labels[next]!;
      if (region === -1 || tried.has(region)) continue;
      tried.add(region);
      if (sizes[region]! < remaining) continue;
      const after = [...sizes];
      after[region]! -= remaining;
      if (canPartition(after, rest)) return true;
    }
    return false;
  };

  interface KeyTarget {
    /** Distance of a cell to the opposite edge. */
    distance: (cell: number) => number;
  }

  /** Extends `path` (the word `w`) step by step; on completion continues with `next`. */
  const grow = (
    w: number,
    path: number[],
    rest: readonly number[],
    key: KeyTarget | null,
    reached: boolean,
    next: () => boolean,
  ): boolean => {
    const length = lengths[w]!;
    if (path.length === length) return next();
    const head = path[path.length - 1]!;
    const left = length - path.length; // letters still to place, including the next one
    const candidates: { cell: number; score: number }[] = [];
    for (const cell of neighbours[head]!) {
      if (!canStep(head, cell)) continue;
      let score = emptyDegree(cell) + rng() * JITTER;
      if (key && !reached) {
        const distance = key.distance(cell);
        if (distance > left - 1) continue; // could no longer reach the opposite edge
        score -= (key.distance(head) - distance) * KEY_BIAS;
      }
      candidates.push({ cell, score });
    }
    candidates.sort((a, b) => a.score - b.score);

    for (const { cell } of candidates) {
      if (tick()) return false;
      owner[cell] = w;
      setStep(head, cell, true);
      path.push(cell);
      const nowReached = reached || (key !== null && key.distance(cell) === 0);
      if (regionsOk(cell, left - 1, rest) && grow(w, path, rest, key, nowReached, next)) {
        return true;
      }
      path.pop();
      setStep(head, cell, false);
      owner[cell] = EMPTY;
      if (stop) return false;
    }
    return false;
  };

  /** Places the remaining words, starting at the most constrained empty cell. */
  const solve = (): boolean => {
    let cell = -1;
    let best = Infinity;
    for (let i = 0; i < total; i++) {
      if (owner[i] !== EMPTY) continue;
      const score = emptyDegree(i) + rng() * 0.99;
      if (score < best) {
        best = score;
        cell = i;
      }
    }
    if (cell === -1) return true; // every cell covered

    const sizes = labelRegions(owner, neighbours, labels);
    const room = sizes[labels[cell]!]!;
    // Words of the same length are interchangeable for the layout: try each length once.
    const byLength = new Map<number, { word: number; key: number }>();
    for (let w = 0; w < words.length; w++) {
      const length = lengths[w]!;
      if (used[w] || length > room) continue;
      const key = rng() ** (1 / (length * length)); // Efraimidis–Spirakis, longer first
      const known = byLength.get(length);
      if (!known || key > known.key) byLength.set(length, { word: w, key });
    }
    const choices = [...byLength.values()].sort((a, b) => b.key - a.key).slice(0, MAX_WORD_TRIES);

    for (const { word: w } of choices) {
      const rest = restLengths(w);
      used[w] = true;
      owner[cell] = w;
      const path = [cell];
      if (regionsOk(cell, lengths[w]! - 1, rest) && grow(w, path, rest, null, false, solve)) {
        paths[w] = path;
        reversed[w] = rng() < 0.5;
        return true;
      }
      owner[cell] = EMPTY;
      used[w] = false;
      if (stop) return false;
    }
    return false;
  };

  /** Places the key word from a random edge towards the opposite edge, then the rest. */
  const placeKey = (): boolean => {
    const length = lengths[0]!;
    const starts: { cell: number; key: KeyTarget }[] = [];
    const rowOf = (c: number) => Math.floor(c / width);
    const colOf = (c: number) => c % width;
    if (length >= width) {
      for (let r = 0; r < height; r++) {
        starts.push({ cell: r * width, key: { distance: (c) => width - 1 - colOf(c) } });
        starts.push({ cell: r * width + width - 1, key: { distance: colOf } });
      }
    }
    if (length >= height) {
      for (let c = 0; c < width; c++) {
        starts.push({ cell: c, key: { distance: (x) => height - 1 - rowOf(x) } });
        starts.push({ cell: (height - 1) * width + c, key: { distance: rowOf } });
      }
    }
    for (let attempt = 0; attempt < MAX_WORD_TRIES; attempt++) {
      const { cell, key } = starts[Math.floor(rng() * starts.length)]!;
      const rest = restLengths(0);
      used[0] = true;
      owner[cell] = 0;
      const path = [cell];
      if (
        regionsOk(cell, length - 1, rest) &&
        grow(0, path, rest, key, key.distance(cell) === 0, solve)
      ) {
        paths[0] = path;
        return true;
      }
      owner[cell] = EMPTY;
      used[0] = false;
      if (stop) return false;
    }
    return false;
  };

  while (steps < maxSteps) {
    restartAt = Math.min(steps + STEPS_PER_RESTART, maxSteps);
    stop = null;
    owner.fill(EMPTY);
    diagonals.fill(0);
    used.fill(false);
    if (placeKey()) return ok(toPuzzle(input, words, paths, reversed, width));
    if (stop === 'timeout') {
      return fail(
        'timeout',
        `Geen puzzel gevonden binnen ${Math.round(timeoutMs / 1000)} seconden. Probeer opnieuw of pas de woorden aan.`,
      );
    }
    if (stop === null) steps = restartAt; // search exhausted early: move on to the next restart
  }
  return fail(
    'no-solution',
    'Met deze woorden en dit formaat is geen puzzel gevonden. Probeer opnieuw of pas de woorden aan.',
  );
}

function toPuzzle(
  input: GenerateInput,
  words: readonly Word[],
  paths: readonly number[][],
  reversed: readonly boolean[],
  width: number,
): WoordslangPuzzle {
  const grid: string[][] = Array.from({ length: input.height }, () =>
    new Array<string>(width).fill(''),
  );
  const slangWords: SlangWord[] = words.map((word, w) => {
    const ordered = reversed[w] ? [...paths[w]!].reverse() : paths[w]!;
    const path = ordered.map((i) => ({ row: Math.floor(i / width), col: i % width }));
    path.forEach(({ row, col }, i) => (grid[row]![col] = word.letters[i]!));
    return { display: word.display, letters: word.letters, path, ...(w === 0 && { key: true }) };
  });
  const puzzle: WoordslangPuzzle = {
    version: 1,
    id: input.id,
    theme: input.theme,
    hint: input.hint,
    width,
    height: input.height,
    grid: grid.map((row) => row.join('')),
    words: slangWords,
  };
  const valid = validatePuzzle(puzzle);
  if (!valid.ok) {
    throw new Error(`Generator bug: invalid puzzle (${valid.error.map((e) => e.code).join(', ')})`);
  }
  return puzzle;
}
