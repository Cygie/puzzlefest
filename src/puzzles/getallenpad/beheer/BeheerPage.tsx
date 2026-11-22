import { useEffect, useRef, useState } from 'react';

import { Grid, type GridController } from '@/shared/grid/Grid';
import { NumberStepper } from '@/shared/NumberStepper';

import {
  type GetallenpadPuzzle,
  LEVEL_LABELS,
  LEVELS,
  type Level,
  MAX_GRID_SIZE,
  MIN_GRID_SIZE,
} from '../logic/types';
import styles from './BeheerPage.module.css';
import { formatPuzzleJson } from './formatPuzzleJson';
import { type BatchItem, MAX_BATCH, type PuzzleFactory, workerFactory } from './puzzleFactory';

const READ_ONLY: GridController = {
  preview: null,
  start: () => {},
  move: () => {},
  end: () => {},
  cancel: () => {},
};

const percent = (ratio: number) => `${Math.round(ratio * 100)}%`;

function downloadJson(puzzle: GetallenpadPuzzle) {
  const url = URL.createObjectURL(
    new Blob([formatPuzzleJson(puzzle)], { type: 'application/json' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = `${puzzle.id}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function PuzzleGrid({
  puzzle,
  rows,
  label,
  testId,
}: {
  puzzle: GetallenpadPuzzle;
  rows: (number | null)[][];
  label: string;
  testId: string;
}) {
  const given = (row: number, col: number) => puzzle.givens[row]![col] !== null;
  return (
    <figure className={styles.figure}>
      <figcaption>{label}</figcaption>
      <div style={{ width: `${puzzle.width * 2.4}rem`, maxWidth: '100%' }}>
        <Grid
          width={puzzle.width}
          height={puzzle.height}
          controller={READ_ONLY}
          renderCell={({ row, col }) => rows[row]![col] ?? ''}
          cellClassName={({ row, col }) => (given(row, col) ? styles.given : undefined)}
          disabled
          ariaLabel={label}
          testId={testId}
        />
      </div>
    </figure>
  );
}

interface BeheerPageProps {
  /** Where the puzzles are made; a Web Worker by default. */
  factory?: PuzzleFactory;
}

/**
 * Dev-only admin page: generate getallenpad puzzles (also in batches), check the preview
 * and copy/download the JSON for `src/puzzles/getallenpad/data/`.
 */
export function BeheerPage({ factory = workerFactory }: BeheerPageProps) {
  const [width, setWidth] = useState(7);
  const [height, setHeight] = useState(7);
  const [level, setLevel] = useState<Level>('normaal');
  const [seedText, setSeedText] = useState('');
  const [count, setCount] = useState(1);
  const [items, setItems] = useState<BatchItem[]>([]);
  const [expected, setExpected] = useState(0);
  const [selected, setSelected] = useState(0);
  const [running, setRunning] = useState(false);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const cancel = useRef<(() => void) | null>(null);

  useEffect(() => () => cancel.current?.(), []);

  const seed = seedText.trim() === '' ? null : Number(seedText);
  const seedValid = seed === null || (Number.isInteger(seed) && seed >= 0 && seed < 2 ** 32);

  const generate = () => {
    cancel.current?.();
    setItems([]);
    setSelected(0);
    setExpected(count);
    setCopyMessage(null);
    setRunning(true);
    cancel.current = factory.start(
      { width, height, level, seed, count },
      {
        onPuzzle: (item) => setItems((current) => [...current, item]),
        onDone: () => {
          cancel.current = null;
          setRunning(false);
        },
      },
    );
  };

  const stop = () => {
    cancel.current?.();
    cancel.current = null;
    setRunning(false);
  };

  const item = items[selected];
  const puzzle = item?.result.ok ? item.result.value : null;
  const json = puzzle ? formatPuzzleJson(puzzle) : '';
  const made = items.flatMap((i) => (i.result.ok ? [i.result.value] : []));

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopyMessage('Gekopieerd.');
    } catch {
      setCopyMessage('Kopiëren lukt niet; selecteer de tekst en kopieer die zelf.');
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Getallenpad beheer</h1>
      <p className={styles.note}>Alleen zichtbaar in de ontwikkelversie.</p>

      <section className={styles.section} aria-labelledby="gpb-instellingen">
        <h2 id="gpb-instellingen" className={styles.heading}>
          Instellingen
        </h2>
        <div className={styles.row}>
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
          <NumberStepper label="Aantal" value={count} min={1} max={MAX_BATCH} onChange={setCount} />
        </div>
        <fieldset className={styles.levels}>
          <legend>Moeilijkheid</legend>
          {LEVELS.map((l) => (
            <label key={l}>
              <input
                type="radio"
                name="gpb-level"
                value={l}
                checked={level === l}
                onChange={() => setLevel(l)}
              />{' '}
              {LEVEL_LABELS[l]}
            </label>
          ))}
        </fieldset>
        <label className={styles.field}>
          Seed (leeg = willekeurig)
          <input
            className="text-input"
            inputMode="numeric"
            value={seedText}
            onChange={(e) => setSeedText(e.target.value.replace(/\D/g, ''))}
          />
        </label>
        {!seedValid && (
          <p className={styles.error} role="alert">
            De seed moet kleiner zijn dan 4294967296.
          </p>
        )}
      </section>

      <div className={styles.actions}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={generate}
          disabled={running || !seedValid}
          aria-busy={running}
        >
          {running ? 'Bezig…' : 'Genereer'}
        </button>
        {running && (
          <button type="button" className="btn btn-secondary" onClick={stop}>
            Stop
          </button>
        )}
        {expected > 0 && (
          <p className={styles.note} aria-live="polite" data-testid="progress">
            {items.length} van {expected} klaar
            {!running && items.length < expected && ' (gestopt)'}
          </p>
        )}
      </div>

      {items.length > 0 && (
        <section className={styles.section} aria-labelledby="gpb-resultaten">
          <h2 id="gpb-resultaten" className={styles.heading}>
            Resultaten
          </h2>
          <ul className={styles.results} aria-label="Gemaakte puzzels">
            {items.map((it, index) => (
              <li key={`${index}-${it.seed}`}>
                <button
                  type="button"
                  className={styles.result}
                  aria-pressed={index === selected}
                  onClick={() => {
                    setSelected(index);
                    setCopyMessage(null);
                  }}
                >
                  {it.result.ok ? (
                    <>
                      <strong>{it.result.value.id}</strong> —{' '}
                      {percent(it.result.value.metric.givenRatio)} gegeven,{' '}
                      {it.result.value.metric.solverNodes} knopen
                    </>
                  ) : (
                    <>
                      seed {it.seed}: {it.result.error.message}
                    </>
                  )}
                </button>
              </li>
            ))}
          </ul>
          {made.length > 1 && (
            <div className={styles.actions}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => made.forEach(downloadJson)}
              >
                Download alle ({made.length})
              </button>
            </div>
          )}
        </section>
      )}

      {item && !item.result.ok && (
        <p className={styles.error} role="alert">
          {item.result.error.message}
        </p>
      )}

      {puzzle && (
        <section className={styles.section} aria-labelledby="gpb-voorbeeld">
          <h2 id="gpb-voorbeeld" className={styles.heading}>
            Voorbeeld: {puzzle.id}
          </h2>
          <p className={styles.note} data-testid="metric">
            {LEVEL_LABELS[puzzle.level]} · {puzzle.width}×{puzzle.height} ·{' '}
            {percent(puzzle.metric.givenRatio)} gegeven · {puzzle.metric.solverNodes} solver-knopen
            · seed {puzzle.seed}
          </p>
          <div className={styles.grids}>
            <PuzzleGrid
              puzzle={puzzle}
              rows={puzzle.givens}
              label="Puzzel"
              testId="beheer-givens"
            />
            <PuzzleGrid
              puzzle={puzzle}
              rows={puzzle.solution}
              label="Oplossing"
              testId="beheer-solution"
            />
          </div>

          <h3 className={styles.heading}>JSON</h3>
          <p className={styles.note}>
            Zet dit bestand als <code>{puzzle.id}.json</code> in{' '}
            <code>src/puzzles/getallenpad/data/</code>.
          </p>
          <textarea
            className={`text-input ${styles.json}`}
            readOnly
            rows={12}
            value={json}
            aria-label="Puzzel-JSON"
          />
          <div className={styles.actions}>
            <button type="button" className="btn btn-secondary" onClick={() => void copy()}>
              Kopiëren
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => downloadJson(puzzle)}
            >
              Downloaden
            </button>
          </div>
          {copyMessage && <p aria-live="polite">{copyMessage}</p>}
        </section>
      )}
    </div>
  );
}
