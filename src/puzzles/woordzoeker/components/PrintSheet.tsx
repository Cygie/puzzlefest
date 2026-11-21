import { getTheme } from '../data/themes';
import { wordCells } from '../logic/directions';
import { leftoverCells } from '../logic/selection';
import type { Puzzle } from '../logic/types';
import styles from './PrintSheet.module.css';

/**
 * Page budget in mm. 15 mm margins leave 180 × 267 mm on A4; the height budget is kept
 * below US Letter (249 mm) too, in case the print dialog uses another paper size.
 */
const PAGE_WIDTH_MM = 180;
const PAGE_HEIGHT_MM = 240;
const MAX_CELL_MM = 12;
// Approximate heights of the parts around the grid (see PrintSheet.module.css).
const HEADER_MM = 22; // title + subtitle
const LIST_HEADING_MM = 16;
const WORD_ROW_MM = 6.5; // one row of the 4-column word list
const WORD_COLUMNS = 4;
const SOLUTION_ROW_MM = 16;
const BLANKS_PER_ROW = 20;
const SAFETY_MM = 8;

/** Largest cell size (mm) so the whole page fits on one sheet. */
export function printCellSize(
  width: number,
  height: number,
  wordCount: number,
  solutionLength: number,
): number {
  const listRows = Math.ceil(wordCount / WORD_COLUMNS);
  const solutionRows = solutionLength > 0 ? Math.ceil((solutionLength + 2) / BLANKS_PER_ROW) : 0;
  const reserved =
    HEADER_MM +
    (wordCount > 0 ? LIST_HEADING_MM + listRows * WORD_ROW_MM : 0) +
    solutionRows * SOLUTION_ROW_MM +
    SAFETY_MM;
  const gridHeight = PAGE_HEIGHT_MM - reserved;
  return Math.min(PAGE_WIDTH_MM / width, gridHeight / height, MAX_CELL_MM);
}

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
        <PrintGrid
          puzzle={puzzle}
          cellMm={printCellSize(
            puzzle.width,
            puzzle.height,
            words.length,
            puzzle.solution?.letters.length ?? 0,
          )}
        />
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
          <PrintGrid
            puzzle={puzzle}
            cellMm={printCellSize(puzzle.width, puzzle.height, 0, puzzle.solution ? 1 : 0)}
            showAnswers
          />
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

interface PrintGridProps {
  puzzle: Puzzle;
  cellMm: number;
  showAnswers?: boolean;
}

function PrintGrid({ puzzle, cellMm, showAnswers = false }: PrintGridProps) {
  const { width, height } = puzzle;
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
