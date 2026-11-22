---
run: run-puzzlefest-010
work_items: [woordslang-spel]
---

# Test Report

- **Suite:** 34 files, 301 tests, all passing (was 278). Coverage 96.9% statements, 93.2% branches.
- **New tests (23):**
  - `matchSelection.test.ts`: found forwards/backwards, already found, single cell ignored, wrong path, theme word along other cells ("elsewhere"), no reuse of found cells; `isSolved`.
  - `progress.test.ts`: save/restore per puzzle, unknown and duplicate words dropped, other version / corrupt data ignored, status new/busy/solved.
  - `SlangPlayScreen.test.tsx`: hint and count, drag a word (marked, listed, saved), key word in its own colour, tap flow, wrong path message that disappears after 3 s, already found, completion with theme + "Andere puzzel" + "Opnieuw spelen", progress restored.
  - `WoordslangPage.test.tsx`: list by hint → open → back to list, nav link active, solved/busy status in the list, unknown id → list with notice, home page card.
- **Woordzoeker regression:** all existing tests unchanged and green.
- **Build:** clean; sample puzzles are now in the bundle; admin code still absent from `dist/`.
- **Not done:** a visual check in a headless browser. Chromium hangs on every page in this environment (also on the existing woordzoeker page), so the layout was not checked in a real browser.
- `tsc -b`, ESLint, Prettier clean.
