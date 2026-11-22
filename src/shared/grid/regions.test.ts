import { describe, expect, it } from 'vitest';

import { EMPTY, labelRegions, neighbourTable } from './regions';

const X = 0; // covered

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
