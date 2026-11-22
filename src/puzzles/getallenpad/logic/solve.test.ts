import { describe, expect, it } from 'vitest';

import { isNeighbour } from '@/shared/grid/cells';
import { createRng, randomInt, shuffle } from '@/shared/random';

import { generatePath } from './generatePath';
import { countSolutions, type SolveInput, uniquenessCheck } from './solve';
import { TEST_PUZZLE, testPuzzle } from './testPuzzle';
import { validatePuzzle } from './validatePuzzle';

type Givens = (number | null)[][];

/**
 * Reference counter for the oracle: plain DFS from 1 upwards (every start if 1 is not
 * given), adjacency only, no pruning. Counts up to `cap` and reports its nodes.
 */
function referenceCount({ width, height, givens }: SolveInput, cap = 2) {
  const n = width * height;
  const values: number[] = givens.flat().map((v) => v ?? 0);
  const cellOf = new Map<number, number>();
  values.forEach((v, cell) => v && cellOf.set(v, cell));
  const cell = (i: number) => ({ row: Math.floor(i / width), col: i % width });
  let count = 0;
  let nodes = 0;
  const extend = (head: number, v: number) => {
    if (count >= cap) return;
    if (v === n) {
      count++;
      return;
    }
    const given = cellOf.get(v + 1);
    for (let next = 0; next < n; next++) {
      if (!isNeighbour(cell(head), cell(next))) continue;
      if (given !== undefined ? next !== given : values[next] !== 0) continue;
      nodes++;
      if (given === undefined) values[next] = v + 1;
      extend(next, v + 1);
      if (given === undefined) values[next] = 0;
    }
  };
  const start = cellOf.get(1);
  if (start !== undefined) extend(start, 1);
  else {
    for (let first = 0; first < n; first++) {
      if (values[first] !== 0) continue;
      values[first] = 1;
      extend(first, 1);
      values[first] = 0;
    }
  }
  return { count: count === 0 ? 0 : count === 1 ? 1 : 'many', nodes };
}

const solve = (width: number, height: number, givens: Givens) => {
  const result = countSolutions({ width, height, givens });
  if (!result.ok) throw new Error(result.error.code);
  return result.value;
};

