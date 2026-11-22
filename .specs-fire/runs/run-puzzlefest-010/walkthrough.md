---
run: run-puzzlefest-010
work_items: [woordslang-spel]
intent: woordslang
generated: 2026-11-22T11:30:00Z
mode: confirm
---

# Implementation Walkthrough: woordslang play page

## Summary

Players open `#/woordslang`, pick a puzzle by its hint and find the theme words by dragging or tapping paths. Found words stay coloured (key word in yellow), progress is saved per puzzle, and the theme is revealed when every cell is covered.

## Files Changed

### Created

| File | Purpose |
|------|---------|
| `src/puzzles/woordslang/WoordslangPage.tsx` (+ test) | list / play routing |
| `src/puzzles/woordslang/components/PuzzleListScreen.tsx` | puzzle list with status |
| `src/puzzles/woordslang/components/SlangPlayScreen.tsx` (+ test) | play screen |
| `src/puzzles/woordslang/components/Woordslang.module.css` | styles |
| `src/puzzles/woordslang/logic/matchSelection.ts` (+ test) | selection → found / already / elsewhere / none |
| `src/puzzles/woordslang/logic/progress.ts` (+ test) | found words in localStorage (v1) |
| `src/puzzles/woordslang/colors.ts` | shared colours |

### Modified

| File | Change |
|------|--------|
| `src/app/useHashRoute.ts`, `App.tsx`, `App.module.css`, `HomePage.tsx` | route, nav link, home card, narrow-screen nav |
| `src/puzzles/woordslang/beheer/BeheerPage.tsx` | colours from `colors.ts` |
