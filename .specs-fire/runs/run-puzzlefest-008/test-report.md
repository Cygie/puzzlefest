---
run: run-puzzlefest-008
work_items: [woordslang-generator]
---

# Test Report

- **Suite:** 27 files, 262 tests, all passing (was 242). Coverage: 96.7% statements, 93.0% branches; `generatePuzzle.ts` 98.4% / 94.4%, `regions.ts` 100%.
- **New tests (20):**
  - `regions.test.ts`: neighbour table, separate regions, diagonal connectivity, full grid; partition yes/no cases, empty regions.
  - `generatePuzzle.test.ts`: one case per input error (grid-size, invalid-word, duplicate-word incl. against the key word, word-too-long, letter-count with numbers in the message, key-too-short); valid puzzle with edge-to-edge key word; identical output per seed, different output for another seed; `no-solution` on a tiny step budget; `timeout` with a fake clock; 3×3 and 12×12 grids; fuzz over 40 seeds → every success valid.
- **Benchmark on the Raspberry Pi 5** (temporary test, deleted): random word sets from the woordzoeker themes, 6–8 words, key word ≥ min(width, height), exact letter count.

| Grid | Success | Median | p90 | Max |
|------|---------|--------|-----|-----|
| 6×8 (48 letters) | 200/200 | < 1 ms | 106 ms | 267 ms |
| 7×7 (49 letters) | 200/200 | < 1 ms | 93 ms | 373 ms |

  Target (≥ 90% within 5 s) met with a wide margin. A 12×12 grid with 23 words is generated in under a second.
- `tsc -b`, ESLint, Prettier and `npm run build` clean.
