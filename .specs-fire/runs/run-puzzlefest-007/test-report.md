---
run: run-puzzlefest-007
work_items: [shared-letter-grid, woordslang-model-validator]
---

# Test Report

- **Suite:** 25 files, 242 tests, all passing (was 199). Coverage: 96.2% statements, 92.5% branches.
- **New tests (43):**
  - `shared/grid/cells.test.ts`: neighbours, index/bounds, point → cell.
  - `shared/grid/pathSelection.test.ts`: append in any direction, reject non-neighbour/used cell, undo, tap flow (start, extend, undo, submit, restart).
  - `shared/grid/LetterGrid.test.tsx`: drag a bent path, corner-cutting does not pick up the orthogonal cell, drag back undoes, tap-by-tap submit, drag continuing a tapped path, strokes as polylines, disabled.
  - `shared/result.test.ts`.
  - `woordslang/logic/validatePuzzle.test.ts`: valid fixture (incl. IJ = two cells); one failing case per rule (letter-count, path-length, out-of-bounds, not-adjacent, repeated-cell, overlap, uncovered, letter-mismatch, key-word, key-edges, crossing between/within words, word-normalization); guard rejects 9 malformed shapes.
- **Woordzoeker regression:** all existing woordzoeker tests pass unchanged after `PlayGrid` moved onto the shared `LetterGrid` (swipe, tap start/end, found strokes, completion, print, page navigation).
- **Fix:** 4 slow generator tests (from the previous solution-word change) timed out under coverage instrumentation (5 s default) → explicit 60 s timeout; a malformed `it.each` title fixed.
- `tsc -b`, ESLint, Prettier and `npm run build` clean.
