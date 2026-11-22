---
run: run-puzzlefest-012
work_items: [getallenpad-path-generator, getallenpad-solver]
generated: 2026-11-22T14:24:32Z
---

# Test Report

## Work Item: getallenpad-path-generator

### Test Results
- Full suite: 40 files passed + 1 skipped (benchmark), **360 passed**, 1 skipped, 0 failed
- New: `generatePath.test.ts` (15); `generatePath.bench.test.ts` (runs only with `BENCH=1`)
- Coverage `generatePath.ts`: 96.6% statements, 94.7% branches, 100% functions (uncovered: the "invalid path" bug throw)
- `tsc -b`, `eslint src`, prettier clean

### Benchmark (Raspberry Pi, 1 000 seeds, 7×7)
- p50 0.27 ms, p95 0.42 ms, max 15 ms; at most 1 restart → the generator is not the bottleneck.

### Acceptance Criteria Validation
- ✅ Backtracking DFS with Warnsdorff ordering, ties by seeded RNG (+ 25% noise per design)
- ✅ Deterministic per seed (test: same seed → equal output)
- ✅ Restarts, step budget (`no-path`), time-out (`timeout`), never a partial path
- ✅ Cancellable via `AbortSignal` (`aborted`, before and during the search)
- ✅ Valid Hamiltonian paths for 3×3, 7×7, 5×9, 10×10 and 200 seeds; time-out, restart and abort tests
- ✅ 7×7 well under 1 s on the Pi (p95 0.4 ms)

---

## Work Item: getallenpad-solver

### Test Results
- Full suite: 41 files + 2 skipped (benchmarks), **371 passed**, 3 skipped, 0 failed
- New: `solve.test.ts` (11) incl. oracle over 320 random 3×3–4×4 grids (pruned, unpruned and an independent reference counter agree; > 10 cases each of 0, 1 and many); `solve.bench.test.ts` (`BENCH=1`)
- `TEST_PUZZLE` now has exactly one solution (9 givens); model/validator tests updated for it
- Coverage `solve.ts`: 98.9% statements, 96.2% branches, 100% functions, 100% lines
- `tsc -b`, `eslint src`, `prettier --check src` clean

### Benchmark (Raspberry Pi, 7×7)
| Workload | Result |
|----------|--------|
| Random 40% givens (40 grids) | all "many"; p50 1.8 ms, max 56 ms |
| Random 30% givens | all "many"; p50 2.2 ms, max 175 ms |
| Random 20% givens | all "many"; p50 8.8 ms, p95 2.1 s, max 18 s |
| Greedy reduction, 20 puzzles (≈ 47 uniqueness checks each, 100 k node cap) | total p50 98 ms, p95 712 ms, max 1.4 s; no node-limit hit |

### Acceptance Criteria Validation
- ✅ `countSolutions(..., { limit 2, signal })` → 0 / 1 / 'many' + nodes
- ✅ Stops at the second solution (test: < 1% of the nodes of a full enumeration)
- ✅ Pruning: distance (Chebyshev) and flood fill over empty regions — plus open-end/degree checks (design revision)
- ✅ Oracle test pruning on vs off (and vs reference counter) on 320 random small grids
- ✅ Fixtures with 0, 1 and many solutions
- ✅ Validator uniqueness step wired (`uniquenessCheck`)
- ✅ Cancellable via `AbortSignal` (before and during the search)

### Finding for getallenpad-reduction
A single greedy pass ends at **29–43% givens** (p50 35%) on 7×7. The brief's "moeilijk ~20%" is not reachable this way: with 8-neighbour steps far more givens are needed for uniqueness. To be decided in the reduction item.
