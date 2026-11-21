---
run: run-puzzlefest-006
work_item: github-pages-deploy
intent: hosting
mode: autopilot
checkpoint: none
approved_at: n/a (autopilot; hosting choice approved by user)
---

# Implementation Plan: Deploy to GitHub Pages

## Approach

Configurable Vite `base` (`BASE_PATH`, default `/`); drop hard-coded `start_url`/`scope`/`navigateFallback` so vite-plugin-pwa derives them from the base. Workflow `.github/workflows/deploy.yml`: checkout → Node 22 → `npm ci` → lint → test → build with `BASE_PATH=/puzzlefest/` → upload Pages artifact → deploy. Create public repo with `gh`, push, enable Pages (build type workflow), watch the run, verify the live site with curl.

## Files to Create

| File | Purpose |
|------|---------|
| `.github/workflows/deploy.yml` | CI + Pages deploy |

## Files to Modify

| File | Changes |
|------|---------|
| `vite.config.ts` | `base` from `BASE_PATH`; PWA scope/start URL from base |
| `README.md` | Live URL, deploy notes |
