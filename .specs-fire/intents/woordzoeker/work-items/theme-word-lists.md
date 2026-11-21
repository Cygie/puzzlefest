---
id: theme-word-lists
title: Built-in Dutch theme word lists
intent: woordzoeker
complexity: low
mode: autopilot
status: completed
depends_on:
  - project-scaffold
created: 2026-11-21T18:25:00Z
run_id: run-puzzlefest-001
completed_at: 2026-11-21T18:17:48.543Z
---

# Work Item: Built-in Dutch theme word lists

## Description

Bundle curated Dutch word lists per theme for pre-filling the word list.

## Acceptance Criteria

- [ ] At least 8 themes: dieren, eten & drinken, sport, beroepen, natuur, kleding, vervoer, huis
- [ ] Each theme has ≥ 30 common, family-friendly Dutch words of varying length (3–12 letters)
- [ ] Typed data: `{ id, naam, woorden[] }`; exported list of all themes
- [ ] Helper to pick N random words from a theme that fit a given max length (seedable RNG)
- [ ] Test: every word in every list passes word-normalization

## Technical Notes

Location: `src/puzzles/woordzoeker/data/themes.ts`.

## Dependencies

- project-scaffold
