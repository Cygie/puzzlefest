import { describe, expect, it } from 'vitest';

import { createRng } from '@/shared/random';

import { pickThemeWords, THEMES } from '../data/themes';
import { ALL_DIRECTIONS, DIRECTIONS_BY_DIFFICULTY, wordCells } from './directions';
import { checkSolutionFit, generateGrid } from './generateGrid';
import { type NormalizedWord, normalizeWordList } from './normalize';
import type { Difficulty, GenerateInput, Puzzle } from './types';

const SEEDS = Array.from({ length: 25 }, (_, i) => i * 7919 + 1);

function words(...inputs: string[]): NormalizedWord[] {
  return normalizeWordList(inputs).words;
}

function raw(...letters: string[]): NormalizedWord[] {
  return letters.map((l) => ({ display: l, letters: l }));
}

function themeWords(index: number, count: number, maxLength: number): NormalizedWord[] {
  const theme = THEMES[index % THEMES.length]!;
  return words(...pickThemeWords(theme, { count, maxLength, rng: createRng(index) }));
}

function generateOk(input: GenerateInput): Puzzle {
  const result = generateGrid(input);
  if (!result.ok) throw new Error(`Expected success, got: ${result.reason}`);
  return result.puzzle;
}

function letterAt(puzzle: Puzzle, row: number, col: number): string {
  return puzzle.grid[row]?.[col] ?? '';
}

/** Indexes (row * width + col) of all cells used by placed words. */
function wordCellSet(puzzle: Puzzle): Set<number> {
  const set = new Set<number>();
  for (const w of puzzle.words) {
    for (const c of wordCells(w.row, w.col, w.direction, w.length)) {
      set.add(c.row * puzzle.width + c.col);
    }
  }
  return set;
}

describe('generateGrid – input validation', () => {
  it.each([
    [4, 10],
    [10, 21],
    [5.5, 10],
  ])('rejects size %s×%s', (width, height) => {
    const result = generateGrid({
      words: words('kat'),
      width,
      height,
      difficulty: 'normaal',
      seed: 1,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain('tussen 5 en 20');
  });

  it('accepts independent width and height', () => {
    const puzzle = generateOk({
      words: words('kat', 'hond'),
      width: 5,
      height: 20,
      difficulty: 'makkelijk',
      seed: 1,
    });
    expect(puzzle.grid).toHaveLength(20);
    for (const row of puzzle.grid) expect(row).toHaveLength(5);
  });

  it('requires at least one word', () => {
    const result = generateGrid({ words: [], width: 8, height: 8, difficulty: 'normaal', seed: 1 });
    expect(result).toMatchObject({ ok: false, reason: 'Voeg minstens één woord toe.' });
  });
});

describe('generateGrid – placement', () => {
  it.each(['makkelijk', 'normaal', 'moeilijk'] as Difficulty[])(
    '%s only uses its own directions',
    (difficulty) => {
      const used = new Set<string>();
      for (const seed of SEEDS) {
        const puzzle = generateOk({
          words: themeWords(seed, 10, 10),
          width: 12,
          height: 12,
          difficulty,
          seed,
        });
        puzzle.words.forEach((w) => used.add(w.direction));
      }
      for (const direction of used) {
        expect(DIRECTIONS_BY_DIFFICULTY[difficulty]).toContain(direction);
      }
      // Over many puzzles every allowed direction shows up (e.g. backwards words in moeilijk).
      expect([...used].sort()).toEqual([...DIRECTIONS_BY_DIFFICULTY[difficulty]].sort());
    },
  );

  it('records every word at a position where the grid spells it', () => {
    for (const seed of SEEDS) {
      const input = themeWords(seed, 12, 10);
      const puzzle = generateOk({
        words: input,
        width: 10,
        height: 10,
        difficulty: 'moeilijk',
        seed,
      });
      expect(puzzle.words.map((w) => w.letters)).toEqual(input.map((w) => w.letters));
      for (const w of puzzle.words) {
        const spelled = wordCells(w.row, w.col, w.direction, w.length)
          .map((c) => letterAt(puzzle, c.row, c.col))
          .join('');
        // Spelling matches ⇒ overlapping words share identical letters.
        expect(spelled).toBe(w.letters);
      }
    }
  });

  it('never places a word entirely inside another single word', () => {
    for (const seed of SEEDS) {
      const puzzle = generateOk({
        words: words('kater', 'kat', 'ater', 'raket', 'taart', 'tas'),
        width: 6,
        height: 6,
        difficulty: 'moeilijk',
        seed,
      });
      const cellSets = puzzle.words.map(
        (w) =>
          new Set(wordCells(w.row, w.col, w.direction, w.length).map((c) => c.row * 6 + c.col)),
      );
      cellSets.forEach((own, i) => {
        cellSets.forEach((other, j) => {
          if (i === j) return;
          const inside = [...own].every((cell) => other.has(cell));
          expect(inside, `${puzzle.words[i]?.letters} in ${puzzle.words[j]?.letters}`).toBe(false);
        });
      });
    }
  });

  it('fills all other cells with uppercase letters', () => {
    const puzzle = generateOk({
      words: words('fiets'),
      width: 9,
      height: 7,
      difficulty: 'normaal',
      seed: 3,
    });
    expect(puzzle.grid).toHaveLength(7);
    for (const row of puzzle.grid) expect(row).toMatch(/^[A-Z]{9}$/);
  });

  it('does not create accidental extra copies of words', () => {
    for (const seed of SEEDS) {
      const puzzle = generateOk({
        words: themeWords(seed, 12, 10),
        width: 10,
        height: 10,
        difficulty: 'moeilijk',
        seed,
      });
      const used = wordCellSet(puzzle);
      for (const w of puzzle.words.filter((p) => p.length >= 3)) {
        for (const direction of ALL_DIRECTIONS) {
          for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 10; col++) {
              const cells = wordCells(row, col, direction, w.length);
              if (cells.some((c) => c.row < 0 || c.col < 0 || c.row >= 10 || c.col >= 10)) continue;
              const spelled = cells.map((c) => letterAt(puzzle, c.row, c.col)).join('');
              if (spelled !== w.letters) continue;
              // Any occurrence must consist of word cells only (the real one, or inside another word).
              expect(
                cells.every((c) => used.has(c.row * 10 + c.col)),
                `${w.letters} seed ${seed}`,
              ).toBe(true);
            }
          }
        }
      }
    }
  });
});

