---
run: run-puzzlefest-012
work_items: [getallenpad-path-generator, getallenpad-solver]
---

# Review Report

## Work Item: getallenpad-path-generator

- Implemented as designed. Additions: options `start`, `noise`, `pruning` (used by tests; `start` is also handy for the admin page later) and `restarts` in the result.
- Fix applied during review: a search that is exhausted without taking any step would restart forever (the step counter did not move). Each attempt now counts as a step, so `maxSteps` always ends the loop. Cannot happen for grids ≥ 3×3 in practice, but the loop is now provably finite.
- Fix: the benchmark used `process.env` (no Node types in the app tsconfig); switched to `import.meta.env.BENCH`.
- Note: the pruning test checks that the pruned search finds a path from every start on 3×3–4×4 (with and without noise); since a Hamiltonian path exists from every start in a king graph, "plain DFS finds one" is always true there.

## Work Item: getallenpad-solver

- **Deviation from the approved design**: search order changed from "1 → N" to "most constrained gap side", plus open-end and degree pruning. Reason: the design as written hit the node limit on 7×7 (measured), so the fallback named in the design's risk table was built immediately. Revision recorded in `getallenpad-solver-design.md`.
- Added: abort check before the search (a pre-aborted signal returns at once, like the generator); invalid givens (outside 1..N, duplicates, consecutive givens not touching) return 0 without searching.
- Fixture change: `TEST_PUZZLE` made unique (was 'many'), as foreseen in the plan.
- Safety: correctness relies on all pruning rules being necessary conditions; the oracle covers 0/1/many cases on 320 grids against an independent counter, and CI validation (beheer item) re-checks every published puzzle.
- No auto-fixes needed.