describe('countSolutions', () => {
  it('finds the single solution of a unique puzzle', () => {
    const result = solve(4, 4, TEST_PUZZLE.givens);
    expect(result.count).toBe(1);
    expect(result.solution).toEqual(TEST_PUZZLE.solution);
    expect(result.nodes).toBeGreaterThan(0);
  });

  it('reports many solutions', () => {
    const result = solve(3, 3, [
      [1, null, null],
      [null, null, null],
      [null, null, 9],
    ]);
    expect(result.count).toBe('many');
    expect(result.solution).toBeDefined();
  });

  it('reports no solution when the givens cannot be connected', () => {
    // Distances allow it, but no path exists (checked by the reference counter too).
    const givens = [
      [null, 1, 5],
      [null, null, null],
      [null, null, 9],
    ];
    expect(solve(3, 3, givens)).toEqual({ count: 0, nodes: expect.any(Number) });
    expect(referenceCount({ width: 3, height: 3, givens }).count).toBe(0);
  });

  it('reports no solution for givens too far apart, without searching', () => {
    const tooFar: Givens = [
      [1, null, null, 3],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, 16],
    ];
    expect(solve(4, 4, tooFar)).toEqual({ count: 0, nodes: 0 });
    const notTouching: Givens = [
      [1, null, null],
      [null, null, null],
      [2, null, 9],
    ];
    expect(solve(3, 3, notTouching)).toEqual({ count: 0, nodes: 0 });
  });

  it('rejects impossible givens', () => {
    expect(
      solve(3, 3, [
        [1, 1, null],
        [null, null, null],
        [null, null, 9],
      ]).count,
    ).toBe(0);
    expect(
      solve(3, 3, [
        [1, 10, null],
        [null, null, null],
        [null, null, 9],
      ]).count,
    ).toBe(0);
    expect(
      solve(3, 3, [
        [1, 0, null],
        [null, null, null],
        [null, null, 9],
      ]).count,
    ).toBe(0);
  });

  it('solves a grid without 1 or N given', () => {
    const givens = TEST_PUZZLE.solution.map((row) =>
      row.map((v) => (v === 1 || v === 16 ? null : v)),
    );
    expect(solve(4, 4, givens).count).toBe(1);
    const empty: Givens = [
      [null, null, null],
      [null, null, null],
      [null, null, null],
    ];
    expect(solve(3, 3, empty).count).toBe('many');
  });

  it('stops at the second solution instead of enumerating all', () => {
    const givens: Givens = [
      [1, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, 16],
    ];
    const all = referenceCount({ width: 4, height: 4, givens }, Infinity);
    const result = solve(4, 4, givens);
    expect(result.count).toBe('many');
    expect(result.nodes * 100).toBeLessThan(all.nodes);
  });

  it('reports a node limit', () => {
    const result = countSolutions(
      { width: 7, height: 7, givens: Array.from({ length: 7 }, () => Array<null>(7).fill(null)) },
      { maxNodes: 10 },
    );
    expect(result).toEqual({ ok: false, error: { code: 'node-limit', nodes: 11 } });
  });

  it('stops when the signal is aborted', () => {
    const givens: Givens = Array.from({ length: 7 }, () => Array<number | null>(7).fill(null));
    givens[0]![0] = 1;
    givens[6]![6] = 49;
    expect(
      countSolutions({ width: 7, height: 7, givens }, { signal: AbortSignal.abort() }),
    ).toEqual({ ok: false, error: { code: 'aborted', nodes: 0 } });

    // Aborted during the search: the signal is polled every 1024 nodes. Find a grid
    // whose plain search needs more than that (deterministic), then abort it.
    const big = Array.from({ length: 40 }, (_, i) => i + 1)
      .map((seed) => {
        const path = generatePath({ width: 6, height: 6, seed });
        if (!path.ok) throw new Error('no path');
        const keep = new Set([
          1,
          36,
          ...shuffle([...Array(34).keys()], createRng(seed)).slice(0, 3),
        ]);
        return path.value.solution.map((row) => row.map((v) => (keep.has(v) ? v : null)));
      })
      .find((g) => {
        const r = countSolutions({ width: 6, height: 6, givens: g }, { pruning: false });
        return r.ok && r.value.nodes > 2048;
      });
    expect(big).toBeDefined();
    let reads = 0;
    const flipping = {
      get aborted() {
        return ++reads > 1;
      },
    } as AbortSignal;
    const result = countSolutions(
      { width: 6, height: 6, givens: big! },
      { signal: flipping, pruning: false },
    );
    expect(result).toEqual({ ok: false, error: { code: 'aborted', nodes: 1024 } });
  });

  it('agrees with plain search and the reference counter on random small grids (oracle)', () => {
    const rng = createRng(2026);
    const sizes = [
      [3, 3],
      [3, 4],
      [4, 3],
      [4, 4],
    ];
    const seen = { 0: 0, 1: 0, many: 0 };
    for (let t = 0; t < 320; t++) {
      const [width, height] = sizes[t % sizes.length]!;
      const n = width! * height!;
      const path = generatePath({ width: width!, height: height!, seed: t + 1 });
      if (!path.ok) throw new Error('no path');
      const ratio = n === 16 ? 0.3 + rng() * 0.4 : 0.15 + rng() * 0.5;
      const keep = new Set(shuffle([...Array(n).keys()], rng).slice(0, Math.round(n * ratio)));
      const givens: Givens = path.value.solution.map((row, r) =>
        row.map((v, c) => (keep.has(r * width! + c) ? v : null)),
      );
      // A third of the cases: move one given to a random empty cell (often unsolvable).
      if (t % 3 === 0) {
        const flat = givens.flat();
        const from = flat.findIndex((v) => v !== null);
        const empties = flat.flatMap((v, i) => (v === null ? [i] : []));
        if (from >= 0 && empties.length > 0) {
          const to = empties[randomInt(rng, empties.length)]!;
          givens[Math.floor(to / width!)]![to % width!] = flat[from]!;
          givens[Math.floor(from / width!)]![from % width!] = null;
        }
      }
      const input = { width: width!, height: height!, givens };
      const expected = referenceCount(input).count;
      const pruned = countSolutions(input);
      const plain = countSolutions(input, { pruning: false });
      expect(pruned.ok && pruned.value.count, JSON.stringify(input)).toBe(expected);
      expect(plain.ok && plain.value.count, JSON.stringify(input)).toBe(expected);
      seen[expected as keyof typeof seen]++;
    }
    // The oracle must cover all three outcomes.
    expect(seen[0]).toBeGreaterThan(10);
    expect(seen[1]).toBeGreaterThan(10);
    expect(seen.many).toBeGreaterThan(10);
  });
});

describe('uniquenessCheck', () => {
  it('lets validatePuzzle accept a unique puzzle and reject a non-unique one', () => {
    expect(validatePuzzle(TEST_PUZZLE, { countSolutions: uniquenessCheck }).ok).toBe(true);

    const loose = testPuzzle();
    loose.givens = loose.givens.map((row) => row.map((v) => (v === 1 || v === 16 ? v : null)));
    loose.metric.givenRatio = 2 / 16;
    const result = validatePuzzle(loose, { countSolutions: uniquenessCheck });
    expect(!result.ok && result.error.map((e) => e.code)).toEqual(['not-unique']);
  });
});
