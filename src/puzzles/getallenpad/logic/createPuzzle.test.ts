import { describe, expect, it } from 'vitest';

import { createPuzzle, type CreateInput, type CreateOptions } from './createPuzzle';
import { givenCells } from './model';
import { countSolutions, uniquenessCheck } from './solve';
import { type GetallenpadPuzzle, LEVELS } from './types';
import { validatePuzzle } from './validatePuzzle';

/** No time budget by default: results must not depend on how busy the machine is. */
const NO_LIMIT: CreateOptions = { timeoutMs: Infinity };

function make(input: Partial<CreateInput> = {}, options?: CreateOptions): GetallenpadPuzzle {
  const result = createPuzzle(
    { width: 5, height: 5, level: 'moeilijk', seed: 1, ...input },
    { ...NO_LIMIT, ...options },
  );
  if (!result.ok) throw new Error(result.error.code);
  return result.value;
}

const givenCount = (p: GetallenpadPuzzle) => givenCells(p).length;

describe('createPuzzle', () => {
  it('makes a puzzle with exactly one solution that keeps 1 and N', () => {
    const puzzle = make({ width: 6, height: 5, seed: 7 });
    expect(countSolutions(puzzle)).toMatchObject({ ok: true, value: { count: 1 } });
    const shown = givenCells(puzzle).map((g) => g.value);
    expect(shown).toContain(1);
    expect(shown).toContain(30);
    expect(puzzle).toMatchObject({ id: '6x5-moeilijk-7', width: 6, height: 5, seed: 7 });
  });

  it('makes the same puzzle for the same seed', () => {
    expect(make({ seed: 11 })).toEqual(make({ seed: 11 }));
    expect(make({ seed: 11 })).not.toEqual(make({ seed: 12 }));
  });

  it('gives easier levels more numbers, with the same path', { timeout: 60_000 }, () => {
    const [easy, normal, hard] = LEVELS.map((level) =>
      make({ width: 7, height: 7, level, seed: 3 }),
    );
    expect(givenCount(easy!)).toBeGreaterThanOrEqual(givenCount(normal!));
    expect(givenCount(normal!)).toBeGreaterThanOrEqual(givenCount(hard!));
    expect(easy!.solution).toEqual(hard!.solution);
    // 7×7: the minimal puzzle is well below 40%, so the targets are met exactly.
    expect(givenCount(hard!)).toBeLessThan(20);
    expect(givenCount(normal!)).toBe(Math.ceil(49 * 0.4));
    expect(givenCount(easy!)).toBe(Math.ceil(49 * 0.5));
  });

  it('stores the given ratio and the solver nodes', () => {
    const puzzle = make({ seed: 5 });
    expect(puzzle.metric.givenRatio).toBe(givenCount(puzzle) / 25);
    const solved = countSolutions(puzzle);
    expect(solved.ok && solved.value.nodes).toBe(puzzle.metric.solverNodes);
  });

  it('keeps the lowest of several passes', () => {
    const one = make({ width: 6, height: 6, seed: 9 }, { passes: 1 });
    const three = make({ width: 6, height: 6, seed: 9 }, { passes: 3 });
    expect(givenCount(three)).toBeLessThanOrEqual(givenCount(one));
  });

  it('accepts a custom id', () => {
    expect(make({ id: 'mijn-puzzel' }).id).toBe('mijn-puzzel');
  });

  it('rejects grids outside 3..10', () => {
    expect(createPuzzle({ width: 2, height: 5, level: 'normaal', seed: 1 })).toEqual({
      ok: false,
      error: {
        code: 'grid-size',
        message: 'Het raster moet tussen 3 en 10 vakjes breed en hoog zijn.',
      },
    });
  });

  it('times out during the first pass', () => {
    let time = 0;
    const result = createPuzzle(
      { width: 7, height: 7, level: 'normaal', seed: 1 },
      { timeoutMs: 1000, now: () => (time += 100) },
    );
    expect(!result.ok && result.error.code).toBe('timeout');
  });

  it('returns the best puzzle so far when the time runs out after a pass', () => {
    // Count the clock reads of a single pass, then let the clock jump right after them.
    let reads = 0;
    const passOne = make({ seed: 4 }, { passes: 1, now: () => (reads++, 0) });
    const readsForOnePass = reads;
    let later = 0;
    const result = createPuzzle(
      { width: 5, height: 5, level: 'moeilijk', seed: 4 },
      { passes: 3, now: () => (++later <= readsForOnePass ? 0 : 1e9) },
    );
    expect(result.ok && result.value.givens).toEqual(passOne.givens);
  });

  it('stops when aborted', () => {
    const result = createPuzzle(
      { width: 5, height: 5, level: 'normaal', seed: 1 },
      { signal: AbortSignal.abort() },
    );
    expect(!result.ok && result.error.code).toBe('aborted');
  });

  it('only produces puzzles that pass the full validator (property)', { timeout: 60_000 }, () => {
    const cases: CreateInput[] = [];
    for (let seed = 1; seed <= 30; seed++) {
      for (const level of LEVELS) cases.push({ width: 5, height: 5, level, seed });
    }
    for (let seed = 1; seed <= 10; seed++) {
      cases.push({ width: 7, height: 7, level: LEVELS[seed % 3]!, seed });
    }
    for (const input of cases) {
      const result = createPuzzle(input, NO_LIMIT);
      expect(result.ok, JSON.stringify(input)).toBe(true);
      if (result.ok) {
        expect(validatePuzzle(result.value, { countSolutions: uniquenessCheck }).ok).toBe(true);
      }
    }
  });
});
