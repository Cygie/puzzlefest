import { describe, expect, it } from 'vitest';

import { formatTime } from './formatTime';

describe('formatTime', () => {
  it('formats minutes and seconds', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(9_999)).toBe('0:09');
    expect(formatTime(83_000)).toBe('1:23');
    expect(formatTime(3_725_000)).toBe('1:02:05');
    expect(formatTime(-5)).toBe('0:00');
  });
});
