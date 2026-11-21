import type { Cell } from '@/shared/grid/cells';
import { LetterGrid } from '@/shared/grid/LetterGrid';

import type { FoundWord, Line } from '../logic/selection';
import type { Puzzle } from '../logic/types';
import { useLineSelection } from './useLineSelection';

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

/** Woordzoeker grid: the shared letter grid with straight-line selection. */
export function PlayGrid({
  puzzle,
  found,
  highlightCells = [],
  disabled = false,
  onFirstTouch,
  onSelect,
}: PlayGridProps) {
  const { width, height } = puzzle;
  const controller = useLineSelection(width, height, onSelect);

  return (
    <LetterGrid
      rows={puzzle.grid}
      width={width}
      height={height}
      controller={controller}
      strokes={found.map((f, i) => ({
        key: f.letters,
        cells: [f.start, f.end],
        color: HIGHLIGHT_COLORS[i % HIGHLIGHT_COLORS.length] ?? '#ffb703',
      }))}
      highlightCells={highlightCells}
      disabled={disabled}
      onFirstTouch={onFirstTouch}
      ariaLabel={`Woordzoeker van ${width} bij ${height} letters`}
      testId="play-grid"
    />
  );
}
