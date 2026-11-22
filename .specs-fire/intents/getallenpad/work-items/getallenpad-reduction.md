---
id: getallenpad-reduction
title: Puzzle reduction and difficulty metric
intent: getallenpad
complexity: medium
mode: confirm
status: pending
depends_on: [getallenpad-path-generator, getallenpad-solver]
created: 2026-11-22T11:15:00Z
---

# Work Item: Puzzle reduction and difficulty metric

## Description

From a full path, remove numbers in seeded order while the solver still finds exactly one solution, steering difficulty by target given percentage, and record the metric.

## Acceptance Criteria

- [ ] `createPuzzle({width, height, level, seed, signal})` → `Result<Puzzle, Error>`; levels: makkelijk ~40%, normaal ~30%, moeilijk ~20% givens
- [ ] 1 and N are never removed; result always has exactly one solution
- [ ] Unreachable target (cannot get down to the target %) → explicit `err` or retry with a new path within the time budget
- [ ] Stored metric: given percentage and solver visited nodes of the final uniqueness check
- [ ] Property test: N random seeds → every produced puzzle passes the full validator
- [ ] Performance test (can be tagged/skipped in CI): 7×7 produces a unique puzzle within 5 s in ≥ 95% of runs; report metric distribution per level to show the levels differ

## Dependencies

- getallenpad-path-generator
- getallenpad-solver
