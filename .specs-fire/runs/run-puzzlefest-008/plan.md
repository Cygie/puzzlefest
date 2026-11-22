---
run: run-puzzlefest-008
work_items: [woordslang-generator]
intent: woordslang
mode: validate
checkpoint: plan
design: .specs-fire/intents/woordslang/work-items/woordslang-generator-design.md
---

# Implementation Plan: woordslang generator

Follows the approved design (checkpoint 1) without deviations.

## Files

| File | Change |
|------|--------|
| `src/puzzles/woordslang/logic/regions.ts` (+ test) | new: `emptyRegions(owner, width, height)` (8-neighbour flood fill → cell lists), `canPartition(regionSizes, lengths)` (memoized DFS) |
| `src/puzzles/woordslang/logic/generatePuzzle.ts` (+ test) | new: `generatePuzzle(input, options)`, `GenerateInput`, `GenerateOptions`, `GenerateError(Code)`, constants `DEFAULT_TIMEOUT_MS` = 5000, `DEFAULT_MAX_STEPS` = 400 000, `STEPS_PER_RESTART` = 20 000, `MAX_WORD_TRIES` = 3 |

No changes to existing files (uses `createRng`, `normalizeWord`, `validatePuzzle`, `ok`/`err`).

## Steps

1. `regions.ts` + tests.
2. Input checks in a fixed order (grid-size → invalid-word → duplicate-word → word-too-long → letter-count → key-too-short), each with a Dutch message naming the word or numbers.
3. Search state: `Int8Array` owner per cell, diagonal register per 2×2 square, paths per word.
4. `growPath`: DFS with Warnsdorff + jitter ordering, crossing check, region pruning after each step; for the key word: edge start, bias to the opposite edge, span check on completion.
5. Main loop: key word, then most-constrained-cell → up to 3 words → grow → `canPartition` → recurse; restart every 20 000 steps with a new order; budget → `no-solution`, clock → `timeout` (checked every 1 000 steps).
6. `toPuzzle` + `validatePuzzle` safety net (throws on a bug).
7. Tests (see below), then a temporary benchmark on the Pi, deleted afterwards; numbers go into the test report.

## Tests

- regions: separate regions, diagonal connectivity, empty grid; partition yes/no cases.
- each input error code (one case each).
- fixed seed → valid puzzle, identical on a second call; key word spans edges.
- different seeds → different grids.
- `maxSteps` tiny → `no-solution`; fake `now()` jumping past the limit → `timeout`.
- fuzz: 40 seeds on the 6×8 fruit word set → every success passes `validatePuzzle`.
