import { describe, expect, it } from 'vitest';

import { canPartition, EMPTY, labelRegions, neighbourTable } from './regions';

const X = 0; // covered by some word

function regions(rows: string[]) {
  const width = rows[0]!.length;
  const owner = rows.flatMap((r) => Array.from(r, (c) => (c === '.' ? EMPTY : X)));
  const labels = new Int16Array(owner.length);
  const sizes = labelRegions(owner, neighbourTable(width, rows.length), labels);
  return { sizes, labels };
}

describe('neighbourTable', () => {
  it('lists 3 neighbours in a corner and 8 inside', () => {
    const table = neighbourTable(3, 3);
    expect(table[0]).toEqual([1, 3, 4]);
    expect(table[4]).toHaveLength(8);
  });
});

describe('labelRegions', () => {
  it('finds one region in an empty grid', () => {
    expect(regions(['...', '...']).sizes).toEqual([6]);
  });

  it('separates regions split by covered cells', () => {
    const { sizes, labels } = regions(['..#..', '..#..', '###..']);
    expect(sizes).toEqual([4, 6]);
    expect(labels[2]).toBe(-1);
  });

  it('connects cells that only touch diagonally', () => {
    expect(regions(['.#', '#.']).sizes).toEqual([2]);
  });

  it('returns no regions for a full grid', () => {
    expect(regions(['##', '##']).sizes).toEqual([]);
  });
});

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
