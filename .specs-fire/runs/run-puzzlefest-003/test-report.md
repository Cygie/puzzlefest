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
