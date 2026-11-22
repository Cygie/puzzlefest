---
work_item: getallenpad-solver
intent: getallenpad
created: 2026-11-22T14:10:00Z
mode: validate
checkpoint_1: approved
---

# Design: Counting solver

## Summary

A pure TypeScript solver in `src/puzzles/getallenpad/logic/solve.ts` that counts the solutions of a grid with givens, stopping at the second one: 0, 1 or "many". It reports how many search nodes it visited (stored as the difficulty metric). It plugs into `validatePuzzle` as the uniqueness check and is the engine of the reduction step.

## Scope

**In scope:** search, pruning, node count, node budget, `AbortSignal`, validator hook, oracle tests, fixtures.
**Out of scope:** the reduction loop and difficulty targets (getallenpad-reduction), hints.

## API

```ts
interface SolveInput { width: number; height: number; givens: (number | null)[][] }
interface SolveOptions {
  maxNodes?: number;         // default: unlimited
  signal?: AbortSignal;
  pruning?: boolean;         // default true; false only for the oracle test
}
interface SolveResult {
  count: SolutionCount;      // 0 | 1 | 'many'  (from validatePuzzle.ts)
  nodes: number;
  solution?: number[][];     // the first solution found
}
type SolveErrorCode = 'node-limit' | 'aborted';
interface SolveError { code: SolveErrorCode; nodes: number }

function countSolutions(input: SolveInput, options?: SolveOptions): Result<SolveResult, SolveError>;

/** For validatePuzzle({ countSolutions: uniquenessCheck }) — unlimited, no signal. */
function uniquenessCheck(puzzle: GetallenpadPuzzle): SolutionCount;
```

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Search order | Place values in order 1 → N: from the cell of k, value k+1 goes to its given cell (must be adjacent) or to an empty neighbour. | Standard for this type of puzzle: each step has ≤ 8 options and givens act as fixed waypoints, so most branches die fast. 1 is always given, so there's always a start. |
| Candidate order | Empty neighbours with the fewest empty neighbours first (Warnsdorff). | Finds the first solution quickly; for counting to 2 the whole tree must be explored anyway, so order mostly affects how early the second solution shows. |
| Pruning 1 — distance | Value k+1 at cell c is only allowed if `chebyshev(c, G) ≤ g − (k+1)` for the next given g at G. Before searching, check every pair of consecutive givens the same way → 0 immediately. Also: a cell holding a given is never used for another value. | Chebyshev distance is exactly the minimum number of king steps, so this is a necessary condition — it never prunes a real solution. |
| Pruning 2 — regions | After each placement, flood fill the empty cells (shared `labelRegions`). Every region must touch an "open end": the current head, or a given g whose g−1 or g+1 is still unplaced. Otherwise backtrack. Also: an empty cell with no empty neighbour and no adjacent open end → backtrack. | Sequential filling means unreachable empty cells can never be filled. Exact necessary condition, cheap on ≤ 100 cells. |
| Counting | Stop as soon as the second solution is found; keep the first as `solution`. | All the reduction and the validator need is "exactly one". |
| Node count | One node = one value placed (given or chosen). | Simple, deterministic (no timing), comparable between puzzles → usable as difficulty metric. |
| Budget | Optional `maxNodes` → `err('node-limit')`. The reduction treats a node-limit as "keep this given" (it never removes a number it can't prove safe). | Keeps the 5 s target without ever publishing a non-unique puzzle. Validator/CI run without limit. |
| Abort | `signal.aborted` checked every 1 024 nodes → `err('aborted')`. | Brief: CPU work must be cancellable. |
| Validator hook | `uniquenessCheck` adapts the solver to the sync `countSolutions` option of `validatePuzzle`. | The validator stays independent of the solver module (no import cycle). |

## Technical Approach

```
countSolutions(input)
 ├─ index givens: cell of each given value, nextGiven[k]
 ├─ precheck consecutive givens (distance)     → 0 solutions
 └─ dfs(k, head)
      if k == N → found++ (copy first) ; stop at 2
      target = cellOf[k+1] ? [that cell if adjacent] : empty neighbours (Warnsdorff)
      for c in target:
        distanceOk(c, k+1) → place → regionsOk() → dfs(k+1, c) → unplace
```

State: `Int16Array` value per cell (0 empty), `Int16Array cellOf` per value, labels buffer for flood fill.

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Proving uniqueness on 7×7 at ~20% givens is expensive (whole tree must be explored), and reduction calls the solver ~40 times | High | Both prunings; measure nodes/time on the Pi early (first fixture benchmarks). Fallback via `maxNodes` in the reduction. If still too slow: add bidirectional placement (also extend downward from givens) — noted, not built now. |
| A pruning bug silently drops real solutions → a puzzle wrongly judged unique | High | Oracle test: pruning on vs off on hundreds of random small grids (3×3–4×4, random givens incl. 0/1/many cases) must give identical counts. Validator in CI re-checks every published puzzle. |
| Node count depends on candidate order, not only on human difficulty | Medium | It's a relative metric between our own puzzles (same solver); the brief only asks that levels differ measurably. |

## Implementation Checklist

1. Index givens, `nextGiven`, distance precheck.
2. DFS 1 → N with Warnsdorff candidate order, counting to 2, node count.
3. Distance pruning.
4. Region pruning (open ends).
5. `maxNodes`, `signal`, `pruning: false` switch.
6. `uniquenessCheck` + validator tests with it (TEST_PUZZLE turns out unique or not → fixture adjusted).
7. Tests:
   - fixtures with 0, 1 and many solutions (hand-made 3×3/4×4);
   - stops at the second solution: a puzzle with many solutions uses far fewer nodes than full enumeration (compared with a test-only enumeration counter);
   - oracle: pruning on/off equal on ≥ 300 random small grids;
   - node-limit and abort errors.
8. Benchmark on the Pi (temporary): 7×7 paths from the generator with 40/30/20% random givens → nodes/time.

## Revision during implementation (run-puzzlefest-012)

The first measurement of the design as written (place 1 → N only, distance + region pruning) hit the 5 M node limit on 7×7 for 15–40% of grids with 20–30% givens (up to 16 s). The fallback named under Risks was therefore built right away:

| Decision | Revised choice | Rationale |
|----------|----------------|-----------|
| Search order | Fill the **gaps** between placed values; each step picks the gap side (grow up from the lower value or down from the upper value) with the **fewest candidate cells** and branches over them. Values below the lowest / above the highest placed value grow from that end. | Most-constrained-first: forced moves are taken immediately, dead gaps (0 candidates) are found at once. Each solution is still reached exactly once (we branch on the cell of one specific value). |
| Extra pruning | After each placement: an **open end** (placed value with an unplaced neighbour value) needs at least that many empty neighbours; an **empty cell** needs ≥ 2 neighbours it can connect through (empty or open end) — only a missing 1 or N may have one; plus the distance and region checks over all placed values. | All necessary conditions → never drop a real solution (verified by the oracle against an independent counter). |

Measured on the Pi after the revision: random 20% givens p50 9 ms; a complete greedy reduction of a 7×7 puzzle p50 98 ms, max 1.4 s.
