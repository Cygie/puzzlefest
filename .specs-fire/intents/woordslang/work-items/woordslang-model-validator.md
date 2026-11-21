---
id: woordslang-model-validator
title: Woordslang model and validator
intent: woordslang
complexity: medium
mode: confirm
status: completed
depends_on: []
created: 2026-11-21T23:50:00Z
run_id: run-puzzlefest-007
completed_at: 2026-11-21T22:42:54.346Z
---

# Work Item: Woordslang model and validator

## Description

Strictly typed domain model for woordslang puzzles, a generic `Result` type, a runtime guard for puzzle JSON, and the validator.

## Acceptance Criteria

- [ ] Types: puzzle (id, theme, hint, width, height, grid rows, words with paths, key word), cell coordinates, word path — no `any`, no string coordinates
- [ ] `Result<T, E>` type in `src/shared/result.ts` with typed error codes and Dutch messages
- [ ] `isWoordslangPuzzle` guard for untrusted JSON
- [ ] Validator reports (as Result errors): incomplete coverage, overlap, non-adjacent step, repeated cell in a word, letters on the path not matching the word, key word not touching opposite edges, total word length ≠ cells, paths crossing diagonally
- [ ] Letters normalized with the woordzoeker normalization (IJ = two cells)
- [ ] Unit tests per rule (valid fixture + one broken fixture per rule)

## Technical Notes

Words are stored with their path; the grid letters are derivable but kept for readability and checked for consistency.

## Dependencies

(none)
