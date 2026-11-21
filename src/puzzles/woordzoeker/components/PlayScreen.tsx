import { useEffect, useMemo, useRef, useState } from 'react';

import { formatTime } from '@/shared/formatTime';
import { shareLink, type ShareOutcome } from '@/shared/share';

import type { SaveResult } from '../logic/savedPuzzles';
import { leftoverCells, type Line, matchWord } from '../logic/selection';
import type { FoundWord, PlayProgress, Puzzle } from '../logic/types';
import { HIGHLIGHT_COLORS, PlayGrid } from './PlayGrid';
import styles from './PlayScreen.module.css';
import { PrintSheet } from './PrintSheet';
import { useTimer } from './useTimer';

export interface CompletionResult {
  bestTimeMs: number;
  isRecord: boolean;
}

interface PlayScreenProps {
  puzzle: Puzzle;
  initialProgress?: PlayProgress;
  /** Set when the puzzle is saved on this device. */
  saved?: { id: string; bestTimeMs: number | null } | null;
  onProgress?: (progress: PlayProgress) => void;
  /** Saves the puzzle; when omitted no Opslaan button is shown. */
  onSave?: (progress: PlayProgress) => SaveResult;
  /** Called once when all words are found (not when reopening a finished puzzle). */
  onComplete?: (timeMs: number) => CompletionResult | null;
  /** Link that reproduces this puzzle; when set a Delen button is shown. */
  shareUrl?: string;
  onNew: () => void;
}

export function PlayScreen({
  puzzle,
  initialProgress,
  saved = null,
  onProgress,
  onSave,
  onComplete,
  shareUrl,
  onNew,
}: PlayScreenProps) {
  const [found, setFound] = useState<FoundWord[]>(initialProgress?.found ?? []);
  const [started, setStarted] = useState((initialProgress?.elapsedMs ?? 0) > 0);
  const total = puzzle.words.length;
  const complete = found.length >= total;
  const [elapsed, setElapsed] = useTimer(initialProgress?.elapsedMs ?? 0, started && !complete);
  const [lastMiss, setLastMiss] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [completion, setCompletion] = useState<CompletionResult | null>(null);
  const [shareOutcome, setShareOutcome] = useState<ShareOutcome | null>(null);
  const [printAnswers, setPrintAnswers] = useState(false);
  const wasComplete = useRef(complete);

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

  useEffect(() => {
    if (complete && !wasComplete.current) {
      wasComplete.current = true;
      setCompletion(onComplete?.(elapsed) ?? null);
    }
  }, [complete, elapsed, onComplete]);

  const save = () => {
    if (!onSave) return;
    const result = onSave({ found, elapsedMs: elapsed });
    setSaveError(result.ok ? null : result.reason);
  };

  const bestTimeMs = completion?.bestTimeMs ?? saved?.bestTimeMs ?? null;

  const share = async () => {
    if (!shareUrl) return;
    const text = complete
      ? `Ik vond alle woorden in ${formatTime(elapsed)}. Kun jij het sneller?`
      : 'Kun jij alle woorden vinden?';
    setShareOutcome(await shareLink({ title: 'Woordzoeker – PuzzleFest', text, url: shareUrl }));
  };

  const shareButton = shareUrl && (
    <button type="button" className="btn btn-secondary" onClick={share}>
      Delen
    </button>
  );

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
    setCompletion(null);
    wasComplete.current = false;
  };

  const saveButton = onSave && (
    <button type="button" className="btn btn-secondary" onClick={save} disabled={saved !== null}>
      {saved ? '✓ Opgeslagen' : 'Opslaan'}
    </button>
  );

  const sortedWords = [...puzzle.words].sort((a, b) => a.display.localeCompare(b.display, 'nl'));

  return (
    <>
      <div className={`${styles.screen} no-print`}>
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
            {completion?.isRecord && saved && <p className={styles.record}>🏆 Nieuw record!</p>}
            {bestTimeMs !== null && saved && (
              <p>
                Beste tijd: <strong>{formatTime(bestTimeMs)}</strong>
              </p>
            )}
            {!saved && onSave && (
              <p className={styles.hint}>Sla de puzzel op om je beste tijd te bewaren.</p>
            )}
            <div className={styles.buttons}>
              {!saved && saveButton}
              {shareButton}
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

        {shareOutcome === 'copied' && (
          <p className={styles.notice} role="status">
            Link gekopieerd! Plak hem in een bericht.
          </p>
        )}
        {shareOutcome === 'manual' && shareUrl && (
          <div className={styles.manualShare}>
            <label htmlFor="ws-share-url">Kopieer deze link:</label>
            <input
              id="ws-share-url"
              className="text-input"
              readOnly
              value={shareUrl}
              onFocus={(e) => e.currentTarget.select()}
            />
          </div>
        )}

        {saveError && (
          <p className={styles.error} role="alert">
            {saveError}
          </p>
        )}

        {!complete && (
          <div className={styles.buttons}>
            {saveButton}
            {shareButton}
            <button type="button" className="btn btn-link" onClick={onNew}>
              Nieuwe puzzel
            </button>
          </div>
        )}
        <div className={styles.print}>
          <label className={styles.printOption}>
            <input
              type="checkbox"
              checked={printAnswers}
              onChange={(e) => setPrintAnswers(e.target.checked)}
            />
            Met antwoorden
          </label>
          <button type="button" className="btn btn-link" onClick={() => window.print()}>
            🖨 Afdrukken
          </button>
        </div>
      </div>
      <PrintSheet puzzle={puzzle} withAnswers={printAnswers} />
    </>
  );
}
