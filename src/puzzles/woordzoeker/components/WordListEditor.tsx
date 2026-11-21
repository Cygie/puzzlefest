import { type FormEvent, useId, useState } from 'react';

import { normalizeWord, toGridLetters } from '../logic/normalize';
import styles from './SetupScreen.module.css';

interface WordListEditorProps {
  words: string[];
  /** Words longer than this many letters are marked as not fitting. */
  maxLength: number;
  onChange: (words: string[]) => void;
}

/** Splits pasted/typed input on commas, semicolons and newlines. */
function splitInput(input: string): string[] {
  return input
    .split(/[,;\n]+/)
    .map((part) => part.trim())
    .filter((part) => part !== '');
}

export function WordListEditor({ words, maxLength, onChange }: WordListEditorProps) {
  const [input, setInput] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const inputId = useId();
  const errorId = useId();

  const add = (event: FormEvent) => {
    event.preventDefault();
    const next = [...words];
    const seen = new Set(words.map(toGridLetters));
    const problems: string[] = [];
    const rejected: string[] = [];

    for (const part of splitInput(input)) {
      const result = normalizeWord(part);
      if (!result.ok) {
        problems.push(result.error.reason);
        rejected.push(part);
      } else if (seen.has(result.word.letters)) {
        problems.push(`"${result.word.display}" staat al in de lijst.`);
      } else {
        seen.add(result.word.letters);
        next.push(result.word.display);
      }
    }

    setErrors(problems);
    if (next.length !== words.length) onChange(next);
    // Keep only the rejected parts so they can be corrected; duplicates are simply dropped.
    setInput(rejected.join(', '));
  };

  return (
    <div>
      <form className={styles.addRow} onSubmit={add}>
        <label htmlFor={inputId} className="visually-hidden">
          Woord toevoegen
        </label>
        <input
          id={inputId}
          className="text-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Typ een woord…"
          autoCapitalize="none"
          autoComplete="off"
          enterKeyHint="done"
          aria-invalid={errors.length > 0}
          aria-describedby={errors.length > 0 ? errorId : undefined}
        />
        <button type="submit" className="btn btn-primary" disabled={input.trim() === ''}>
          Toevoegen
        </button>
      </form>

      {errors.length > 0 && (
        <ul id={errorId} className={styles.errors} role="alert">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}

      {words.length === 0 ? (
        <p className={styles.hint}>Nog geen woorden. Kies een thema of typ je eigen woorden.</p>
      ) : (
        <>
          <ul className={styles.chips} aria-label="Woordenlijst">
            {words.map((word) => {
              const tooLong = toGridLetters(word).length > maxLength;
              return (
                <li key={word} className={tooLong ? styles.wordChipTooLong : styles.wordChip}>
                  <span>{word}</span>
                  {tooLong && <span className={styles.badge}>te lang</span>}
                  <button
                    type="button"
                    className={styles.remove}
                    onClick={() => onChange(words.filter((w) => w !== word))}
                    aria-label={`${word} verwijderen`}
                  >
                    ×
                  </button>
                </li>
              );
            })}
          </ul>
          <div className={styles.listFooter}>
            <span className={styles.hint}>
              {words.length} {words.length === 1 ? 'woord' : 'woorden'}
            </span>
            <button type="button" className="btn btn-link" onClick={() => onChange([])}>
              Alles wissen
            </button>
          </div>
        </>
      )}
    </div>
  );
}
