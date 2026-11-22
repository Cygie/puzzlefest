---
run: run-puzzlefest-012
work_item: getallenpad-path-generator
intent: getallenpad
mode: validate
checkpoint: plan
approved_at: 2026-11-22T14:22:17Z
---

# Implementation Plan: Hamiltonian path generator

## Approach

Implement the approved design (`getallenpad-path-generator-design.md`) as one pure module. Recursive DFS over cell indexes using the shared `neighbourTable`; per step: Warnsdorff ordering with `NOISE` = 0.25, pruning via shared `labelRegions` (one region touching the head) and a dead-end count (≤ 1). Step counter drives restarts (every `RESTART_STEPS` = 5 000), `maxSteps` (200 000), and time-out/abort checks every 256 steps. Output rows are self-checked with `findPathProblem` + coverage; failure throws (bug).

Tunables (`NOISE`, `RESTART_STEPS`, defaults) are exported constants; `restartSteps` is also an option so tests can observe restarts. The function reports the number of restarts in its result for tests and the benchmark: `ok({ solution, restarts })`.

## Files to Create

| File | Purpose |
|------|---------|
| `src/puzzles/getallenpad/logic/generatePath.ts` | `generatePath`, error codes + Dutch messages, constants |
| `src/puzzles/getallenpad/logic/generatePath.test.ts` | Unit tests (see below) |
| `src/puzzles/getallenpad/logic/generatePath.bench.test.ts` | Pi benchmark, only when `BENCH=1` (`describe.skipIf`) |

## Files to Modify

| File | Changes |
|------|---------|
| (none) | |

## Tests

| Test File | Coverage |
|-----------|----------|
| `generatePath.test.ts` | fixed seed → identical valid path (3×3, 7×7, 5×9, 10×10); different seeds differ; `grid-size`; fake clock → `timeout`; tiny `maxSteps` → `no-path`; aborted signal → `aborted`; restart counter with tiny `restartSteps`; pruning vs plain DFS on 3×3/3×4 from every start (pruned search finds a path whenever plain DFS does) |
| `generatePath.bench.test.ts` | 1 000 seeds on 7×7: p50/p95/max time, restarts (`BENCH=1 npx vitest run generatePath.bench`) |

## Based on Design Doc

Reference: `.specs-fire/intents/getallenpad/work-items/getallenpad-path-generator-design.md`

---
*Plan approved at checkpoint. Execution follows.*

---

## Work Item: getallenpad-solver

**Mode**: validate — checkpoint: plan — approved_at: 2026-11-22T14:27:19Z

### Approach

Implement the approved design (`getallenpad-solver-design.md`) in `solve.ts`:
- Index givens (`cellOf[value]`, `nextGiven[k]`), reject inconsistent input up front (value outside 1..N or a value given twice → 0 solutions; 1 or N missing is allowed — the search then starts from every empty cell for 1, which keeps the solver general for the oracle test and for hand-made fixtures).
- Distance precheck over consecutive givens; DFS placing k+1 next to k (given cell if k+1 is given, else empty neighbours in Warnsdorff order); distance pruning against the next given; region pruning (every empty region touches an open end; cells with no way in are dead).
- Count to `limit` 2, keep the first solution, count nodes; `maxNodes` → `node-limit`; abort every 1 024 nodes.
- `uniquenessCheck(puzzle)` for `validatePuzzle`.
- Test-only exhaustive counter (in the test file, plain recursion without pruning or early stop) to prove early stopping and as the oracle.

### Files to Create

| File | Purpose |
|------|---------|
| `src/puzzles/getallenpad/logic/solve.ts` | `countSolutions`, `uniquenessCheck`, error type |
| `src/puzzles/getallenpad/logic/solve.test.ts` | fixtures 0/1/many, early stop, oracle (≥ 300 random small grids), node-limit, abort, validator integration |
| `src/puzzles/getallenpad/logic/solve.bench.test.ts` | Pi benchmark, `BENCH=1`: 7×7 generator paths with 40/30/20% random givens (1 and N kept) → nodes and time |

### Files to Modify

| File | Changes |
|------|---------|
| `src/puzzles/getallenpad/logic/testPuzzle.ts` | Only if needed: make `TEST_PUZZLE` provably unique (add givens), so it can serve as the "1 solution" fixture |

### Based on Design Doc

Reference: `.specs-fire/intents/getallenpad/work-items/getallenpad-solver-design.md`
