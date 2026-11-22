import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Cell } from '@/shared/grid/cells';

import { loadProgress, saveProgress } from '../logic/progress';
import { TEST_PUZZLE } from '../logic/testPuzzle';
import { PadPlayScreen, TYPE_WINDOW_MS } from './PadPlayScreen';

// TEST_PUZZLE (4×4 snake), givens shown, dots are empty:
//    1  2  .  4
//    .  .  6  .
//    9 10 11  .
//   16  .  . 13
const P = TEST_PUZZLE;
const CELL = 50;

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    top: 0,
    width: P.width * CELL,
    height: P.height * CELL,
    right: P.width * CELL,
    bottom: P.height * CELL,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });
});
afterEach(() => {
  localStorage.clear();
  vi.useRealTimers();
});

const c = (row: number, col: number): Cell => ({ row, col });
const point = ({ row, col }: Cell) => ({
  clientX: col * CELL + CELL / 2,
  clientY: row * CELL + CELL / 2,
  pointerId: 1,
});
const grid = () => screen.getByTestId('pad-grid');
const cellEl = ({ row, col }: Cell) =>
  within(grid()).getAllByRole('gridcell')[row * P.width + col]!;
const value = (cell: Cell) => cellEl(cell).textContent;
function drag(...path: Cell[]) {
  fireEvent.pointerDown(grid(), point(path[0]!));
  for (const cell of path.slice(1)) fireEvent.pointerMove(grid(), point(cell));
  fireEvent.pointerUp(grid(), point(path[path.length - 1]!));
}
function tap(cell: Cell) {
  fireEvent.pointerDown(grid(), point(cell));
  fireEvent.pointerUp(grid(), point(cell));
}
const strokes = () => within(grid()).queryAllByTestId('word-stroke');

function setup() {
  const onBack = vi.fn();
  render(<PadPlayScreen puzzle={P} onBack={onBack} />);
  return { onBack };
}

describe('PadPlayScreen', () => {
  it('shows givens apart from empty cells, and lines between touching runs', () => {
    setup();
    expect(value(c(0, 0))).toBe('1');
    expect(cellEl(c(0, 0))).toHaveAccessibleName('Rij 1, kolom 1: 1 (gegeven)');
    expect(cellEl(c(1, 0))).toHaveAccessibleName('Rij 2, kolom 1: leeg');
    expect(screen.getByText(/9 van 16 vakjes gevuld/)).toBeInTheDocument();
    expect(strokes()).toHaveLength(2); // 1–2 and 9–10–11
  });

  it('numbers a drag upwards, through a matching given', () => {
    setup();
    drag(c(0, 1), c(0, 2), c(0, 3), c(1, 3));
    expect(value(c(0, 2))).toBe('3');
    expect(value(c(1, 3))).toBe('5');
    expect(strokes()).toHaveLength(2); // 1…6 is now one run
  });

  it('numbers a drag downwards from the higher number', () => {
    setup();
    drag(c(3, 0), c(3, 1), c(3, 2));
    expect([value(c(3, 1)), value(c(3, 2))]).toEqual(['15', '14']);
    drag(c(2, 0), c(1, 0), c(1, 1));
    expect([value(c(1, 0)), value(c(1, 1))]).toEqual(['8', '7']);
  });

  it('rejects a drag into a different given, with feedback', () => {
    setup();
    drag(c(0, 1), c(0, 2), c(1, 2));
    expect(value(c(0, 2))).toBe('');
    expect(screen.getByText('Daar staat al een ander getal.')).toBeInTheDocument();
    expect(cellEl(c(1, 2)).className).toMatch(/rejected/);
    drag(c(0, 1), c(0, 2));
    expect(screen.queryByText('Daar staat al een ander getal.')).not.toBeInTheDocument();
  });

  it('undoes with the button and with Ctrl+Z', async () => {
    const user = userEvent.setup();
    setup();
    const undoButton = screen.getByRole('button', { name: 'Ongedaan maken' });
    expect(undoButton).toBeDisabled();
    drag(c(0, 1), c(0, 2));
    drag(c(3, 0), c(3, 1));
    await user.click(undoButton);
    expect(value(c(3, 1))).toBe('');
    expect(value(c(0, 2))).toBe('3');
    await user.keyboard('{Control>}z{/Control}');
    expect(value(c(0, 2))).toBe('');
    expect(undoButton).toBeDisabled();
  });

  it('types numbers with the keyboard: arrows, two digits, clearing', async () => {
    const user = userEvent.setup();
    setup();
    tap(c(1, 0));
    await user.keyboard('8');
    expect(value(c(1, 0))).toBe('8');
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowRight}'); // to (3,1)
    await user.keyboard('15');
    expect(value(c(3, 1))).toBe('15');
    await user.keyboard('{Backspace}');
    expect(value(c(3, 1))).toBe('');
    // Typing into a given does nothing.
    await user.keyboard('{ArrowUp}{ArrowLeft}7');
    expect(value(c(2, 0))).toBe('9');
  });

  it('starts a new number after a pause', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    setup();
    tap(c(1, 0));
    fireEvent.keyDown(grid(), { key: '1' });
    vi.setSystemTime(Date.now() + TYPE_WINDOW_MS + 1);
    fireEvent.keyDown(grid(), { key: '5' });
    expect(value(c(1, 0))).toBe('5');
  });

  it('treats two typed digits as one change for undo', async () => {
    const user = userEvent.setup();
    setup();
    tap(c(3, 1));
    await user.keyboard('15');
    await user.click(screen.getByRole('button', { name: 'Ongedaan maken' }));
    expect(value(c(3, 1))).toBe('');
  });

  it('marks errors at once: a number away from its neighbour, a duplicate', async () => {
    const user = userEvent.setup();
    setup();
    tap(c(3, 1));
    await user.keyboard('12'); // 13 is not next to it
    expect(cellEl(c(3, 1)).className).toMatch(/error/);
    expect(cellEl(c(3, 1))).toHaveAccessibleName(/\(fout\)/);
    expect(screen.getByText('Er staat iets fout.')).toBeInTheDocument();
    tap(c(1, 0));
    await user.keyboard('6'); // 6 is a given
    expect(cellEl(c(1, 0)).className).toMatch(/error/);
    expect(cellEl(c(1, 2)).className).not.toMatch(/error/);
  });

  it('is solved when the path is complete, and saves progress', () => {
    const { onBack } = setup();
    drag(c(0, 1), c(0, 2), c(0, 3), c(1, 3));
    drag(c(2, 0), c(1, 0), c(1, 1));
    expect(loadProgress(P).entries.filter((v) => v !== null)).toHaveLength(4);
    drag(c(2, 2), c(2, 3), c(3, 3), c(3, 2), c(3, 1));
    expect(screen.getByRole('heading', { name: 'Opgelost!' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ongedaan maken' })).not.toBeInTheDocument();
    expect(strokes()).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Naar alle puzzels' }));
    expect(onBack).toHaveBeenCalled();
  });

  it('restores saved progress', () => {
    const entries = P.givens.flat().map(() => null as number | null);
    entries[4] = 8;
    saveProgress(P.id, entries);
    setup();
    expect(value(c(1, 0))).toBe('8');
  });

  it('shows the numbers a drag would place while dragging', () => {
    setup();
    fireEvent.pointerDown(grid(), point(c(0, 1)));
    fireEvent.pointerMove(grid(), point(c(0, 2)));
    expect(value(c(0, 2))).toBe('3');
    act(() => {
      fireEvent.pointerCancel(grid());
    });
    expect(value(c(0, 2))).toBe('');
  });
});
