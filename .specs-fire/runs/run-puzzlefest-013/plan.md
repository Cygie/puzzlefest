---
run: run-puzzlefest-013
work_item: getallenpad-reduction
intent: getallenpad
mode: confirm
checkpoint: plan
approved_at: 2026-11-22T14:56:08Z
---

# Implementation Plan: Puzzle reduction and difficulty metric

## Approach

`createPuzzle(input, options)` in `src/puzzles/getallenpad/logic/createPuzzle.ts`:

```ts
interface CreateInput { width: number; height: number; level: Level; seed: number; id?: string }
interface CreateOptions { timeoutMs?: number /* 5000 */; passes?: number /* 3 */; now?; signal? }
type CreateErrorCode = 'grid-size' | 'no-path' | 'timeout' | 'aborted';
createPuzzle(input, options): Result<GetallenpadPuzzle, CreateError>
```

1. **Minimal puzzle** — `passes` (3) greedy reduction passes, each on a new path and removal order from the seeded RNG: start from the full solution, try removing each number (1 and N never), keep the removal when `countSolutions(..., { maxNodes: 100 000 })` is exactly 1; a `node-limit` keeps the number. Keep the pass with the fewest givens (tie: more solver nodes).
2. **Level** (decision 2026-11-22): **moeilijk** = the minimal puzzle; **normaal** = add givens back to `ceil(N × 0.40)`, **makkelijk** to `ceil(N × 0.50)` (random removed cells, seeded). If the minimal puzzle already has more givens than the target, it is used as is. Adding givens never breaks uniqueness.
3. **Metric** — final `countSolutions` without node limit → `solverNodes`; `givenRatio` = givens / N. Stored in the puzzle with `seed`.
4. **Safety net** — `validatePuzzle(puzzle, { countSolutions: uniquenessCheck })` must pass, otherwise throw (bug).
5. **Time / abort** — one deadline (`timeoutMs`) for the whole call, checked between solver calls and passed on as `signal` to generator/solver. If the deadline hits **after** at least one pass is complete, the best puzzle so far is returned (still unique and valid, only possibly not the lowest); during the first pass → `err('timeout')`. Deterministic per seed whenever all passes finish in time.
6. Default id: `{width}x{height}-{level}-{seed}`.

## Files to Create

| File | Purpose |
|------|---------|
| `src/puzzles/getallenpad/logic/createPuzzle.ts` | `createPuzzle`, level targets, error codes + Dutch messages |
| `src/puzzles/getallenpad/logic/createPuzzle.test.ts` | Unit + property tests |
| `src/puzzles/getallenpad/logic/createPuzzle.bench.test.ts` | Pi benchmark (`BENCH=1`) |

## Files to Modify

| File | Changes |
|------|---------|
| (none) | |

## Tests

| Test File | Coverage |
|-----------|----------|
| `createPuzzle.test.ts` | always exactly one solution; 1 and N given; same seed → same puzzle; makkelijk ≥ normaal ≥ moeilijk givens for one seed; targets hit when above the minimum; metric stored and correct; `grid-size`; time-out during first pass → `timeout`; deadline after pass 1 → best-so-far; abort; **property**: 30 seeds × 3 levels on 5×5 and 10 seeds on 7×7 → all pass the full validator |
| `createPuzzle.bench.test.ts` | 100 seeds 7×7 per level: success within 5 s (target ≥ 95%), time, givens %, solver nodes per level (shows the levels differ) |

---

# Implementation Plan: Admin page and puzzle publishing (getallenpad-beheer)

checkpoint: plan — approved 2026-11-22

## Approach

