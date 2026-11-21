---
id: github-pages-deploy
title: Deploy to GitHub Pages
intent: hosting
complexity: low
mode: autopilot
status: completed
depends_on: []
created: 2026-11-21T21:20:00Z
run_id: run-puzzlefest-006
completed_at: 2026-11-21T19:52:34.539Z
---

# Work Item: Deploy to GitHub Pages

## Description

Make the build work under a sub-path, add a GitHub Actions workflow (lint, test, build, deploy), create the public repo and enable Pages.

## Acceptance Criteria

- [ ] Build base path configurable (`BASE_PATH`), PWA scope/start URL follow it
- [ ] Workflow: on push to main → npm ci, lint, test, build, deploy to Pages
- [ ] Public repo `Cygie/puzzlefest` created and pushed; Pages source = GitHub Actions
- [ ] Site live over HTTPS; manifest + service worker served under `/puzzlefest/`
- [ ] Share links point to the HTTPS URL
- [ ] README updated

## Technical Notes

Vite `base` from `process.env.BASE_PATH ?? '/'`; let vite-plugin-pwa derive scope/start_url from base.

## Dependencies

(none)
