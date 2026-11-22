---
run: run-puzzlefest-011
work_item: shared-grid-generalize
intent: getallenpad
mode: confirm
checkpoint: plan
approved_at: 2026-11-22T13:28:54Z
---

# Implementation Plan: Generic grid cell content and shared path/region utilities

## Approach

1. **Generic grid component** — extract the body of `LetterGrid` into a new `Grid` component that takes per-cell content instead of `rows: string[]`:
   - `renderCell(cell, index) => ReactNode` (content) and optional `cellClassName(cell, index) => string | undefined` (module styling: givens, errors, …). Pointer handling, strokes, preview, sizing and `GridController` stay exactly as they are.
   - Optional `keyboard` prop `{ activeCell, onActiveCellChange, onKey }`: the board becomes focusable (`tabIndex=0`, `role="grid"`, cells `role="gridcell"`, `aria-activedescendant`), arrow keys move the active cell (clamped), other keys go to `onKey(key, cell)`. Without the prop the markup stays `role="img"` as today, so existing accessible names/tests do not change.
   - `LetterGrid` becomes a thin wrapper (same props, same output) that maps `rows` + `highlightCells` onto `Grid`. `GridController`/`GridStroke` types move to `Grid.tsx` and are re-exported from `LetterGrid.tsx`, so no caller changes.
2. **Shared regions** — move `EMPTY`, `neighbourTable`, `labelRegions` from `woordslang/logic/regions.ts` to `src/shared/grid/regions.ts` (+ their tests). `canPartition` (word-length specific) stays in woordslang; woordslang imports the rest from shared.
3. **Shared path check** — `src/shared/grid/paths.ts`: `findPathProblem(path, width, height)` returns the first problem `{ kind: 'out-of-bounds' | 'not-adjacent' | 'repeated-cell', index }` or `null`, plus `isValidPath(...)` as boolean shorthand. The woordslang validator is left as is (it reports every step with its own Dutch messages; rewriting it is out of scope).

## Files to Create

| File | Purpose |
|------|---------|
| `src/shared/grid/Grid.tsx` | Generic grid: content/class per cell, strokes, pointer + optional keyboard |
| `src/shared/grid/Grid.test.tsx` | Custom content/classes, keyboard navigation and key forwarding |
| `src/shared/grid/regions.ts` | `EMPTY`, `neighbourTable`, `labelRegions` (moved) |
| `src/shared/grid/regions.test.ts` | Moved tests for neighbour table and flood fill |
| `src/shared/grid/paths.ts` | `findPathProblem`, `isValidPath` |
| `src/shared/grid/paths.test.ts` | Valid path, out of bounds, not adjacent, repeated cell, empty path |

## Files to Modify

| File | Changes |
|------|---------|
| `src/shared/grid/LetterGrid.tsx` | Thin wrapper over `Grid`; re-exports `GridController`, `GridStroke` |
| `src/shared/grid/LetterGrid.module.css` | Renamed/shared classes for `Grid` (or `Grid.module.css` + kept letter styles); focus ring for active cell |
| `src/puzzles/woordslang/logic/regions.ts` | Keep only `canPartition` |
| `src/puzzles/woordslang/logic/regions.test.ts` | Keep only `canPartition` tests |
| `src/puzzles/woordslang/logic/generatePuzzle.ts` | Import `EMPTY`/`labelRegions`/`neighbourTable` from `@/shared/grid/regions` |

## Tests

| Test File | Coverage |
|-----------|----------|
| `src/shared/grid/Grid.test.tsx` | renderCell/cellClassName, keyboard arrows (clamped), onKey forwarding, no keyboard → role img |
| `src/shared/grid/paths.test.ts` | all path problems |
| `src/shared/grid/regions.test.ts` | moved, unchanged assertions |
| existing 308 tests | must stay green unchanged (woordzoeker, woordslang, LetterGrid) |

---
*Plan approved at checkpoint. Execution follows.*

---

## Work Item: getallenpad-model-validator

**Mode**: confirm — checkpoint: plan — approved_at: 2026-11-22T13:44:48Z

### Approach

Pure TS in `src/puzzles/getallenpad/logic/`, following the woordslang pattern (shape guard for untrusted JSON + rule validator that returns *all* problems with Dutch messages).

**Puzzle JSON (readable in the repo, one row per line):**

```ts
type Level = 'makkelijk' | 'normaal' | 'moeilijk';
interface DifficultyMetric { givenRatio: number; solverNodes: number }  // ratio 0..1
interface GetallenpadPuzzle {
  version: 1;
  id: string;                       // /^[a-z0-9-]+$/, URL + saved progress
  level: Level;
  width: number; height: number;    // 3..10
  solution: number[][];             // rows; every value 1..N exactly once
  givens: (number | null)[][];      // rows; null = empty cell for the player
  metric: DifficultyMetric;
  seed?: number;                    // generator seed, for reproducing
}
```

**Player state** (separate from the definition): `PlayerState { entries: (number | null)[]; history: (number | null)[][] }` — row-major, givens not stored in `entries`. Only types + `emptyPlayerState(puzzle)` here; the edit/undo logic belongs to getallenpad-spel.

**Helpers** (`model.ts`): `cellCount`, `positionsByValue(solution)` (value → cell), `givenCells(puzzle)`, `givenRatio(puzzle)`.

**Validator** `validatePuzzle(puzzle, { countSolutions? })` → `Result<GetallenpadPuzzle, ValidationError[]>`, codes:
- `dimensions` — row counts/lengths don't match width/height
- `solution-values` — not a permutation of 1..N (missing/duplicate/out of range)
- `not-adjacent` — k and k+1 don't touch (uses shared `isNeighbour`)
- `given-mismatch` — a given differs from the solution
- `missing-endpoint` — 1 or N not given
- `metric` — stored `givenRatio` differs from the actual ratio (± 0.005)
- `no-solution` / `not-unique` — only when a `countSolutions` function is passed (filled in by getallenpad-solver); otherwise skipped

`isGetallenpadPuzzle(value)` — shape check of untrusted JSON (types, sizes, level, id pattern).

### Files to Create

| File | Purpose |
|------|---------|
| `src/puzzles/getallenpad/logic/types.ts` | Puzzle, Level, DifficultyMetric, PlayerState, size limits |
| `src/puzzles/getallenpad/logic/model.ts` | Helpers (positions by value, givens, ratio, empty player state) |
| `src/puzzles/getallenpad/logic/validatePuzzle.ts` | `isGetallenpadPuzzle`, `validatePuzzle` |
| `src/puzzles/getallenpad/logic/testPuzzle.ts` | Hand-made 4×4 fixture |
| `src/puzzles/getallenpad/logic/model.test.ts` | Helper tests |
| `src/puzzles/getallenpad/logic/validatePuzzle.test.ts` | Every error code + valid fixture + shape guard + pluggable uniqueness |

### Files to Modify

| File | Changes |
|------|---------|
| (none) | |
