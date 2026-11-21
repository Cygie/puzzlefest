import { useEffect, useMemo, useState } from 'react';

import { formatTime } from '@/shared/formatTime';

import { type FoundWord, leftoverCells, type Line, matchWord } from '../logic/selection';
import type { Puzzle } from '../logic/types';
import { HIGHLIGHT_COLORS, PlayGrid } from './PlayGrid';
import styles from './PlayScreen.module.css';
import { useTimer } from './useTimer';

export interface PlayProgress {
  found: FoundWord[];
  elapsedMs: number;
}

interface PlayScreenProps {
  puzzle: Puzzle;
  initialProgress?: PlayProgress;
  onProgress?: (progress: PlayProgress) => void;
  onNew: () => void;
}

export function PlayScreen({ puzzle, initialProgress, onProgress, onNew }: PlayScreenProps) {
  const [found, setFound] = useState<FoundWord[]>(initialProgress?.found ?? []);
  const [started, setStarted] = useState((initialProgress?.elapsedMs ?? 0) > 0);
  const total = puzzle.words.length;
  const complete = found.length >= total;
  const [elapsed, setElapsed] = useTimer(initialProgress?.elapsedMs ?? 0, started && !complete);
  const [lastMiss, setLastMiss] = useState(false);

  const foundSet = useMemo(() => new Set(found.map((f) => f.letters)), [found]);
  const colorOf = useMemo(
    () => new Map(found.map((f, i) => [f.letters, HIGHLIGHT_COLORS[i % HIGHLIGHT_COLORS.length]])),
    [found],
  );
  const solutionCells = useMemo(
    () => (complete && puzzle.solution ? leftoverCells(puzzle) : []),
    [complete, puzzle],
  );

  useEffect(() => {
    onProgress?.({ found, elapsedMs: elapsed });
  }, [found, elapsed, onProgress]);

  const select = (line: Line) => {
    const word = matchWord(puzzle, line, foundSet);
    if (!word) {
      setLastMiss(line.cells.length > 1);
      return;
    }
    setLastMiss(false);
    setFound((current) => [
      ...current,
      { letters: word.letters, start: line.cells[0]!, end: line.cells[line.cells.length - 1]! },
    ]);
  };

  const restart = () => {
    setFound([]);
    setElapsed(0);
    setStarted(false);
    setLastMiss(false);
  };

  const sortedWords = [...puzzle.words].sort((a, b) => a.display.localeCompare(b.display, 'nl'));

  return (
    <div className={styles.screen}>
      <div className={styles.statusBar}>
        <span aria-live="polite">
          Gevonden{' '}
          <strong>
            {found.length} / {total}
          </strong>
        </span>
        <span className={styles.timer} aria-label={`Tijd ${formatTime(elapsed)}`}>
          ⏱ {formatTime(elapsed)}
        </span>
      </div>

      <PlayGrid
        puzzle={puzzle}
        found={found}
        highlightCells={solutionCells}
        disabled={complete}
        onFirstTouch={() => setStarted(true)}
        onSelect={select}
      />

      <p className={styles.feedback} aria-live="polite">
        {lastMiss ? 'Dat is geen woord uit de lijst. Probeer het nog eens!' : ' '}
      </p>

      {complete && (
        <section className={styles.complete} aria-labelledby="ws-klaar">
          <h2 id="ws-klaar">Gefeliciteerd!</h2>
          <p>
            Je vond alle {total} woorden in <strong>{formatTime(elapsed)}</strong>.
          </p>
          {puzzle.solution && (
            <p>
              De oplossing is:{' '}
              <strong className={styles.solution}>{puzzle.solution.display}</strong>
            </p>
          )}
          <div className={styles.buttons}>
            <button type="button" className="btn btn-secondary" onClick={restart}>
              Opnieuw
            </button>
            <button type="button" className="btn btn-primary" onClick={onNew}>
              Nieuwe puzzel
            </button>
          </div>
        </section>
      )}

      <ul className={styles.words} aria-label="Te zoeken woorden">
        {sortedWords.map((word) => {
          const isFound = foundSet.has(word.letters);
          return (
            <li
              key={word.letters}
              className={isFound ? styles.wordFound : styles.word}
              style={isFound ? { textDecorationColor: colorOf.get(word.letters) } : undefined}
            >
              {word.display}
              {isFound && <span className="visually-hidden"> (gevonden)</span>}
            </li>
          );
        })}
      </ul>

      {!complete && (
        <div className={styles.buttons}>
          <button type="button" className="btn btn-link" onClick={onNew}>
            Nieuwe puzzel
          </button>
        </div>
      )}
    </div>
  );
}
