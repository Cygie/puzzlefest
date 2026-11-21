# Code Review Report

**Run**: run-puzzlefest-003
**Intent**: woordzoeker

---

## Work Item: puzzle-setup-ui

**Reviewed**: 2026-11-21T19:15:00Z
**Files Reviewed**: 17

| Category | Auto-Fixed | Applied | Skipped |
|----------|------------|---------|---------|
| Code Quality | 1 | 1 | 1 |
| Security | 0 | 0 | 0 |
| Architecture | 0 | 0 | 0 |
| Testing | 0 | 0 | 0 |
| **Total** | **1** | **1** | **1** |

**Tests Status**: Passing

### Auto-Fixed

1. [Code Quality] Prettier formatting on all new files.

### Applied

1. [Code Quality] `WordListEditor.tsx` — after a multi-word paste with some rejections, the input kept the full text (re-submitting would re-report the accepted words as duplicates). Now only the rejected parts stay in the field. Test added. Risk: low.

### Skipped

1. [Code Quality] A failure message stays visible after changing settings until the next Genereer. Harmless; revisit if it confuses users.

### Notes

- Global utility classes (`.btn`, `.text-input`, `.card`, `.visually-hidden`) added to `index.css` for reuse across puzzles; component layout stays in CSS modules.
- `useSetupSettings` writes on every change — fine for this tiny payload.

---

## Work Item: play-ui

**Files Reviewed**: 11 — Auto-fixed: 1 (Prettier), Applied: 2, Skipped: 1. Tests passing. Lint clean.

### Applied

1. [Code Quality] `useTimer.ts` — deferred updater closed over a mutable `last` → negative/lost time. Delta now computed eagerly. (Found by the timer test.)
2. [Architecture] `PlayGrid.tsx` — `max-width: 70dvh` did not constrain tall grids (aspect-ratio drives height). Replaced with `min(100%, calc(70dvh * width / height))` so e.g. 5×20 fits on screen.

### Skipped

1. [Code Quality] `onProgress` fires on every timer tick (4×/s). No-op today; save-puzzles should debounce/throttle writes.

### Notes

- Matching is by letters, not position, so a legitimate second occurrence (KAT inside KATER) is accepted and highlighted where the player selected it.
- `GridPreview` removed (superseded).

---

## Work Item: save-puzzles

**Files Reviewed**: 16 — Auto-fixed: 1 (Prettier), Applied: 1, Skipped: 1. Tests passing. Lint clean.

### Applied

1. [Code Quality] `useProgressSaver.ts` — when leaving a saved puzzle, progress since the last throttled write (≤ 3 s of time) was lost because the id switched before flushing. Now flushes to the old id in the effect cleanup, and resets throttle state for the next puzzle.

### Skipped

1. [Architecture] Saved list is read from localStorage on each setup render (`savedCount`). ≤ 50 small entries — negligible; revisit if the list grows.

### Notes

- `isPuzzle` checks that the grid actually spells each word at its recorded position, so tampered data (or share links later) cannot produce an unsolvable puzzle.
- `PlayProgress` / `FoundWord` moved to `types.ts` (shared by play, save and share).
- `logic/testPuzzle.ts` is a test fixture; it is not imported by app code and is tree-shaken from the build.
