---
run: run-puzzlefest-001
work_item: project-scaffold, word-normalization, theme-word-lists
intent: woordzoeker
generated: 2026-11-21T18:18:00Z
mode: autopilot
---

# Implementation Walkthrough: Foundation (scaffold, normalization, theme lists)

## Summary

PuzzleFest now exists as an installable, offline-capable React + TypeScript PWA with a Dutch app shell. The Woordzoeker module has its first two building blocks: word normalization/validation and 8 built-in Dutch theme word lists, plus a shared seeded RNG that the grid generator will use.

## Structure Overview

The app shell (`src/app`) renders a header with navigation and switches pages via the URL hash. Each puzzle lives in its own folder under `src/puzzles/`. Woordzoeker's pure logic (`logic/`) and data (`data/`) have no React dependencies, so they are fully unit-tested. Shared, puzzle-agnostic helpers live in `src/shared/`.

## Architecture

### Pattern Used

Modular SPA with feature folders; pure logic separated from UI.

### Layer Structure

```text
App shell (app/) ──► Puzzle pages (puzzles/woordzoeker/*Page.tsx)
                         │
                         ├─► data/themes.ts ──► logic/normalize.ts
                         └─► (next) logic/generateGrid.ts
                                   │
                              shared/random.ts
```

## Files Changed

### Created

| File | Purpose |
|------|---------|
| `package.json`, `vite.config.ts`, `tsconfig*.json` | Build, PWA, test configuration |
| `eslint.config.js`, `.prettierrc`, `.prettierignore`, `.gitignore` | Tooling |
| `index.html`, `public/favicon.svg`, `public/icons/*` | Entry + icons |
| `scripts/generate-icons.mjs` | Icon generator (`npm run icons`) |
| `src/main.tsx`, `src/index.css` | Bootstrap + design tokens (light/dark) |
| `src/app/*` | Shell, hash router, home page, tests |
| `src/puzzles/woordzoeker/WoordzoekerPage.tsx` | Placeholder page |
| `src/puzzles/woordzoeker/logic/normalize.ts` (+test) | Word normalization |
| `src/puzzles/woordzoeker/data/themes.ts` (+test) | Theme lists + picker |
| `src/shared/random.ts` (+test) | Seeded RNG + shuffle |
| `README.md` | Dutch docs incl. Android install |

### Modified

| File | Changes |
|------|---------|
| (none) | |

## Domain Model

### Value Objects

| Value Object | Properties | Constraints |
|--------------|------------|-------------|
| NormalizedWord | `display`, `letters` | `letters` matches `^[A-Z]{2,}$`; IJ = two letters |
| WordError | `display`, `code`, `reason` | `reason` in Dutch |
| Theme | `id`, `naam`, `woorden[]` | ≥ 30 words, each 3–12 grid letters |

## Key Implementation Details

### 1. Normalization pipeline

trim → Unicode NFD → strip combining marks → remove spaces/hyphens/apostrophes → uppercase → validate A–Z and length ≥ 2. Duplicates are detected on the normalized letters, so "Café" and "cafe" collide.

### 2. Seeded randomness

`createRng(seed)` (mulberry32) gives identical sequences per seed. Everything random in puzzle generation will take an `Rng`, so a puzzle can be rebuilt from its seed.

### 3. PWA

`vite-plugin-pwa` generates the manifest (Dutch, standalone, portrait) and a Workbox service worker precaching the whole build; `registerType: autoUpdate` updates silently.

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Routing | Hash-based mini router | Works on any static host and in the PWA without rewrites; no dependency |
| Icons | Dependency-free generator script | Avoid heavy image tooling on the Raspberry Pi |
| RNG | mulberry32 in `src/shared` | Deterministic puzzles (share links); reusable by future puzzles |
| Non A–Z letters (ø, ß) | Rejected | Dutch needs only A–Z after stripping diacritics |

## Deviations from Plan

- Added `src/shared/random.ts` during theme-word-lists (planned there, but it is broader than the work item — it serves the grid generator too).
- Added `noUncheckedIndexedAccess` to TS config (stricter than standards).

## Dependencies Added

| Package | Why Needed |
|---------|------------|
| `react`, `react-dom` | UI |
| `vite`, `@vitejs/plugin-react` | Build / dev server |
| `vite-plugin-pwa` | Manifest + service worker |
| `typescript`, `@types/*` | Types |
| `vitest`, `@vitest/coverage-v8`, `jsdom`, `@testing-library/*` | Tests |
| `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `globals`, `prettier` | Code quality |
| `yaml` | Required by the FIRE run scripts |

## How to Verify

1. **Tests**
   ```bash
   npm test
   ```
   Expected: 41 tests pass.

2. **Dev server on the phone**
   ```bash
   npm run dev
   ```
   Expected: open the Network URL on the phone → Dutch home page with a "Woordzoeker" tile.

3. **Production build + PWA**
   ```bash
   npm run build && npm run preview
   ```
   Expected: `dist/sw.js` and `dist/manifest.webmanifest` exist; via HTTPS or USB port-forwarding Chrome on Android offers "App installeren".

## Test Coverage

- Tests added: 41
- Coverage: 98.6%
- Status: passing

## Ready for Review

- [x] All acceptance criteria met (Android install check is manual)
- [x] Tests passing
- [x] No critical issues
- [x] Documentation updated
- [x] Developer notes captured

## Developer Notes

- PWA install requires HTTPS (or `localhost`). From the Raspberry Pi, use USB + `chrome://inspect` port forwarding, or deploy to a static HTTPS host.
- `npm audit` reports 4 moderate issues in build-time deps (workbox-build → minimatch). Not shipped to users; the only automatic fix downgrades vite-plugin-pwa.
- Vitest uses `css.modules.classNameStrategy: 'non-scoped'` so tests can rely on readable class names if needed.

---
*Generated by specs.md - fabriqa.ai FIRE Flow Run run-puzzlefest-001*
