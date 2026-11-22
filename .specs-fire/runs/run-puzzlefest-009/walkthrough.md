---
run: run-puzzlefest-009
work_items: [woordslang-beheer]
intent: woordslang
generated: 2026-11-22T10:30:00Z
mode: confirm
---

# Implementation Walkthrough: woordslang admin page + publishing

## Summary

`npm run dev` → `#/woordslang/beheer`: enter theme, hint, key word and words, see the letter count, generate, check the coloured preview and copy or download the JSON. Puzzles live as JSON in `src/puzzles/woordslang/data/`; a test validates every file, so CI blocks an invalid puzzle. Three sample puzzles (fruit, weer, keuken) are published.

## Files Changed

### Created

| File | Purpose |
|------|---------|
| `src/puzzles/woordslang/beheer/BeheerPage.tsx`, `.module.css` (+ test) | admin page |
| `src/puzzles/woordslang/beheer/beheerInput.ts` (+ test) | parsing, letter count, slug, JSON formatting |
| `src/puzzles/woordslang/data/index.ts` | `publishedPuzzles()`, `findPuzzle(id)` via `import.meta.glob` |
| `src/puzzles/woordslang/data/{fruit,weer,keuken}.json` | sample puzzles (6×8) |
| `src/puzzles/woordslang/data/puzzles.test.ts` | CI check of every published puzzle |

### Modified

| File | Change |
|------|--------|
| `src/app/App.tsx` (+ test) | dev-only lazy route `#/woordslang/beheer` |

## Publishing a puzzle

1. `npm run dev`, open `#/woordslang/beheer`.
2. Fill in, generate (again) until you like the layout.
3. Download `<id>.json` into `src/puzzles/woordslang/data/`, run `npm test`, commit, push.
