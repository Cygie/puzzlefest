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
