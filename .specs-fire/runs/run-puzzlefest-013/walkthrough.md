---
run: run-puzzlefest-013
work_items: [getallenpad-reduction, getallenpad-beheer, getallenpad-spel]
intent: getallenpad
generated: 2026-11-22T18:10:00Z
mode: confirm
---

# Implementation Walkthrough: reduction, admin page and play page

## Summary

Getallenpad is now playable end to end. `createPuzzle` turns a generated path into a unique puzzle at one of three levels and stores a difficulty metric. A dev-only admin page generates batches in a Web Worker and exports JSON. Nine published starter puzzles (7×7, 3 per level) appear in the app at `#/getallenpad`, where players drag or type numbers, with immediate error marking, undo and saved progress.

## Structure

```
generatePath ─► createPuzzle(level, seed) ─► GetallenpadPuzzle JSON
                   │ greedy reduction (3 passes, countSolutions ≤ 100k nodes)
                   │ level fill-back: moeilijk = minimal, normaal 40%, makkelijk 50%
                   └ validatePuzzle + uniquenessCheck (safety net)

#/getallenpad/beheer (dev only) ─► PuzzleFactory ─► createPuzzle.worker.ts ─► export JSON
                                                                    │
src/puzzles/getallenpad/data/*.json ◄───────────────────────────────┘ (checked in CI by puzzles.test.ts)
        │
#/getallenpad ─► PuzzleListScreen ─► PadPlayScreen ─ play.ts (rules) + progress.ts (localStorage)
```

## Key decisions

- **Levels**: by given ratio on top of the minimal puzzle (decision 2026-11-22). Measured solver nodes per level (median 40 / 129 / 970) show the levels really differ.
- **Time budget**: one 5 s deadline. A timeout after the first pass returns the best puzzle so far, which is still unique.
- **Worker cancel** = `terminate()`, because the generation loop is synchronous. Seeds are chosen on the main thread, so every batch can be reproduced.
- **One place per value**: placing a number again removes the player's earlier entry with that value. Givens are never removed or marked.
- **Drag direction**: ascending unless k+1 is already on the board and k−1 is not, in which case descending.

## Deviations from plan

- Tie between passes: the first pass is kept instead of the one with more solver nodes, which saves an extra unlimited solver run.
- The final metric run ignores the deadline, so a call can take up to about 5.4 s.
- Extras: a drag preview shows the numbers while dragging, `no-start`/`out-of-range` messages were added, and level labels are shared in `types.ts`.

## Dependencies added

None.

## How to verify

```bash
npm test
npm run dev        # #/getallenpad to play, #/getallenpad/beheer to generate
BENCH=1 npx vitest run createPuzzle.bench --silent=false
GENERATE=1 npx vitest run src/puzzles/getallenpad/data/generate.test.ts   # regenerate starter set
```

## Developer notes

- Tests use `timeoutMs: Infinity` unless they test timeouts, so results don't depend on Pi load.
- `createPuzzle.worker.ts` and `workerFactory` aren't covered by the tests because jsdom has no Worker. The user checked them by hand in the browser.
- Touch dragging on a real phone has not been tested by hand yet. It uses the shared `Grid` pointer handling, the same as woordslang.
