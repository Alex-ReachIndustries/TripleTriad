# Todo: AI Alpha-Beta Pruning

**Project:** `.cursor/projects/triple-triad-v2.md`
**Phase:** Phase 5 — Performance & Code Quality
**Status:** Complete

## Objective

Replace the hard AI's 2-ply minimax with a minimax + alpha-beta pruning implementation. Add a dynamic depth cap so the search goes deeper (4–6 ply) as the game progresses and the branching factor shrinks.

## Implementation Steps

- [x] Step 1: Add `minimax(state, depth, alpha, beta)` function to `ai.ts`
  - Maximises for player 1, minimises for player 0
  - Uses `state.turn` to determine current player
  - Alpha-beta cuts off branches where `beta <= alpha`
- [x] Step 2: Add `calcDepth(state)` — returns 4 when ≥7 cards left, 5 when 5–6 cards left, 6 when ≤4 left
- [x] Step 3: Rewrite `hardMove` to use `minimax` at the computed depth

## Testing Criteria

- [x] Test: `docker-compose run --rm frontend sh -c "npm run build"` exits 0
- [x] Test: Hard AI still returns a valid move object `{ cardIndex, row, col }`

## Definition of Done

- All implementation steps complete
- Build passes
- Committed and pushed
