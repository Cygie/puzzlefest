---
run: run-puzzlefest-011
work_items: [shared-grid-generalize, getallenpad-model-validator]
generated: 2026-11-22T13:31:57Z
---

# Test Report

## Work Item: shared-grid-generalize

### Test Results
- Full suite: 37 files, **318 passed**, 0 failed, 0 skipped (baseline before the run: 34 files, 308 tests)
- New: `Grid.test.tsx` (4), `paths.test.ts` (6); `regions.test.ts` moved to `src/shared/grid/` (5, unchanged assertions); woordslang `regions.test.ts` keeps the 3 `canPartition` tests
- `tsc -b`, `eslint src`, `prettier --check` and `npm run build` clean
- Coverage: `Grid.tsx` 92% statements / 97% lines; `paths.ts` 100%

### Acceptance Criteria Validation
- ✅ Generic cell content (`renderCell`) — `LetterGrid` is a thin wrapper; woordzoeker/woordslang unchanged
- ✅ Per-cell styling hook (`cellClassName`)
- ✅ `EMPTY`, `neighbourTable`, `labelRegions` in `src/shared/grid/regions.ts`; woordslang imports from there; `canPartition` stays in woordslang
- ✅ `findPathProblem` / `isValidPath` with unit tests
- ✅ Keyboard focus of a single cell (`keyboard` prop: roving active cell, arrows, key forwarding)
- ✅ All existing woordzoeker and woordslang tests pass unchanged

### Notes
- Keyboard mode not checked with a real screen reader; only jsdom role/name assertions.

---

## Work Item: getallenpad-model-validator

### Test Results
- Full suite: 39 files, **345 passed**, 0 failed, 0 skipped
- New: `model.test.ts` (5), `validatePuzzle.test.ts` (22, incl. 11 shape-guard cases)
- Coverage `src/puzzles/getallenpad/**`: 100% statements, branches, functions, lines
- `tsc -b`, `eslint src`, `prettier --check src`, `npm run build` clean

### Acceptance Criteria Validation
- ✅ Types for puzzle, level, metric, player state (separate from definition); no `any`, cells as `{row, col}`
- ✅ Solution as value per cell + `positionsByValue` (value → cell)
- ✅ `validatePuzzle` returns `Result` with specific errors: `solution-values`, `not-adjacent`, `given-mismatch`, `missing-endpoint`, `dimensions` (+ `metric`)
- ✅ Uniqueness is pluggable (`countSolutions` option → `no-solution` / `not-unique`; skipped for broken puzzles)
- ✅ Unit tests for every error and a valid hand-made 4×4 fixture
