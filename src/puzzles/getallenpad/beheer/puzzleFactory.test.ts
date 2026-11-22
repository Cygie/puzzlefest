import { describe, expect, it, vi } from 'vitest';

import { formatPuzzleJson } from './formatPuzzleJson';
import { type BatchItem, batchSeeds, inProcessFactory, makeItem } from './puzzleFactory';

const REQUEST = { width: 4, height: 4, level: 'normaal' as const };

function run(seed: number | null, count: number) {
  return new Promise<BatchItem[]>((resolve) => {
    const items: BatchItem[] = [];
    inProcessFactory.start(
      { ...REQUEST, seed, count },
      { onPuzzle: (item) => items.push(item), onDone: () => resolve(items) },
    );
  });
}

describe('batchSeeds', () => {
  it('counts up from a given seed and draws random seeds otherwise', () => {
    expect(batchSeeds({ seed: 7, count: 3 })).toEqual([7, 8, 9]);
    expect(batchSeeds({ seed: 2 ** 32 - 1, count: 2 })).toEqual([2 ** 32 - 1, 0]);
    let n = 100;
    expect(batchSeeds({ seed: null, count: 2 }, () => n++)).toEqual([100, 101]);
  });
});

describe('inProcessFactory', () => {
  it('makes the batch in order, one puzzle per seed', async () => {
    const items = await run(5, 3);
    expect(items.map((i) => i.seed)).toEqual([5, 6, 7]);
    for (const item of items) {
      expect(item.result.ok && item.result.value.id).toBe(`4x4-normaal-${item.seed}`);
    }
    expect(items[0]).toEqual(makeItem(REQUEST, 5));
  });

  it('stops between puzzles when cancelled', async () => {
    vi.useFakeTimers();
    try {
      const onPuzzle = vi.fn();
      const onDone = vi.fn();
      const cancel = inProcessFactory.start(
        { ...REQUEST, seed: 1, count: 5 },
        { onPuzzle, onDone },
      );
      await vi.advanceTimersByTimeAsync(0);
      expect(onPuzzle).toHaveBeenCalledTimes(1);
      cancel();
      await vi.runAllTimersAsync();
      expect(onPuzzle).toHaveBeenCalledTimes(1);
      expect(onDone).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('formatPuzzleJson', () => {
  it('puts each grid row on one line and stays valid JSON', () => {
    const data = {
      a: [
        [1, null],
        [3, 4],
      ],
      b: { c: 1 },
    };
    const json = formatPuzzleJson(data);
    expect(json).toContain('    [1, null],\n    [3, 4]\n');
    expect(json.endsWith('}\n')).toBe(true);
    expect(JSON.parse(json)).toEqual(data);
  });
});
