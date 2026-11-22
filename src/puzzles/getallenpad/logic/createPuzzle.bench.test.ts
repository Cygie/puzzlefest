import { describe, it } from 'vitest';

import { createPuzzle } from './createPuzzle';
import { LEVELS } from './types';

const stats = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const at = (q: number) => s[Math.floor(q * (s.length - 1))]!;
  return `p50 ${at(0.5).toFixed(0)}, p95 ${at(0.95).toFixed(0)}, max ${at(1).toFixed(0)}`;
};

/** Benchmark on the target device: `BENCH=1 npx vitest run createPuzzle.bench --silent=false`. */
describe.skipIf(!import.meta.env.BENCH)('createPuzzle benchmark', () => {
  it('7×7, 100 seeds per level', { timeout: 3_600_000 }, () => {
    const SEEDS = Number(import.meta.env.SEEDS ?? 100);
    for (const level of LEVELS) {
      const times: number[] = [];
      const ratios: number[] = [];
      const nodes: number[] = [];
      let inTime = 0;
      for (let seed = 1; seed <= SEEDS; seed++) {
        const t = performance.now();
        const result = createPuzzle({ width: 7, height: 7, level, seed });
        const ms = performance.now() - t;
        times.push(ms);
        if (result.ok && ms <= 5000) inTime++;
        if (result.ok) {
          ratios.push(result.value.metric.givenRatio * 100);
          nodes.push(result.value.metric.solverNodes);
        }
      }
      console.log(
        `${level}: unique within 5 s ${inTime}/${SEEDS}; ms ${stats(times)}; ` +
          `givens % ${stats(ratios)}; solver nodes ${stats(nodes)}`,
      );
    }
  });
});
