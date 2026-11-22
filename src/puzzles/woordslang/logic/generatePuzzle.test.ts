import { describe, expect, it } from 'vitest';

import { spansGrid, validatePuzzle } from './validatePuzzle';
import { type GenerateInput, generatePuzzle } from './generatePuzzle';

const FRUIT: GenerateInput = {
  id: 'fruit',
  theme: 'Fruit',
  hint: 'Gezond tussendoortje',
  keyWord: 'fruitmand',
  words: ['banaan', 'appel', 'peer', 'druif', 'citroen', 'kiwi', 'vijg', 'kers'],
  width: 6,
  height: 8,
  seed: 1,
};

function errorCode(input: Partial<GenerateInput>) {
  const result = generatePuzzle({ ...FRUIT, ...input });
  return result.ok ? null : result.error.code;
}

describe('generatePuzzle: input checks', () => {
  it('rejects a grid outside 3–12', () => {
    expect(errorCode({ width: 2 })).toBe('grid-size');
    expect(errorCode({ height: 13 })).toBe('grid-size');
  });

  it('rejects invalid words', () => {
    expect(errorCode({ words: [...FRUIT.words.slice(1), 'b4naan'] })).toBe('invalid-word');
    expect(errorCode({ keyWord: '' })).toBe('invalid-word');
  });

  it('rejects duplicates, also against the key word', () => {
    expect(errorCode({ words: [...FRUIT.words, 'Kiwi'] })).toBe('duplicate-word');
    expect(errorCode({ words: [...FRUIT.words, 'fruit-mand'] })).toBe('duplicate-word');
  });

  it('rejects a word longer than the grid', () => {
    expect(errorCode({ width: 3, height: 3, keyWord: 'abc', words: ['fruitmandje'] })).toBe(
      'word-too-long',
    );
  });

  it('rejects a letter count that does not match the cells', () => {
    const result = generatePuzzle({ ...FRUIT, words: FRUIT.words.slice(1) });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('letter-count');
      expect(result.error.message).toContain('42 letters');
      expect(result.error.message).toContain('48 vakjes');
    }
  });

  it('rejects a key word too short to span the grid', () => {
    // 'vijg' has 4 letters; a 6×6 grid needs at least 6 to reach from edge to edge.
    expect(
      errorCode({
        width: 6,
        height: 6,
        keyWord: 'vijg',
        words: ['banaan', 'appel', 'citroen', 'druif', 'kers', 'mango'],
      }),
    ).toBe('key-too-short');
  });
});

describe('generatePuzzle: search', () => {
  it('generates a valid puzzle with the key word from edge to edge', () => {
    const result = generatePuzzle(FRUIT);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const puzzle = result.value;
    expect(validatePuzzle(puzzle).ok).toBe(true);
    expect(puzzle).toMatchObject({ id: 'fruit', theme: 'Fruit', width: 6, height: 8 });
    const key = puzzle.words.filter((w) => w.key);
    expect(key.map((w) => w.letters)).toEqual(['FRUITMAND']);
    expect(spansGrid(key[0]!.path, 6, 8)).toBe(true);
    expect(puzzle.words.find((w) => w.display === 'vijg')?.letters).toBe('VIJG');
  });

  it('is deterministic per seed', () => {
    expect(generatePuzzle(FRUIT)).toEqual(generatePuzzle(FRUIT));
    const other = generatePuzzle({ ...FRUIT, seed: 2 });
    const first = generatePuzzle(FRUIT);
    expect(other.ok && first.ok && other.value.grid).not.toEqual(first.ok && first.value.grid);
  });

  it('reports no-solution when the step budget runs out', () => {
    const result = generatePuzzle(FRUIT, { maxSteps: 5 });
    expect(result.ok ? null : result.error.code).toBe('no-solution');
  });

  it('reports a time-out when the clock runs past the limit', () => {
    let clock = 0;
    const now = () => (clock += 1_000); // each step takes a "second"
    const result = generatePuzzle(FRUIT, { now, timeoutMs: 5_000 });
    expect(result.ok ? null : result.error).toEqual({
      code: 'timeout',
      message: expect.stringContaining('binnen 5 seconden') as string,
    });
  });

  it('generates small and large grids', () => {
    const tiny = generatePuzzle({
      ...FRUIT,
      width: 3,
      height: 3,
      keyWord: 'abc',
      words: ['de', 'fg', 'hi'],
    });
    expect(tiny.ok && tiny.value.grid).toHaveLength(3);
    // 18 + 126 letters = 12 × 12.
    const words = [
      'boekenkast',
      'schilderij',
      'vensterbank',
      'kapstok',
      'spiegel',
      'gordijn',
      'kussen',
      'tapijt',
      'lamp',
      'bank',
      'stoel',
      'tafel',
      'kast',
      'deken',
      'klok',
      'vaas',
      'plant',
      'deur',
      'raam',
      'muur',
      'trap',
      'zolder',
    ];
    const big = generatePuzzle({
      ...FRUIT,
      width: 12,
      height: 12,
      keyWord: 'woonkamerinterieur',
      words,
    });
    expect(big.ok ? null : big.error.code).toBeNull();
    expect(big.ok && validatePuzzle(big.value).ok).toBe(true);
  }, 30_000);

  it('returns only valid puzzles (fuzz over 40 seeds)', () => {
    let successes = 0;
    for (let seed = 0; seed < 40; seed++) {
      const result = generatePuzzle({ ...FRUIT, seed });
      if (result.ok) {
        successes++;
        expect(validatePuzzle(result.value).ok).toBe(true);
      }
    }
    expect(successes).toBeGreaterThanOrEqual(36);
  });
});
