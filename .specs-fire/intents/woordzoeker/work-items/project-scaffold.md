---
id: project-scaffold
title: Project scaffold (Vite + React + TS PWA)
intent: woordzoeker
complexity: low
mode: autopilot
status: completed
depends_on: []
created: 2026-11-21T18:25:00Z
run_id: run-puzzlefest-001
completed_at: 2026-11-21T18:15:25.048Z
---

# Work Item: Project scaffold (Vite + React + TS PWA)

## Description

Create the PuzzleFest app foundation: Vite + React + TypeScript, PWA support, tooling and a Dutch app shell with a Woordzoeker entry.

## Acceptance Criteria

- [ ] `npm run dev`, `npm run build`, `npm run lint`, `npm test` all work
- [ ] TypeScript strict mode enabled; `@/` path alias to `src/`
- [ ] vite-plugin-pwa configured: Dutch manifest (name PuzzleFest, lang nl, icons, standalone display), service worker precaches the build
- [ ] Production build is installable on Android Chrome and loads offline
- [ ] App shell with header and Dutch navigation; placeholder Woordzoeker page
- [ ] Folder structure per coding-standards (`src/app`, `src/puzzles/woordzoeker/{logic,components,data}`, `src/shared`)
- [ ] README with setup, run and install-on-Android instructions
- [ ] `.gitignore` excludes node_modules and dist

## Technical Notes

Use `vite --host` so the dev server is reachable from a phone on the LAN. Generate simple placeholder icons (192/512 px, maskable). Use hash-based or minimal routing (no server rewrites needed on static hosts).

## Dependencies

(none)
