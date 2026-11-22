---
id: getallenpad-solver
title: Counting solver with pruning and uniqueness check
intent: getallenpad
complexity: high
mode: validate
status: pending
depends_on: [getallenpad-model-validator]
created: 2026-11-22T11:15:00Z
---

# Work Item: Counting solver with pruning and uniqueness check

## Description

DFS solver that counts solutions up to 2 (0 / 1 / many) for a grid with givens, with pruning, and reports search effort.

## Acceptance Criteria

- [ ] `countSolutions(puzzle, {limit: 2, signal})` returns 0, 1 or 'many' plus number of visited nodes
- [ ] Stops at the second solution (no full enumeration) — test proves it via node count / early exit
- [ ] Pruning: distance between consecutive placed values (Chebyshev distance ≤ value difference); flood fill on empty regions (unreachable/isolated empty cells)
- [ ] Oracle test: pruning on vs off gives identical counts on many small random grids (e.g. 3×3–4×4)
- [ ] Known puzzles with 0, 1 and multiple solutions as fixtures
- [ ] Validator's uniqueness step wired to the solver
- [ ] Cancellable via `AbortSignal`

## Dependencies

- getallenpad-model-validator
