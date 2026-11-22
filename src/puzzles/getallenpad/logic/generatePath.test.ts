import { describe, expect, it } from 'vitest';

import type { Cell } from '@/shared/grid/cells';
import { findPathProblem } from '@/shared/grid/paths';

import { generatePath, type PathOptions } from './generatePath';
import { positionsByValue } from './model';

function expectHamiltonian(solution: number[][], width: number, height: number) {
  expect(solution).toHaveLength(height);
  solution.forEach((row) => expect(row).toHaveLength(width));
  const path = positionsByValue(solution).slice(1);
  expect(path.every(Boolean)).toBe(true);
  expect(path).toHaveLength(width * height);
  expect(findPathProblem(path as Cell[], width, height)).toBeNull();
}

function solve(width: number, height: number, seed: number, options?: PathOptions) {
  const result = generatePath({ width, height, seed }, options);
  if (!result.ok) throw new Error(`unexpected ${result.error.code}`);
  return result.value;
}

describe('generatePath', () => {
  it.each([
    [3, 3],
    [7, 7],
    [5, 9],
    [10, 10],
  ])('returns a path through every cell of a %i×%i grid', (width, height) => {
    expectHamiltonian(solve(width, height, 42).solution, width, height);
  });

  it('returns the same path for the same seed', () => {
    expect(solve(7, 7, 123)).toEqual(solve(7, 7, 123));
  });

  it('returns different paths for different seeds', () => {
    const paths = new Set(
      [1, 2, 3, 4, 5].map((seed) => JSON.stringify(solve(7, 7, seed).solution)),
    );
    expect(paths.size).toBe(5);
  });

  it('gives valid paths for many seeds', () => {
    for (let seed = 1; seed <= 200; seed++) {
      expectHamiltonian(solve(7, 7, seed).solution, 7, 7);
    }
  });

  it('does not always start in a corner', () => {
    const starts = new Set<string>();
    for (let seed = 1; seed <= 30; seed++) {
      const start = positionsByValue(solve(7, 7, seed).solution)[1]!;
      starts.add(`${start.row},${start.col}`);
    }
    expect(starts.size).toBeGreaterThan(10);
  });

  it('rejects grids that are too small or too big', () => {
    for (const [width, height] of [
      [2, 5],
      [5, 11],
      [4.5, 4],
    ]) {
      const result = generatePath({ width: width!, height: height!, seed: 1 });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe('grid-size');
    }
  });

  it('restarts from a new start cell when an attempt runs out of steps', () => {
    // Seed 25 needs one restart with this small restart interval (pinned: deterministic).
    const { solution, restarts } = solve(6, 6, 25, { restartSteps: 40 });
    expect(restarts).toBe(1);
    expectHamiltonian(solution, 6, 6);
  });

  it('reports no-path when the step budget is used up', () => {
    const result = generatePath(
      { width: 7, height: 7, seed: 1 },
      { restartSteps: 10, maxSteps: 500 },
    );
    expect(result).toEqual({
      ok: false,
      error: { code: 'no-path', message: 'Geen pad gevonden binnen het aantal zoekstappen.' },
    });
  });

  it('reports a time-out from the clock', () => {
    let time = 0;
    const result = generatePath(
      { width: 7, height: 7, seed: 1 },
      { restartSteps: 10, maxSteps: 1e9, timeoutMs: 2000, now: () => (time += 1000) },
    );
    expect(!result.ok && result.error.code).toBe('timeout');
  });

  it('stops when the signal is aborted', () => {
    const aborted = AbortSignal.abort();
    expect(generatePath({ width: 7, height: 7, seed: 1 }, { signal: aborted })).toMatchObject({
      ok: false,
      error: { code: 'aborted' },
    });

    const controller = new AbortController();
    let calls = 0;
    const result = generatePath(
      { width: 7, height: 7, seed: 1 },
      {
        restartSteps: 10,
        maxSteps: 1e9,
        signal: controller.signal,
        now: () => {
          if (++calls === 3) controller.abort();
          return 0;
        },
      },
    );
    expect(!result.ok && result.error.code).toBe('aborted');
  });

  it('starts at the requested cell', () => {
    const start = positionsByValue(solve(5, 5, 7, { start: { row: 2, col: 3 } }).solution)[1];
    expect(start).toEqual({ row: 2, col: 3 });
  });

  it('with pruning finds a path from every start where plain search does', () => {
    for (const [width, height] of [
      [3, 3],
      [3, 4],
      [4, 4],
    ]) {
      for (let row = 0; row < height!; row++) {
        for (let col = 0; col < width!; col++) {
          for (const noise of [0, 1]) {
            const options = { start: { row, col }, noise, restartSteps: 1e9 };
            const plain = solve(width!, height!, row * 10 + col, { ...options, pruning: false });
            const pruned = solve(width!, height!, row * 10 + col, options);
            expect(plain.restarts).toBe(0);
            expect(pruned.restarts).toBe(0);
            expect(positionsByValue(pruned.solution)[1]).toEqual({ row, col });
            expectHamiltonian(pruned.solution, width!, height!);
          }
        }
      }
    }
  });
});
