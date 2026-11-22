import { type KeyboardEvent, type PointerEvent, type ReactNode, useId, useRef } from 'react';

import { type Cell, cellFromPoint, cellNearPoint, type Rect } from './cells';
import styles from './Grid.module.css';

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

/** Keyboard support: a roving active cell moved with the arrow keys. */
export interface GridKeyboard {
  activeCell: Cell | null;
  onActiveCellChange: (cell: Cell) => void;
  /**
   * Any other key pressed while a cell is active (not Tab, not with Ctrl/⌘/Alt).
   * Return true when it was handled.
   */
  onKey: (key: string, cell: Cell) => boolean;
}

export interface GridProps {
  width: number;
  height: number;
  controller: GridController;
  /** Content of one cell (letter, number, …). */
  renderCell: (cell: Cell, index: number) => ReactNode;
  /** Extra class for one cell (e.g. given, error); combined with the base cell class. */
  cellClassName?: (cell: Cell, index: number) => string | undefined;
  /** Accessible label of one cell (keyboard mode only). */
  cellLabel?: (cell: Cell, index: number) => string;
  strokes?: readonly GridStroke[];
  keyboard?: GridKeyboard;
  disabled?: boolean;
  onFirstTouch?: () => void;
  ariaLabel: string;
  testId?: string;
}

const ARROWS: Record<string, [number, number]> = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
};

/** A puzzle grid with drawn strokes, pointer (mouse/touch) selection and optional keyboard. */
export function Grid({
  width,
  height,
  controller,
  renderCell,
  cellClassName,
  cellLabel,
  strokes = [],
  keyboard,
  disabled = false,
  onFirstTouch,
  ariaLabel,
  testId = 'grid',
}: GridProps) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const idPrefix = useId();

  const rect = (): Rect | null => ref.current?.getBoundingClientRect() ?? null;

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    const box = rect();
    const cell = box && cellFromPoint(event.clientX, event.clientY, box, width, height);
    if (!cell) return;
    event.preventDefault();
    if (keyboard) ref.current?.focus({ preventScroll: true });
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

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!keyboard || disabled) return;
    // Leave Tab and shortcuts (Ctrl/⌘/Alt + key, e.g. undo) to the page.
    if (event.key === 'Tab' || event.ctrlKey || event.metaKey || event.altKey) return;
    const active = keyboard.activeCell ?? { row: 0, col: 0 };
    const arrow = ARROWS[event.key];
    if (arrow) {
      event.preventDefault();
      keyboard.onActiveCellChange({
        row: Math.min(height - 1, Math.max(0, active.row + arrow[0])),
        col: Math.min(width - 1, Math.max(0, active.col + arrow[1])),
      });
      return;
    }
    if (!keyboard.activeCell) {
      keyboard.onActiveCellChange(active);
      return;
    }
    if (keyboard.onKey(event.key, active)) event.preventDefault();
  };

  const cellId = (index: number) => `${idPrefix}-cell-${index}`;
  const active = keyboard?.activeCell;
  const activeIndex = active ? active.row * width + active.col : -1;

  const cells: ReactNode[] = [];
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const cell = { row, col };
      const index = row * width + col;
      const classes = [styles.cell, cellClassName?.(cell, index)];
      if (index === activeIndex) classes.push(styles.cellActive);
      cells.push(
        <span
          key={index}
          id={keyboard ? cellId(index) : undefined}
          role={keyboard ? 'gridcell' : undefined}
          aria-label={keyboard ? cellLabel?.(cell, index) : undefined}
          aria-selected={keyboard ? index === activeIndex : undefined}
          className={classes.filter(Boolean).join(' ')}
        >
          {renderCell(cell, index)}
        </span>,
      );
    }
  }

  return (
    <div
      ref={ref}
      className={styles.board}
      // Fit tall grids on screen: limit width so the height stays within ~70% of the viewport.
      style={{
        aspectRatio: `${width} / ${height}`,
        maxWidth: `min(100%, calc(70dvh * ${width} / ${height}))`,
      }}
      tabIndex={keyboard && !disabled ? 0 : undefined}
      role={keyboard ? 'grid' : undefined}
      aria-label={keyboard ? ariaLabel : undefined}
      aria-activedescendant={keyboard && activeIndex >= 0 ? cellId(activeIndex) : undefined}
      onKeyDown={keyboard ? onKeyDown : undefined}
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
        className={styles.cells}
        style={{
          gridTemplateColumns: `repeat(${width}, 1fr)`,
          gridTemplateRows: `repeat(${height}, 1fr)`,
          fontSize: `calc(100cqi / ${width} * 0.55)`,
        }}
        role={keyboard ? 'presentation' : 'img'}
        aria-label={keyboard ? undefined : ariaLabel}
      >
        {cells}
      </div>
    </div>
  );
}

interface StrokeProps {
  cells: readonly Cell[];
  color: string;
  current?: boolean;
}

/** A path drawn through its cell centres; a single cell shows as a dot. */
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
