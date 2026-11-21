---
run: run-puzzlefest-003
work_item: puzzle-setup-ui
intent: woordzoeker
mode: confirm
checkpoint: plan
approved_at: 2026-11-21T19:05:00Z
---

# Implementation Plan: Puzzle setup screen

## Approach

One mobile-first setup screen, top to bottom: **Thema** → **Woorden** → **Formaat** → **Moeilijkheid** → **Oplossingswoord (optioneel)** → **Genereer**. Pure helpers (word-count suggestion, theme fill, settings validation) live in `logic/setupSettings.ts` and are unit-tested; components stay thin. Settings persist in localStorage via a small typed, versioned storage helper that save-puzzles will reuse. `WoordzoekerPage` switches between setup and a temporary read-only grid preview (replaced by play-ui next).

Behaviour:
- **Thema**: chips for the 8 themes + "Eigen woorden". Choosing a theme replaces the list with suggested words (count from grid size; with a solution word, enough letters to fill the grid). "Andere woorden" reshuffles.
- **Woorden**: input + Toevoegen (Enter); pasting "kat, hond; vis" adds several. Chips with × to remove, "Alles wissen". Invalid / duplicate words show the Dutch reason inline; words too long for the current size are marked on their chip.
- **Formaat**: two steppers (− 10 +) for breedte/hoogte, 5–20, 44 px tap targets.
- **Moeilijkheid**: segmented control Makkelijk / Normaal / Moeilijk with a one-line explanation.
- **Oplossingswoord**: optional text; live status via `checkSolutionFit()` — "✓ Past" / "Nog 12 letters nodig" / "8 letters te veel — kies een groter raster of minder woorden" (overlap > a few is hard to fit).
- **Genereer**: new random seed → `generateGrid`. Success → preview. Failure → Dutch reason, list of words that don't fit, and if a fallback exists a button "Doorgaan zonder deze woorden" / "Doorgaan zonder oplossingswoord".

## Files to Create

| File | Purpose |
|------|---------|
| `src/shared/storage.ts` | Typed, versioned, try/catch localStorage helper |
| `src/shared/NumberStepper.tsx` + `.module.css` | Reusable − value + control |
| `src/puzzles/woordzoeker/logic/setupSettings.ts` | `SetupSettings` type, defaults, `suggestWordCount`, `wordsFromTheme`, `solutionStatus` |
| `src/puzzles/woordzoeker/components/SetupScreen.tsx` + `.module.css` | The screen |
| `src/puzzles/woordzoeker/components/ThemePicker.tsx` | Theme chips |
| `src/puzzles/woordzoeker/components/WordListEditor.tsx` | Add/remove/clear + errors |
| `src/puzzles/woordzoeker/components/DifficultyPicker.tsx` | Segmented control |
| `src/puzzles/woordzoeker/components/GridPreview.tsx` | Temporary read-only grid (until play-ui) |
| `src/puzzles/woordzoeker/components/useSetupSettings.ts` | State + persistence hook |

## Files to Modify

| File | Changes |
|------|---------|
| `src/puzzles/woordzoeker/WoordzoekerPage.tsx` | Setup ↔ puzzle view |
| `src/index.css` | Shared form/button tokens if needed |

## Tests

| Test File | Coverage |
|-----------|----------|
| `src/shared/storage.test.ts` | read/write, version mismatch, corrupt JSON, unavailable storage |
| `logic/setupSettings.test.ts` | word-count suggestion, theme fill (with/without solution), solution status texts |
| `components/SetupScreen.test.tsx` | theme → list filled; add/paste/remove/clear; invalid word message; steppers clamp 5–20; difficulty select; solution status; generate → puzzle shown; failure → fallback button; settings restored after remount |

---

## Work Item: play-ui

### Approach

