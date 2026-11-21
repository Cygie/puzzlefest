---
id: print-view
title: Print view (A4)
intent: woordzoeker
complexity: low
mode: autopilot
status: pending
depends_on: [play-ui]
created: 2026-11-21T18:25:00Z
---

# Work Item: Print view (A4)

## Description

Clean printable version of a puzzle.

## Acceptance Criteria

- [ ] 'Afdrukken' button opens print-optimized layout and triggers browser print
- [ ] A4 portrait: title/theme, grid with clear borders, word list, solution-word blanks (if any)
- [ ] Optional second page with answers (placed words highlighted)
- [ ] No app chrome (header/buttons) in print output

## Technical Notes

Use `@media print` CSS; grid sized in mm.

## Dependencies

- play-ui
