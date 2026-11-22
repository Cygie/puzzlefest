import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { Cell } from './cells';
import { Grid, type GridController } from './Grid';

const controller: GridController = {
  preview: null,
  start: () => {},
  move: () => {},
  end: () => {},
  cancel: () => {},
};

describe('Grid', () => {
  it('renders custom cell content and classes', () => {
    render(
      <Grid
        width={3}
        height={2}
        controller={controller}
        renderCell={(_, index) => index + 1}
        cellClassName={(cell) => (cell.row === 0 && cell.col === 0 ? 'given' : undefined)}
        ariaLabel="Getallen"
      />,
    );
    const image = screen.getByRole('img', { name: 'Getallen' });
    expect(image).toHaveTextContent('123456');
    expect(image.firstElementChild).toHaveClass('given');
    expect(image.children[1]).not.toHaveClass('given');
    expect(screen.queryByRole('grid')).toBeNull();
  });
});

function KeyboardGrid({ onKey }: { onKey: (key: string, cell: Cell) => boolean }) {
  const [active, setActive] = useState<Cell | null>(null);
  return (
    <Grid
      width={3}
      height={2}
      controller={controller}
      renderCell={() => ''}
      cellLabel={(cell) => `rij ${cell.row + 1}, kolom ${cell.col + 1}`}
      keyboard={{ activeCell: active, onActiveCellChange: setActive, onKey }}
      ariaLabel="Getallen"
    />
  );
}

describe('Grid with keyboard', () => {
  const selected = () =>
    screen.getAllByRole('gridcell').find((c) => c.getAttribute('aria-selected') === 'true');

  it('is a focusable grid whose active cell moves with the arrow keys', () => {
    render(<KeyboardGrid onKey={() => false} />);
    const grid = screen.getByRole('grid', { name: 'Getallen' });
    expect(grid).toHaveAttribute('tabindex', '0');
    expect(screen.getAllByRole('gridcell')).toHaveLength(6);

    fireEvent.keyDown(grid, { key: 'ArrowRight' });
    expect(selected()).toHaveAccessibleName('rij 1, kolom 2');
    expect(grid).toHaveAttribute('aria-activedescendant', selected()!.id);

    fireEvent.keyDown(grid, { key: 'ArrowDown' });
    fireEvent.keyDown(grid, { key: 'ArrowDown' });
    fireEvent.keyDown(grid, { key: 'ArrowRight' });
    fireEvent.keyDown(grid, { key: 'ArrowRight' });
    expect(selected()).toHaveAccessibleName('rij 2, kolom 3');
  });

  it('forwards other keys with the active cell', () => {
    const onKey = vi.fn(() => true);
    render(<KeyboardGrid onKey={onKey} />);
    const grid = screen.getByRole('grid');

    fireEvent.keyDown(grid, { key: '7' });
    expect(onKey).not.toHaveBeenCalled(); // first key only activates the top-left cell
    expect(selected()).toHaveAccessibleName('rij 1, kolom 1');

    fireEvent.keyDown(grid, { key: 'ArrowDown' });
    fireEvent.keyDown(grid, { key: '7' });
    expect(onKey).toHaveBeenCalledWith('7', { row: 1, col: 0 });
  });

  it('leaves Tab and modifier shortcuts to the page', () => {
    const onKey = vi.fn(() => true);
    render(<KeyboardGrid onKey={onKey} />);
    const grid = screen.getByRole('grid');

    fireEvent.keyDown(grid, { key: 'Tab' });
    expect(selected()).toBeUndefined();

    fireEvent.keyDown(grid, { key: 'ArrowRight' });
    fireEvent.keyDown(grid, { key: 'z', ctrlKey: true });
    fireEvent.keyDown(grid, { key: 'z', metaKey: true });
    expect(onKey).not.toHaveBeenCalled();
  });
});
