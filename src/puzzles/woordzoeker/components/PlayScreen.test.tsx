import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Puzzle } from '../logic/types';
import { PlayScreen } from './PlayScreen';

// 5×5 grid, rendered at 50 px per cell.
const CELL = 50;
const puzzle: Puzzle = {
  version: 1,
  width: 5,
  height: 5,
  difficulty: 'moeilijk',
  seed: 1,
  grid: ['KATGO', 'HONDE', 'VISDD', 'XYZQA', 'WVUAN'],
  words: [
    { display: 'kat', letters: 'KAT', row: 0, col: 0, direction: 'E', length: 3 },
    { display: 'hond', letters: 'HOND', row: 1, col: 0, direction: 'E', length: 4 },
    { display: 'vis', letters: 'VIS', row: 2, col: 0, direction: 'E', length: 3 },
  ],
  // Leftover cells (row order): G O E D D X Y Z Q A W V U A N → not used as a real solution here.
};

const center = (row: number, col: number) => ({
  clientX: col * CELL + CELL / 2,
  clientY: row * CELL + CELL / 2,
  pointerId: 1,
});

function grid() {
  return screen.getByTestId('play-grid');
}

function swipe(from: [number, number], to: [number, number]) {
  fireEvent.pointerDown(grid(), center(...from));
  fireEvent.pointerMove(grid(), center(...to));
  fireEvent.pointerUp(grid(), center(...to));
}

function tap(cell: [number, number]) {
  fireEvent.pointerDown(grid(), center(...cell));
  fireEvent.pointerUp(grid(), center(...cell));
}

function foundWords() {
  return within(screen.getByRole('list', { name: 'Te zoeken woorden' }))
    .getAllByRole('listitem')
    .filter((li) => li.textContent?.includes('(gevonden)'))
    .map((li) => li.textContent?.replace(' (gevonden)', ''));
}

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    top: 0,
    width: 5 * CELL,
    height: 5 * CELL,
    right: 5 * CELL,
    bottom: 5 * CELL,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('PlayScreen', () => {
  it('finds a word by swiping and crosses it off', () => {
    render(<PlayScreen puzzle={puzzle} onNew={() => {}} />);
    expect(screen.getByText('0 / 3')).toBeInTheDocument();
    swipe([1, 0], [1, 3]);
    expect(foundWords()).toEqual(['hond']);
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('accepts a word selected backwards', () => {
    render(<PlayScreen puzzle={puzzle} onNew={() => {}} />);
    swipe([2, 2], [2, 0]);
    expect(foundWords()).toEqual(['vis']);
  });

  it('selects with two taps', () => {
    render(<PlayScreen puzzle={puzzle} onNew={() => {}} />);
    tap([0, 0]);
    expect(foundWords()).toEqual([]);
    tap([0, 2]);
    expect(foundWords()).toEqual(['kat']);
  });

  it('gives feedback on a wrong selection', () => {
    render(<PlayScreen puzzle={puzzle} onNew={() => {}} />);
    swipe([3, 0], [3, 3]);
    expect(foundWords()).toEqual([]);
    expect(screen.getByText(/geen woord uit de lijst/)).toBeInTheDocument();
  });

  it('starts the timer on the first touch and pauses while hidden', () => {
    vi.useFakeTimers({
      toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout', 'Date'],
    });
    render(<PlayScreen puzzle={puzzle} onNew={() => {}} />);
    act(() => vi.advanceTimersByTime(5_000));
    expect(screen.getByLabelText('Tijd 0:00')).toBeInTheDocument();

    tap([4, 4]);
    act(() => vi.advanceTimersByTime(3_000));
    expect(screen.getByLabelText('Tijd 0:03')).toBeInTheDocument();

    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
      vi.advanceTimersByTime(10_000);
    });
    expect(screen.getByLabelText('Tijd 0:03')).toBeInTheDocument();

    hidden.mockReturnValue(false);
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
      vi.advanceTimersByTime(2_000);
    });
    expect(screen.getByLabelText('Tijd 0:05')).toBeInTheDocument();
  });

  it('shows the completion panel with the solution and can restart', () => {
    const withSolution: Puzzle = {
      ...puzzle,
      solution: { display: 'Goed', letters: 'GOEDDXYZQAWVUAN' },
    };
    const onNew = vi.fn();
    render(<PlayScreen puzzle={withSolution} onNew={onNew} />);
    swipe([0, 0], [0, 2]);
    swipe([1, 0], [1, 3]);
    swipe([2, 0], [2, 2]);

    expect(screen.getByRole('heading', { name: 'Gefeliciteerd!' })).toBeInTheDocument();
    expect(screen.getByText(/Je vond alle 3 woorden/)).toBeInTheDocument();
    expect(screen.getByText('Goed')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Opnieuw' }));
    expect(screen.queryByRole('heading', { name: 'Gefeliciteerd!' })).toBeNull();
    expect(screen.getByText('0 / 3')).toBeInTheDocument();

    swipe([0, 0], [0, 2]);
    swipe([1, 0], [1, 3]);
    swipe([2, 0], [2, 2]);
    fireEvent.click(screen.getByRole('button', { name: 'Nieuwe puzzel' }));
    expect(onNew).toHaveBeenCalled();
  });

  it('restores and reports progress', () => {
    const onProgress = vi.fn();
    render(
      <PlayScreen
        puzzle={puzzle}
        initialProgress={{
          found: [{ letters: 'KAT', start: { row: 0, col: 0 }, end: { row: 0, col: 2 } }],
          elapsedMs: 42_000,
        }}
        onProgress={onProgress}
        onNew={() => {}}
      />,
    );
    expect(foundWords()).toEqual(['kat']);
    expect(screen.getByLabelText('Tijd 0:42')).toBeInTheDocument();
    swipe([1, 0], [1, 3]);
    const last = onProgress.mock.calls.at(-1)?.[0];
    expect(last.found.map((f: { letters: string }) => f.letters)).toEqual(['KAT', 'HOND']);
  });
});
