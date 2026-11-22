import { useEffect, useRef, useState } from 'react';

import type { Cell } from '@/shared/grid/cells';
import { Grid, type GridStroke } from '@/shared/grid/Grid';

import { cellCount } from '../logic/model';
import {
  applyDrag,
  boardValues,
  type DragError,
  type DragErrorCode,
  findErrors,
  isSolved,
  pathRuns,
  setEntry,
  undo,
} from '../logic/play';
import { loadProgress, saveProgress } from '../logic/progress';
import { type GetallenpadPuzzle, LEVEL_LABELS, type PlayerState } from '../logic/types';
import styles from './Getallenpad.module.css';
import { useNumberDrag } from './useNumberDrag';

/** Two digits typed within this time form one number (e.g. 1, 2 → 12). */
export const TYPE_WINDOW_MS = 1000;

const PATH_COLOR = 'var(--color-accent)';

const rejectMessage = (code: DragErrorCode, n: number) =>
  ({
    'given-collision': 'Daar staat al een ander getal.',
    'out-of-range': `Zo kom je buiten 1 tot ${n}.`,
    'no-start': 'Begin met slepen op een vakje met een getal.',
  })[code];

interface PadPlayScreenProps {
  puzzle: GetallenpadPuzzle;
  onBack: () => void;
}

export function PadPlayScreen({ puzzle, onBack }: PadPlayScreenProps) {
  const n = cellCount(puzzle);
  const [state, setState] = useState<PlayerState>(() => loadProgress(puzzle));
  const [active, setActive] = useState<Cell | null>(null);
  const [rejected, setRejected] = useState<DragError | null>(null);
  // Digits typed into one cell: the state before the first digit, so 1 → 12 is one change.
  const typed = useRef<{ index: number; text: string; at: number; base: PlayerState } | null>(null);

  const solved = isSolved(puzzle, state);

  useEffect(() => {
    saveProgress(puzzle.id, state.entries);
  }, [puzzle.id, state.entries]);

  useEffect(() => {
    if (solved) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        typed.current = null;
        setRejected(null);
        setState(undo);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [solved]);

  const change = (next: PlayerState) => {
    setRejected(null);
    setState(next);
  };

  const controller = useNumberDrag({
    onDrag: (path) => {
      typed.current = null;
      const result = applyDrag(puzzle, state, path);
      if (result.ok) change(result.value);
      else setRejected(result.error);
    },
    onTap: (cell) => {
      typed.current = null;
      setActive(cell);
    },
  });

  const onKey = (key: string, cell: Cell): boolean => {
    const index = cell.row * puzzle.width + cell.col;
    if (/^\d$/.test(key)) {
      const now = Date.now();
      const prev = typed.current;
      const going =
        prev &&
        prev.index === index &&
        now - prev.at < TYPE_WINDOW_MS &&
        Number(prev.text + key) <= n;
      const text = going ? prev.text + key : key;
      const base = going ? prev.base : state;
      typed.current = { index, text, at: now, base };
      if (Number(text) >= 1) change(setEntry(puzzle, base, cell, Number(text)));
      return true;
    }
    if (key === 'Backspace' || key === 'Delete') {
      typed.current = null;
      change(setEntry(puzzle, state, cell, null));
      return true;
    }
    return false;
  };

  // While dragging, show the numbers the drag would place.
  const previewPath = controller.preview;
  const preview = previewPath ? applyDrag(puzzle, state, previewPath) : null;
  const values = boardValues(puzzle, preview?.ok ? preview.value : state);
  const errors = findErrors(puzzle, state);
  const strokes: GridStroke[] = pathRuns(puzzle, state).map((cells, i) => ({
    key: `run-${i}`,
    cells,
    color: PATH_COLOR,
  }));
  const givens = puzzle.givens.flat();
  const isGiven = (index: number) => givens[index] !== null;
  const rejectedIndex = rejected ? rejected.cell.row * puzzle.width + rejected.cell.col : -1;
  const filled = values.filter((v) => v !== null).length;

  return (
    <div className={styles.screen}>
      <div className={styles.titleRow}>
        <button type="button" className="btn btn-link" onClick={onBack}>
          ← Alle puzzels
        </button>
      </div>
      <p className={styles.count} aria-live="polite">
        {LEVEL_LABELS[puzzle.level]} · {puzzle.width} × {puzzle.height} · {filled} van {n} vakjes
        gevuld
      </p>

      <div
        className={styles.board}
        style={{ maxWidth: `calc(62vh * ${puzzle.width} / ${puzzle.height})` }}
      >
        <Grid
          width={puzzle.width}
          height={puzzle.height}
          controller={controller}
          strokes={strokes}
          renderCell={(_, index) => values[index] ?? ''}
          cellClassName={(_, index) =>
            [
              isGiven(index) ? styles.given : styles.entered,
              errors.has(index) && styles.error,
              index === rejectedIndex && styles.rejected,
            ]
              .filter(Boolean)
              .join(' ')
          }
          cellLabel={({ row, col }, index) =>
            `Rij ${row + 1}, kolom ${col + 1}: ${values[index] ?? 'leeg'}` +
            (isGiven(index) ? ' (gegeven)' : '') +
            (errors.has(index) ? ' (fout)' : '')
          }
          keyboard={{
            activeCell: active,
            onActiveCellChange: (cell) => {
              typed.current = null;
              setActive(cell);
            },
            onKey,
          }}
          disabled={solved}
          ariaLabel={`Getallenpad: sleep vanaf een getal over lege vakjes, of kies een vakje en typ een getal van 1 tot ${n}`}
          testId="pad-grid"
        />
      </div>

      <p className={styles.feedback} aria-live="polite">
        {rejected ? rejectMessage(rejected.code, n) : errors.size > 0 ? 'Er staat iets fout.' : ' '}
      </p>

      {!solved && (
        <div className={styles.buttons}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              typed.current = null;
              change(undo(state));
            }}
            disabled={state.history.length === 0}
            aria-keyshortcuts="Control+Z"
          >
            Ongedaan maken
          </button>
        </div>
      )}

      {solved && (
        <section className={styles.complete} aria-labelledby="gp-klaar">
          <h2 id="gp-klaar">Opgelost!</h2>
          <p>Alle getallen van 1 tot {n} vormen één pad.</p>
          <div className={styles.buttons}>
            <button type="button" className="btn btn-primary" onClick={onBack}>
              Naar alle puzzels
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
