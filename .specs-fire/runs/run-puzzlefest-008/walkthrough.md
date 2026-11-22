---
run: run-puzzlefest-008
work_items: [woordslang-generator]
intent: woordslang
generated: 2026-11-22T09:30:00Z
mode: validate
---

# Implementation Walkthrough: woordslang generator

## Summary

`generatePuzzle(input, options)` turns a key word, theme words and a grid size into a complete, valid woordslang puzzle, or a typed error with a Dutch message. Deterministic per seed; 100% success in under 0.4 s on the Pi for 48-letter sets.

## Files Changed

### Created

| File | Purpose |
|------|---------|
| `src/puzzles/woordslang/logic/regions.ts` (+ test) | neighbour table, flood-fill region labelling, exact region partition check |
| `src/puzzles/woordslang/logic/generatePuzzle.ts` (+ test) | input checks, path search, restarts, budget, time-out, `toPuzzle` + validator safety net |

## How it works

1. Input checks (grid-size → invalid-word → duplicate-word → word-too-long → letter-count → key-too-short).
2. Key word from a random edge cell; moves that can no longer reach the opposite edge are cut, moves towards it are preferred.
3. Each further word starts at the empty cell with the fewest empty neighbours; up to 3 word lengths are tried there.
4. Paths grow to empty neighbours (fewest onward neighbours first, with jitter); diagonals that would cross an existing diagonal are blocked.
5. After every step the empty regions must still be fillable exactly by the remaining lengths (`canPartition`).
6. Restart every 20 000 steps; 400 000 steps → `no-solution`; 5 s → `timeout`.

## Usage

```ts
const result = generatePuzzle({ id, theme, hint, keyWord, words, width, height, seed });
if (result.ok) save(result.value); else show(result.error.message);
```

## Next

`woordslang-beheer`: admin page that calls the generator, previews and publishes JSON.
