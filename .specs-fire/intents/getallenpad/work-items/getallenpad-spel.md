---
id: getallenpad-spel
title: Getallenpad play page
intent: getallenpad
complexity: medium
mode: confirm
status: pending
depends_on: [shared-grid-generalize, getallenpad-model-validator, getallenpad-beheer]
created: 2026-11-22T11:15:00Z
---

# Work Item: Getallenpad play page

## Description

Play page for published getallenpad puzzles with drag and keyboard input, immediate error feedback and saved progress.

## Acceptance Criteria

- [ ] Hash route + tile on the home page; puzzle list grouped by level
- [ ] Givens visually distinct; path drawn as a line between consecutive numbers
- [ ] Drag from a numbered cell over empty cells numbers them ascending (descending when starting from the higher neighbour's side); numbering that collides with a given is rejected with visual feedback
- [ ] Tap/focus an empty cell and type a number (keyboard); arrow keys move focus; clear a cell
- [ ] Undo (button + keyboard shortcut)
- [ ] Immediate error marking: a value whose placed neighbour k−1 or k+1 is not adjacent; duplicate values
- [ ] Solved state when all cells filled and path valid
- [ ] Progress saved in `localStorage` per puzzle and restored
- [ ] Testing Library tests: drag ascending and descending, given collision rejected, undo, keyboard input, error marking, solved
- [ ] All existing woordzoeker and woordslang tests pass

## Technical Notes

Number-specific rendering lives in `src/puzzles/getallenpad/`, not in the shared grid. Own name and look; no names or visuals of commercial puzzle games.

## Dependencies

- shared-grid-generalize
- getallenpad-model-validator
- getallenpad-beheer
