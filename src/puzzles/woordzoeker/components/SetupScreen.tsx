import { useMemo, useRef, useState } from 'react';

import { NumberStepper } from '@/shared/NumberStepper';
import { createRng, randomSeed } from '@/shared/random';

import { getTheme } from '../data/themes';
import { generateGrid, MAX_SIZE, MIN_SIZE } from '../logic/generateGrid';
import { normalizeWordList } from '../logic/normalize';
import { solutionStatus, themeExtras, wordsFromTheme } from '../logic/setupSettings';
import type { Puzzle, UnplacedWord } from '../logic/types';
import { DifficultyPicker } from './DifficultyPicker';
import styles from './SetupScreen.module.css';
import { ThemePicker } from './ThemePicker';
import { useSetupSettings } from './useSetupSettings';
import { WordListEditor } from './WordListEditor';

interface SetupScreenProps {
  onGenerated: (puzzle: Puzzle) => void;
  /** Number of saved puzzles; the "Mijn puzzels" link is shown when `onShowSaved` is set. */
  savedCount?: number;
  onShowSaved?: () => void;
  /** Message shown at the top, e.g. for an invalid share link. */
  notice?: string | null;
}

/** Delay before generating, so the browser can show the busy button first. */
const BUSY_PAINT_MS = 30;

interface Failure {
  reason: string;
  unplaced: UnplacedWord[];
  partial?: Puzzle;
}

export function SetupScreen({
  onGenerated,
  savedCount = 0,
  onShowSaved,
  notice = null,
}: SetupScreenProps) {
  const [settings, update] = useSetupSettings();
  const [failure, setFailure] = useState<Failure | null>(null);
  const { width, height, difficulty, solution, themeId, words } = settings;

  const normalized = useMemo(() => normalizeWordList(words).words, [words]);
  // With a solution word the generator may top up the list with the rest of the theme.
  const theme = themeId === null ? undefined : getTheme(themeId);
  const hasSolution = solution.trim() !== '';
  const extras = useMemo(
    () => (theme && hasSolution ? themeExtras(theme, normalized, width, height) : []),
    [theme, hasSolution, normalized, width, height],
  );
  const status = solutionStatus(normalized, width, height, solution, extras);

  // The list as last filled from the theme; while untouched it may be refilled automatically.
  const themeFill = useRef<string[] | null>(null);

  const fillFromTheme = (id: string, forSolution = solution) => {
    const picked = getTheme(id);
    if (!picked) return;
    const next = wordsFromTheme(picked, {
      width,
      height,
      solution: forSolution,
      rng: createRng(randomSeed()),
    });
    themeFill.current = next;
    update({ themeId: id, words: next, solution: forSolution });
    setFailure(null);
  };

  const changeSolution = (next: string) => {
    // Adding or removing a solution word changes how many theme words suit the list.
    const toggled = (solution.trim() === '') !== (next.trim() === '');
    if (toggled && themeId !== null && words === themeFill.current) fillFromTheme(themeId, next);
    else update({ solution: next });
  };

  const selectTheme = (id: string | null) => {
    if (id === null) update({ themeId: null });
    else fillFromTheme(id);
  };

  const [busy, setBusy] = useState(false);

  const generate = () => {
    const input = {
      words: normalized,
      width,
      height,
      difficulty,
      solution,
      seed: randomSeed(),
      themeId: themeId ?? undefined,
      extraWords: extras,
    };
    setBusy(true);
    // Let the busy state paint first: an exact solution fit can take a moment.
    window.setTimeout(() => {
      const result = generateGrid(input);
      setBusy(false);
      if (result.ok) {
        setFailure(null);
        onGenerated(result.puzzle);
      } else {
        setFailure({ reason: result.reason, unplaced: result.unplaced, partial: result.partial });
      }
    }, BUSY_PAINT_MS);
  };

  return (
    <div className={styles.screen}>
      <div className={styles.titleRow}>
        <h1 className={styles.title}>Nieuwe woordzoeker</h1>
        {onShowSaved && (
          <button type="button" className="btn btn-link" onClick={onShowSaved}>
            Mijn puzzels ({savedCount})
          </button>
        )}
      </div>

      {notice && (
        <p className={styles.error} role="alert">
          {notice}
        </p>
      )}

      <section className={styles.section} aria-labelledby="ws-thema">
        <h2 id="ws-thema" className={styles.heading}>
          Thema
        </h2>
        <ThemePicker themeId={themeId} onSelect={selectTheme} />
        {themeId !== null && (
          <button type="button" className="btn btn-link" onClick={() => fillFromTheme(themeId)}>
            ↻ Andere woorden
          </button>
        )}
      </section>

      <section className={styles.section} aria-labelledby="ws-woorden">
        <h2 id="ws-woorden" className={styles.heading}>
          Woorden
        </h2>
        <WordListEditor
          words={words}
          maxLength={Math.max(width, height)}
          onChange={(next) => update({ words: next })}
        />
      </section>

      <section className={styles.section} aria-labelledby="ws-formaat">
        <h2 id="ws-formaat" className={styles.heading}>
          Formaat
        </h2>
        <div className={styles.sizeRow}>
          <NumberStepper
            label="Breedte"
            value={width}
            min={MIN_SIZE}
            max={MAX_SIZE}
            onChange={(value) => update({ width: value })}
          />
          <span className={styles.times} aria-hidden="true">
            ×
          </span>
          <NumberStepper
            label="Hoogte"
            value={height}
            min={MIN_SIZE}
            max={MAX_SIZE}
            onChange={(value) => update({ height: value })}
          />
        </div>
      </section>

      <section className={styles.section} aria-labelledby="ws-moeilijkheid">
        <h2 id="ws-moeilijkheid" className={styles.heading}>
          Moeilijkheid
        </h2>
        <DifficultyPicker value={difficulty} onChange={(value) => update({ difficulty: value })} />
      </section>

      <section className={styles.section} aria-labelledby="ws-oplossing">
        <h2 id="ws-oplossing" className={styles.heading}>
          Oplossingswoord <span className={styles.optional}>(optioneel)</span>
        </h2>
        <label htmlFor="ws-oplossing-input" className={styles.hint}>
          De letters die overblijven vormen samen dit woord of deze zin.
        </label>
        <input
          id="ws-oplossing-input"
          className="text-input"
          value={solution}
          onChange={(e) => changeSolution(e.target.value)}
          placeholder="Bijv. GOED GEDAAN"
          autoComplete="off"
        />
        {status.kind !== 'none' && (
          <p className={styles[status.kind]} aria-live="polite">
            {status.message}
          </p>
        )}
      </section>

      {failure && (
        <div className={styles.failure} role="alert">
          <p className={styles.failureReason}>{failure.reason}</p>
          {failure.unplaced.length > 0 && (
            <ul>
              {failure.unplaced.map((u) => (
                <li key={u.word.letters}>{u.reason}</li>
              ))}
            </ul>
          )}
          {failure.partial && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => failure.partial && onGenerated(failure.partial)}
            >
              {failure.unplaced.length > 0
                ? 'Doorgaan zonder deze woorden'
                : 'Doorgaan zonder oplossingswoord'}
            </button>
          )}
        </div>
      )}

      <div className={styles.actions}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={generate}
          disabled={normalized.length === 0 || busy}
          aria-busy={busy}
        >
          {busy ? 'Puzzel maken…' : 'Genereer'}
        </button>
      </div>
    </div>
  );
}
