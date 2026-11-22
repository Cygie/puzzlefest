import { useEffect, useMemo, useRef, useState } from 'react';

import { NumberStepper } from '@/shared/NumberStepper';
import { randomSeed } from '@/shared/random';
import type { Result } from '@/shared/result';
import { type GridController, type GridStroke, LetterGrid } from '@/shared/grid/LetterGrid';

import { KEY_COLOR, WORD_COLORS } from '../colors';
import { type GenerateError, generatePuzzle } from '../logic/generatePuzzle';
import { MAX_GRID_SIZE, MIN_GRID_SIZE, type WoordslangPuzzle } from '../logic/types';
import styles from './BeheerPage.module.css';
import { countStatus, formatPuzzleJson, parseWordList, slugify } from './beheerInput';

/** Lets the browser paint the busy button before the (synchronous) search starts. */
const BUSY_PAINT_MS = 30;

const READ_ONLY: GridController = {
  preview: null,
  start: () => {},
  move: () => {},
  end: () => {},
  cancel: () => {},
};

interface Generated {
  seed: number;
  result: Result<WoordslangPuzzle, GenerateError>;
}

const colorOf = (puzzle: WoordslangPuzzle, index: number) => {
  const word = puzzle.words[index]!;
  if (word.key) return KEY_COLOR;
  const nonKey = puzzle.words.slice(0, index).filter((w) => !w.key).length;
  return WORD_COLORS[nonKey % WORD_COLORS.length]!;
};

/**
 * Dev-only admin page: enter a theme and words, generate a woordslang puzzle, check the
 * preview and copy/download the JSON for `src/puzzles/woordslang/data/`.
 */
export function BeheerPage() {
  const [theme, setTheme] = useState('');
  const [hint, setHint] = useState('');
  const [customId, setCustomId] = useState<string | null>(null);
  const [keyWord, setKeyWord] = useState('');
  const [wordsText, setWordsText] = useState('');
  const [width, setWidth] = useState(6);
  const [height, setHeight] = useState(8);
  const [busy, setBusy] = useState(false);
  const [generated, setGenerated] = useState<Generated | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const id = customId ?? slugify(theme);
  const words = useMemo(() => parseWordList(wordsText), [wordsText]);
  const status = countStatus(keyWord.trim() ? [keyWord, ...words] : words, width * height);
  const canGenerate = !busy && theme.trim() !== '' && id !== '' && keyWord.trim() !== '';

  const generate = () => {
    const seed = randomSeed();
    setBusy(true);
    setCopyMessage(null);
    timer.current = setTimeout(() => {
      const result = generatePuzzle({
        id,
        theme: theme.trim(),
        hint: hint.trim(),
        keyWord,
        words,
        width,
        height,
        seed,
      });
      setGenerated({ seed, result });
      setBusy(false);
    }, BUSY_PAINT_MS);
  };

  const puzzle = generated?.result.ok ? generated.result.value : null;
  const json = puzzle ? formatPuzzleJson(puzzle) : '';
  const strokes: GridStroke[] = puzzle
    ? puzzle.words.map((w, i) => ({ key: w.letters, cells: w.path, color: colorOf(puzzle, i) }))
    : [];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopyMessage('Gekopieerd.');
    } catch {
      setCopyMessage('Kopiëren lukt niet; selecteer de tekst en kopieer die zelf.');
    }
  };

  const download = () => {
    if (!puzzle) return;
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${puzzle.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Woordslang beheer</h1>
      <p className={styles.note}>Alleen zichtbaar in de ontwikkelversie.</p>

      <section className={styles.section} aria-labelledby="wsb-gegevens">
        <h2 id="wsb-gegevens" className={styles.heading}>
          Puzzel
        </h2>
        <label className={styles.field}>
          Thema
          <input className="text-input" value={theme} onChange={(e) => setTheme(e.target.value)} />
        </label>
        <label className={styles.field}>
          Id (bestandsnaam)
          <input
            className="text-input"
            value={id}
            onChange={(e) => setCustomId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
          />
        </label>
        <label className={styles.field}>
          Hint voor de speler
          <input className="text-input" value={hint} onChange={(e) => setHint(e.target.value)} />
        </label>
        <label className={styles.field}>
          Sleutelwoord
          <input
            className="text-input"
            value={keyWord}
            onChange={(e) => setKeyWord(e.target.value)}
          />
        </label>
        <label className={styles.field}>
          Andere woorden (komma of nieuwe regel)
          <textarea
            className="text-input"
            rows={4}
            value={wordsText}
            onChange={(e) => setWordsText(e.target.value)}
          />
        </label>
      </section>

      <section className={styles.section} aria-labelledby="wsb-formaat">
        <h2 id="wsb-formaat" className={styles.heading}>
          Formaat
        </h2>
        <div className={styles.sizeRow}>
          <NumberStepper
            label="Breedte"
            value={width}
            min={MIN_GRID_SIZE}
            max={MAX_GRID_SIZE}
            onChange={setWidth}
          />
          <NumberStepper
            label="Hoogte"
            value={height}
            min={MIN_GRID_SIZE}
            max={MAX_GRID_SIZE}
            onChange={setHeight}
          />
        </div>
        <p className={styles[status.kind]} aria-live="polite" data-testid="letter-count">
          {status.text}
        </p>
      </section>

      <div className={styles.actions}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={generate}
          disabled={!canGenerate}
          aria-busy={busy}
        >
          {busy ? 'Puzzel maken…' : generated ? 'Opnieuw' : 'Genereer'}
        </button>
      </div>

      {generated && !generated.result.ok && (
        <p className={styles.error} role="alert">
          {generated.result.error.message}
        </p>
      )}

      {puzzle && generated && (
        <section className={styles.section} aria-labelledby="wsb-resultaat">
          <h2 id="wsb-resultaat" className={styles.heading}>
            Resultaat <span className={styles.seed}>(seed {generated.seed})</span>
          </h2>
          <div className={styles.grid} style={{ maxWidth: `${puzzle.width * 3.2}rem` }}>
            <LetterGrid
              rows={puzzle.grid}
              width={puzzle.width}
              height={puzzle.height}
              controller={READ_ONLY}
              strokes={strokes}
              disabled
              ariaLabel={`Voorbeeld: ${puzzle.theme}`}
              testId="beheer-preview"
            />
          </div>
          <ul className={styles.words} aria-label="Woorden">
            {puzzle.words.map((w, i) => (
              <li key={w.letters}>
                <span className={styles.swatch} style={{ background: colorOf(puzzle, i) }} />
                {w.display}
                {w.key && <strong> (sleutelwoord)</strong>}
              </li>
            ))}
          </ul>

          <h3 className={styles.heading}>JSON</h3>
          <p className={styles.note}>
            Zet dit bestand als <code>{puzzle.id}.json</code> in{' '}
            <code>src/puzzles/woordslang/data/</code>.
          </p>
          <textarea
            className={`text-input ${styles.json}`}
            readOnly
            rows={12}
            value={json}
            aria-label="Puzzel-JSON"
          />
          <div className={styles.jsonActions}>
            <button type="button" className="btn btn-secondary" onClick={() => void copy()}>
              Kopiëren
            </button>
            <button type="button" className="btn btn-secondary" onClick={download}>
              Downloaden
            </button>
          </div>
          {copyMessage && <p aria-live="polite">{copyMessage}</p>}
        </section>
      )}
    </div>
  );
}