describe('generateGrid – words that do not fit', () => {
  it('reports a word longer than the grid as too long', () => {
    const result = generateGrid({
      words: words('kat', 'brandweerman'),
      width: 8,
      height: 6,
      difficulty: 'normaal',
      seed: 1,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.unplaced).toHaveLength(1);
    expect(result.unplaced[0]).toMatchObject({ code: 'too-long' });
    expect(result.unplaced[0]?.reason).toContain('te lang voor een raster van 8×6');
    expect(result.reason).toBe('1 woord past niet in de puzzel.');
    expect(result.partial?.words.map((w) => w.letters)).toEqual(['KAT']);
  });

  it('reports words without room left', () => {
    const many = raw(
      'AAAAA',
      'BBBBB',
      'CCCCC',
      'DDDDD',
      'EEEEE',
      'FFFFF',
      'GGGGG',
      'HHHHH',
      'IIIII',
      'JJJJJ',
      'KKKKK',
    );
    const result = generateGrid({
      words: many,
      width: 5,
      height: 5,
      difficulty: 'moeilijk',
      seed: 1,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.unplaced.length).toBeGreaterThan(0);
    expect(result.unplaced.every((u) => u.code === 'no-room')).toBe(true);
    expect(result.unplaced[0]?.reason).toContain('geen plek meer');
    expect(result.partial?.words.length).toBeGreaterThan(0);
  });
});

describe('generateGrid – hidden solution word', () => {
  it('leaves exactly the solution letters, readable row by row', () => {
    let successes = 0;
    for (const seed of SEEDS) {
      const pool = themeWords(seed, 40, 10);
      const toCover = 100 - 'PUZZELFEEST'.length;
      const chosen: NormalizedWord[] = [];
      let sum = 0;
      for (const w of pool) {
        if (sum >= toCover) break;
        chosen.push(w);
        sum += w.letters.length;
      }
      if (!checkSolutionFit(chosen, 10, 10, 'Puzzelfeest').ok) continue;

      const result = generateGrid({
        words: chosen,
        width: 10,
        height: 10,
        difficulty: 'normaal',
        solution: 'Puzzelfeest',
        seed,
      });
      if (!result.ok) continue;
      successes++;
      const puzzle = result.puzzle;
      expect(puzzle.solution).toEqual({ display: 'Puzzelfeest', letters: 'PUZZELFEEST' });
      const used = wordCellSet(puzzle);
      const leftover = puzzle.grid
        .join('')
        .split('')
        .filter((_, index) => !used.has(index))
        .join('');
      expect(leftover).toBe('PUZZELFEEST');
    }
    // The exact fit is a search; it should succeed for the large majority of feasible inputs.
    expect(successes).toBeGreaterThanOrEqual(20);
  });

  it('ignores spaces in a solution sentence', () => {
    const result = generateGrid({
      words: raw('AAAA'),
      width: 5,
      height: 5,
      difficulty: 'makkelijk',
      solution: 'Goed gedaan!',
      seed: 1,
    });
    expect(result).toMatchObject({
      ok: false,
      reason: 'De oplossing mag alleen letters bevatten.',
    });
  });

  it('explains when the words have too few letters', () => {
    const result = generateGrid({
      words: words('kat', 'hond'),
      width: 8,
      height: 8,
      difficulty: 'normaal',
      solution: 'klaar',
      seed: 1,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain('De woorden hebben samen 7 letters');
  });

  it('falls back to a puzzle without solution when the exact fit is impossible', () => {
    // 25 letters must cover 24 cells ⇒ 1 overlap needed, but the words share no letters.
    const result = generateGrid({
      words: raw('AAAAA', 'BBBBB', 'CCCCC', 'DDDDD', 'EEEEE'),
      width: 8,
      height: 8,
      difficulty: 'normaal',
      solution: 'X'.repeat(40),
      seed: 1,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toContain('precies 40 vakjes');
    expect(result.unplaced).toEqual([]);
    expect(result.partial?.solution).toBeUndefined();
    expect(result.partial?.words).toHaveLength(5);
  });
});

describe('checkSolutionFit', () => {
  it('returns the required number of overlaps', () => {
    expect(checkSolutionFit(raw('ABCDE', 'FGHIJ'), 5, 5, 'x'.repeat(16))).toEqual({
      ok: true,
      letters: 'X'.repeat(16),
      requiredOverlap: 1,
    });
  });

  it('rejects a solution that fills the whole grid', () => {
    expect(checkSolutionFit(raw('ABC'), 5, 5, 'x'.repeat(25))).toMatchObject({
      ok: false,
      code: 'too-long',
    });
  });

  it('rejects non-letters', () => {
    expect(checkSolutionFit(raw('ABC'), 5, 5, '123')).toMatchObject({ ok: false, code: 'invalid' });
  });
});

describe('generateGrid – determinism and performance', () => {
  const input: GenerateInput = {
    words: words('olifant', 'giraf', 'zebra', 'leeuw', 'tijger', 'aap'),
    width: 10,
    height: 10,
    difficulty: 'moeilijk',
    seed: 12345,
  };

  it('produces the same puzzle for the same seed', () => {
    expect(generateGrid(input)).toEqual(generateGrid(input));
  });

  it('produces a different puzzle for a different seed', () => {
    expect(generateOk(input).grid).not.toEqual(generateOk({ ...input, seed: 54321 }).grid);
  });

  it('generates a 20×20 grid with 20 words in under 200 ms', () => {
    let slowest = 0;
    for (const seed of SEEDS.slice(0, 5)) {
      const twenty = themeWords(seed, 20, 12);
      expect(twenty).toHaveLength(20);
      const start = performance.now();
      generateOk({ words: twenty, width: 20, height: 20, difficulty: 'moeilijk', seed });
      slowest = Math.max(slowest, performance.now() - start);
    }
    expect(slowest).toBeLessThan(200);
  });
});
