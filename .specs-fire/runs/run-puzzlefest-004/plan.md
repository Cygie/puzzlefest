---
run: run-puzzlefest-004
work_item: print-view
intent: woordzoeker
mode: autopilot
checkpoint: none
approved_at: n/a (autopilot)
---

# Implementation Plan: Print view (A4)

## Approach

A `PrintSheet` component is rendered next to the play screen but only visible in `@media print`; the interactive UI gets a `no-print` class. "Afdrukken" (with a "Met antwoorden" checkbox) calls `window.print()`. Page 1: title + theme/size, bordered grid sized in mm to fit A4 (180 × 230 mm printable), word list in columns, solution-word blanks. Optional page 2 (`break-before: page`): same grid with every word outlined (SVG strokes) and the solution letters marked.

## Files to Create

| File | Purpose |
|------|---------|
| `src/puzzles/woordzoeker/components/PrintSheet.tsx` + `.module.css` | Print layout |
| `src/puzzles/woordzoeker/components/PrintSheet.test.tsx` | Tests |

## Files to Modify

| File | Changes |
|------|---------|
| `components/PlayScreen.tsx` | Afdrukken button + answers option, wrap UI in `no-print`, render PrintSheet |
| `src/index.css` | `@page` A4, `.no-print`, print-only helpers |

## Tests

| Test File | Coverage |
|-----------|----------|
| `PrintSheet.test.tsx` | grid letters, sorted word list, solution blanks, answers page only when requested, Afdrukken calls `window.print` |
