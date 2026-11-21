---
id: hash-routes-woordzoeker
title: Hash routes for Woordzoeker screens
intent: navigatie
complexity: medium
mode: confirm
status: completed
depends_on: []
created: 2026-11-21T20:50:00Z
run_id: run-puzzlefest-005
completed_at: 2026-11-21T19:41:47.182Z
---

# Work Item: Hash routes for Woordzoeker screens

## Description

Give each Woordzoeker screen its own hash route so the browser history (Android back button) navigates between them.

## Acceptance Criteria

- [ ] Routes: `#/woordzoeker` (setup), `#/woordzoeker/mijn` (Mijn puzzels), `#/woordzoeker/spel` (unsaved puzzle), `#/woordzoeker/spel/<id>` (saved puzzle)
- [ ] In-app navigation adds history entries; back returns to the previous screen
- [ ] Saving an unsaved puzzle replaces the URL with `/spel/<id>` without adding a history entry and without restarting the game
- [ ] Reload on `/spel/<id>` reopens the saved puzzle with progress; reload on `/spel` without a puzzle in memory goes to setup
- [ ] Unknown saved id → Mijn puzzels with a Dutch notice
- [ ] Share links open in `/spel` (replacing the link URL)
- [ ] Header "Woordzoeker" link stays highlighted on all sub-routes
- [ ] Tests for routing and back navigation

## Technical Notes

Extend `useHashRoute` with path segments (`useHashPath`, `navigate`). Derive the Woordzoeker view from the path; keep the unsaved puzzle in page memory.

## Dependencies

(none)
