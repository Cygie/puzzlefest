import type { WoordslangPuzzle } from '../logic/types';
import { puzzleStatus } from '../logic/progress';
import styles from './Woordslang.module.css';

interface PuzzleListScreenProps {
  puzzles: readonly WoordslangPuzzle[];
  notice?: string | null;
  onOpen: (puzzle: WoordslangPuzzle) => void;
}

export function PuzzleListScreen({ puzzles, notice, onOpen }: PuzzleListScreenProps) {
  return (
    <div className={styles.screen}>
      <h1 className={styles.title}>Woordslang</h1>
      <p className={styles.intro}>
        Vind alle woorden van het thema. Ze slingeren door het raster en vullen samen elk vakje. Het
        sleutelwoord loopt van rand tot rand.
      </p>
      {notice && (
        <p className={styles.notice} role="alert">
          {notice}
        </p>
      )}
      <ul className={styles.list} aria-label="Puzzels">
        {puzzles.map((puzzle) => {
          const status = puzzleStatus(puzzle);
          return (
            <li key={puzzle.id}>
              <button type="button" className={styles.card} onClick={() => onOpen(puzzle)}>
                <span className={styles.cardTitle}>
                  {status.kind === 'solved' ? puzzle.theme : `“${puzzle.hint}”`}
                </span>
                <span className={styles.cardText}>
                  {puzzle.width} × {puzzle.height}
                  {status.kind === 'solved' && ' · ✓ Opgelost'}
                  {status.kind === 'busy' && ` · Bezig: ${status.found} van ${status.total}`}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
