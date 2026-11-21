---
run: run-puzzlefest-005
work_item: hash-routes-woordzoeker
intent: navigatie
mode: confirm
checkpoint: plan
approved_at: 2026-11-21T20:55:00Z
---

# Implementation Plan: Hash routes for Woordzoeker screens

## Approach

Each Woordzoeker screen gets its own hash route; the page derives its view from the URL instead of internal state, so the browser history — and thus the Android back button — moves between screens.

| Route | Screen |
|-------|--------|
| `#/woordzoeker` | Setup |
| `#/woordzoeker/mijn` | Mijn puzzels |
| `#/woordzoeker/spel` | Unsaved puzzle (kept in page memory) |
| `#/woordzoeker/spel/<id>` | Saved puzzle (loaded from storage → survives reload) |

- In-app actions (Genereer, Mijn puzzels, Spelen, Nieuwe puzzel) push a history entry.
- Opslaan replaces `/spel` with `/spel/<id>` (no extra entry, game keeps running).
- `/spel` without a puzzle in memory (e.g. after reload) → replaced by setup; unknown id → Mijn puzzels + Dutch notice.
- Share links (`?p=`) decode into memory and replace the URL with `/spel`.

## Files to Create

| File | Purpose |
|------|---------|
| (none) | |

## Files to Modify

| File | Changes |
|------|---------|
| `src/app/useHashRoute.ts` | Route by first path segment; `parsePath`, `useHashPath`, `navigate(hash, { replace })` |
| `src/puzzles/woordzoeker/WoordzoekerPage.tsx` | View derived from path; memory puzzle; saved puzzle loaded by id; link handling via `navigate` |
| `src/app/App.test.tsx` | Sub-route tests |
| `src/puzzles/woordzoeker/WoordzoekerPage.test.tsx` | Back-navigation, reload and link tests |

## Tests

| Test File | Coverage |
|-----------|----------|
| `App.test.tsx` | `parseHash`/`parsePath` with sub-routes; header link active on sub-routes |
| `WoordzoekerPage.test.tsx` | setup → play → back → setup; setup → Mijn puzzels → Spelen → back → Mijn puzzels → back → setup; Opslaan replaces URL without restart; reload on `/spel/<id>` restores progress; `/spel` without memory → setup; unknown id → notice; share link → `/spel` |
