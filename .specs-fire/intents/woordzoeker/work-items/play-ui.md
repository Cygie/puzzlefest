---
id: play-ui
title: Play screen (solve, timer, completion)
intent: woordzoeker
complexity: medium
mode: confirm
status: in_progress
depends_on:
  - puzzle-setup-ui
created: 2026-11-21T18:25:00Z
---

# Work Item: Play screen (solve, timer, completion)

## Description

Interactive solving of a generated puzzle on screen.

## Acceptance Criteria

- [ ] Grid scales to screen width; cells are large enough to touch
- [ ] Select a word by swiping (pointer events) from first to last letter, or tapping start and end cell
- [ ] Selection snaps to valid straight lines; correct words get highlighted and crossed off in the word list
- [ ] Backwards selection of a word counts as found
- [ ] Timer starts on first interaction, pauses when app is hidden
- [ ] Completion screen: time, solution word (if any), 'Nieuwe puzzel' and 'Opnieuw'
- [ ] Component tests for selection logic (pure helper) and completion

## Technical Notes

Keep selection geometry in a pure helper in `logic/` for testability; prevent page scroll while swiping over the grid.

## Dependencies

- puzzle-setup-ui
