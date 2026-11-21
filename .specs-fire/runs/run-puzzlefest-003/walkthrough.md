---
run: run-puzzlefest-003
work_item: puzzle-setup-ui, play-ui, save-puzzles, share-link
intent: woordzoeker
generated: 2026-11-21T20:10:00Z
mode: confirm
---

# Implementation Walkthrough: Woordzoeker UI (setup, play, save, share)

## Summary

The Woordzoeker is now a complete app flow: configure a puzzle (theme, words, size, difficulty, solution word), solve it by swiping or tapping with a timer, save it on the device with progress and best times, and share it as a link that opens the identical puzzle elsewhere.

## Structure Overview

`WoordzoekerPage` holds a small view state (setup | saved | play) and owns persistence side effects (saving, progress, best time, share URL). Screens are thin React components; all rules live in pure, unit-tested modules under `logic/` and puzzle-agnostic helpers under `src/shared/`.

## Architecture

### Pattern Used

Pure functional core, thin React shell; localStorage behind a typed, versioned helper.

### Layer Structure

```text
WoordzoekerPage (view state, persistence wiring, share URL)
 ├─ SetupScreen ── ThemePicker · WordListEditor · NumberStepper · DifficultyPicker
 ├─ PlayScreen ─── PlayGrid (pointer → cell → snapLine → matchWord) · useTimer
 └─ SavedPuzzlesScreen
logic/: setupSettings · selection · savedPuzzles · validatePuzzle · shareCode · generateGrid
shared/: storage · random · formatTime · base64url · share · NumberStepper
```

## Files Changed

### Created

| File | Purpose |
|------|---------|
| `src/shared/storage.ts` | Typed, versioned, failure-safe localStorage |
| `src/shared/NumberStepper.tsx` | Touch-friendly − value + |
| `src/shared/formatTime.ts`, `base64url.ts`, `share.ts` | Time format, link encoding, share fallbacks |
| `logic/setupSettings.ts` | Settings type, word-count suggestion, theme fill, solution status |
| `logic/selection.ts` | Point→cell, 8-direction snapping, matching, leftover cells |
| `logic/validatePuzzle.ts` | Validates stored/received puzzles and progress |
| `logic/savedPuzzles.ts` | Saved list: add, progress, best time, rename, delete |
| `logic/shareCode.ts` | Versioned share code |
| `components/SetupScreen.tsx` (+ pickers, editor, hook) | Setup |
| `components/PlayScreen.tsx`, `PlayGrid.tsx`, `useTimer.ts` | Play |
| `components/SavedPuzzlesScreen.tsx`, `useProgressSaver.ts` | Saving |

### Modified

| File | Changes |
|------|---------|
| `WoordzoekerPage.tsx` | View state, saving, share links |
| `src/app/useHashRoute.ts` | Hash query params, absolute hrefs |
| `src/index.css` | Shared `.btn`, `.text-input`, `.card`, `.visually-hidden` |
| `logic/types.ts` | `FoundWord`, `PlayProgress` |

## Domain Model

### Entities

| Entity | Properties | Business Rules |
|--------|------------|----------------|
| SavedPuzzle | id, name, createdAt, updatedAt, puzzle, progress, bestTimeMs | ≤ 50 per device; best time only decreases |

### Value Objects

| Value Object | Properties | Constraints |
|--------------|------------|-------------|
| PlayProgress | found[], elapsedMs | found words must exist in the puzzle |
| FoundWord | letters, start, end | serializable |
| SetupSettings | themeId, words, width, height, difficulty, solution | sizes 5–20 |

## Key Implementation Details

### 1. Selection

Pointer events with pointer capture on the board (`touch-action: none`). Swipe = down→move→up on different cells; tap-tap = two taps. The line snaps to the nearest of 8 directions (`atan2` rounded to 45°) and is clipped to the grid; matching is by letters forwards or backwards.

### 2. Timer

Interval-based with wall-clock deltas, paused on `visibilitychange`. Delta is computed before the state update (the original version had a stale-closure bug, caught by tests).

### 3. Saving

Opslaan creates an entry; afterwards `useProgressSaver` writes on every found word, at most every 3 s otherwise, and flushes when the app is hidden or the puzzle is left.

### 4. Share links

`#/woordzoeker?p=<base64url JSON>` with the full grid. On open: decode → `isPuzzle()` → play screen, then the address is reset.

## Security Considerations

| Concern | Approach |
|---------|----------|
| Tampered share links | Same strict `isPuzzle()` validation as storage; width guard prevents a hang |
| Injection via word text | Rendered as React text only |
| Corrupt local data | Each saved entry validated individually; invalid ones skipped |

## Performance Considerations

| Requirement | Implementation |
|-------------|----------------|
| Smooth swiping | State updates only when the cell under the finger changes |
| Few storage writes | Throttled progress saving |
| Link length < 2000 | Max 1235 chars measured (20×20, 25 words) |

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Share format | Full grid, versioned base64url JSON | Survives generator changes; short enough |
| Matching | By letters | Legit second occurrences count |
| Navigation | In-page view state | Simple; Android back button handling proposed as follow-up |
| Delete confirmation | Inline, not `window.confirm` | Works well in installed PWA, testable |

## Deviations from Plan

- Added `src/shared/formatTime.ts` and `base64url.ts` (small helpers not listed in the plans).
- Added a manual-copy field as third share fallback (plan mentioned Web Share + clipboard).
- Progress-saver flush moved to effect cleanup after review (no progress lost when leaving).

## Dependencies Added

| Package | Why Needed |
|---------|------------|
| (none) | |

## How to Verify

1. **Tests**
   ```bash
   npm test
   ```
   Expected: 163 tests pass.

2. **On the phone**
   ```bash
   npm run build && npm run preview
   ```
   Expected: create a puzzle, swipe words (also diagonally/backwards), Opslaan, reopen via Mijn puzzels with progress, finish for a best time, Delen opens the Android share sheet; the shared link opens the same puzzle.

## Test Coverage

- Tests added: 71
- Coverage: ≈ 96%
- Status: passing

## Ready for Review

- [x] All acceptance criteria met
- [x] Tests passing
- [x] No critical issues
- [x] Documentation updated
- [x] Developer notes captured

## Developer Notes

- Web Share API requires a secure context (HTTPS or localhost). Over plain `http://192.168…` the Delen button falls back to clipboard — and clipboard also needs a secure context, so you will likely see the manual-copy field there. On an HTTPS host it uses the Android share sheet.
- `userEvent.setup()` installs its own clipboard stub: install clipboard mocks after calling it.
- Android back button currently leaves the Woordzoeker page; suggested follow-up work item.

---
*Generated by specs.md - fabriqa.ai FIRE Flow Run run-puzzlefest-003*
