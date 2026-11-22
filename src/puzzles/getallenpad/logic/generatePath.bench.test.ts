import { describe, expect, it } from 'vitest';

import { generatePath } from './generatePath';

/** Benchmark on the target device: `BENCH=1 npx vitest run generatePath.bench --silent=false`. */
describe.skipIf(!import.meta.env.BENCH)('generatePath benchmark', () => {
  it('7×7 paths over 1000 seeds', () => {
    const times: number[] = [];
    let maxRestarts = 0;
    for (let seed = 1; seed <= 1000; seed++) {
      const t = performance.now();
      const result = generatePath({ width: 7, height: 7, seed });
      times.push(performance.now() - t);
      expect(result.ok).toBe(true);
      if (result.ok) maxRestarts = Math.max(maxRestarts, result.value.restarts);
    }
    times.sort((a, b) => a - b);
    const at = (q: number) => times[Math.floor(q * (times.length - 1))]!.toFixed(2);
    console.log(
      `7×7: p50 ${at(0.5)} ms, p95 ${at(0.95)} ms, max ${at(1)} ms, max restarts ${maxRestarts}`,
    );
  });
});
