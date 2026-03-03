# Todo: Progressive Difficulty

## Goal
Remove player-chosen AI difficulty in world/story mode. Map each NPC's difficultyTier (1-5) to the engine's AI strategy automatically. Keep manual difficulty selection only for freestyle vs-AI.

## Mapping
- Tier 1 → easy (random moves)
- Tier 2 → medium (greedy, 1-ply)
- Tier 3 → medium (greedy, 1-ply)
- Tier 4 → hard (minimax alpha-beta)
- Tier 5 → hard (minimax alpha-beta)

## Steps
- [x] 1. Add `getDifficultyForTier(tier: DifficultyTier): Difficulty` to ai.ts
- [x] 2. Add `difficultyTier` to legacy Area type and include it in getAreas() mapping
- [x] 3. In PlayPage: when worldChallengeLocation has a difficultyTier, auto-set difficulty and hide the dropdown
- [x] 4. Keep difficulty dropdown visible only for freestyle vs-AI (no worldChallengeLocation)
- [x] 5. Docker build + verify in browser — confirmed Tier 1 = Easy auto-set, freestyle shows dropdown
