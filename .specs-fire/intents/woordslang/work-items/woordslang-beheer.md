---
id: woordslang-beheer
title: Admin page and puzzle publishing
intent: woordslang
complexity: medium
mode: confirm
status: pending
depends_on: [woordslang-generator, shared-letter-grid]
created: 2026-11-21T23:50:00Z
---

# Work Item: Admin page and puzzle publishing

## Description

Dev-only admin page to create puzzles, and the repo-based publishing of puzzle JSON files.

## Acceptance Criteria

- [ ] `#/woordslang/beheer` exists only in dev builds (`import.meta.env.DEV`); not reachable or bundled on the live site
- [ ] Inputs: theme, hint, key word, words, width/height (default 6×8); live letter count vs cells
- [ ] Generate (with seed shown, "opnieuw" for another seed) → preview grid with word paths and key word colour; Dutch error messages
- [ ] Copy/download puzzle JSON ready to add to `src/puzzles/woordslang/data/`
- [ ] Bundled puzzle index loads all JSON files in that folder
- [ ] Test runs every published puzzle through the guard + validator (fails CI on an invalid puzzle)
- [ ] 2–3 sample puzzles published

## Dependencies

- woordslang-generator
- shared-letter-grid
