import { type PointerEvent, useRef } from 'react';

import { type Cell, cellFromPoint, cellIndex, cellNearPoint, type Rect } from './cells';
import styles from './LetterGrid.module.css';

/** Turns pointer gestures on the grid into a selection (line, path, …). */
export interface GridController {
  /** Cells of the selection in progress (drawn as a faint stroke). */
  preview: readonly Cell[] | null;
  start: (cell: Cell) => void;
  move: (cell: Cell) => void;
  end: () => void;
  cancel: () => void;
  /**
   * While dragging, only pick up a cell when the pointer is this close to its centre
   * (fraction of a cell). Omit to use the nearest cell, clamped to the grid.
   */
  moveRadius?: number;
}

export interface GridStroke {
  key: string;
  cells: readonly Cell[];
  color: string;
}

interface LetterGridProps {
  rows: readonly string[];
  width: number;
  height: number;
  controller: GridController;
  strokes?: readonly GridStroke[];
  /** Cells to emphasise (e.g. solution letters). */
  highlightCells?: readonly Cell[];
  disabled?: boolean;
  onFirstTouch?: () => void;
  ariaLabel: string;
  testId?: string;
}

/** A letter grid with drawn word strokes and pointer (mouse/touch) selection. */
export function LetterGrid({
  rows,
  width,
  height,
  controller,
  strokes = [],
  highlightCells = [],
  disabled = false,
  onFirstTouch,
  ariaLabel,
  testId = 'letter-grid',
}: LetterGridProps) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const rect = (): Rect | null => ref.current?.getBoundingClientRect() ?? null;

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    const box = rect();
    const cell = box && cellFromPoint(event.clientX, event.clientY, box, width, height);
    if (!cell) return;
    event.preventDefault();
    try {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {
      // Pointer capture is optional (unsupported in some test environments).
    }
    dragging.current = true;
    onFirstTouch?.();
    controller.start(cell);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const box = rect();
    if (!box) return;
    const { moveRadius } = controller;
    const cell =
      moveRadius === undefined
        ? cellFromPoint(event.clientX, event.clientY, box, width, height, true)
        : cellNearPoint(event.clientX, event.clientY, box, width, height, moveRadius);
    if (cell) controller.move(cell);
  };

  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    controller.end();
  };

  const onPointerCancel = () => {
    dragging.current = false;
    controller.cancel();
  };

  const highlighted = new Set(highlightCells.map((c) => cellIndex(c, width)));

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
      onPointerCancel={onPointerCancel}
      data-testid={testId}
    >
      <svg
        className={styles.overlay}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {strokes.map((stroke) => (
          <Stroke key={stroke.key} cells={stroke.cells} color={stroke.color} />
        ))}
        {controller.preview && controller.preview.length > 0 && (
          <Stroke cells={controller.preview} color="var(--color-primary)" current />
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
        aria-label={ariaLabel}
      >
        {rows.flatMap((row, r) =>
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
  cells: readonly Cell[];
  color: string;
  current?: boolean;
}

/** A word drawn through its cell centres; a single cell shows as a dot. */
function Stroke({ cells, color, current = false }: StrokeProps) {
  const points = cells.map((c) => `${c.col + 0.5},${c.row + 0.5}`);
  if (points.length === 1) points.push(points[0]!);
  return (
    <polyline
      points={points.join(' ')}
      fill="none"
      stroke={color}
      strokeWidth={0.78}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={current ? 0.35 : 0.55}
      data-current={current || undefined}
      data-testid={current ? undefined : 'word-stroke'}
    />
  );
}
