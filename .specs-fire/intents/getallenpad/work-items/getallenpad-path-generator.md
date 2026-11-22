---
id: getallenpad-path-generator
title: Hamiltonian path generator (Warnsdorff + backtracking)
intent: getallenpad
complexity: high
mode: validate
status: pending
depends_on: [getallenpad-model-validator]
created: 2026-11-22T11:15:00Z
---

# Work Item: Hamiltonian path generator (Warnsdorff + backtracking)

## Description

Generate a random Hamiltonian path over a W×H grid with 8-neighbour adjacency.

## Acceptance Criteria

- [ ] Backtracking DFS ordered by Warnsdorff (fewest onward moves first), ties broken by the seeded RNG (`src/shared/random.ts`)
- [ ] Deterministic: same seed + size → same path
- [ ] Step budget / time-out per attempt, restart with derived seed; overall time-out returns `err` (never a partial path)
- [ ] Cancellable via `AbortSignal`
- [ ] Tests: valid Hamiltonian path (via shared `isValidPath` + covers all cells) for fixed seeds and several sizes incl. rectangular; time-out path with tiny budget; restart behaviour; abort
- [ ] 7×7 path in well under 1 s on the Raspberry Pi in typical runs

## Technical Notes

Optional flood-fill check for disconnected empty regions can speed up failures; measure before adding.

## Dependencies

- getallenpad-model-validator
