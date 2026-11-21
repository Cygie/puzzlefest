import { describe, expect, it } from 'vitest';

import { createRng } from '@/shared/random';

import { normalizeWord, normalizeWordList, toGridLetters } from '../logic/normalize';
import { getTheme, pickThemeWords, THEMES } from './themes';

describe('THEMES', () => {
  it('has at least 8 themes with unique ids', () => {
    expect(THEMES.length).toBeGreaterThanOrEqual(8);
    expect(new Set(THEMES.map((t) => t.id)).size).toBe(THEMES.length);
  });

  it.each(THEMES.map((t) => [t.naam, t] as const))('%s has at least 30 words', (_, theme) => {
    expect(theme.woorden.length).toBeGreaterThanOrEqual(30);
  });

  it.each(THEMES.map((t) => [t.naam, t] as const))(
    '%s only contains valid, unique words of 3–12 letters',
    (_, theme) => {
      for (const word of theme.woorden) {
        const result = normalizeWord(word);
        expect(result.ok, word).toBe(true);
        const length = toGridLetters(word).length;
        expect(length, word).toBeGreaterThanOrEqual(3);
        expect(length, word).toBeLessThanOrEqual(12);
      }
      expect(normalizeWordList(theme.woorden).errors).toEqual([]);
    },
  );
});

describe('getTheme', () => {
  it('finds a theme by id', () => {
    expect(getTheme('dieren')?.naam).toBe('Dieren');
    expect(getTheme('bestaat-niet')).toBeUndefined();
  });
});

describe('pickThemeWords', () => {
  const dieren = getTheme('dieren')!;

  it('returns the requested number of words', () => {
    const words = pickThemeWords(dieren, { count: 10, maxLength: 12, rng: createRng(1) });
    expect(words).toHaveLength(10);
    expect(new Set(words).size).toBe(10);
  });

  it('only returns words that fit the max length', () => {
    const words = pickThemeWords(dieren, { count: 50, maxLength: 5, rng: createRng(2) });
    expect(words.length).toBeGreaterThan(0);
    for (const word of words) expect(toGridLetters(word).length).toBeLessThanOrEqual(5);
  });

  it('is deterministic for the same seed', () => {
    const opts = { count: 8, maxLength: 10 };
    expect(pickThemeWords(dieren, { ...opts, rng: createRng(99) })).toEqual(
      pickThemeWords(dieren, { ...opts, rng: createRng(99) }),
    );
  });

  it('returns nothing for a non-positive count', () => {
    expect(pickThemeWords(dieren, { count: 0, maxLength: 10, rng: createRng(1) })).toEqual([]);
  });
});
