---
run: run-puzzlefest-012
work_items: [getallenpad-path-generator, getallenpad-solver]
intent: getallenpad
generated: 2026-11-22T14:40:20Z
mode: validate
---

# Implementation Walkthrough: path generator + counting solver

## Summary

`generatePath` produces a random Hamiltonian path (8-neighbour steps) over a 3–10 × 3–10 grid, deterministic per seed. `countSolutions` counts the solutions of a grid with givens up to two and reports the search effort (nodes), which becomes the stored difficulty metric. `uniquenessCheck` plugs the solver into `validatePuzzle`.

## Structure

```
generatePath(seed) ──► solution rows ──► (reduction, next run) ──► givens
                                                         │
countSolutions(givens) ◄─────────────────────────────────┘   → 0 | 1 | many, nodes
uniquenessCheck(puzzle) = countSolutions → validatePuzzle({ countSolutions })
```

Both are pure TS in `src/puzzles/getallenpad/logic/`, using the shared `neighbourTable`/`labelRegions` and the seeded RNG.

## Key decisions

- **Generator**: random start cell, Warnsdorff + 25% noise, pruning (one connected region, ≤ 1 dead end), restarts every 5 000 steps, time-out/abort every 256 steps.
- **Solver (revised)**: fills gaps between placed values on the most constrained side; distance, open-end, degree and region pruning — all necessary conditions. Node = one placed value; deterministic, so usable as metric.
- **Correctness guard**: oracle test against an independent plain counter on 320 small grids (0/1/many all covered).

## Deviations from plan

- Solver search order revised after measuring (design's fallback); recorded in the design doc.
- `TEST_PUZZLE` made unique.
- Solver returns immediately for a pre-aborted signal.

## Dependencies added

None.

## How to verify

```bash
npm test
BENCH=1 npx vitest run generatePath.bench solve.bench --silent=false   # Pi timings
```

## Developer notes

- Benchmarks are skipped unless `BENCH=1` (`import.meta.env`; the app tsconfig has no Node types).
- Random givens at 20% can take seconds to *refute* uniqueness; the reduction must pass `maxNodes` and treat `node-limit` as "keep this given".
- **Open question for the reduction item**: greedy reduction bottoms out at ~29–43% givens on 7×7, so the brief's 40/30/20% targets need revisiting.
