/** Minimum number of letters a word needs to be usable in a woordzoeker. */
export const MIN_WORD_LENGTH = 2;

/** A word ready for placement in the grid. */
export interface NormalizedWord {
  /** What the user typed (trimmed), used for display in the word list. */
  display: string;
  /** Uppercase A–Z letters only, used for placement. IJ stays two letters. */
  letters: string;
}

export type WordErrorCode = 'empty' | 'too-short' | 'invalid-characters' | 'duplicate';

export interface WordError {
  display: string;
  code: WordErrorCode;
  /** Dutch, user-facing explanation. */
  reason: string;
}

export type NormalizeResult = { ok: true; word: NormalizedWord } | { ok: false; error: WordError };

export interface NormalizeListResult {
  words: NormalizedWord[];
  errors: WordError[];
}

// Spaces, hyphens/dashes and apostrophes are allowed in input but are not part of the grid
// ("ijs-beer" → IJSBEER, "'s-Hertogenbosch" → SHERTOGENBOSCH).
const SEPARATORS = /[\s\-‐‑‒–—'‘’`´]/g;
const COMBINING_MARKS = /[̀-ͯ]/g;
const VALID_LETTERS = /^[A-Z]+$/;

/** Converts input to grid letters without validating it. */
export function toGridLetters(input: string): string {
  return input.normalize('NFD').replace(COMBINING_MARKS, '').replace(SEPARATORS, '').toUpperCase();
}

/** Normalizes a single word and validates it for use in the grid. */
export function normalizeWord(input: string): NormalizeResult {
  const display = input.trim();
  const letters = toGridLetters(display);

  if (letters.length === 0) {
    return fail(display, 'empty', 'Vul een woord in.');
  }
  if (!VALID_LETTERS.test(letters)) {
    return fail(
      display,
      'invalid-characters',
      `"${display}" bevat tekens die niet in een woordzoeker passen. Gebruik alleen letters.`,
    );
  }
  if (letters.length < MIN_WORD_LENGTH) {
    return fail(
      display,
      'too-short',
      `"${display}" is te kort. Een woord moet minstens ${MIN_WORD_LENGTH} letters hebben.`,
    );
  }
  return { ok: true, word: { display, letters } };
}

/**
 * Normalizes a list of words. Invalid words and duplicates (same letters after
 * normalization, e.g. "Café" and "cafe") are reported; the first occurrence is kept.
 * Blank entries are silently skipped.
 */
export function normalizeWordList(inputs: readonly string[]): NormalizeListResult {
  const words: NormalizedWord[] = [];
  const errors: WordError[] = [];
  const seen = new Map<string, string>();

  for (const input of inputs) {
    if (input.trim() === '') continue;
    const result = normalizeWord(input);
    if (!result.ok) {
      errors.push(result.error);
      continue;
    }
    const firstDisplay = seen.get(result.word.letters);
    if (firstDisplay !== undefined) {
      errors.push({
        display: result.word.display,
        code: 'duplicate',
        reason: `"${result.word.display}" staat al in de lijst (als "${firstDisplay}").`,
      });
      continue;
    }
    seen.set(result.word.letters, result.word.display);
    words.push(result.word);
  }

  return { words, errors };
}

function fail(display: string, code: WordErrorCode, reason: string): NormalizeResult {
  return { ok: false, error: { display, code, reason } };
}
