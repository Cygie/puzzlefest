---
id: getallenpad-beheer
title: Admin page and puzzle publishing
intent: getallenpad
complexity: medium
mode: confirm
status: completed
depends_on:
  - getallenpad-reduction
  - shared-grid-generalize
created: 2026-11-22T11:15:00Z
run_id: run-puzzlefest-013
completed_at: 2026-11-22T18:08:29.866Z
---

# Work Item: Admin page and puzzle publishing

## Description

Dev-only admin page to generate, preview and export getallenpad puzzles, plus the published puzzle data and its CI check — same pattern as woordslang beheer.

## Acceptance Criteria

- [ ] Hidden admin route only available in `npm run dev` (not in the production build)
- [ ] Choose width, height, level, seed (optional) and batch size; generation runs in a Web Worker with cancel button; UI stays responsive
- [ ] Preview shows givens and full solution, plus metric
- [ ] Export: copy/download JSON per puzzle (and batch)
- [ ] `src/puzzles/getallenpad/data/` with an index and a few starter puzzles per level
- [ ] Test runs every published JSON through the full validator (incl. uniqueness) — fails CI on an invalid puzzle
- [ ] Component test for the admin flow (generate → preview → export)

## Dependencies

- getallenpad-reduction
- shared-grid-generalize
