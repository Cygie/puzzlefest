import { puzzleStatus } from '../logic/progress';
import { type GetallenpadPuzzle, LEVEL_LABELS, LEVELS } from '../logic/types';
import styles from './Getallenpad.module.css';

interface PuzzleListScreenProps {
  puzzles: readonly GetallenpadPuzzle[];
  notice?: string | null;
  onOpen: (puzzle: GetallenpadPuzzle) => void;
}

export function PuzzleListScreen({ puzzles, notice, onOpen }: PuzzleListScreenProps) {
  return (
    <div className={styles.screen}>
      <h1 className={styles.title}>Getallenpad</h1>
      <p className={styles.intro}>
        Vul het raster met de getallen 1 tot het laatste getal. Elk volgend getal staat in een vakje
        dat het vorige raakt, ook schuin. Zo ontstaat één pad door alle vakjes.
      </p>
      {notice && (
        <p className={styles.notice} role="alert">
          {notice}
        </p>
      )}
      {LEVELS.map((level) => {
        const ofLevel = puzzles.filter((p) => p.level === level);
        if (ofLevel.length === 0) return null;
        const headingId = `gp-niveau-${level}`;
        return (
          <section key={level} className={styles.group} aria-labelledby={headingId}>
            <h2 id={headingId} className={styles.groupTitle}>
              {LEVEL_LABELS[level]}
            </h2>
            <ul className={styles.list} aria-labelledby={headingId}>
              {ofLevel.map((puzzle, i) => {
                const status = puzzleStatus(puzzle);
                return (
                  <li key={puzzle.id}>
                    <button type="button" className={styles.card} onClick={() => onOpen(puzzle)}>
                      <span className={styles.cardTitle}>Puzzel {i + 1}</span>
                      <span className={styles.cardText}>
                        {puzzle.width} × {puzzle.height}
                        {status.kind === 'solved' && ' · ✓ Opgelost'}
                        {status.kind === 'busy' &&
                          ` · Bezig: ${status.filled} van ${status.open} ingevuld`}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
