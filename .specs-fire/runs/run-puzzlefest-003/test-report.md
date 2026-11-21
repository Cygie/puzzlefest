---
run: run-puzzlefest-003
work_item: puzzle-setup-ui
intent: woordzoeker
generated: 2026-11-21T19:15:00Z
status: passed
---

# Test Report: Puzzle setup screen

## Summary

| Category | Passed | Failed | Skipped | Coverage |
|----------|--------|--------|---------|----------|
| Unit | 14 | 0 | 0 | setupSettings 100%, storage 91% |
| Component | 11 | 0 | 0 | SetupScreen 91% |
| **Total (full suite)** | 92 | 0 | 0 | 95.7% |

## Acceptance Criteria Validation

- ✅ **Theme picker pre-fills the word list (count adapts to grid size)** — 11 words for 10×10; with a solution word, letters fill the grid minus the solution
- ✅ **Word list editor: add (Enter), remove, clear; normalization errors inline** — incl. paste of "a, b; c"
- ✅ **Width and height controls 5–20, touch-friendly** — 44 px buttons, clamped and disabled at limits
- ✅ **Difficulty selector with explanation**
- ✅ **Optional solution word input** — with live fit status (ok / warning / letters needed)
- ✅ **Genereer generates; errors in Dutch** — plus "Doorgaan zonder deze woorden / oplossingswoord" fallback
- ✅ **Settings remembered between sessions** — verified by remount test
- ✅ **Component tests for main flow**
- ✅ **Visual check at ~360 px** — checked manually by the user on the phone (headless Chromium hangs on the Pi)

## Tests Written

- `src/shared/storage.test.ts`
- `src/puzzles/woordzoeker/logic/setupSettings.test.ts`
- `src/puzzles/woordzoeker/components/SetupScreen.test.tsx`

## Issues Found

| Issue | Severity | Status |
|-------|----------|--------|
| No automated visual/layout check | low | resolved: manual check on phone OK |

---

## Work Item: play-ui

### Test Results
- Passed: 20 new (selection 12, PlayScreen 7, formatTime 1); full suite 112
- Failed: 0
- Coverage: `selection.ts` 100% statements, `PlayScreen.tsx` ~100%, `PlayGrid.tsx` 87.5% (pointer-cancel and capture-fallback branches untested)

### Acceptance Criteria Validation
- ✅ Grid scales to screen width; large touch cells — CSS grid + container-query font size; tall grids limited to ~70% viewport height
- ✅ Swipe (pointer events) or tap start + end cell — both tested
- ✅ Selection snaps to valid straight lines; found words highlighted and crossed off — SVG marker strokes; word list strike-through
- ✅ Backwards selection counts — tested
- ✅ Timer starts on first interaction, pauses when app hidden — tested with fake timers + visibilitychange
- ✅ Completion screen: time, solution word, Nieuwe puzzel and Opnieuw — tested
- ✅ Tests for selection logic (pure helper) and completion
- ⚠️ Feel of swiping on a real phone — manual check pending

### Bug found by tests
- `useTimer` read a mutable variable inside a deferred state updater, so elapsed time could go backwards. Fixed by computing the delta before scheduling the update.

### Tests Written
- `src/puzzles/woordzoeker/logic/selection.test.ts`
- `src/puzzles/woordzoeker/components/PlayScreen.test.tsx`
- `src/shared/formatTime.test.ts`

---

## Work Item: save-puzzles

### Test Results
- Passed: 31 new (validatePuzzle 15, savedPuzzles 9, SavedPuzzlesScreen 5, page flow 2); full suite 143
- Failed: 0

### Acceptance Criteria Validation
- ✅ 'Opslaan' saves the puzzle with name, date, theme, size, difficulty — default name "Dieren · 21 nov"
- ✅ 'Mijn puzzels' list: open, rename, delete (with confirmation) — inline "Weet je het zeker?"
- ✅ Best time stored per puzzle and shown in list and on completion — incl. "🏆 Nieuw record!"
- ✅ In-progress state (found words, elapsed time) restored when reopening — page flow test
- ✅ Storage versioned; corrupted/old data ignored gracefully — invalid entries skipped individually
- ✅ Tests for the storage helper
- Extra: max 50 saved puzzles and a Dutch "storage full" message

### Tests Written
- `src/puzzles/woordzoeker/logic/validatePuzzle.test.ts`
- `src/puzzles/woordzoeker/logic/savedPuzzles.test.ts`
- `src/puzzles/woordzoeker/components/SavedPuzzlesScreen.test.tsx`
- `src/puzzles/woordzoeker/WoordzoekerPage.test.tsx`

---

## Work Item: share-link

### Test Results
- Passed: 20 new (shareCode 9, base64url 2, share 4, PlayScreen 2, page link flows 3); full suite 163
- Failed: 0

### Acceptance Criteria Validation
- ✅ 'Delen' creates a link containing the puzzle — full grid encoded (not seed), versioned format
- ✅ Web Share API when available, otherwise clipboard with Dutch confirmation — plus manual-copy field as last resort
- ✅ Opening the link loads the identical puzzle straight into the play screen — round-trip test via the real UI
- ✅ Invalid/corrupted links show a friendly Dutch error — garbage, non-JSON, wrong version, tampered grid, zero width
- ✅ Link < 2000 chars for 20×20 — measured max 1235 chars (25 words); 15×15/20 words 843; 10×10 434
- ✅ Round-trip tests: encode → decode → identical puzzle

### Tests Written
- `src/puzzles/woordzoeker/logic/shareCode.test.ts`
- `src/shared/base64url.test.ts`, `src/shared/share.test.ts`
- additions in `PlayScreen.test.tsx`, `WoordzoekerPage.test.tsx`

---

## Run Totals (run-puzzlefest-003)

- 4 work items, **163 tests passing**, overall coverage ≈ 96% statements
