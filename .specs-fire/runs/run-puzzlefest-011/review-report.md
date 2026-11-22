---
run: run-puzzlefest-011
work_items: [shared-grid-generalize, getallenpad-model-validator]
---

# Review Report

## Work Item: shared-grid-generalize

- Implemented as planned. `GridController`/`GridStroke` now live in `Grid.tsx` and are re-exported by `LetterGrid.tsx`, so no caller changed. `LetterGrid.module.css` renamed to `Grid.module.css` (`.letters` → `.cells`), plus a focus ring and an active-cell style.
- Fix applied during review: in keyboard mode, Tab and Ctrl/⌘/Alt shortcuts were swallowed by the grid (Tab activated a cell, Ctrl+Z went to `onKey` as `z`). They are now left to the page, so an undo shortcut can live at page level. Test added.
- No auto-fixes needed (lint/prettier clean).
- Not changed (out of scope): the woordslang validator keeps its own per-step path checks instead of using `findPathProblem`, because it reports every problem with Dutch messages.

## Work Item: getallenpad-model-validator

- Implemented as planned.
- Fix applied during review: the shape guard accepted any number as `metric.givenRatio` (also > 1). It now requires 0..1, otherwise an out-of-range ratio could only be caught by the `metric` rule. Test added.
- Note: a duplicate value in the solution also produces follow-up `not-adjacent` messages (positions use the last occurrence). Acceptable for an admin-only message list; left as is.
- No auto-fixes needed.
