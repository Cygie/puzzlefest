---
id: getallenpad-reduction
title: Puzzle reduction and difficulty metric
intent: getallenpad
complexity: medium
mode: confirm
status: completed
depends_on:
  - getallenpad-path-generator
  - getallenpad-solver
created: 2026-11-22T11:15:00Z
run_id: run-puzzlefest-013
completed_at: 2026-11-22T18:08:29.866Z
---

# Work Item: Puzzle reduction and difficulty metric

## Description

From a full path, remove numbers in seeded order while the solver still finds exactly one solution, steering difficulty by target given percentage, and record the metric.

## Acceptance Criteria

- [ ] `createPuzzle({width, height, level, seed, signal})` → `Result<Puzzle, Error>`; a few reduction passes (other order / path) within the time budget, keep the lowest = **moeilijk** (minimal); **normaal** ~40% and **makkelijk** ~50% by adding givens back (decision 2026-11-22, see brief)
- [ ] 1 and N are never removed; result always has exactly one solution
- [ ] Solver calls use `maxNodes`; `node-limit` counts as "keep this given"; no unique puzzle within the time budget → explicit `err`
- [ ] Stored metric: given percentage and solver visited nodes of the final uniqueness check
- [ ] Property test: N random seeds → every produced puzzle passes the full validator
- [ ] Performance test (can be tagged/skipped in CI): 7×7 produces a unique puzzle within 5 s in ≥ 95% of runs; report metric distribution per level to show the levels differ

## Dependencies

- getallenpad-path-generator
- getallenpad-solver
