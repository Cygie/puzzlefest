---
id: save-puzzles
title: Save puzzles on device
intent: woordzoeker
complexity: medium
mode: confirm
status: completed
depends_on:
  - play-ui
created: 2026-11-21T18:25:00Z
run_id: run-puzzlefest-003
completed_at: 2026-11-21T19:21:07.234Z
---

# Work Item: Save puzzles on device

## Description

Persist generated puzzles locally and reopen them.

## Acceptance Criteria

- [ ] 'Opslaan' saves the puzzle (with name, date, theme, size, difficulty)
- [ ] 'Mijn puzzels' list: open, rename, delete (with confirmation)
- [ ] Best time stored per puzzle and shown in the list and on completion
- [ ] In-progress state (found words, elapsed time) restored when reopening
- [ ] Storage is versioned; corrupted/old data is ignored gracefully
- [ ] Tests for the storage helper

## Technical Notes

localStorage via typed helper in `src/shared/storage.ts`.

## Dependencies

- play-ui