Replace the temporary `GridPreview` with an interactive `PlayScreen`. Geometry and matching are pure functions in `logic/selection.ts` (unit-tested); the grid is a CSS grid of letters with an SVG overlay drawing rounded "marker" strokes for found words and the current selection (handles overlapping words cleanly). Pointer events on the grid container (`touch-action: none`, pointer capture) translate coordinates → cell; the line snaps to the nearest of 8 directions and is clipped to the grid. Swipe (down → move → up) and tap-tap (tap start cell, tap end cell) both work. A selection matching an unfound word (forwards or backwards) marks it found. Timer starts on first touch, pauses while the app is hidden. Progress `{ found, elapsedMs }` is a plain serializable object with `initialProgress`/`onProgress` props, ready for save-puzzles.

Completion panel: "Gefeliciteerd!", time, the solution (leftover cells highlighted), buttons **Opnieuw** and **Nieuwe puzzel**.

### Files to Create

| File | Purpose |
|------|---------|
| `src/puzzles/woordzoeker/logic/selection.ts` | `cellFromPoint`, `snapLine`, `matchWord`, `leftoverCells` |
| `src/puzzles/woordzoeker/logic/selection.test.ts` | Unit tests |
| `src/puzzles/woordzoeker/components/PlayScreen.tsx` + `.module.css` | Screen: timer, grid, word list, completion |
| `src/puzzles/woordzoeker/components/PlayGrid.tsx` | Grid + SVG overlay + pointer handling |
| `src/puzzles/woordzoeker/components/useTimer.ts` | Pausable timer hook |
| `src/puzzles/woordzoeker/components/PlayScreen.test.tsx` | Component tests |

### Files to Modify

| File | Changes |
|------|---------|
| `src/puzzles/woordzoeker/WoordzoekerPage.tsx` | Show PlayScreen; Nieuwe puzzel → setup |

### Files to Delete

| File | Reason |
|------|--------|
| `components/GridPreview.tsx` + `.module.css` | Replaced by PlayScreen |

### Tests

| Test File | Coverage |
|-----------|----------|
| `selection.test.ts` | point→cell incl. edges; snapping (straight, diagonal, off-angle, clipping); matching forwards/backwards/already found/non-word; leftover cells |
| `PlayScreen.test.tsx` | swipe finds a word (crossed off); backwards swipe; tap-tap; wrong selection does nothing; timer starts on first touch and pauses when hidden; completion shows time + solution; Opnieuw resets |

---

## Work Item: save-puzzles

### Approach

`validatePuzzle.ts` validates any stored/received puzzle (shape + grid actually spells each word) — reused by share-link. `savedPuzzles.ts` is a typed list in versioned localStorage (`woordzoeker:saved`, max 50, newest first) with add / update progress / record completion (best time + record flag) / rename / delete, returning Dutch errors when storage is full. The page holds a small view state (setup | saved | play); progress of a saved puzzle is written throttled (on found-word change, every ~3 s, and when the app is hidden). `PlayProgress`/`FoundWord` move to `types.ts`.

### Files to Create

| File | Purpose |
|------|---------|
| `src/puzzles/woordzoeker/logic/validatePuzzle.ts` (+test) | `isPuzzle`, `isPlayProgress` |
| `src/puzzles/woordzoeker/logic/savedPuzzles.ts` (+test) | Saved-puzzle store |
| `src/puzzles/woordzoeker/components/SavedPuzzlesScreen.tsx` + `.module.css` (+test) | "Mijn puzzels" |
| `src/puzzles/woordzoeker/components/useProgressSaver.ts` | Throttled progress persistence |

### Files to Modify

| File | Changes |
|------|---------|
| `logic/types.ts`, `logic/selection.ts` | Move `FoundWord`, add `PlayProgress` |
| `components/PlayScreen.tsx` | Opslaan button, best time / record on completion |
| `components/SetupScreen.tsx` | "Mijn puzzels (n)" link |
| `WoordzoekerPage.tsx` | View state setup / saved / play |
