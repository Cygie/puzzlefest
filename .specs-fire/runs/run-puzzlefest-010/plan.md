---
run: run-puzzlefest-010
work_items: [woordslang-spel]
intent: woordslang
mode: confirm
checkpoint: plan
---

# Implementation Plan: woordslang play page

## Approach

### Routes (like the woordzoeker; the back button moves between screens)
- `#/woordslang` → list of published puzzles. `#/woordslang/<id>` → play. An unknown id redirects to the list with a notice.
- The dev-only `#/woordslang/beheer` keeps priority in `App`.
- `Route` gets `'woordslang'`, with a header link "Woordslang" and a second card on the home page.

### Matching a selection (`logic/matchSelection.ts`, pure)
A selected path (drag or tap) is compared with the puzzle's words:

| Outcome | When | Message |
|---|---|---|
| `found` | the cells equal a word's path (forwards or backwards) | — (word gets marked) |
| `already` | that word was already found | "Dat woord heb je al gevonden." |
| `elsewhere` | the letters spell a word that is not yet found, but along other cells | "Dat woord hoort erbij, maar ligt ergens anders." |
| `none` | anything else | "Geen woord van dit thema." |

- A single cell is ignored without a message.
- Cells of found words can't be reused: a selection that touches them is `none`.

### Play screen (`components/SlangPlayScreen.tsx`)
- **Header and grid:** the hint at the top ("Hint: …"). Shared `LetterGrid` + `usePathSelection`.
- **Found words:** shown as strokes. The key word is yellow (`KEY_COLOR`, shared with the admin page); other words get the palette colours.
- **Feedback:** a short message (`aria-live`) that disappears after a few seconds, a counter ("3 van 9 woorden gevonden"), and the found words listed as chips with the key word marked.
- **Completion:** when every cell belongs to a found word:
  - "Opgelost! Het thema was: Fruit."
  - the grid is locked;
  - a link back to the list.

### Progress (`logic/progress.ts`)
- `localStorage` key `woordslang:progress`, version 1, through the shared `readStored`/`writeStored`.
- Stored per puzzle id: the found words (letters). Restored on opening, and saved after every find. Found words that no longer exist in the puzzle are ignored.

### List (`components/PuzzleListScreen.tsx`)
- One card per puzzle: the **hint** (the theme stays hidden until solved), the grid size, and a status:
  - "Opgelost — <thema>",
  - "Bezig: 3 van 9",
  - or nothing.

## Files

| File | Change |
|------|--------|
| `src/app/useHashRoute.ts`, `App.tsx`, `HomePage.tsx` (+ tests) | route, nav link, home card |
| `src/puzzles/woordslang/WoordslangPage.tsx` (+ test) | new: list/play routing |
| `src/puzzles/woordslang/components/PuzzleListScreen.tsx`, `SlangPlayScreen.tsx`, `.module.css` (+ tests) | new |
| `src/puzzles/woordslang/logic/matchSelection.ts`, `progress.ts` (+ tests) | new |
| `src/puzzles/woordslang/colors.ts` | `KEY_COLOR`, `WORD_COLORS` (moved from the admin page) |

## Tests
- `matchSelection`: found forwards and backwards, already found, elsewhere, none, overlap with a found word.
- `progress`: save/restore, wrong version, unknown words dropped.
- `SlangPlayScreen` (using the fixture puzzle):
  - drag a valid path → marked and counted;
  - an invalid path → message;
  - an already found word → message;
  - tap flow → found;
  - finding every word → completion message and theme;
  - progress restored after a remount.
- `WoordslangPage`/`App`: list → play → back; unknown id → list with a notice; nav link active; home card.
- Woordzoeker regression: the full suite stays green.
