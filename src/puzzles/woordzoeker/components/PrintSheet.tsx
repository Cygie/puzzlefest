import { getTheme } from '../data/themes';
import { wordCells } from '../logic/directions';
import { leftoverCells } from '../logic/selection';
import type { Puzzle } from '../logic/types';
import styles from './PrintSheet.module.css';

/** Printable area of A4 portrait with 15 mm margins, minus room for title and word list. */
const MAX_GRID_WIDTH_MM = 180;
const MAX_GRID_HEIGHT_MM = 175;

const DIFFICULTY_LABEL = { makkelijk: 'Makkelijk', normaal: 'Normaal', moeilijk: 'Moeilijk' };

interface PrintSheetProps {
  puzzle: Puzzle;
  withAnswers: boolean;
}

/** A4 print layout; hidden on screen, shown only when printing. */
export function PrintSheet({ puzzle, withAnswers }: PrintSheetProps) {
  const theme = puzzle.themeId ? getTheme(puzzle.themeId)?.naam : undefined;
  const subtitle = [theme, `${puzzle.width}×${puzzle.height}`, DIFFICULTY_LABEL[puzzle.difficulty]]
    .filter(Boolean)
    .join(' · ');
  const words = [...puzzle.words].sort((a, b) => a.display.localeCompare(b.display, 'nl'));

  return (
    <div className={styles.sheet} data-testid="print-sheet">
      <section className={styles.page}>
        <h1 className={styles.title}>Woordzoeker</h1>
        <p className={styles.subtitle}>{subtitle}</p>
        <PrintGrid puzzle={puzzle} />
        <h2 className={styles.heading}>Zoek deze woorden</h2>
        <ul className={styles.words} aria-label="Woordenlijst (afdruk)">
          {words.map((w) => (
            <li key={w.letters}>
              <span className={styles.checkbox} aria-hidden="true" />
              {w.display}
            </li>
          ))}
        </ul>
        {puzzle.solution && (
          <div className={styles.solution}>
            <span>Oplossing:</span>
            <span
              className={styles.blanks}
              aria-label={`${puzzle.solution.letters.length} letters`}
            >
              {Array.from(puzzle.solution.letters, (_, i) => (
                <span key={i} className={styles.blank} data-testid="solution-blank" />
              ))}
            </span>
          </div>
        )}
      </section>

      {withAnswers && (
        <section className={`${styles.page} ${styles.answers}`} data-testid="answer-page">
          <h1 className={styles.title}>Antwoorden</h1>
          <p className={styles.subtitle}>{subtitle}</p>
          <PrintGrid puzzle={puzzle} showAnswers />
          {puzzle.solution && (
            <p className={styles.answerSolution}>
              Oplossing: <strong>{puzzle.solution.display}</strong>
            </p>
          )}
        </section>
      )}
    </div>
  );
}

function PrintGrid({ puzzle, showAnswers = false }: { puzzle: Puzzle; showAnswers?: boolean }) {
  const { width, height } = puzzle;
  const cellMm = Math.min(MAX_GRID_WIDTH_MM / width, MAX_GRID_HEIGHT_MM / height, 12);
  const solution = new Set(
    showAnswers && puzzle.solution ? leftoverCells(puzzle).map((c) => c.row * width + c.col) : [],
  );

  return (
    <div
      className={styles.grid}
      style={{
        width: `${cellMm * width}mm`,
        height: `${cellMm * height}mm`,
        gridTemplateColumns: `repeat(${width}, 1fr)`,
        fontSize: `${cellMm * 0.55}mm`,
      }}
    >
      {puzzle.grid.flatMap((row, r) =>
        row.split('').map((letter, c) => (
          <span
            key={`${r}-${c}`}
            className={solution.has(r * width + c) ? styles.solutionCell : styles.cell}
          >
            {letter}
          </span>
        )),
      )}
      {showAnswers && (
        <svg
          className={styles.overlay}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {puzzle.words.map((w) => {
            const cells = wordCells(w.row, w.col, w.direction, w.length);
            const first = cells[0]!;
            const last = cells[cells.length - 1]!;
            return (
              <line
                key={w.letters}
                data-testid="answer-stroke"
                x1={first.col + 0.5}
                y1={first.row + 0.5}
                x2={last.col + 0.5}
                y2={last.row + 0.5}
                stroke="#000"
                strokeWidth={0.7}
                strokeLinecap="round"
                strokeOpacity={0.18}
              />
            );
          })}
        </svg>
      )}
    </div>
  );
}
