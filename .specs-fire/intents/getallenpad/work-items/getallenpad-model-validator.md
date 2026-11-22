---
id: getallenpad-model-validator
title: Getallenpad domain model and structural validator
intent: getallenpad
complexity: medium
mode: confirm
status: completed
depends_on:
  - shared-grid-generalize
created: 2026-11-22T11:15:00Z
run_id: run-puzzlefest-011
completed_at: 2026-11-22T13:48:24.496Z
---

# Work Item: Getallenpad domain model and structural validator

## Description

Strictly typed domain model for the getallenpad and a validator for structural correctness of a puzzle definition.

## Acceptance Criteria

- [ ] Types in `src/puzzles/getallenpad/logic/types.ts`: puzzle (id, width, height, givens, solution, difficulty level, metric), player state (entered values, undo history) — player state separate from the definition; no `any`, no stringly-typed coordinates
- [ ] Solution represented as value-per-cell (1..N) with helper to get the cell of value k
- [ ] `validatePuzzle` returns `Result` with specific errors: solution not a permutation of 1..N, consecutive values not adjacent, a given that differs from the solution, 1 or N not given, wrong dimensions
- [ ] Uniqueness check is a pluggable step (filled in by getallenpad-solver)
- [ ] Unit tests for each error and for a valid puzzle (hand-made fixture)

## Technical Notes

Rectangular grids only in v1; keep the model extensible for excluded cells later (no hard assumption that every index is playable beyond what v1 needs).

## Dependencies

- shared-grid-generalize
