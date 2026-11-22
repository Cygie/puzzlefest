---
id: woordslang-generator
title: Woordslang generator (backtracking + flood fill)
intent: woordslang
complexity: high
mode: validate
status: completed
depends_on:
  - woordslang-model-validator
created: 2026-11-21T23:50:00Z
run_id: run-puzzlefest-008
completed_at: 2026-11-22T08:04:32.932Z
---

# Work Item: Woordslang generator

## Description

Given theme, hint, key word, candidate words and grid size, produce a complete valid grid layout or an explicit error.

## Acceptance Criteria

- [ ] Input validation as Result errors: total letters ≠ cells, word longer than cells, key word cannot span the grid, invalid letters
- [ ] Places the key word first as an edge-to-edge path, then the other words path by path with backtracking
- [ ] Flood-fill pruning: no empty region smaller than the shortest remaining word; region sizes must be fillable by remaining word lengths
- [ ] Deterministic per seed (step budget, not time, decides the outcome); restarts with new order; separate wall-clock time-out (default 5 s) returning a distinct error
- [ ] Never returns a partial grid; every success passes the validator
- [ ] Tests: fixed seed → valid and identical output; impossible input → correct error; budget exhausted → error; fuzz over N seeds → all successes valid
- [ ] Measured: 6–8 words / 48 letters → ≥ 90% success within 5 s on the Raspberry Pi

## Technical Notes

Design doc before implementation (validate mode). No diagonal crossings between path segments.

## Dependencies

- woordslang-model-validator
