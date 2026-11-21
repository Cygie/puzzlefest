---
run: run-puzzlefest-007
work_items: [shared-letter-grid, woordslang-model-validator]
intent: woordslang
mode: confirm
checkpoint: plan
approved_at: 2026-11-21T23:58:00Z
---

# Implementation Plan: shared letter grid + woordslang model/validator

## 1. shared-letter-grid

### Approach

The Woordzoeker `PlayGrid` currently mixes three things: rendering (letters, SVG strokes), pointer handling (pointer → cell, capture) and *line* selection (swipe / two taps, `snapLine`). Split them:

- **`src/shared/grid/cells.ts`** — `Cell`, `sameCell`, `cellIndex`, `isNeighbour` (8 directions), `cellFromPoint` + `Rect` (moved from woordzoeker `selection.ts`, re-exported there so imports keep working).
- **`src/shared/grid/pathSelection.ts`** (pure) — path rules:
  - `extendPath(path, cell)`: neighbour of the last cell and not in the path → append; the second-last cell → step back (undo); anything else → unchanged.
  - `tapPath(path, cell)`: tap flow → `{ path, submit }`: first tap starts, a neighbour extends, the second-last undoes, tapping the last cell again submits, a non-adjacent cell starts a new path.
- **`src/shared/grid/LetterGrid.tsx`** — puzzle-agnostic component: rows of letters, `strokes` (each a list of cells + colour, drawn as SVG polylines, so straight lines and bent paths look alike), `preview` cells, `highlightCells`, `ariaLabel`, `disabled`, and a `controller` with `start(cell) / move(cell) / end() / cancel()`.
- **Controllers (hooks)**:
  - `useLineSelection` (woordzoeker, in its own folder): today's swipe + tap-start/tap-end behaviour with `snapLine`.
  - `usePathSelection` (shared): drag through neighbours with `extendPath`, tap-by-tap with `tapPath`.
- Woordzoeker `PlayGrid` becomes a thin wrapper (`LetterGrid` + `useLineSelection`) with the same props, test ids and aria labels, so the screens and tests don't change.

### Files

| File | Change |
|------|--------|
| `src/shared/grid/cells.ts` (+ test) | new |
| `src/shared/grid/pathSelection.ts` (+ test) | new |
| `src/shared/grid/usePathSelection.ts` | new |
| `src/shared/grid/LetterGrid.tsx`, `LetterGrid.module.css` (+ test) | new (CSS moved from `PlayGrid.module.css`) |
| `src/puzzles/woordzoeker/components/useLineSelection.ts` | new (logic moved from `PlayGrid`) |
| `src/puzzles/woordzoeker/components/PlayGrid.tsx` | wrapper |
| `src/puzzles/woordzoeker/logic/selection.ts`, `directions.ts` | re-export shared `Cell`, `cellFromPoint`, `sameCell` |

### Tests

- `pathSelection.test.ts`: append neighbour, reject non-neighbour / repeated cell, undo via second-last, diagonal steps, tap flow (start, extend, undo, submit, restart).
- `LetterGrid.test.tsx`: drag along a bent path with pointer events → `onSelect` gets that path; tap flow; disabled; strokes render as polylines.
- Woordzoeker regression: all existing tests (PlayScreen swipe/tap, page, print) unchanged and green.

## 2. woordslang-model-validator

### Approach

- **`src/shared/result.ts`** — `Result<T, E> = { ok: true; value: T } | { ok: false; error: E }` + `ok()` / `err()` helpers.
- **`src/puzzles/woordslang/logic/types.ts`**:
  - `WoordslangPuzzle { version: 1; id; theme; hint; width; height; grid: string[]; words: SlangWord[] }`
  - `SlangWord { display; letters; path: Cell[]; key?: true }` — exactly one word has `key: true`.
  - Cells stay `{ row, col }` objects, in JSON too: typed, and no string coordinates.
- **`isWoordslangPuzzle(value: unknown)`** — runtime guard for JSON (shapes, integers, sizes 3–12, rows match width/height, letters A–Z).
- **`validatePuzzle(puzzle): Result<WoordslangPuzzle, ValidationError[]>`** — collects *all* problems, each with a typed `code` and a Dutch `message`:

| code | rule |
|------|------|
| `letter-count` | total word letters ≠ width × height |
| `path-length` | path length ≠ word length |
| `out-of-bounds` | cell outside the grid |
| `not-adjacent` | consecutive cells not 8-neighbours |
| `repeated-cell` | a cell twice in one word |
| `overlap` | a cell in two words |
| `uncovered` | a cell in no word |
| `letter-mismatch` | grid letter ≠ word letter on the path |
| `key-word` | not exactly one key word |
| `key-edges` | key word does not touch left+right or top+bottom |
| `crossing` | two diagonal steps cross inside the same 2×2 square (between words or within one) |
| `word-normalization` | `letters` ≠ normalized `display` (IJ = I + J, shared woordzoeker normalization) |

### Files

| File | Change |
|------|--------|
| `src/shared/result.ts` (+ test) | new |
| `src/puzzles/woordslang/logic/types.ts` | new |
| `src/puzzles/woordslang/logic/validatePuzzle.ts` (+ test) | guard + validator |
| `src/puzzles/woordslang/logic/testPuzzle.ts` | valid 6×8 fixture (hand-made) |

### Tests

A valid fixture passes. For each rule above, one mutated fixture fails with exactly that code. The guard rejects malformed JSON (wrong types, ragged rows, non-integer cells).

## Not in this run

Generator, admin page, play page and routes (later work items). No visible change in the app; the woordzoeker looks and behaves the same.