1. **Worker** — `beheer/createPuzzle.worker.ts` receives `{ width, height, level, seed?, count }`, calls `createPuzzle` for each puzzle (seed: given → seed, seed+1, …; empty → random per puzzle) and posts each result as soon as it is ready (`{ type: 'puzzle', result }`, then `{ type: 'done' }`). **Cancel = `worker.terminate()`**: the worker is busy in a synchronous loop and cannot read a cancel message, so a new worker is started for the next job. Puzzles already received are kept.
2. **Client** — `beheer/puzzleFactory.ts`: interface `PuzzleFactory { start(request, onPuzzle, onDone): cancel }`, with `workerFactory()` (Vite `new Worker(new URL(...), { type: 'module' })`). The page takes the factory as a prop (default: worker). jsdom has no Worker, so tests pass an in-process factory.
3. **Admin page** — `beheer/BeheerPage.tsx`, route `#/getallenpad/beheer`, wired in `App.tsx` the same way as woordslang (`import.meta.env.DEV ? lazy(...) : null`, so it is absent from the production build).
   - Inputs: width and height (`NumberStepper`, 3–10, default 7), level (3 choices), seed (optional), batch size (1–20).
   - "Genereer" → progress "3 van 10 klaar", "Stop" button, page stays usable.
   - List of results (id, givens %, solver nodes, or the error message). The selected puzzle shows a preview: the shared `Grid` with givens and next to it the full solution, plus the metric.
   - Export: copy/download JSON of the selected puzzle (`{id}.json`) and "Download alle" for the batch (one JSON per puzzle, one download each; no zip, to avoid adding a dependency).
   - JSON formatting: rows on one line per row (shared helper with woordslang `formatPuzzleJson` if it fits, otherwise its own).
4. **Data** — `src/puzzles/getallenpad/data/` with `index.ts` (same pattern as woordslang: `import.meta.glob`, `PUZZLE_FILES`, `publishedPuzzles()` sorted by level then id, `findPuzzle`). **Starter set: 3 puzzles per level on 7×7 (9 files)**, generated once with a skipped test file (`GENERATE=1`, like the benchmarks) that writes the JSON; that file stays for regenerating.
5. **CI check** — `data/puzzles.test.ts`: every file passes `isGetallenpadPuzzle`, file name = id, `validatePuzzle` with `uniquenessCheck` (full uniqueness); ids unique; at least one puzzle per level.

## Files to Create

| File | Purpose |
|------|---------|
| `src/puzzles/getallenpad/beheer/createPuzzle.worker.ts` | Worker: batch generation |
| `src/puzzles/getallenpad/beheer/puzzleFactory.ts` | `PuzzleFactory` interface, worker + in-process implementations |
| `src/puzzles/getallenpad/beheer/BeheerPage.tsx` + `.module.css` | Admin page |
| `src/puzzles/getallenpad/beheer/BeheerPage.test.tsx` | Component test: generate → preview → export, batch progress, stop |
| `src/puzzles/getallenpad/beheer/puzzleFactory.test.ts` | In-process factory: batch order, seeds, cancel |
| `src/puzzles/getallenpad/data/index.ts`, `puzzles.test.ts` | Published puzzles + CI validation |
| `src/puzzles/getallenpad/data/*.json` | 9 starter puzzles |
| `src/puzzles/getallenpad/data/generate.test.ts` | One-off generator (`GENERATE=1`) |

## Files to Modify

| File | Changes |
|------|---------|
| `src/app/App.tsx` | Dev-only route `#/getallenpad/beheer` |
| `src/app/App.test.tsx` | Route test (dev shows the admin page) |

## Not in this item
- No `getallenpad` entry on the home page or play route yet; that comes with `getallenpad-spel`.

---

# Implementation Plan: Getallenpad play page (getallenpad-spel)

checkpoint: plan — approved 2026-11-22

## Approach

