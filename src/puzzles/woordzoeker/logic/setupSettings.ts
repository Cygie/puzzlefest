import { type Rng, shuffle } from '@/shared/random';

import type { Theme } from '../data/themes';
import { checkSolutionFit, MAX_SIZE, MIN_SIZE } from './generateGrid';
import { type NormalizedWord, normalizeWordList, toGridLetters } from './normalize';
import type { Difficulty } from './types';

export interface SetupSettings {
  /** Selected theme id, or null for "Eigen woorden". */
  themeId: string | null;
  /** Words as the user sees them (display form); always valid and unique. */
  words: string[];
  width: number;
  height: number;
  difficulty: Difficulty;
  /** Optional hidden solution word or sentence; empty string = none. */
  solution: string;
}

export const SETTINGS_KEY = 'woordzoeker:setup';
export const SETTINGS_VERSION = 1;

export const DEFAULT_SETTINGS: SetupSettings = {
  themeId: null,
  words: [],
  width: 10,
  height: 10,
  difficulty: 'normaal',
  solution: '',
};

const DIFFICULTIES: readonly Difficulty[] = ['makkelijk', 'normaal', 'moeilijk'];

export function isSetupSettings(value: unknown): value is SetupSettings {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    (v.themeId === null || typeof v.themeId === 'string') &&
    Array.isArray(v.words) &&
    v.words.every((w) => typeof w === 'string') &&
    isSize(v.width) &&
    isSize(v.height) &&
    DIFFICULTIES.includes(v.difficulty as Difficulty) &&
    typeof v.solution === 'string'
  );
}

function isSize(value: unknown): value is number {
  return (
    typeof value === 'number' && Number.isInteger(value) && value >= MIN_SIZE && value <= MAX_SIZE
  );
}

/** A comfortable number of words for a grid (roughly one word per 9 cells, 4–25). */
export function suggestWordCount(width: number, height: number): number {
  return Math.min(25, Math.max(4, Math.round((width * height) / 9)));
}

export interface ThemeFillOptions {
  width: number;
  height: number;
  /** Hidden solution word; empty string = none. */
  solution: string;
  rng: Rng;
}

/**
 * Share of the cells to cover that the listed words fill when there is a solution word;
 * the generator tops up the rest from the theme. More required words make an exact fit
 * much harder to find (measured: ~50% succeeds nearly always, ~75% only half the time).
 */
export const SOLUTION_LIST_SHARE = 0.5;
/** Without a solution word the listed words fill at most this share of the grid. */
export const PLAIN_MAX_FILL = 0.7;

/**
 * Picks theme words that fit the grid: the suggested number, or with a solution word
 * enough to fill about half the grid (the generator adds the rest from the theme).
 */
export function wordsFromTheme(
  theme: Theme,
  { width, height, solution, rng }: ThemeFillOptions,
): string[] {
  const maxLength = Math.max(width, height);
  const pool = shuffle(
    theme.woorden.filter((w) => toGridLetters(w).length <= maxLength),
    rng,
  );
  const cells = width * height;
  const solutionLength = toGridLetters(solution).length;
  if (solutionLength === 0 || solutionLength >= cells) {
    // Skip words that would make the grid too full (some themes have many long words).
    const count = suggestWordCount(width, height);
    const chosen: string[] = [];
    let letters = 0;
    for (const word of pool) {
      if (chosen.length >= count) break;
      const length = toGridLetters(word).length;
      if (letters + length > cells * PLAIN_MAX_FILL) continue;
      chosen.push(word);
      letters += length;
    }
    return chosen;
  }
  const target = (cells - solutionLength) * SOLUTION_LIST_SHARE;
  const chosen: string[] = [];
  let letters = 0;
  for (const word of pool) {
    if (letters >= target) break;
    chosen.push(word);
    letters += toGridLetters(word).length;
  }
  return chosen;
}

/**
 * The theme words that are not in the list (and fit the grid): with a solution word the
 * generator may add these to fill the grid exactly.
 */
export function themeExtras(
  theme: Theme,
  words: readonly NormalizedWord[],
  width: number,
  height: number,
): NormalizedWord[] {
  const maxLength = Math.max(width, height);
  const taken = new Set(words.map((w) => w.letters));
  return normalizeWordList(theme.woorden).words.filter(
    (w) => w.letters.length <= maxLength && !taken.has(w.letters),
  );
}

export type SolutionStatus =
  { kind: 'none' } | { kind: 'ok' | 'warning' | 'error'; message: string };

/** Live feedback for the optional solution word. */
export function solutionStatus(
  words: readonly NormalizedWord[],
  width: number,
  height: number,
  solution: string,
  /** Theme words the generator may add (see `themeExtras`). */
  extras: readonly NormalizedWord[] = [],
): SolutionStatus {
  if (solution.trim() === '') return { kind: 'none' };
  const fit = checkSolutionFit(words, width, height, solution);
  if (!fit.ok && fit.code === 'too-few-letters' && extras.length > 0) {
    if (checkSolutionFit([...words, ...extras], width, height, solution).ok) {
      return {
        kind: 'ok',
        message:
          '✓ Past: de puzzel wordt aangevuld met woorden uit het thema; de overgebleven ' +
          'letters vormen je oplossing.',
      };
    }
    return {
      kind: 'error',
      message:
        'Dit thema heeft niet genoeg woorden voor dit formaat: voeg eigen woorden toe of ' +
        'kies een kleiner raster.',
    };
  }
  if (!fit.ok) {
    if (fit.code === 'too-few-letters') {
      const letters = toGridLetters(solution).length;
      const total = words.reduce((sum, w) => sum + w.letters.length, 0);
      const missing = width * height - letters - total;
      return {
        kind: 'error',
        message: `Nog ${missing} ${missing === 1 ? 'letter' : 'letters'} nodig: voeg woorden toe of kies een kleiner raster.`,
      };
    }
    return { kind: 'error', message: fit.reason };
  }
  const tolerated = Math.max(3, Math.floor(words.length / 3));
  if (fit.requiredOverlap <= tolerated) {
    return { kind: 'ok', message: '✓ Past: de overgebleven letters vormen je oplossing.' };
  }
  return {
    kind: 'warning',
    message: `${fit.requiredOverlap} letters te veel: dat lukt misschien niet. Kies een groter raster of minder woorden.`,
  };
}
