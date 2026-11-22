---
id: shared-grid-generalize
title: Generic grid cell content and shared path/region utilities
intent: getallenpad
complexity: medium
mode: confirm
status: completed
depends_on: []
created: 2026-11-22T11:15:00Z
run_id: run-puzzlefest-011
completed_at: 2026-11-22T13:31:57.371Z
---

# Work Item: Generic grid cell content and shared path/region utilities

## Description

Make the shared grid puzzle-agnostic so it can render numbers as well as letters, and move generic path/region logic out of the woordslang module into `src/shared/grid/`.

## Acceptance Criteria

- [ ] `LetterGrid` (or a renamed generic grid) accepts generic cell content (e.g. a `renderCell(cell)` prop or a content array); letter usage stays a thin wrapper so woordzoeker and woordslang need no behavioural change
- [ ] Per-cell styling hook (class/state per cell) so a module can mark givens, errors and selection
- [ ] Neighbour table, region labeling / flood fill (now `woordslang/logic/regions.ts`) moved to `src/shared/grid/`; woordslang imports from there
- [ ] Shared `isValidPath(path, width, height)` (adjacent steps, no cell twice, in grid) with unit tests
- [ ] Keyboard focus/selection of a single cell is possible (needed later for typed input)
- [ ] All existing woordzoeker and woordslang tests pass unchanged

## Technical Notes

`canPartition` is woordslang-specific and stays there. Keep accessible labels as today.

## Dependencies

(none)
