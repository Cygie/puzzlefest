---
id: puzzle-setup-ui
title: Puzzle setup screen
intent: woordzoeker
complexity: medium
mode: confirm
status: pending
depends_on: [theme-word-lists, grid-generator]
created: 2026-11-21T18:25:00Z
---

# Work Item: Puzzle setup screen

## Description

Dutch screen to configure and generate a woordzoeker.

## Acceptance Criteria

- [ ] Theme picker; choosing a theme pre-fills the word list (count adapts to grid size)
- [ ] Word list editor: add (type + enter), remove, clear; shows normalization errors inline
- [ ] Width and height controls (5–20), touch-friendly
- [ ] Difficulty selector: Makkelijk / Normaal / Moeilijk with short explanation
- [ ] Optional solution word/sentence input
- [ ] 'Genereer' button generates the puzzle; errors from the generator shown in Dutch
- [ ] Settings remembered between sessions (localStorage)
- [ ] Component tests for main flow (theme → edit → generate)

## Technical Notes

Mobile-first layout; works one-handed on a ~360px wide screen.

## Dependencies

- theme-word-lists
- grid-generator
