---
id: shared-letter-grid
title: Shared letter grid with line and path selection
intent: woordslang
complexity: medium
mode: confirm
status: completed
depends_on: []
created: 2026-11-21T23:50:00Z
run_id: run-puzzlefest-007
completed_at: 2026-11-21T22:42:53.805Z
---

# Work Item: Shared letter grid with line and path selection

## Description

Extract the grid rendering and pointer handling from the Woordzoeker `PlayGrid` into a shared component with two selection strategies: straight line (woordzoeker) and free 8-neighbour path (woordslang).

## Acceptance Criteria

- [ ] Shared grid component (e.g. `src/shared/grid/LetterGrid.tsx`) renders letters, found-word strokes and highlights; puzzle-agnostic
- [ ] Shared cell/coordinate types and helpers (neighbours, adjacency) in `src/shared/grid/`
- [ ] Line strategy reproduces current woordzoeker behaviour (swipe and tap start/end)
- [ ] Path strategy: drag through neighbouring cells, direction changes allowed, moving back onto the previous cell undoes the last step, no cell twice; tap-to-extend with consecutive taps, tap the last cell again to submit
- [ ] Woordzoeker uses the shared component; all existing woordzoeker tests pass unchanged (behaviour) 
- [ ] Unit tests for path selection logic (valid/invalid step, backtrack, tap flow)

## Technical Notes

Keep pure selection logic separate from the component so it is testable without the DOM. Accessible labels stay as today.

## Dependencies

(none)
