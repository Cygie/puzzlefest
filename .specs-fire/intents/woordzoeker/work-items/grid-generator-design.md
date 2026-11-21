---
work_item: grid-generator
intent: woordzoeker
created: 2026-11-21T18:30:00Z
mode: validate
checkpoint_1: approved
---

# Design: Grid generator (placement, difficulty, solution word)

## Summary

Pure TypeScript generator in `src/puzzles/woordzoeker/logic/generateGrid.ts`. Input: normalized words, width × height, difficulty, optional solution word, seed. Output: a `Puzzle` or a failure listing unplaced words with Dutch reasons (plus the best partial puzzle). Fully deterministic per seed.

## Scope

**In Scope:**
- Word placement for all three difficulty levels
- Hidden solution word with exact leftover-cell count, plus `checkSolutionFit()` pre-check
- Weighted random fill (Dutch letter frequencies, flattened)
- Accidental-duplicate detection and refill
- Puzzle data model (shared by play, print, save, share)

**Out of Scope:**
- UI (puzzle-setup-ui, play-ui)
- Share-link encoding (share-link)
- Persistence (save-puzzles)

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Placement strategy | Longest-first; enumerate all valid (row, col, direction) candidates per word; weighted random pick favouring overlaps; restart the attempt when a word cannot be placed; keep best attempt | Long words are hardest to fit; full enumeration is cheap at ≤ 20×20; restarts are simpler than backtracking and sufficient at this size |
| Retry limit | Fixed attempt count (~30), not a time budget | A time budget would make output device-dependent and break seed reproducibility |
| Directions | Makkelijk: E, S · Normaal: + SE, NE · Moeilijk: all 8 | As agreed in the intent; uniform choice yields a natural mix of backward words |
| Too long vs. no room | `too-long` if letters > max(width, height); otherwise `no-room` | Two distinct, explainable Dutch messages |
| Solution word fit | Required overlaps k = totalLetters − (W·H − S). If totalLetters < W·H − S → impossible (message with numbers). Otherwise steer overlap count to exactly k and retry until exact | Leftover cells must equal solution length exactly |
| Fill letters | Dutch letter frequencies, flattened with sqrt | Raw frequencies (~19% E) look unnatural and make puzzles easier |
| Accidental duplicates | After fill, verify each word occurs exactly once; occurrences fully inside other placed words are allowed; refill (or restart) otherwise | Avoid ambiguous solutions |
| Grid representation | `grid: string[]` (one string per row) | Compact, immutable, easy to render, print and serialize |
| Failure shape | `ok: false` with `unplaced[]` and optional `partial` puzzle | Setup UI can offer "Doorgaan zonder deze woorden?" |

## Data Models Affected

### Creates
- **Difficulty**: `'makkelijk' | 'normaal' | 'moeilijk'` — difficulty level
- **Direction**: `'E' | 'S' | 'SE' | 'NE' | 'W' | 'N' | 'NW' | 'SW'` — placement direction
- **PlacedWord**: `display, letters, row, col, direction, length` — where a word sits in the grid
- **Puzzle**: `version: 1, width, height, difficulty, seed, grid: string[], words: PlacedWord[], solution?: { display, letters }, themeId?` — the complete puzzle
- **GenerateResult**: `{ ok: true; puzzle } | { ok: false; reason; unplaced: { word, code: 'too-long' | 'no-room', reason }[]; partial? }`

## Technical Approach

### Architecture

```
GenerateInput
   │
   ├─ validateInput (size 5–20, ≥ 1 word, solution letters)
   ├─ checkSolutionFit (if solution)
   │
   └─ for attempt in 1..MAX_ATTEMPTS  (rng from seed)
        ├─ placeWords (longest-first, candidates, weighted pick, overlap steering)
        ├─ exact leftover check (if solution)
        ├─ fillCells (solution letters row-order | weighted random)
        └─ duplicate check → refill / next attempt
   │
   └─ Puzzle | failure (+ best partial)
```

## Dependencies

- `src/shared/random.ts` (createRng, shuffle, randomInt)
- `logic/normalize.ts` (NormalizedWord, toGridLetters)

## Affected Files

| File | Action | Purpose |
|------|--------|---------|
| `src/puzzles/woordzoeker/logic/types.ts` | Create | Puzzle data model |
| `src/puzzles/woordzoeker/logic/directions.ts` | Create | Direction vectors, per-difficulty sets |
| `src/puzzles/woordzoeker/logic/letterFrequency.ts` | Create | Weighted fill letters |
| `src/puzzles/woordzoeker/logic/generateGrid.ts` | Create | Generator + `checkSolutionFit` |
| `src/puzzles/woordzoeker/logic/generateGrid.test.ts` | Create | Tests |

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Exact solution fit not found | Medium | Pre-check, overlap steering, Dutch message with size advice |
| Too slow on low-end devices | Medium | Fixed attempt cap; < 200 ms timing test at 20×20 / 20 words |
| Future algorithm changes alter seeded output (old share links) | High for share links | `version: 1`; recommend share-link encodes the grid, not the seed |
| Dense grids with many long words | Low | Report unplaced words + partial puzzle |

## Implementation Checklist

- [ ] Direction vectors + difficulty sets
- [ ] Input validation (size 5–20, ≥ 1 word, solution letters only)
- [ ] Candidate enumeration (bounds + overlap on identical letters)
- [ ] Longest-first weighted placement with restarts and best-attempt tracking
- [ ] Overlap steering for solution word + `checkSolutionFit()`
- [ ] Fill: solution row-order or flattened Dutch frequency
- [ ] Duplicate check + refill
- [ ] Tests for all acceptance criteria incl. determinism and timing

---
*Generated by specs.md - fabriqa.ai FIRE Flow | Checkpoint 1 approved: 2026-11-21T18:30:00Z*
