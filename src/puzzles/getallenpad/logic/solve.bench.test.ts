import { describe, it } from 'vitest';

import { createRng, shuffle } from '@/shared/random';

import { generatePath } from './generatePath';
import { countSolutions } from './solve';

const SIZE = 7;
const N = SIZE * SIZE;

const pathFor = (seed: number) => {
  const path = generatePath({ width: SIZE, height: SIZE, seed });
  if (!path.ok) throw new Error('no path');
  return path.value.solution;
};

const stats = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const at = (q: number) => s[Math.floor(q * (s.length - 1))]!;
  return `p50 ${at(0.5).toFixed(1)}, p95 ${at(0.95).toFixed(1)}, max ${at(1).toFixed(1)}`;
};

/** Benchmark on the target device: `BENCH=1 npx vitest run solve.bench --silent=false`. */
describe.skipIf(!import.meta.env.BENCH)('countSolutions benchmark', () => {
  it('7×7 with random givens (40/30/20%)', { timeout: 600_000 }, () => {
    for (const ratio of [0.4, 0.3, 0.2]) {
      const nodes: number[] = [];
      const times: number[] = [];
      const outcomes: Record<string, number> = {};
      for (let seed = 1; seed <= 40; seed++) {
        const keep = new Set([
          1,
          N,
          ...shuffle(
            [...Array(N - 2).keys()].map((i) => i + 2),
            createRng(seed),
          ).slice(0, Math.round(N * ratio) - 2),
        ]);
        const givens = pathFor(seed).map((row) => row.map((v) => (keep.has(v) ? v : null)));
        const t = performance.now();
        const result = countSolutions({ width: SIZE, height: SIZE, givens }, { maxNodes: 2e6 });
        times.push(performance.now() - t);
        const key = result.ok ? String(result.value.count) : result.error.code;
        outcomes[key] = (outcomes[key] ?? 0) + 1;
        nodes.push(result.ok ? result.value.nodes : result.error.nodes);
      }
      console.log(
        `${ratio * 100}% givens: ${JSON.stringify(outcomes)}; nodes ${stats(nodes)}; ms ${stats(times)}`,
      );
    }
  });

  it('7×7 greedy reduction (uniqueness proofs)', { timeout: 600_000 }, () => {
    const totals: number[] = [];
    const ratios: number[] = [];
    for (let seed = 1; seed <= 20; seed++) {
      const givens: (number | null)[][] = pathFor(seed).map((row) => [...row]);
      const t = performance.now();
      for (const index of shuffle([...Array(N).keys()], createRng(seed))) {
        const row = givens[Math.floor(index / SIZE)]!;
        const value = row[index % SIZE]!;
        if (value === 1 || value === N) continue;
        row[index % SIZE] = null;
        const result = countSolutions({ width: SIZE, height: SIZE, givens }, { maxNodes: 1e5 });
        if (!result.ok || result.value.count !== 1) row[index % SIZE] = value;
      }
      totals.push(performance.now() - t);
      ratios.push((givens.flat().filter((v) => v !== null).length / N) * 100);
    }
    console.log(`reduction: ms ${stats(totals)}; givens % ${stats(ratios)}`);
  });
});
