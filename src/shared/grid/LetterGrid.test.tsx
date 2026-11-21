import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Cell } from './cells';
import { type GridStroke, LetterGrid } from './LetterGrid';
import { usePathSelection } from './usePathSelection';

// 4×3 grid rendered at 50 px per cell.
const CELL = 50;
const ROWS = ['SLAN', 'GXEO', 'ABCD'];

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    top: 0,
    width: 4 * CELL,
    height: 3 * CELL,
    right: 4 * CELL,
    bottom: 3 * CELL,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });
});

function PathGrid({
  onSelect,
  strokes,
  disabled,
}: {
  onSelect: (path: Cell[]) => void;
  strokes?: GridStroke[];
  disabled?: boolean;
}) {
  const controller = usePathSelection(onSelect);
  return (
    <LetterGrid
      rows={ROWS}
      width={4}
      height={3}
      controller={controller}
      strokes={strokes}
      disabled={disabled}
      ariaLabel="Testraster"
    />
  );
}

const at = (row: number, col: number, dx = 0, dy = 0) => ({
  clientX: col * CELL + CELL / 2 + dx,
  clientY: row * CELL + CELL / 2 + dy,
  pointerId: 1,
});
const grid = () => screen.getByTestId('letter-grid');
const down = (row: number, col: number) => fireEvent.pointerDown(grid(), at(row, col));
const move = (row: number, col: number, dx = 0, dy = 0) =>
  fireEvent.pointerMove(grid(), at(row, col, dx, dy));
const up = () => fireEvent.pointerUp(grid(), at(0, 0));
const tap = (row: number, col: number) => {
  down(row, col);
  up();
};
const c = (row: number, col: number): Cell => ({ row, col });

describe('LetterGrid with path selection', () => {
  it('renders the letters with an accessible label', () => {
    render(<PathGrid onSelect={vi.fn()} />);
    expect(screen.getByRole('img', { name: 'Testraster' })).toHaveTextContent('SLANGXEOABCD');
  });

  it('selects a bent path by dragging (S-L-A-N then down to O)', () => {
    const onSelect = vi.fn();
    render(<PathGrid onSelect={onSelect} />);
    down(0, 0);
    move(0, 1);
    move(0, 2);
    move(0, 3);
    move(1, 3);
    up();
    expect(onSelect).toHaveBeenCalledWith([c(0, 0), c(0, 1), c(0, 2), c(0, 3), c(1, 3)]);
  });

  it('ignores the corner of a cell while cutting diagonally', () => {
    const onSelect = vi.fn();
    render(<PathGrid onSelect={onSelect} />);
    down(0, 0);
    move(0, 1, -24, 24); // near the corner shared with (1,0) and (1,1): no cell picked up
    move(1, 1);
    up();
    expect(onSelect).toHaveBeenCalledWith([c(0, 0), c(1, 1)]);
  });

  it('undoes a step when dragging back', () => {
    const onSelect = vi.fn();
    render(<PathGrid onSelect={onSelect} />);
    down(0, 0);
    move(0, 1);
    move(0, 2);
    move(0, 1);
    up();
    expect(onSelect).toHaveBeenCalledWith([c(0, 0), c(0, 1)]);
  });

  it('selects tap by tap and submits on tapping the last cell again', () => {
    const onSelect = vi.fn();
    render(<PathGrid onSelect={onSelect} />);
    tap(2, 0);
    tap(2, 1);
    tap(1, 2);
    expect(onSelect).not.toHaveBeenCalled();
    expect(document.querySelector('[data-current]')).not.toBeNull(); // preview stroke
    tap(1, 2);
    expect(onSelect).toHaveBeenCalledWith([c(2, 0), c(2, 1), c(1, 2)]);
    expect(document.querySelector('[data-current]')).toBeNull();
  });

  it('continues a tapped path by dragging from its last cell', () => {
    const onSelect = vi.fn();
    render(<PathGrid onSelect={onSelect} />);
    tap(0, 0);
    down(0, 0);
    move(0, 1);
    up();
    expect(onSelect).toHaveBeenCalledWith([c(0, 0), c(0, 1)]);
  });

  it('draws found words as strokes through their cells', () => {
    render(
      <PathGrid
        onSelect={vi.fn()}
        strokes={[{ key: 'SLANG', cells: [c(0, 0), c(0, 1), c(1, 0)], color: 'red' }]}
      />,
    );
    const stroke = screen.getByTestId('word-stroke');
    expect(stroke.getAttribute('points')).toBe('0.5,0.5 1.5,0.5 0.5,1.5');
  });

  it('does nothing when disabled', () => {
    const onSelect = vi.fn();
    render(<PathGrid onSelect={onSelect} disabled />);
    down(0, 0);
    move(0, 1);
    up();
    expect(onSelect).not.toHaveBeenCalled();
  });
});
