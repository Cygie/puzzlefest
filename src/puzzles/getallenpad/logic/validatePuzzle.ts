import { isNeighbour } from '@/shared/grid/cells';
import { err, ok, type Result } from '@/shared/result';

import { cellCount, givenRatio, positionsByValue } from './model';
import {
  type GetallenpadPuzzle,
  LEVELS,
  MAX_GRID_SIZE,
  MIN_GRID_SIZE,
  type ValueRows,
} from './types';

export type ValidationCode =
  | 'dimensions'
  | 'solution-values'
  | 'not-adjacent'
  | 'given-mismatch'
  | 'missing-endpoint'
  | 'metric'
  | 'no-solution'
  | 'not-unique';

export interface ValidationError {
  code: ValidationCode;
  /** Dutch explanation for the admin page. */
  message: string;
}

/** Number of solutions of the givens, capped: 0, 1 or 'many'. */
export type SolutionCount = 0 | 1 | 'many';

export interface ValidateOptions {
  /** When given, the puzzle must have exactly one solution. */
  countSolutions?: (puzzle: GetallenpadPuzzle) => SolutionCount;
}

/** Allowed difference between the stored and the actual given ratio. */
const RATIO_TOLERANCE = 0.005;

type Obj = Record<string, unknown>;
const isObject = (v: unknown): v is Obj => typeof v === 'object' && v !== null;
const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v);
const isSize = (v: unknown): v is number => isInt(v) && v >= MIN_GRID_SIZE && v <= MAX_GRID_SIZE;
const isRows = <T>(v: unknown, isValue: (x: unknown) => x is T): v is ValueRows<T> =>
  Array.isArray(v) && v.every((row) => Array.isArray(row) && row.every(isValue));
const isIntOrNull = (v: unknown): v is number | null => v === null || isInt(v);

/**
 * Checks the shape of untrusted JSON. Rule checks (path, givens, …) are done by
 * `validatePuzzle`.
 */
export function isGetallenpadPuzzle(value: unknown): value is GetallenpadPuzzle {
  if (!isObject(value)) return false;
  const { version, id, level, width, height, solution, givens, metric, seed } = value;
  return (
    version === 1 &&
    typeof id === 'string' &&
    /^[a-z0-9-]+$/.test(id) &&
    LEVELS.some((l) => l === level) &&
    isSize(width) &&
    isSize(height) &&
    isRows(solution, isInt) &&
    isRows(givens, isIntOrNull) &&
    isObject(metric) &&
    typeof metric.givenRatio === 'number' &&
    metric.givenRatio >= 0 &&
    metric.givenRatio <= 1 &&
    isInt(metric.solverNodes) &&
    metric.solverNodes >= 0 &&
    (seed === undefined || isInt(seed))
  );
}

const hasShape = (rows: readonly (readonly unknown[])[], width: number, height: number) =>
  rows.length === height && rows.every((row) => row.length === width);

/** Checks every getallenpad rule; returns all problems found, not just the first. */
export function validatePuzzle(
  puzzle: GetallenpadPuzzle,
  options: ValidateOptions = {},
): Result<GetallenpadPuzzle, ValidationError[]> {
  const { width, height, solution, givens } = puzzle;
  const errors: ValidationError[] = [];
  const add = (code: ValidationCode, message: string) => errors.push({ code, message });

  if (!hasShape(solution, width, height) || !hasShape(givens, width, height)) {
    add('dimensions', `Oplossing en getallen moeten ${height} rijen van ${width} vakjes hebben.`);
    return err(errors); // the other checks assume matching rows
  }

  const n = cellCount(puzzle);
  const seen = new Set<number>();
  solution.forEach((row, r) =>
    row.forEach((value, c) => {
      if (value < 1 || value > n) {
        add(
          'solution-values',
          `Vakje (${r + 1}, ${c + 1}) heeft ${value}; dat ligt niet tussen 1 en ${n}.`,
        );
      } else if (seen.has(value)) {
        add('solution-values', `Het getal ${value} staat meer dan eens in de oplossing.`);
      }
      seen.add(value);
    }),
  );

  const positions = positionsByValue(solution);
  for (let k = 1; k < n; k++) {
    const here = positions[k];
    const next = positions[k + 1];
    if (here && next && !isNeighbour(here, next)) {
      add('not-adjacent', `${k} en ${k + 1} liggen niet naast elkaar.`);
    }
  }

  givens.forEach((row, r) =>
    row.forEach((value, c) => {
      if (value !== null && value !== solution[r]![c]) {
        add(
          'given-mismatch',
          `Vakje (${r + 1}, ${c + 1}) toont ${value}, maar de oplossing heeft ${solution[r]![c]}.`,
        );
      }
    }),
  );

  const shown = new Set(givens.flat());
  for (const endpoint of [1, n]) {
    if (!shown.has(endpoint)) add('missing-endpoint', `Het getal ${endpoint} moet gegeven zijn.`);
  }

  const ratio = givenRatio(puzzle);
  if (Math.abs(puzzle.metric.givenRatio - ratio) > RATIO_TOLERANCE) {
    add(
      'metric',
      `De opgeslagen verhouding ${puzzle.metric.givenRatio} klopt niet; ` +
        `${Math.round(ratio * 100)}% van de vakjes is gegeven.`,
    );
  }

  // Counting solutions is expensive and meaningless for a broken puzzle.
  if (errors.length === 0 && options.countSolutions) {
    const count = options.countSolutions(puzzle);
    if (count === 0) add('no-solution', 'Met deze getallen is de puzzel niet op te lossen.');
    if (count === 'many')
      add('not-unique', 'Met deze getallen heeft de puzzel meer dan één oplossing.');
  }

  return errors.length === 0 ? ok(puzzle) : err(errors);
}
