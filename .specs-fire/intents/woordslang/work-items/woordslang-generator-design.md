---
work_item: woordslang-generator
intent: woordslang
created: 2026-11-22T00:20:00Z
mode: validate
checkpoint_1: approved
---

# Design: Woordslang generator

## Summary

A pure TypeScript generator in `src/puzzles/woordslang/logic/generatePuzzle.ts`.
- **Input:** theme, hint, key word, other words, width × height, seed.
- **Output:** `Result<WoordslangPuzzle, GenerateError>`, i.e. either a complete puzzle that passes `validatePuzzle`, or a typed error with a Dutch message. Never a partial grid.
- It runs only in the admin page and in tests, never while a player is playing.

## Scope

**In scope:**
- Input checks.
- The path search, with backtracking and region pruning.
- Restarts, a step budget and a time-out.
- Determinism per seed.
- Tests, plus a benchmark on the Pi.

**Out of scope:**
- The admin UI and publishing (the `woordslang-beheer` work item).
- Choosing the words (the admin supplies them).
- Avoiding non-theme words that appear by accident (not a rule in the brief).

## API

```ts
interface GenerateInput {
  id: string; theme: string; hint: string;
  keyWord: string; words: readonly string[];   // display forms, normalized inside
  width: number; height: number; seed: number;
}
interface GenerateOptions { timeoutMs?: number /* 5000 */; maxSteps?: number; now?: () => number }
type GenerateErrorCode =
  | 'invalid-word' | 'duplicate-word' | 'letter-count' | 'word-too-long'
  | 'key-too-short' | 'grid-size' | 'no-solution' | 'timeout';
interface GenerateError { code: GenerateErrorCode; message: string /* Dutch */ }

function generatePuzzle(input: GenerateInput, options?: GenerateOptions):
  Result<WoordslangPuzzle, GenerateError>;
```

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Input errors | Checked before searching:<br>• `normalizeWord` (IJ = two letters)<br>• duplicates (same letters)<br>• total letters = cells<br>• no word longer than the cells<br>• key word long enough to span: ≥ width (left↔right) or ≥ height (top↔bottom)<br>• grid 3–12 | Clear Dutch messages instead of a search that can never succeed. |
| Order | The key word first, then the other words. | The key word has the strictest constraint (it must span two edges); placing it while the grid is empty is cheapest. It splits the grid into regions that the region checks then make use of. |
| Key word path | Starts on a random edge cell (left or top edge, chosen at random). It then grows step by step, with steps towards the opposite edge weighted higher. The word is accepted when its path touches both opposite edges. | Without the bias, random walks rarely reach the other side. The weighting still leaves bends. |
| Where the next word starts | At the **most constrained empty cell**: the one with the fewest empty neighbours, ties broken at random. | A cell with 0–1 empty neighbours can only be the end of a word. Covering it first prevents isolated cells, the same idea as Warnsdorff's rule for knight's tours. |
| Which word goes there | Remaining words in weighted random order, longer first, only lengths that fit the region the cell is in. Up to `MAX_WORD_TRIES` (3) words per cell before backtracking. | Long words are the hardest to fit later. Limiting how many alternatives are tried, combined with restarts, works better than an exhaustive search (as with the woordzoeker solver). |
| Growing a path | DFS step by step to an empty 8-neighbour. A diagonal step is not allowed if it would cross an existing diagonal in the same 2×2 square, within the word or with another word. Neighbours are ordered by fewest onward empty neighbours (Warnsdorff), with a little randomness. | This produces compact paths without dead ends, and the no-crossing rule is enforced during the search rather than afterwards. |
| Pruning while growing | After each step, flood fill all empty regions:<br>• the region the path head can continue into must hold at least the word's remaining letters;<br>• every other region must be at least as large as the shortest remaining word. | Cheap (48 cells) and catches most dead ends early. |
| Pruning after a word | **Exact region partition:** the remaining word lengths must be assignable to the regions so that each region's sum equals its size (small DFS over at most 8 words, with memo). | A region of 7 cells with words of 4, 4 and 5 left is hopeless; this sees it immediately. It's exact, and cheap because there are so few words. |
| Determinism | Seeded RNG (`createRng`). A **step budget** (`maxSteps`, default 400 000 path steps) decides "no solution", with a restart every 20 000 steps using a new order. | The same seed gives the same puzzle, and tests are reproducible. |
| Time-out | Separate wall-clock limit (`timeoutMs`, default 5 000 ms, injectable `now()`) gives the error `timeout`. | This is what the brief asks for. A time-out can only turn a later success into an error, never into a different puzzle, so determinism holds whenever the generator finishes in time. Tests use a fake `now()`. |
| Safety net | Every success goes through `validatePuzzle`. If that fails, the generator throws. | A failure there is a bug, not an expected outcome (per the brief: exceptions only for real bugs). |
| Word direction | The path follows the word's letters from start to end. In the game, a selection read in either direction counts. | The player sees no direction, so it doesn't matter for the puzzle. |

## Technical Approach

```
generatePuzzle(input)
 ├─ checkInput()                       → Result errors
 ├─ for restart in 0..                 (budget / time-out)
 │   ├─ rng order of words (seeded)
 │   ├─ placeKey()   ── growPath(edge start, bias, spans?) ── regionsOk()
 │   └─ placeRest()  ── pick constrained cell → try word → growPath() ── partitionOk()
 │                      backtrack on failure
 ├─ toPuzzle(paths)  → grid rows + words (key: true)
 └─ validatePuzzle() → ok | throw (bug)
```

Supporting module `regions.ts` (pure, unit-tested):
- `emptyRegions(grid, width, height)` → list of cell sets (8-neighbour flood fill).
- `canPartition(regionSizes, lengths)` → boolean.

State: an `Int8Array` of owners (−1 empty), a list of diagonal steps per 2×2 square for the crossing check, and the paths per word.

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Success rate below 90% for some word sets (e.g. many long words, or a key word just long enough) | Medium | Benchmark on the Pi with 6–8-word sets from the theme lists. The tunables (tries per cell, restart interval, key-word bias) are constants. Report the results honestly. |
| Paths look too random or too straight | Low | Warnsdorff plus randomness gives compact bends. Preview and "opnieuw" in the admin page let the admin choose. |
| Time-out makes a test environment slow or flaky | Low | Tests inject `now()`; the measurement runs separately. |
| 8-neighbour regions: two cells that touch only diagonally count as connected, but a diagonal step can be blocked by the no-crossing rule | Low | The region check is optimistic (it never prunes wrongly). An exact check happens when the path grows. |

## Implementation Checklist

1. `regions.ts` + tests (flood fill, partition).
2. Input checks + error codes and messages + tests.
3. `growPath` (adjacency, no reuse, no crossing, Warnsdorff ordering, pruning).
4. Key word placement (edge start, bias, span check).
5. Main search (constrained cell, word choice, backtracking, restarts, budget, time-out).
6. `toPuzzle` + validator safety net.
7. Tests:
   - fixed seed → identical, valid puzzle;
   - impossible input → error code;
   - budget too small → `no-solution`;
   - fake clock → `timeout`;
   - fuzz over 40 seeds → every success is valid.
8. Benchmark (temporary): 6–8 words, 48 letters → success rate and times on the Pi. Target ≥ 90% within 5 s.
