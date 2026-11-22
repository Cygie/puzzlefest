---
run: run-puzzlefest-009
work_items: [woordslang-beheer]
intent: woordslang
mode: confirm
checkpoint: plan
---

# Implementation Plan: woordslang admin page + publishing

## Approach

### Dev-only route
- `App` reads the hash path; `#/woordslang/beheer` renders the admin page **only when `import.meta.env.DEV`**.
- The page is a `lazy(() => import(...))` behind `import.meta.env.DEV ? … : null`. Vite replaces `DEV` with `false` in a production build, so the import is removed and the admin code is not in the bundle. A check after `npm run build` greps `dist/` for an admin-only string.
- On the live site `#/woordslang/beheer` falls back to the home page. The real `#/woordslang` routes come with `woordslang-spel`.
- No header link: you open it by URL.

### Admin page (`src/puzzles/woordslang/beheer/BeheerPage.tsx`)
- **Fields:** theme, hint, key word, words (textarea; comma, semicolon or new line), width and height (`NumberStepper`, 3–12, default 6×8), and the id (filled from the theme as a slug, editable).
- **Live counter:** "41 van 48 letters — nog 7 nodig" / "✓ precies 48" / "3 te veel", using the same normalization (IJ = 2).
- **Genereer:** random seed → `generatePuzzle`, run behind a busy state (as in the woordzoeker) so the button shows "Puzzel maken…".
  - Error → Dutch message in an alert.
  - **Opnieuw** gives another seed. The seed is shown.
- **Preview:** read-only `LetterGrid` with every word path as a coloured stroke and the key word in its own colour. The word list below uses matching colours, with the key word marked.
- **JSON:** pretty-printed in a read-only textarea, plus:
  - **Kopiëren** (clipboard),
  - **Downloaden** as `<id>.json`,
  - the instruction "Zet dit bestand in `src/puzzles/woordslang/data/`".

### Puzzle index (`src/puzzles/woordslang/data/index.ts`)
- `import.meta.glob('./*.json', { eager: true })` collects all puzzle files.
- `publishedPuzzles()` returns puzzles that pass the guard, sorted by theme. `findPuzzle(id)` looks one up.

### CI safety
- `data/puzzles.test.ts` runs every JSON file through `isWoordslangPuzzle` + `validatePuzzle`, checks that the id equals the file name and that ids are unique. CI already runs the tests before deploying, so an invalid puzzle cannot go live.

### Sample puzzles (3, 6×8)
Generated with the generator and saved as JSON:
- **fruit:** key word *fruitmand*.
- **weer:** key word e.g. *regenboog*.
- **keuken:** key word e.g. *pannenkoek*.

Each has a vague Dutch hint.

## Files

| File | Change |
|------|--------|
| `src/app/App.tsx` (+ test) | dev-only lazy route `#/woordslang/beheer` |
| `src/puzzles/woordslang/beheer/BeheerPage.tsx`, `.module.css` (+ test) | new |
| `src/puzzles/woordslang/beheer/beheerInput.ts` (+ test) | new: word-list parsing, letter count status, id slug |
| `src/puzzles/woordslang/data/index.ts`, `*.json`, `puzzles.test.ts` | new |

## Tests
- `beheerInput`: parsing, count status (short / exact / too many), slug.
- `BeheerPage`:
  - live counter;
  - generate → preview with strokes and a key-word stroke, plus the JSON;
  - an input error shows a Dutch alert;
  - "Opnieuw" gives a different seed;
  - copy calls the clipboard.
- `App`: the admin route renders in dev (the test environment is DEV).
- Build check: no admin strings in `dist/`.
- Published puzzles all valid.