### Pure game logic — `logic/play.ts` (no React)
- `boardValues(puzzle, state)`: givens + player entries per cell (row-major).
- `applyDrag(puzzle, state, path)` → `Result<PlayerState, DragError>`. The first cell must hold a number v (given or entered). **Direction**: ascending (v+1, v+2, …) unless v+1 is already on the board and v−1 is not, then descending. That covers "drag from the higher number towards the gap below it".
  - A given on the path is accepted only when it equals the number it would get; otherwise → `err({ code: 'given-collision', cell })`. Running past 1 or N → `err('out-of-range')`. Rejected drags change nothing.
  - Player entries on the path are overwritten. **Decision 2026-11-22**: a player entry with the same value elsewhere is removed automatically (a value lives in one place); givens are never removed, so a value equal to a given elsewhere is still marked as a duplicate.
- `setEntry(puzzle, state, cell, value | null)`: keyboard input / clear; never on a given; value must be 1..N; removes an earlier player entry with the same value (same decision).
- Every change pushes the previous `entries` onto `history`; `undo(state)` pops it.
- `findErrors(puzzle, state)` → set of cells: (a) a value that occurs more than once; (b) value k whose k−1 or k+1 is placed exactly once but not adjacent (8 directions). Errors show immediately, also on a partly filled board.
- `isSolved`: all cells filled and no errors (with unique solutions this equals the solution; also checked against `solution` in tests).
- `pathStrokes(values)`: runs of consecutive numbers on adjacent cells → strokes for the shared `Grid`.

### Progress — `logic/progress.ts`
`localStorage` via `shared/storage` (`getallenpad:<id>`, version 1): entries only (undo history is not kept across reloads). Invalid/foreign data → fresh state. `puzzleStatus(puzzle)` → new / busy (x of y open cells filled) / solved, for the list.

### UI — `components/`
- `PuzzleListScreen`: grouped by level (Makkelijk / Normaal / Moeilijk), card with size and status.
- `PadPlayScreen`: shared `Grid` with
  - own controller `useNumberDrag` (built on `extendPath`): drag → `applyDrag`; tap without dragging → makes that cell the active cell for typing;
  - keyboard via `GridKeyboard`: arrows move, digits build a number (two digits within 1 s, max N), Backspace/Delete clears, Ctrl/⌘+Z undoes;
  - givens bold on a tinted background, player numbers normal, errors red, rejected drag: the colliding cell flashes red + `aria-live` message ("Daar staat al een ander getal.");
  - buttons Ongedaan maken, Terug; solved banner "Opgelost!" and the grid becomes read-only.
- `GetallenpadPage`: `#/getallenpad` list, `#/getallenpad/<id>` play, unknown id → back to list with notice (same as woordslang).
- App: route `getallenpad`, nav link, home tile. Own name and look.

## Files to Create

| File | Purpose |
|------|---------|
| `src/puzzles/getallenpad/logic/play.ts` + `.test.ts` | Drag/keyboard rules, errors, solved, strokes, undo |
| `src/puzzles/getallenpad/logic/progress.ts` + `.test.ts` | Save/restore, list status |
| `src/puzzles/getallenpad/components/useNumberDrag.ts` | Grid controller for drag + tap |
| `src/puzzles/getallenpad/components/PadPlayScreen.tsx` + `.test.tsx` | Play screen |
| `src/puzzles/getallenpad/components/PuzzleListScreen.tsx` | List by level |
| `src/puzzles/getallenpad/components/Getallenpad.module.css` | Styles |
| `src/puzzles/getallenpad/GetallenpadPage.tsx` + `.test.tsx` | Routing list/play |

## Files to Modify

| File | Changes |
|------|---------|
| `src/app/useHashRoute.ts` | Route `getallenpad` |
| `src/app/App.tsx`, `HomePage.tsx` (+ tests) | Nav link, page, home tile |

## Tests (Testing Library + unit)
Drag ascending and descending, given collision rejected (state unchanged + feedback), drag through a matching given, undo (button + Ctrl+Z), keyboard: arrows, one- and two-digit input, clear; error marking (non-adjacent neighbour, duplicate) while the board is partly filled; solved; progress restored after remount; list grouped by level with status. Full suite (woordzoeker, woordslang) stays green.
