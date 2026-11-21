---
run: run-puzzlefest-002
work_item: grid-generator
intent: woordzoeker
mode: validate
checkpoint: plan (checkpoint 2)
approved_at: 2026-11-21T18:35:00Z
---

# Implementation Plan: Grid generator (placement, difficulty, solution word)

## Approach

Implement the approved design in four small modules. `generateGrid` validates input, pre-checks solution fit, then runs up to `MAX_ATTEMPTS` seeded attempts: place words longest-first from enumerated candidates (weighted towards overlaps; with a solution word, steered towards the exact required overlap count), fill the remaining cells (solution letters in row order, or flattened Dutch-frequency letters), verify no accidental duplicates, and return the first valid puzzle — or the best partial with unplaced words. One `Rng` instance from the seed drives everything, so output is deterministic.

## Files to Create

| File | Purpose |
|------|---------|
| `src/puzzles/woordzoeker/logic/types.ts` | `Difficulty`, `Direction`, `PlacedWord`, `Puzzle`, `GenerateInput`, `GenerateResult` |
| `src/puzzles/woordzoeker/logic/directions.ts` | Direction vectors, `DIRECTIONS_BY_DIFFICULTY`, `wordCells()` helper |
| `src/puzzles/woordzoeker/logic/letterFrequency.ts` | Flattened Dutch frequency table + `randomFillLetter(rng)` |
| `src/puzzles/woordzoeker/logic/generateGrid.ts` | `generateGrid`, `checkSolutionFit`, constants (`MIN_SIZE`, `MAX_SIZE`, `MAX_ATTEMPTS`) |
| `src/puzzles/woordzoeker/logic/generateGrid.test.ts` | Tests |
| `src/puzzles/woordzoeker/logic/directions.test.ts` | Direction helper tests |

## Files to Modify

| File | Changes |
|------|---------|
| (none) | |

## Tests

| Test File | Coverage |
|-----------|----------|
| `generateGrid.test.ts` | size validation; each difficulty uses only its directions (checked over many seeds); every word found in grid at recorded position; overlaps only on identical letters; too-long vs no-room reasons; solution word: leftover cells spell it, impossible case message, `checkSolutionFit`; fill letters A–Z only; no accidental duplicates; same seed → identical puzzle, different seed → different; 20×20 + 20 words < 200 ms |
| `directions.test.ts` | vectors and `wordCells` |

## Technical Details

- Candidate = (row, col, direction) where the word stays in bounds and each cell is empty or holds the same letter. Weight = 1 + 3 × overlaps (no solution) — overlap preference keeps grids compact.
- Overlap steering (solution word): track `remainingOverlapNeeded`; prefer candidates whose overlap count keeps the target reachable; final check `freeCells === solution.length`.
- Duplicate check scans each word (and its reverse in Moeilijk/all directions used) across the grid; an occurrence counts as accidental only if it uses at least one filler cell.
- Timing test uses `performance.now()` with a generous margin to avoid flakiness on the Pi.

## Based on Design Doc

Reference: `.specs-fire/intents/woordzoeker/work-items/grid-generator-design.md`
