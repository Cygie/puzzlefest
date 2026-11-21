import { type Rng, shuffle } from '@/shared/random';

import type { Theme } from '../data/themes';
import { checkSolutionFit, MAX_SIZE, MIN_SIZE } from './generateGrid';
import { type NormalizedWord, toGridLetters } from './normalize';
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
  /** When set, pick words whose letters just fill the grid minus the solution. */
  solution: string;
  rng: Rng;
}

/** Picks words from a theme suited to the grid size (and solution word, if any). */
export function wordsFromTheme(
  theme: Theme,
  { width, height, solution, rng }: ThemeFillOptions,
): string[] {
  const maxLength = Math.max(width, height);
  const pool = shuffle(
    theme.woorden.filter((w) => toGridLetters(w).length <= maxLength),
    rng,
  );
  const solutionLength = toGridLetters(solution).length;

  if (solutionLength === 0 || solutionLength >= width * height) {
    return pool.slice(0, suggestWordCount(width, height));
  }

  // Fill up to exactly the cells to cover where possible: overlaps are hard to force.
  const target = width * height - solutionLength;
  const chosen: string[] = [];
  const rest: string[] = [];
  let sum = 0;
  for (const word of pool) {
    const length = toGridLetters(word).length;
    if (sum + length <= target) {
      chosen.push(word);
      sum += length;
    } else {
      rest.push(word);
    }
  }
  if (sum < target && rest.length > 0) {
    // Add the word that overshoots the least.
    const missing = target - sum;
    const best = rest
      .map((word) => ({ word, length: toGridLetters(word).length }))
      .sort((a, b) => a.length - b.length)
      .find((w) => w.length >= missing);
    if (best) chosen.push(best.word);
  }
  return chosen;
}

export type SolutionStatus =
  { kind: 'none' } | { kind: 'ok' | 'warning' | 'error'; message: string };

/** Live feedback for the optional solution word. */
export function solutionStatus(
  words: readonly NormalizedWord[],
  width: number,
  height: number,
  solution: string,
): SolutionStatus {
  if (solution.trim() === '') return { kind: 'none' };
  const fit = checkSolutionFit(words, width, height, solution);
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
