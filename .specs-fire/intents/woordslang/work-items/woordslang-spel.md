---
id: woordslang-spel
title: Woordslang play page
intent: woordslang
complexity: medium
mode: confirm
status: pending
depends_on: [shared-letter-grid, woordslang-model-validator, woordslang-beheer]
created: 2026-11-21T23:50:00Z
---

# Work Item: Woordslang play page

## Description

Players choose a published puzzle and solve it with path selection on mouse and touch.

## Acceptance Criteria

- [ ] Routes `#/woordslang` (list) and `#/woordslang/<id>` (play); back button works like the woordzoeker; header link and home page card
- [ ] Play: hint shown; path selection; found word stays marked; key word in its own colour; short Dutch message for a non-theme word; found count
- [ ] Completed when every cell belongs to a found word; completion message
- [ ] Progress (found words) saved per puzzle in localStorage, versioned; list shows solved/in progress
- [ ] Works with mouse and touch; accessible labels
- [ ] Component tests: valid path, invalid path, already found word, tap flow, completion, progress restore
- [ ] Woordzoeker regression: full suite green

## Dependencies

- shared-letter-grid
- woordslang-model-validator
- woordslang-beheer
