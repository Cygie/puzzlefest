import { type PointerEvent, useRef, useState } from 'react';

import type { Cell } from '../logic/directions';
import { cellFromPoint, type FoundWord, type Line, sameCell, snapLine } from '../logic/selection';
import type { Puzzle } from '../logic/types';
import styles from './PlayGrid.module.css';

/** Marker colours for found words (cycled). */
export const HIGHLIGHT_COLORS = ['#ffb703', '#8ecae6', '#90be6d', '#f28482', '#cdb4db', '#f4a261'];

interface PlayGridProps {
  puzzle: Puzzle;
  found: readonly FoundWord[];
  /** Cells to emphasise (e.g. the solution letters after completion). */
  highlightCells?: readonly Cell[];
  disabled?: boolean;
  onFirstTouch?: () => void;
  onSelect: (line: Line) => void;
}

interface Drag {
  start: Cell;
  end: Cell;
}

export function PlayGrid({
  puzzle,
  found,
  highlightCells = [],
  disabled = false,
  onFirstTouch,
  onSelect,
}: PlayGridProps) {
  const { width, height } = puzzle;
  const ref = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [tapStart, setTapStart] = useState<Cell | null>(null);

  const cellAt = (event: PointerEvent, clamp: boolean) => {
    const rect = ref.current?.getBoundingClientRect();
    return rect ? cellFromPoint(event.clientX, event.clientY, rect, width, height, clamp) : null;
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    const cell = cellAt(event, false);
    if (!cell) return;
    event.preventDefault();
    try {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {
      // Pointer capture is optional (unsupported in some test environments).
    }
    onFirstTouch?.();
    setDrag({ start: cell, end: cell });
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    const cell = cellAt(event, true);
    if (cell && !sameCell(cell, drag.end)) setDrag({ start: drag.start, end: cell });
  };

  const onPointerUp = () => {
    if (!drag) return;
    const { start, end } = drag;
    setDrag(null);

    if (!sameCell(start, end)) {
      // Swipe
      setTapStart(null);
      onSelect(snapLine(start, end, width, height));
    } else if (!tapStart) {
      // First tap: remember the start cell
      setTapStart(start);
    } else if (sameCell(tapStart, start)) {
      // Tapping the start cell again cancels
      setTapStart(null);
    } else {
      // Second tap: select from the first tapped cell
      setTapStart(null);
      onSelect(snapLine(tapStart, start, width, height));
    }
  };

  const preview: Line | null = drag
    ? snapLine(drag.start, drag.end, width, height)
    : tapStart
      ? { cells: [tapStart], direction: null }
      : null;

  const highlighted = new Set(highlightCells.map((c) => c.row * width + c.col));

  return (
    <div
      ref={ref}
      className={styles.board}
      // Fit tall grids on screen: limit width so the height stays within ~70% of the viewport.
      style={{
        aspectRatio: `${width} / ${height}`,
        maxWidth: `min(100%, calc(70dvh * ${width} / ${height}))`,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => setDrag(null)}
      data-testid="play-grid"
    >
      <svg
        className={styles.overlay}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {found.map((f, i) => (
          <Stroke
            key={f.letters}
            from={f.start}
            to={f.end}
            color={HIGHLIGHT_COLORS[i % HIGHLIGHT_COLORS.length] ?? '#ffb703'}
          />
        ))}
        {preview && (
          <Stroke
            from={preview.cells[0]!}
            to={preview.cells[preview.cells.length - 1]!}
            color="var(--color-primary)"
            current
          />
        )}
      </svg>
      <div
        className={styles.letters}
        style={{
          gridTemplateColumns: `repeat(${width}, 1fr)`,
          gridTemplateRows: `repeat(${height}, 1fr)`,
          fontSize: `calc(100cqi / ${width} * 0.55)`,
        }}
        role="img"
        aria-label={`Woordzoeker van ${width} bij ${height} letters`}
      >
        {puzzle.grid.flatMap((row, r) =>
          row.split('').map((letter, c) => (
            <span
              key={`${r}-${c}`}
              className={highlighted.has(r * width + c) ? styles.cellHighlighted : styles.cell}
            >
              {letter}
            </span>
          )),
        )}
      </div>
    </div>
  );
}

interface StrokeProps {
  from: Cell;
  to: Cell;
  color: string;
  current?: boolean;
}

function Stroke({ from, to, color, current = false }: StrokeProps) {
  return (
    <line
      x1={from.col + 0.5}
      y1={from.row + 0.5}
      x2={to.col + 0.5}
      y2={to.row + 0.5}
      stroke={color}
      strokeWidth={0.78}
      strokeLinecap="round"
      opacity={current ? 0.35 : 0.55}
      data-current={current || undefined}
    />
  );
}
