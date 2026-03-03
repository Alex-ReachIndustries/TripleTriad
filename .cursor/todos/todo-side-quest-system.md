# Todo: Side Quest System

## Goal
Implement a data-layer side quest system with 13 hand-crafted quests. NPCs offer quests via dialogue, player tracks active/completed quests, and rewards are delivered on completion. This is pure data/logic — no UI changes in this phase.

## Quest Types
- `find_card` — player must own a specific card
- `beat_npc` — player must defeat a specific NPC
- `clear_dungeon` — player must complete a dungeon (beat the boss)

## Steps
- [x] 1. Create `frontend/src/types/quest.ts` with Quest and QuestReward interfaces
- [x] 2. Create `frontend/src/data/quests.ts` with all 13 quest definitions + helper functions
- [x] 3. Add quest state tracking to worldState.ts (activeQuests, completedQuests, clearedDungeons)
- [x] 4. Add quest helper functions: acceptQuest, claimQuestReward, markDungeonCleared
- [x] 5. Docker build + verify no TypeScript errors — confirmed, state persists correctly
