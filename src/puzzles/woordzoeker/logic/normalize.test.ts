import { describe, expect, it } from 'vitest';

import { normalizeWord, normalizeWordList, toGridLetters } from './normalize';

function lettersOf(input: string): string {
  const result = normalizeWord(input);
  if (!result.ok) throw new Error(`Expected "${input}" to be valid: ${result.error.reason}`);
  return result.word.letters;
}

describe('toGridLetters', () => {
  it('uppercases and strips diacritics', () => {
    expect(toGridLetters('café')).toBe('CAFE');
    expect(toGridLetters('ruïne')).toBe('RUINE');
    expect(toGridLetters('coördinatie')).toBe('COORDINATIE');
    expect(toGridLetters('crème brûlée')).toBe('CREMEBRULEE');
  });

  it('removes spaces, hyphens and apostrophes', () => {
    expect(toGridLetters('ijs-beer')).toBe('IJSBEER');
    expect(toGridLetters("'s-Hertogenbosch")).toBe('SHERTOGENBOSCH');
    expect(toGridLetters('rode kool')).toBe('RODEKOOL');
    expect(toGridLetters('oma’s')).toBe('OMAS');
  });
});

describe('normalizeWord', () => {
  it('keeps IJ as two letters', () => {
    expect(lettersOf('ijsje')).toBe('IJSJE');
    expect(lettersOf('IJsland')).toBe('IJSLAND');
  });

  it('keeps the trimmed original as display text', () => {
    const result = normalizeWord('  Café  ');
    expect(result).toEqual({ ok: true, word: { display: 'Café', letters: 'CAFE' } });
  });

  it('rejects empty input', () => {
    const result = normalizeWord('   ');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('empty');
  });

  it('rejects words that are too short', () => {
    const result = normalizeWord('a');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('too-short');
      expect(result.error.reason).toContain('te kort');
    }
  });

  it('rejects digits and other non-letters', () => {
    for (const input of ['kat1', 'hond!', 'vis@', 'ø', '😀']) {
      const result = normalizeWord(input);
      expect(result.ok, input).toBe(false);
      if (!result.ok) expect(result.error.code).toBe('invalid-characters');
    }
  });
});

describe('normalizeWordList', () => {
  it('returns valid words in input order', () => {
    const { words, errors } = normalizeWordList(['kat', 'Hond', 'ijs-beer']);
    expect(words.map((w) => w.letters)).toEqual(['KAT', 'HOND', 'IJSBEER']);
    expect(errors).toEqual([]);
  });

  it('reports duplicates after normalization and keeps the first', () => {
    const { words, errors } = normalizeWordList(['Café', 'cafe', 'kat', 'KAT']);
    expect(words.map((w) => w.display)).toEqual(['Café', 'kat']);
    expect(errors.map((e) => [e.display, e.code])).toEqual([
      ['cafe', 'duplicate'],
      ['KAT', 'duplicate'],
    ]);
    expect(errors[0]?.reason).toContain('staat al in de lijst');
  });

  it('skips blank lines and reports invalid words', () => {
    const { words, errors } = normalizeWordList(['', '  ', 'x', 'vogel', '123']);
    expect(words.map((w) => w.letters)).toEqual(['VOGEL']);
    expect(errors.map((e) => e.code)).toEqual(['too-short', 'invalid-characters']);
  });
});
