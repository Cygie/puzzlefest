---
run: run-puzzlefest-013
work_items: [getallenpad-reduction, getallenpad-beheer, getallenpad-spel]
---

# Review Report

## Work Item: getallenpad-reduction

- Implemented as planned.
- **Small deviation**: when two passes reach the same number of givens, the first pass is kept (plan said: the one with more solver nodes). Choosing by nodes would cost an extra unlimited solver run per pass; the metric is stored on the final puzzle anyway. Left as is.
- **Note**: the final uniqueness check (for the metric) runs without the deadline, so a call can end slightly past `timeoutMs` (max 5.36 s measured). It cannot return a non-unique puzzle; acceptable for the admin page.
- Test fix: tests no longer depend on machine speed (see test report).
- No auto-fixes needed in production code.

## Work Item: getallenpad-beheer

- Implemented as planned. App shell now maps `#/<puzzle>/beheer` to a dev-only lazy page for woordslang and getallenpad.
- Seeds are chosen on the main thread and sent to the worker, so a batch is reproducible from the seeds shown in the list.
- Own `formatPuzzleJson` (grid rows on one line); output matches prettier, so regenerated files do not churn.
- Manual check of the worker in a browser done by the user: batch runs, page stays responsive, Stop works.

## Work Item: getallenpad-spel

- Implemented as planned, with the decision of 2026-11-22: a number lives in one place — an earlier player entry with the same value is removed when it is placed again (drag or keyboard); duplicates can only occur with a given, and only the player's cell is marked.
- Additions: while dragging, the cells show the numbers the drag would place; `no-start` / `out-of-range` messages besides the given collision; level labels moved to `types.ts` (shared with the admin page).
- Review fix: givens flattened once per render instead of per cell.
- Not covered by automated tests: the feel of touch dragging on a real phone (pointer handling is the shared `Grid`, already used by woordslang).
