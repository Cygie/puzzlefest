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
