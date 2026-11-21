---
run: run-puzzlefest-001
work_item: project-scaffold
intent: woordzoeker
mode: autopilot
checkpoint: none
approved_at: n/a (autopilot)
---

# Implementation Plan: Project scaffold (Vite + React + TS PWA)

## Approach

Hand-write a minimal Vite + React + TypeScript project (no interactive `npm create`), add vite-plugin-pwa with a Dutch manifest and generated PNG icons, ESLint flat config + Prettier, Vitest with jsdom. App shell uses a tiny hash router (no dependency) with Home and Woordzoeker placeholder pages. Folder layout per coding-standards.

## Files to Create

| File | Purpose |
|------|---------|
| `package.json` | Scripts + dependencies (extends existing file that holds `yaml`) |
| `index.html` | Entry HTML, `lang="nl"`, theme color |
| `vite.config.ts` | React + PWA plugin, `@` alias, Vitest config, `server.host` |
| `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` | Strict TS configs |
| `eslint.config.js`, `.prettierrc`, `.gitignore` | Tooling |
| `public/icons/*` , `public/favicon.svg` | PWA icons (192, 512, maskable) |
| `scripts/generate-icons.mjs` | Dependency-free PNG icon generator |
| `src/main.tsx`, `src/index.css` | Bootstrap + global styles (CSS variables, mobile-first) |
| `src/app/App.tsx`, `src/app/App.module.css`, `src/app/useHashRoute.ts` | Shell, header, routing |
| `src/app/HomePage.tsx` | Dutch home with puzzle tiles |
| `src/puzzles/woordzoeker/WoordzoekerPage.tsx` | Placeholder page |
| `src/shared/.gitkeep` | Shared folder |
| `src/test/setup.ts` | Testing Library setup |
| `src/app/App.test.tsx` | Smoke test for shell + navigation |
| `README.md` | Setup, run, Android install |

## Files to Modify

| File | Changes |
|------|---------|
| (none) | |

## Tests

| Test File | Coverage |
|-----------|----------|
| `src/app/App.test.tsx` | Shell renders Dutch header; navigating to Woordzoeker shows page |

---

## Work Item: word-normalization

### Approach

Pure functions in `logic/normalize.ts`. `normalizeWord` trims, decomposes (NFD) and strips combining marks, uppercases, removes spaces/hyphens/apostrophes, then validates `^[A-Z]{2,}$`. `normalizeWordList` normalizes a list, keeps first occurrence of duplicates (compared on normalized letters) and reports the rest. Result objects with Dutch reasons, never throws. IJ stays two letters naturally.

### Files to Create

| File | Purpose |
|------|---------|
| `src/puzzles/woordzoeker/logic/normalize.ts` | Normalization + validation |
| `src/puzzles/woordzoeker/logic/normalize.test.ts` | Unit tests |

### Files to Modify

| File | Changes |
|------|---------|
| (none) | |

### Tests

| Test File | Coverage |
|-----------|----------|
| `normalize.test.ts` | diacritics, separators, IJ, invalid chars, too short, empty, duplicates |

---

## Work Item: theme-word-lists

### Approach

Typed static data in `data/themes.ts` (8 themes, ≥ 30 words each, display form with proper Dutch spelling). A small seedable RNG (mulberry32) + Fisher–Yates shuffle in `src/shared/random.ts` — reused later by the grid generator. `pickThemeWords` filters by max letter length (after normalization) and returns N shuffled words.

### Files to Create

| File | Purpose |
|------|---------|
| `src/shared/random.ts` | Seeded RNG + shuffle |
| `src/shared/random.test.ts` | Determinism tests |
| `src/puzzles/woordzoeker/data/themes.ts` | Theme lists + `pickThemeWords` |
| `src/puzzles/woordzoeker/data/themes.test.ts` | Data validity + picker tests |

### Files to Modify

| File | Changes |
|------|---------|
| (none) | |
