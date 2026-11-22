import { cellIndex, type Cell } from './cells';
import { Grid, type GridController, type GridStroke } from './Grid';
import styles from './Grid.module.css';

export type { GridController, GridStroke } from './Grid';

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
  highlightCells = [],
  testId = 'letter-grid',
  ...rest
}: LetterGridProps) {
  const highlighted = new Set(highlightCells.map((c) => cellIndex(c, rest.width)));
  return (
    <Grid
      {...rest}
      testId={testId}
      renderCell={(cell) => rows[cell.row]?.[cell.col] ?? ''}
      cellClassName={(_, index) => (highlighted.has(index) ? styles.cellHighlighted : undefined)}
    />
  );
}
