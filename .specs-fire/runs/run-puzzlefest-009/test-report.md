---
run: run-puzzlefest-009
work_items: [woordslang-beheer]
---

# Test Report

- **Suite:** 30 files, 278 tests, all passing (was 262). Coverage 96.8% statements, 93.1% branches; admin folder 97.5% / 97.4%.
- **New tests (16):**
  - `beheerInput.test.ts`: word-list parsing, letter count (short / exact / too many, IJ = 2), slug, JSON formatting (paths on one line, still valid JSON).
  - `BeheerPage.test.tsx`: live counter, id from theme + editable, generate → preview with 9 strokes and key word marked + JSON, "Opnieuw" gives another seed, Dutch alert on impossible input, copy (clipboard) and download (blob link).
  - `App.test.tsx`: `#/woordslang/beheer` opens the admin page in dev.
  - `data/puzzles.test.ts`: every JSON file passes the guard and the validator, id = file name, ids unique, index sorted by theme.
- **Production build:** `npm run build` clean; `grep` for admin-only strings ("Woordslang beheer", "Puzzel-JSON", "BeheerPage") in `dist/` finds nothing, so the admin code is not shipped.
- **Dev server:** admin page and puzzle index modules served without errors.
- `tsc -b`, ESLint, Prettier clean.
