---
run: run-puzzlefest-007
work_items: [shared-letter-grid, woordslang-model-validator]
intent: woordslang
generated: 2026-11-22T00:10:00Z
mode: confirm
---

# Implementation Walkthrough: shared letter grid + woordslang model/validator

## Summary

The grid of the woordzoeker is now a shared, puzzle-agnostic `LetterGrid` with pluggable selection: straight lines (woordzoeker) or free 8-neighbour paths (woordslang, drag or tap-by-tap). The woordslang puzzle model, a `Result` type, a JSON guard and a complete rule validator are in place. No visible change in the app yet.

## Files Changed

### Created

| File | Purpose |
|------|---------|
| `src/shared/grid/cells.ts` | `Cell`, `Rect`, `sameCell`, `cellIndex`, `isNeighbour`, `inGrid`, `cellFromPoint`, `cellNearPoint` |
| `src/shared/grid/pathSelection.ts` | Pure path rules: `extendPath` (drag), `tapPath` (tap flow) |
| `src/shared/grid/usePathSelection.ts` | Path controller hook |
| `src/shared/grid/LetterGrid.tsx` (+ CSS moved from `PlayGrid.module.css`) | Letters, polyline strokes, preview, pointer handling via a `GridController` |
| `src/puzzles/woordzoeker/components/useLineSelection.ts` | Line controller (old `PlayGrid` logic) |
| `src/shared/result.ts` | `Result<T, E>`, `ok`, `err` |
| `src/puzzles/woordslang/logic/types.ts` | `WoordslangPuzzle`, `SlangWord` |
| `src/puzzles/woordslang/logic/validatePuzzle.ts` | `isWoordslangPuzzle`, `validatePuzzle`, `spansGrid`, `findCrossings` |
| `src/puzzles/woordslang/logic/testPuzzle.ts` | Valid 6×8 fixture (Fruit, key word FRUITMAND) |

### Modified

| File | Changes |
|------|---------|
| `src/puzzles/woordzoeker/components/PlayGrid.tsx` | Thin wrapper: `LetterGrid` + `useLineSelection` |
| `src/puzzles/woordzoeker/logic/selection.ts`, `directions.ts` | Re-export shared `Cell`, `cellFromPoint`, `sameCell` |
| `src/puzzles/woordzoeker/logic/generateGrid.test.ts` | Timeouts for slow search tests, title fix |

## How it fits together

`LetterGrid` translates pointer events into cells and calls `controller.start / move / end / cancel`; the controller owns the selection and its `preview`. A future woordslang play screen uses `usePathSelection(onSelect)` and gets the submitted `Cell[]` path, which it can compare with `SlangWord.path` (or letters).

## Verification

242 tests green, coverage 96%, typecheck/lint/format/build clean.
