---
run: run-puzzlefest-013
work_items: [getallenpad-reduction, getallenpad-beheer, getallenpad-spel]
generated: 2026-11-22T15:18:00Z
---

# Test Report

## Work Item: getallenpad-reduction

### Test Results
- Full suite: 42 files passed + 3 skipped (benchmarks), **382 passed**, 4 skipped, 0 failed
- New: `createPuzzle.test.ts` (11) incl. property test (30 seeds × 3 levels on 5×5, 10 seeds on 7×7 → all pass the full validator); `createPuzzle.bench.test.ts` (`BENCH=1`)
- Coverage `createPuzzle.ts`: 88.6% statements, 79.3% branches, 100% functions (uncovered: generator failure inside a pass, the two "bug" throws)
- `tsc -b`, `eslint src`, `prettier --check src` clean

### Benchmark (Raspberry Pi, 100 seeds 7×7 per level, 5 s budget)
| Level | Unique within 5 s | ms p50 / p95 / max | Givens % p50 / p95 / max | Solver nodes p50 / p95 / max |
|---|---|---|---|---|
| makkelijk | 99/100 | 378 / 1 614 / 5 078 | 51 / 51 / 51 | 40 / 118 / 407 |
| normaal | 99/100 | 378 / 1 616 / 5 075 | 41 / 41 / 41 | 129 / 754 / 6 729 |
| moeilijk | 98/100 | 429 / 2 300 / 5 357 | 33 / 35 / 37 | 970 / 13 617 / 39 138 |

The runs over 5 s still returned a valid unique puzzle (best pass so far); they only exceed the budget by the final uniqueness check.

### Acceptance Criteria Validation
- ✅ Always exactly one solution; 1 and N always given (unit + property test, full validator)
- ✅ Levels: moeilijk = minimal (~33%), normaal = 40%, makkelijk = 50% (ceil), same path per seed
- ✅ Metric stored (`givenRatio`, `solverNodes`) and equal to a fresh solver run
- ✅ Deterministic per seed when all passes finish
- ✅ `grid-size`, `timeout` (first pass), best-so-far (later pass), `aborted`
- ✅ ≥ 95% within 5 s on the Pi (98–99%); levels clearly differ in solver nodes (median 40 → 129 → 970)

### Fix during testing
- The 7×7 level test hit vitest's 5 s default under full-suite + coverage load on the Pi, and the 5 s budget in `createPuzzle` could then cut passes short (making "same path" depend on machine load). Tests now use `timeoutMs: Infinity` unless they test time-outs, and that test has a 60 s limit.

---

## Work Item: getallenpad-beheer

### Test Results
- Full suite: 45 files passed + 4 skipped (benchmarks, generator), **401 passed**, 7 skipped, 0 failed
- New: `BeheerPage.test.tsx` (4: generate → preview → copy/download; batch progress, choosing a result, error result, "Download alle"; stop keeps finished puzzles; seed too large), `puzzleFactory.test.ts` (4: seeds, batch order, cancel between puzzles, JSON formatting), `data/puzzles.test.ts` (10: every published file through the full validator incl. uniqueness; ids, levels, order), App route test
- Coverage: `BeheerPage.tsx` 98.5% statements; `puzzleFactory.ts` 68.8% (uncovered: `workerFactory`); `createPuzzle.worker.ts` 0% — jsdom has no Worker
- `tsc -b`, `eslint .`, `prettier --check .` clean; `npm run build` OK and `dist/` contains no admin page or worker code

### Starter puzzles (7×7, generated with `GENERATE=1 … -u`)
3 per level: `7x7-makkelijk-101..103`, `7x7-normaal-201..203`, `7x7-moeilijk-301..303`.

### Acceptance Criteria Validation
- ✅ Hidden admin route only in `npm run dev` (dev test + build check)
- ✅ Generation in a Web Worker with cancel: logic covered via the in-process factory; worker path verified by hand in the browser by the user (batch, responsiveness, Stop) on 2026-11-22
- ✅ Preview shows givens, solution and metric
- ✅ Export per puzzle (copy/download) and batch ("Download alle")
- ✅ `data/` with index and starter puzzles per level
- ✅ CI test runs every published JSON through the full validator incl. uniqueness
- ✅ Component test for generate → preview → export

---

## Work Item: getallenpad-spel

### Test Results
- Full suite: 49 files passed + 4 skipped, **435 passed**, 7 skipped, 0 failed (woordzoeker and woordslang unchanged and green)
- New: `play.test.ts` (15), `progress.test.ts` (3), `PadPlayScreen.test.tsx` (12), `GetallenpadPage.test.tsx` (3), App route tests (+2 assertions/tests)
- Coverage of the new play code: 98.8% statements, 96.2% branches, 100% functions (`play.ts`, `progress.ts`, `PadPlayScreen.tsx`, `PuzzleListScreen.tsx`, `GetallenpadPage.tsx` 100% lines; `useNumberDrag.ts` 94%)
- `tsc -b`, `eslint .`, `prettier --check .` clean; `npm run build` OK

### Acceptance Criteria Validation
- ✅ Hash route `#/getallenpad`, menu link, home tile; list grouped by level with status
- ✅ Givens visually distinct; lines through runs of consecutive touching numbers
- ✅ Drag numbers ascending / descending (from N, or when k+1 is placed and k−1 not); a different given on the path rejects the drag with a flashing cell + message; a matching given is passed through
- ✅ Tap/arrow keys select a cell; digits (two within 1 s = one number, one undo step); Backspace/Delete clears
- ✅ Undo via button and Ctrl/⌘+Z
- ✅ Immediate error marking (non-adjacent k±1, duplicates with a given); givens never marked
- ✅ Solved state; grid read-only
- ✅ Progress saved per puzzle in `localStorage` and restored
- ✅ Testing Library tests for all of the above
- ✅ All existing woordzoeker and woordslang tests pass
