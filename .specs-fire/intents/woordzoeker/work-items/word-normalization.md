---
id: word-normalization
title: Word normalization & validation
intent: woordzoeker
complexity: low
mode: autopilot
status: completed
depends_on:
  - project-scaffold
created: 2026-11-21T18:25:00Z
run_id: run-puzzlefest-001
completed_at: 2026-11-21T18:16:12.760Z
---

# Work Item: Word normalization & validation

## Description

Pure functions that turn user/theme input into grid-ready words and report problems in Dutch.

## Acceptance Criteria

- [ ] Uppercases, strips diacritics (é→E, ë→E, ï→I), removes spaces, hyphens and apostrophes
- [ ] IJ is kept as two letters I + J
- [ ] Rejects words with non-letters after normalization, empty words, and words < 2 letters, with a Dutch reason
- [ ] Detects duplicates (after normalization) and reports them
- [ ] Returns both the normalized form and the original display form
- [ ] Unit tests cover all cases incl. Dutch examples (café, ijs-beer, 's-Hertogenbosch)

## Technical Notes

Location: `src/puzzles/woordzoeker/logic/normalize.ts`. Return result objects, don't throw.

## Dependencies

- project-scaffold
