---
id: navigatie
title: Navigatie met de terugknop
status: completed
created: 2026-11-21T20:50:00Z
completed_at: 2026-11-21T19:41:47.199Z
---

# Intent: Navigatie met de terugknop

## Goal

The Android back button (and browser back/forward) moves between the Woordzoeker screens instead of leaving the Woordzoeker page.

## Users

Players using PuzzleFest on Android, in the browser or as installed PWA.

## Problem

Setup, Mijn puzzels and the play screen are internal view state without their own URL. Pressing back on the play screen leaves the Woordzoeker entirely (or closes the installed app), which feels broken.

## Success Criteria

- Back from the play screen returns to where the player came from (setup or Mijn puzzels)
- Back from Mijn puzzels returns to the setup screen
- Back from setup goes to the previous page (home) as before
- Reloading a saved puzzle keeps it open (with its progress)
- Opening a share link, then pressing back, leaves the app/link as expected (no loop)

## Constraints

- Hash-based routing (static hosting, PWA) — no server rewrites
- Must not break saving, progress, share links or existing tests

## Notes

Follow-up suggested during the share-link work item.
