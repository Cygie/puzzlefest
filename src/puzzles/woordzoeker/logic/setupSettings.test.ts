import { describe, expect, it } from 'vitest';

import { createRng } from '@/shared/random';

import { getTheme } from '../data/themes';
import { normalizeWordList, toGridLetters } from './normalize';
import {
  DEFAULT_SETTINGS,
  isSetupSettings,
  solutionStatus,
  suggestWordCount,
  wordsFromTheme,
} from './setupSettings';

const dieren = getTheme('dieren')!;
const lettersOf = (words: string[]) => words.reduce((n, w) => n + toGridLetters(w).length, 0);

describe('suggestWordCount', () => {
  it('scales with the grid and stays within 4–25', () => {
    expect(suggestWordCount(5, 5)).toBe(4);
    expect(suggestWordCount(10, 10)).toBe(11);
    expect(suggestWordCount(20, 20)).toBe(25);
  });
});

describe('wordsFromTheme', () => {
  it('picks the suggested number of fitting words without a solution', () => {
    const words = wordsFromTheme(dieren, { width: 6, height: 6, solution: '', rng: createRng(1) });
    expect(words).toHaveLength(suggestWordCount(6, 6));
    for (const w of words) expect(toGridLetters(w).length).toBeLessThanOrEqual(6);
  });

  it('picks words that fill the grid minus the solution', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const words = wordsFromTheme(dieren, {
        width: 10,
        height: 10,
        solution: 'Goed gedaan',
        rng: createRng(seed),
      });
      const target = 100 - 10;
      const letters = lettersOf(words);
      expect(letters).toBeGreaterThanOrEqual(target);
      expect(letters - target).toBeLessThanOrEqual(12);
    }
  });
});

describe('solutionStatus', () => {
  const words = (...w: string[]) => normalizeWordList(w).words;

  it('is silent without a solution', () => {
    expect(solutionStatus(words('kat'), 5, 5, '  ')).toEqual({ kind: 'none' });
  });

  it('says how many letters are still needed', () => {
    expect(solutionStatus(words('kat', 'hond'), 5, 5, 'klaar')).toEqual({
      kind: 'error',
      message: 'Nog 13 letters nodig: voeg woorden toe of kies een kleiner raster.',
    });
  });

  it('confirms a good fit', () => {
    // 5×5 − 5 = 20 cells; 20 letters ⇒ no overlap needed.
    const status = solutionStatus(words('olifant', 'giraffe', 'zebra', 'uil'), 5, 5, 'klaar');
    expect(status.kind).toBe('ok');
  });

  it('warns when many overlaps would be needed', () => {
    const many = words('olifant', 'giraffe', 'zebra', 'tijger', 'leeuw', 'krokodil');
    const status = solutionStatus(many, 5, 5, 'klaar');
    expect(status).toMatchObject({ kind: 'warning' });
    if (status.kind === 'warning') expect(status.message).toContain('te veel');
  });

  it('reports invalid characters', () => {
    expect(solutionStatus(words('kat'), 5, 5, 'k@t')).toMatchObject({ kind: 'error' });
  });
});

describe('isSetupSettings', () => {
  it('accepts valid settings and rejects malformed ones', () => {
    expect(isSetupSettings(DEFAULT_SETTINGS)).toBe(true);
    expect(isSetupSettings({ ...DEFAULT_SETTINGS, width: 30 })).toBe(false);
    expect(isSetupSettings({ ...DEFAULT_SETTINGS, difficulty: 'extreem' })).toBe(false);
    expect(isSetupSettings({ ...DEFAULT_SETTINGS, words: [1] })).toBe(false);
    expect(isSetupSettings(null)).toBe(false);
  });
});
