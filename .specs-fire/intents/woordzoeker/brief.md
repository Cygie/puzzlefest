---
id: woordzoeker
title: Woordzoeker
status: completed
created: 2026-11-21T18:20:00Z
completed_at: 2026-11-21T19:29:00.280Z
---

# Intent: Woordzoeker

## Goal

A Dutch word search (woordzoeker) generator and player as the first puzzle in PuzzleFest: create a puzzle from a theme and/or own words with custom width and height, solve it on the phone, print it, save it and share it.

## Users

Dutch-speaking people who create and solve word searches — mainly on an Android phone (PWA installed to the home screen), sometimes on paper.

## Problem

Making a custom word search by hand is tedious. PuzzleFest generates one in seconds, on any theme and size, playable on screen or printable.

## Success Criteria

- Picking a theme pre-fills a word list; the user can add/remove words before generating
- Width and height are independently adjustable (5–20)
- Difficulty: Makkelijk (→, ↓), Normaal (+ diagonals), Moeilijk (+ backwards)
- All chosen words appear in the grid, or the user gets a clear Dutch message explaining which word doesn't fit and why
- Optional hidden solution word: leftover letters spell a user-entered word/sentence
- Interactive play: select words by swiping/tapping, found words crossed off, timer runs; completion shows time and solution word
- Print view (A4): grid + word list, optional answer page
- Puzzles can be saved on the device and reopened; best time kept per puzzle
- A share link reproduces exactly the same puzzle on another device, without a server
- Generating a 20×20 grid with 20 words takes < 200 ms on a mid-range phone
- Installable on Android and fully usable offline

## Constraints

- UI fully in Dutch; puzzle letters uppercase
- Word normalization: accents stripped (é → E), spaces/hyphens removed; IJ = two cells (I + J)
- No backend, no accounts; data stays on device or inside the share link
- Stack per standards: Vite + React + TypeScript PWA
- Touch-first, usable on small screens

## Notes

Theme words come from bundled, curated Dutch word lists (no AI generation in v1). PuzzleFest will get more puzzle types later; keep Woordzoeker a self-contained module.
