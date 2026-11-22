import { useEffect, useMemo, useRef, useState } from 'react';

import type { Cell } from '@/shared/grid/cells';
import { type GridStroke, LetterGrid } from '@/shared/grid/LetterGrid';
import { usePathSelection } from '@/shared/grid/usePathSelection';

import { KEY_COLOR, WORD_COLORS } from '../colors';
import { isSolved, matchSelection } from '../logic/matchSelection';
import { loadFound, saveFound } from '../logic/progress';
import type { WoordslangPuzzle } from '../logic/types';
import styles from './Woordslang.module.css';

/** How long a feedback message stays visible. */
export const MESSAGE_MS = 3_000;

const MESSAGES = {
  already: 'Dat woord heb je al gevonden.',
  elsewhere: 'Dat woord hoort erbij, maar ligt ergens anders.',
  none: 'Geen woord van dit thema.',
} as const;

interface SlangPlayScreenProps {
  puzzle: WoordslangPuzzle;
  onBack: () => void;
}

export function SlangPlayScreen({ puzzle, onBack }: SlangPlayScreenProps) {
  /** Found words (letters), in the order they were found. */
  const [found, setFound] = useState<string[]>(() => loadFound(puzzle));
  const [message, setMessage] = useState<string | null>(null);
  const messageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const foundSet = useMemo(() => new Set(found), [found]);
  const solved = isSolved(puzzle, foundSet);
  const total = puzzle.words.length;

  useEffect(
    () => () => {
      if (messageTimer.current) clearTimeout(messageTimer.current);
    },
    [],
  );

  const show = (text: string | null) => {
    if (messageTimer.current) clearTimeout(messageTimer.current);
    setMessage(text);
    if (text) messageTimer.current = setTimeout(() => setMessage(null), MESSAGE_MS);
  };

  const update = (next: string[]) => {
    setFound(next);
    saveFound(puzzle.id, next);
  };

  const select = (path: Cell[]) => {
    const match = matchSelection(puzzle, path, foundSet);
    if (match.kind === 'ignore') return;
    if (match.kind === 'found') {
      show(null);
      update([...found, match.word.letters]);
      return;
    }
    show(MESSAGES[match.kind]);
  };

  const controller = usePathSelection(select);

  const colorOf = useMemo(() => {
    const colors = new Map<string, string>();
    let next = 0;
    for (const letters of found) {
      const word = puzzle.words.find((w) => w.letters === letters);
      colors.set(letters, word?.key ? KEY_COLOR : WORD_COLORS[next++ % WORD_COLORS.length]!);
    }
    return colors;
  }, [found, puzzle]);

  const strokes: GridStroke[] = found.flatMap((letters) => {
    const word = puzzle.words.find((w) => w.letters === letters);
    return word ? [{ key: letters, cells: word.path, color: colorOf.get(letters)! }] : [];
  });

  const foundWords = found.flatMap((letters) => puzzle.words.filter((w) => w.letters === letters));

  return (
    <div className={styles.screen}>
      <div className={styles.titleRow}>
        <button type="button" className="btn btn-link" onClick={onBack}>
          ← Alle puzzels
        </button>
      </div>
      <p className={styles.hint}>
        Hint: <strong>{puzzle.hint}</strong>
      </p>
      <p className={styles.count} aria-live="polite">
        {found.length} van {total} woorden gevonden
      </p>

      <div
        className={styles.board}
        style={{ maxWidth: `calc(62vh * ${puzzle.width} / ${puzzle.height})` }}
      >
        <LetterGrid
          rows={puzzle.grid}
          width={puzzle.width}
          height={puzzle.height}
          controller={controller}
          strokes={strokes}
          disabled={solved}
          ariaLabel="Woordslang: sleep over aangrenzende letters of tik ze één voor één aan"
          testId="slang-grid"
        />
      </div>

      <p className={styles.feedback} aria-live="polite">
        {message ?? ' '}
      </p>

      {solved && (
        <section className={styles.complete} aria-labelledby="wsl-klaar">
          <h2 id="wsl-klaar">Opgelost!</h2>
          <p>
            Het thema was: <strong>{puzzle.theme}</strong>.
          </p>
          <div className={styles.buttons}>
            <button type="button" className="btn btn-secondary" onClick={() => update([])}>
              Opnieuw spelen
            </button>
            <button type="button" className="btn btn-primary" onClick={onBack}>
              Andere puzzel
            </button>
          </div>
        </section>
      )}

      {foundWords.length > 0 && (
        <ul className={styles.chips} aria-label="Gevonden woorden">
          {foundWords.map((word) => (
            <li
              key={word.letters}
              className={styles.chip}
              style={{ background: colorOf.get(word.letters) }}
            >
              {word.display}
              {word.key && <span className={styles.keyTag}> · sleutelwoord</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
