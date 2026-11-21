---
id: grid-generator
title: Grid generator (placement, difficulty, solution word)
intent: woordzoeker
complexity: high
mode: validate
status: pending
depends_on: [word-normalization]
created: 2026-11-21T18:25:00Z
---

# Work Item: Grid generator (placement, difficulty, solution word)

## Description

Core algorithm: place words in a width×height grid according to difficulty, optionally reserve leftover cells for a hidden solution word, fill the rest, and report what didn't fit. Deterministic from a seed.

## Acceptance Criteria

- [ ] Width and height independently 5–20
- [ ] Directions: Makkelijk = →, ↓; Normaal = + diagonals ↘ ↗; Moeilijk = all 8 directions incl. backwards
- [ ] Words may overlap only on identical letters
- [ ] Every placed word's position/direction is recorded (for solving, answers and printing)
- [ ] Words that cannot be placed are reported with a Dutch reason (too long vs. no room)
- [ ] Hidden solution word: the exact number of leftover cells equals the solution's letter count; leftover cells read in row order spell it; if impossible, a clear Dutch message
- [ ] Without a solution word, remaining cells are filled with random letters weighted towards Dutch letter frequency
- [ ] Same seed + same input → identical grid (needed for share links)
- [ ] 20×20 with 20 words generates in < 200 ms (test with timing guard)
- [ ] Unit tests with seeded RNG for all of the above

## Technical Notes

Location: `src/puzzles/woordzoeker/logic/generateGrid.ts`. Needs a design doc (validate mode): placement strategy (longest-first + retries/backtracking), how to hit an exact leftover count for the solution word, seeded PRNG choice, data model of a Puzzle.

## Dependencies

- word-normalization
