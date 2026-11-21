import type { Puzzle } from '../logic/types';
import styles from './GridPreview.module.css';

interface GridPreviewProps {
  puzzle: Puzzle;
}

/** Read-only view of a generated puzzle (interactive play comes with play-ui). */
export function GridPreview({ puzzle }: GridPreviewProps) {
  return (
    <div className={styles.preview}>
      <div
        className={styles.grid}
        style={{ gridTemplateColumns: `repeat(${puzzle.width}, 1fr)` }}
        role="grid"
        aria-label={`Woordzoeker van ${puzzle.width} bij ${puzzle.height}`}
      >
        {puzzle.grid.map((row, r) => (
          <div key={r} role="row" className={styles.row}>
            {row.split('').map((letter, c) => (
              <span key={c} role="gridcell" className={styles.cell}>
                {letter}
              </span>
            ))}
          </div>
        ))}
      </div>
      <ul className={styles.words} aria-label="Te zoeken woorden">
        {[...puzzle.words]
          .sort((a, b) => a.display.localeCompare(b.display, 'nl'))
          .map((word) => (
            <li key={word.letters}>{word.display}</li>
          ))}
      </ul>
    </div>
  );
}
