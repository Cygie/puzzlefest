import { describe, expect, it } from 'vitest';

import { canPartition } from './regions';

describe('canPartition', () => {
  it('needs the totals to match', () => {
    expect(canPartition([8], [4, 3])).toBe(false);
    expect(canPartition([7], [4, 3])).toBe(true);
  });

  it('assigns words to regions exactly', () => {
    expect(canPartition([7, 5], [4, 3, 5])).toBe(true);
    expect(canPartition([7, 5], [4, 4, 4])).toBe(false);
    expect(canPartition([6, 6], [3, 3, 3, 3])).toBe(true);
    expect(canPartition([6, 6], [4, 4, 4])).toBe(false);
  });

  it('ignores empty regions and handles no words', () => {
    expect(canPartition([0, 5], [5])).toBe(true);
    expect(canPartition([], [])).toBe(true);
    expect(canPartition([2], [])).toBe(false);
  });
});
