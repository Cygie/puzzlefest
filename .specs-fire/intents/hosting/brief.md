---
id: hosting
title: HTTPS hosting op GitHub Pages
status: completed
created: 2026-11-21T21:20:00Z
completed_at: 2026-11-21T19:52:34.555Z
---

# Intent: HTTPS hosting op GitHub Pages

## Goal

PuzzleFest is reachable over HTTPS so it can be installed on Android and use the system share sheet.

## Users

The user and anyone they share puzzles with.

## Problem

The app was only served over plain HTTP on the local network (Pi), where PWA installation, Web Share and clipboard are unavailable.

## Success Criteria

- Public HTTPS URL: https://cygie.github.io/puzzlefest/
- Every push to `main` runs lint + tests and deploys automatically
- App, PWA install, offline and share links work under the `/puzzlefest/` sub-path

## Constraints

- Public GitHub repository (free Pages); user approved
- Hash routing stays (no server rewrites on Pages)

## Notes

Chosen by the user over Tailscale Serve.
