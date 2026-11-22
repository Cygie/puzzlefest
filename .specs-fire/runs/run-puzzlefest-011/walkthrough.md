---
run: run-puzzlefest-011
work_items: [shared-grid-generalize, getallenpad-model-validator]
intent: getallenpad
generated: 2026-11-22T13:48:37Z
mode: confirm
---

# Implementation Walkthrough: shared grid + getallenpad model

## Summary

The shared grid no longer assumes letters: `Grid` renders any cell content, lets a module style single cells and can be driven by the keyboard. Flood fill and a path check now live in `src/shared/grid/`. On top of that, the getallenpad has its domain model and a validator that checks every puzzle rule, with uniqueness as a pluggable step for the solver.

## Structure

```
src/shared/grid/
  Grid.tsx         ← generic board (pointer, strokes, optional keyboard)
  LetterGrid.tsx   ← letters → Grid (woordzoeker, woordslang unchanged)
  regions.ts       ← neighbourTable, labelRegions (flood fill)
  paths.ts         ← findPathProblem / isValidPath
src/puzzles/getallenpad/logic/
  types.ts         ← GetallenpadPuzzle, Level, DifficultyMetric, PlayerState
  model.ts         ← positionsByValue, givenCells, givenRatio, emptyPlayerState
  validatePuzzle.ts← isGetallenpadPuzzle (JSON shape) + validatePuzzle (rules)
```

## Domain model

| Entity | Properties | Rules |
|--------|------------|-------|
| GetallenpadPuzzle | id, level, width, height (3–10), solution rows, givens rows, metric, seed? | solution = 1..N once; k and k+1 touch; givens match solution; 1 and N given; stored ratio matches givens |
| DifficultyMetric | givenRatio (0..1), solverNodes | ratio checked by the validator; nodes filled in by the solver later |
| PlayerState | entries, history | separate from the puzzle; givens not stored |

## Key decisions

- **Keyboard on the grid, shortcuts on the page**: arrows move a roving active cell (`aria-activedescendant`); Tab and Ctrl/⌘/Alt combos are not touched, so undo (Ctrl+Z) can be handled by the play page.
- **No keyboard prop → same markup as before** (`role="img"` with the label), so existing accessible names and tests stay valid.
- **JSON as rows** (`solution`, `givens`) so published puzzles are readable and diffable in the repo; redundancy between givens and solution is checked.
- **Uniqueness pluggable**: `validatePuzzle(puzzle, { countSolutions })`; only called when all other rules pass.
- **Max grid 10×10** (woordslang: 12) to keep solving bounded; can be raised after measuring the solver.

## Deviations from plan

- None in scope. Two small review fixes: Tab/shortcut handling in keyboard mode; `givenRatio` bounded to 0..1 in the shape guard.
- Woordslang's validator still has its own per-step path checks (decided in the plan).

## Dependencies added

None.

## How to verify

```bash
npm test                      # 39 files, 345 tests
npx vitest run src/shared/grid src/puzzles/getallenpad
npm run build
```

Manual: woordzoeker and woordslang play pages look and behave as before (grid styling moved to `Grid.module.css`).

## Developer notes

- `LetterGrid` default test id stays `letter-grid`; `Grid` defaults to `grid`.
- In keyboard mode the first non-arrow key only activates the top-left cell; it is not forwarded.
- Not yet checked in a real browser / with a screen reader.
