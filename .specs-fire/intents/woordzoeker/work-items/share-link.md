---
id: share-link
title: Share puzzle via link
intent: woordzoeker
complexity: medium
mode: confirm
status: in_progress
depends_on:
  - grid-generator
  - play-ui
created: 2026-11-21T18:25:00Z
---

# Work Item: Share puzzle via link

## Description

Encode a puzzle into a URL so others can play the exact same puzzle without a server.

## Acceptance Criteria

- [ ] 'Delen' creates a link containing the puzzle (words, size, difficulty, solution word, seed or the grid itself) compactly encoded
- [ ] Uses the Web Share API when available, otherwise copies the link to the clipboard with a Dutch confirmation
- [ ] Opening the link loads the identical puzzle straight into the play screen
- [ ] Invalid/corrupted links show a friendly Dutch error
- [ ] Link stays reasonably short for a 20×20 puzzle (target < 2000 chars)
- [ ] Round-trip tests: encode → decode → identical puzzle

## Technical Notes

Decide in plan between encoding seed+inputs (short, depends on generator stability) vs. full grid (robust). Version the format.

## Dependencies

- grid-generator
- play-ui
