import { describe, expect, it } from 'vitest';

import { createRng } from '@/shared/random';

import { getTheme } from '../data/themes';
import { normalizeWordList, toGridLetters } from './normalize';
import {
  DEFAULT_SETTINGS,
  isSetupSettings,
  PLAIN_MAX_FILL,
  SOLUTION_LIST_SHARE,
  solutionStatus,
  suggestWordCount,
  themeExtras,
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

  it('keeps the grid from getting too full without a solution', () => {
    const beroepen = getTheme('beroepen')!; // many long words
    for (let seed = 1; seed <= 20; seed++) {
      const words = wordsFromTheme(beroepen, {
        width: 12,
        height: 12,
        solution: '',
        rng: createRng(seed),
      });
      expect(lettersOf(words)).toBeLessThanOrEqual(144 * PLAIN_MAX_FILL);
    }
  });

  it('with a solution, picks words for about half the cells to cover', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const words = wordsFromTheme(dieren, {
        width: 10,
        height: 10,
        solution: 'Goed gedaan',
        rng: createRng(seed),
      });
      const target = (100 - 10) * SOLUTION_LIST_SHARE;
      const letters = lettersOf(words);
      expect(letters).toBeGreaterThanOrEqual(target);
      expect(letters - target).toBeLessThan(10); // at most one word more than needed
    }
  });
});

describe('themeExtras', () => {
  it('returns the theme words that are not listed and fit the grid', () => {
    const listed = normalizeWordList(['kat', 'Hond']).words;
    const extras = themeExtras(dieren, listed, 6, 5);
    const letters = extras.map((w) => w.letters);
    expect(letters).not.toContain('KAT');
    expect(letters).not.toContain('HOND');
    expect(letters).toContain('KOE');
    for (const w of extras) expect(w.letters.length).toBeLessThanOrEqual(6);
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

  it('counts theme words that can be added', () => {
    const extras = words('olifant', 'giraffe', 'zebra');
    expect(solutionStatus(words('uil'), 5, 5, 'klaar', extras)).toEqual({
      kind: 'ok',
      message:
        '✓ Past: de puzzel wordt aangevuld met woorden uit het thema; de overgebleven ' +
        'letters vormen je oplossing.',
    });
  });

  it('says when the theme has too few words for the grid', () => {
    expect(solutionStatus(words('uil'), 5, 5, 'klaar', words('kat'))).toMatchObject({
      kind: 'error',
      message: expect.stringContaining('Dit thema heeft niet genoeg woorden'),
    });
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
