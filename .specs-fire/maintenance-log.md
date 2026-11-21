# Maintenance Log

## 2026-11-21 — Print always produced 2 pages

- **Reported by:** user (PDF print from the app always had 2 pages, also without answers)
- **Cause:** App shell `min-height: 100dvh` (and `html/body min-height: 100%`) stayed active in print; depending on the browser, `dvh` resolves against the full sheet or window, pushing content over the page margins → an extra (empty) page. Secondary risk: a fixed 175 mm grid-height cap plus a long word list could overflow, especially on US Letter.
- **Fix:**
  - Print CSS: `.shell { min-height: 0; display: block }`, `:root/html/body { height: auto; min-height: 0; background: #fff }`.
  - `printCellSize()` sizes grid cells from the remaining page budget (240 mm, fits A4 and Letter) after title, word list and solution blanks; `.page { break-inside: avoid }`.
- **Verified:** headless Chromium print-to-PDF of 10×10, 20×20 (25 words) and 10×10 with solution word → 1 A4 page each; 8 new tests (one-page budget for 7 size/word combinations).
- **Confirmed by user:** print on their device now gives 1 page.
- **Related work item:** woordzoeker/print-view (run-puzzlefest-004)

## 2026-11-21 — Solution word failed on large grids

- **Reported by:** known open point after the woordzoeker intent; user asked to fix it.
- **Baseline (measured, theme lists, 24 puzzles per cell):** 10×10 ~95%, 12×12 ~65%, 15×15 ~5%, 18×18 and 20×20 0%.
- **Causes:**
  1. The placer (random longest-first with a proportional coverage target) rarely hit the exact leftover count on dense grids.
  2. A fixed word list can only cover the grid exactly when almost all words lie horizontally/vertically: diagonal words leave stair-step gaps, so diagonals disappear (measured: <3% diagonal words on large Normaal/Moeilijk grids even with a better search).
  3. Themes had only 170–260 letters; a 20×20 grid with a solution needs ~390.
- **Fix (user chose "top-up + bigger themes"):**
  - New `logic/solutionPlacement.ts`: cell-driven backtracking (first undecided cell is covered by a word or kept free), weighted random option order, 3 branches per cell, restarts every 2 000 steps, 60 000-step budget (deterministic per seed), diagonal weight ×0.8 per restart, char-code grid for speed.
  - With a theme, the generator may add theme words (`extraWords`, weight 0.05 vs required words) to fill the grid exactly; added words appear in the puzzle's word list after the listed ones.
  - Setup: with a solution word the theme fills the list to ~50% of the cells to cover (more required words make an exact fit much harder: ~75% coverage succeeded only half the time); an untouched theme list is refilled when a solution word is added/removed; status message explains the top-up.
  - Themes expanded from 30–40 to 87–114 words each (582–829 letters).
  - Without a solution: theme fill capped at 70% of the cells (the longer theme words made 12×12/15×15 fail 2–6%), and the new search is a fallback for dense lists.
  - Genereer shows "Puzzel maken…" while generating.
- **Result (measured on the Raspberry Pi 5, 24 puzzles per size/difficulty, 8×8 to 20×20):** 431/432 with the solution word; average 30–410 ms, worst 2.6 s; 14–32% diagonal words on Normaal/Moeilijk. Plain puzzles: 0/2100 failures (5×5–15×15).
- **Tests:** 199 passing (14 new/updated: top-up at 10/15/20 with diagonal share, exact-fill fallback, theme fill shares, extras, status messages, auto-refill, busy button).
- **Related work item:** woordzoeker/grid-generator (run-puzzlefest-002), woordzoeker/setup-screen.
