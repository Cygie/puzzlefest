---
work_item: getallenpad-path-generator
intent: getallenpad
created: 2026-11-22T14:10:00Z
mode: validate
checkpoint_1: approved
---

# Design: Hamiltonian path generator

## Summary

A pure TypeScript function in `src/puzzles/getallenpad/logic/generatePath.ts` that returns a random path through every cell of a W×H grid (8-neighbour steps), as solution rows 1..N. Same seed → same path. Expected failures (time-out, abort, invalid size) come back as `Result`. Used by the reduction step (admin page + tests only).

## Scope

**In scope:** the path search, pruning, restarts, step budget, time-out, `AbortSignal`, tests, Pi benchmark.
**Out of scope:** removing numbers / difficulty (getallenpad-reduction), Web Worker (getallenpad-beheer).

## API

```ts
interface PathInput { width: number; height: number; seed: number }
interface PathOptions {
  timeoutMs?: number;        // default 2000
  maxSteps?: number;         // default 200 000
  now?: () => number;        // injectable clock for tests
  signal?: AbortSignal;
}
type PathErrorCode = 'grid-size' | 'no-path' | 'timeout' | 'aborted';
interface PathError { code: PathErrorCode; message: string /* Dutch */ }

function generatePath(input: PathInput, options?: PathOptions): Result<number[][], PathError>;
```

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Start cell | Random cell (seeded), not a corner. | 1 and N land anywhere, so puzzles don't all start in a corner. With 8-neighbour steps every rectangle ≥ 1×2 has a Hamiltonian path from any start, so this costs nothing. |
| Step order | Warnsdorff: unvisited neighbours sorted by fewest onward unvisited neighbours; ties broken by the seeded RNG. | The classic heuristic for tours: dead ends get used before they're cut off. On 8-neighbour grids it almost never needs to backtrack. |
| Variety | With probability `NOISE` (0.25) a step picks a random valid neighbour instead of the Warnsdorff best. | Pure Warnsdorff hugs the edge and spirals inwards — a predictable path makes an easy, boring puzzle. Pruning (below) catches the dead ends noise creates. Tunable constant. |
| Pruning | After each step:<br>• the unvisited cells must form **one** 8-connected region that touches the head (shared `labelRegions`);<br>• at most **one** unvisited cell may have ≤ 1 unvisited neighbour (not counting the head) — only the path's end can be a dead end. | Both rules are exact necessary conditions, so they never cut off a valid path; they turn deep hopeless subtrees into immediate backtracks. Cheap on ≤ 100 cells. |
| Restarts | Every 5 000 steps restart with a new start cell from the same RNG stream; `maxSteps` total → `no-path`. | A fresh start escapes a bad early choice faster than deep backtracking (same pattern as the woordslang generator). Deterministic because it's one RNG stream. |
| Time-out / abort | Wall clock (`timeoutMs`, injectable `now()`) → `timeout`; `signal.aborted` → `aborted`. Both checked every 256 steps. | Required by the brief. Checking per 256 steps keeps the overhead negligible. A time-out never yields a *different* path, so determinism holds whenever it finishes. |
| Output | Solution rows (`number[][]`), checked with shared `findPathProblem` + full coverage; a failure there throws. | Same shape as `GetallenpadPuzzle.solution`. A wrong path is a bug, not an expected outcome. |

## Technical Approach

```
generatePath(input, options)
 ├─ check size (3..10)                 → err('grid-size')
 ├─ neighbours = neighbourTable(w, h)  (shared)
 ├─ loop restarts (budget / time-out / abort)
 │   ├─ start = random cell
 │   └─ dfs(head, depth)
 │        candidates = unvisited neighbours → Warnsdorff order (+ noise)
 │        for c: visit c; if pruneOk() and dfs(c) → true; unvisit c
 └─ toRows(order) → self-check → ok(rows)
```

State: `Int16Array` order (cell → value, 0 = unvisited), `Int16Array` labels for flood fill, iterative step counter.

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Paths still look too regular (long straight runs along the edge) | Medium | `NOISE` constant; the admin preview shows the path; reduction picks the puzzles. Revisit after seeing real puzzles. |
| Recursion depth 100 in JS | Low | Max 100 cells, well within the stack; no iteration needed. |
| Pi slower than dev machine | Low | Benchmark on the Pi: 7×7 path target < 50 ms typical, so it is not the bottleneck (the solver is). |

## Implementation Checklist

1. Size check + error codes and Dutch messages.
2. DFS with Warnsdorff + noise ordering.
3. Pruning (single region touching the head, ≤ 1 dead-end cell).
4. Restarts, step budget, time-out, abort.
5. `toRows` + self-check.
6. Tests:
   - fixed seed → identical valid path for 3×3, 7×7, 5×9, 10×10;
   - different seeds → different paths;
   - fake clock → `timeout`; tiny `maxSteps` → `no-path`; aborted signal → `aborted`;
   - restart behaviour (restart counter observed via tiny restart interval);
   - pruning never rejects a valid continuation (small grids, compared with plain DFS).
7. Benchmark on the Pi (temporary): 1 000 seeds 7×7 → time distribution.
