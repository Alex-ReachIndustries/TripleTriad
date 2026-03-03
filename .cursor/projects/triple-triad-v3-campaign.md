# Project: Triple Triad V3 Campaign — FF8 Storyline Redesign

## Executive Summary
Redesign the entire single-player campaign to follow the FF8 storyline with ~30 locations across 6 regions (Dollet merged into Balamb), a 13-chapter main quest system that controls progression with backtracking, side quests, notification markers at all navigation levels, a quest log with story recap, and MapEditor save functionality. Success = a full FF8-faithful campaign playable from chapter 1 through 13 with story-driven pacing.

## How to Resume This Project
1. Read this file top to bottom to understand current state
2. **If all phases show `[x] Complete` → the project is finished. Tell the user and stop.**
3. Otherwise, find the first incomplete phase/todo and continue from there
4. Run `/execute-project .cursor/projects/triple-triad-v3-campaign.md` to continue from where it left off

---

## Key Design Decisions

### 6 Regions (Dollet merged into Balamb)
1. **Balamb** — Open rules (starter)
2. **Galbadia** — Same rules
3. **Fisherman's Horizon** — Elemental + Sudden Death
4. **Trabia** — Random + Plus
5. **Centra** — Same + Plus + Random
6. **Esthar** — Elemental + Same Wall

### TD (Town-Dungeon) Concept
TD locations are dungeons accessed from within a parent town as if they were an NPC. They appear in the town's NPC grid with a cave icon. Clicking them navigates into a dungeon floor gauntlet. They do NOT appear as separate markers on the region map.

### 13-Chapter Progression Order
The player progresses through chapters by completing main quests. Each chapter unlocks new locations (and may unlock new content in previously-visited regions via backtracking).

```
Ch 1  — Balamb:    (T) Balamb Garden, (T) Balamb, (D) Fire Cavern, (T) Dollet, (D) Radio Tower
Ch 2  — Galbadia:  (T) Timber, (T) Galbadia Garden, (T) Deling City,
                    (D) Tomb of the Unknown King, (TD←Deling) Deling City Sewers,
                    (T) Winhill, (D) D-District Prison, (D) Galbadia Missile Base
Ch 3  — Balamb:    (TD←Balamb Garden) Balamb Garden Basement
Ch 4  — FH:        (T) Fisherman's Horizon
Ch 5  — Balamb:    (TD←Balamb) Balamb Under Siege!
Ch 6  — Trabia:    (D) Roaming Forest, (T) Trabia Garden
Ch 7  — Galbadia:  (TD←Galbadia Garden) Galbadia Garden Revolution!
Ch 8  — Centra:    (T) Edea's House, (T) White SeeD Ship
Ch 9  — Esthar:    (D) Great Salt Lake, (T) Esthar City, (D) Lunar Base, (T) Sorceress Memorial
Ch 10 — Centra:    (D) Deep Sea Research Centre
Ch 11 — Trabia:    (T) Shumi Village
Ch 12 — Esthar:    (D) Lunatic Pandora
Ch 13 — Centra:    (D) Centra Excavation Site, (D) Centra Ruins
```

### Notification Markers
- **!** (gold) — Main quest available
- **?** (blue) — Side quest available
- **...** (white) — New NPC dialogue
- **$** (green) — New shop content
- **⚔** (red) — New duel/tournament content
- Markers bubble up: NPC → location → region → world map

### Story Chapter System
- `storyChapter: number` in WorldPlayerState (0 = start, advances with main quest)
- NPCs have optional `minChapter`/`maxChapter` — only appear in that chapter range
- Locations unlock via `story_chapter` condition type
- `seenContent: Record<locationId, npcId[]>` tracks player interactions for notification badges

---

## Phases

### Phase 1: Data Model Foundation + MapEditor Save
**Status:** [x] Complete

Goal: Extend the data model to support story chapters, chapter-gated NPCs, TD locations, and notification tracking. Add MapEditor persistence so polygon/location edits survive page reload.

Tasks:
- [x] Create guidance doc at `.cursor/projects/triple-triad-v3-campaign/architecture.md`
- [x] `todo-data-model.md` — Extend types and state:
  - Add `storyChapter: number` to WorldPlayerState (0 = start)
  - Add `mainQuestLog: string[]` — completed main quest IDs in order
  - Add `seenContent: Record<string, string[]>` — per-location NPC interaction tracking
  - Add `story_chapter` to UnlockCondition type union
  - Add `minChapter?: number` / `maxChapter?: number` to NPC type
  - Add `parentTownId?: string` to Location type (for TD locations)
  - Add `isMainQuest?: boolean` to Quest type
  - Update `isRegionUnlocked()` / `isLocationUnlocked()` in unlock.ts for story_chapter
  - Update worldState migration to handle new fields gracefully
- [x] `todo-mapeditor-save.md` — MapEditor persistence:
  - Add "Save Overrides" button that stores edits to localStorage
  - On app load, if localStorage has map overrides, merge them into world data
  - Add "Clear Overrides" button to reset
  - Add "Download JSON" button for exporting overrides as a file

---

### Phase 2: World Data Rewrite — 6 Regions, ~30 Locations
**Status:** [ ] Not Started

Goal: Completely rewrite `world.ts` with the new 6-region, ~30-location structure following the FF8 progression through 13 chapters.

Todos:
- [ ] `todo-regions-locations.md` — Rewrite REGIONS and LOCATIONS arrays:
  - 6 regions with updated mapBounds (merge Dollet into Balamb)
  - ~30 locations with correct chapter-based unlock conditions
  - TD locations with `parentTownId` linking them to their parent town
  - Proper `mapX`/`mapY` placement within regions
  - Dungeon flavour text for all dungeon locations
  - All location `order` values for display sorting

---

### Phase 3: NPCs, Shops, Tournaments & Quest Chain
**Status:** [ ] Not Started

Goal: Populate all ~30 locations with NPCs (~100+), create the 13-chapter main quest storyline, design shops and tournaments, and write ~15-20 side quests.

Todos:
- [ ] `todo-main-quests.md` — Create ~13 main quests (one per chapter transition):
  - Each has: story text, objective (beat boss / clear dungeon / reach location), reward
  - Completing a main quest advances `storyChapter`
  - Main quests use `isMainQuest: true` flag
  - Main quest givers show "!" marker
- [ ] `todo-npcs-ch1-5.md` — NPCs for chapters 1-5 (Balamb, Galbadia early, FH):
  - Duel NPCs with tiered difficulty and deck pools
  - Shop NPCs with appropriate inventory
  - Dialogue NPCs for quests and story (with `minChapter`/`maxChapter`)
  - Tournament NPCs at major towns
  - TD "NPCs" linking to town-dungeons (cave icon)
  - FF8-appropriate names and dialogue
- [ ] `todo-npcs-ch6-13.md` — NPCs for chapters 6-13 (Trabia, Galbadia return, Centra, Esthar):
  - Same structure as above for later chapters
  - Higher difficulty tiers (3-5)
  - Backtracking content: new NPCs appearing in old locations at higher chapters
- [ ] `todo-side-quests.md` — ~15-20 side quests:
  - Mix of find_card, beat_npc, clear_dungeon types
  - Chapter-gated availability
  - Rewards: rare cards, gil, or both
  - Quest givers in town locations only

---

### Phase 4: Notification Marker System
**Status:** [ ] Not Started

Goal: Show notification markers at world map, region map, and town levels for new/unseen content.

Todos:
- [ ] `todo-notification-system.md` — Implement marker system:
  - Track `seenContent` in WorldPlayerState: add NPC to seen list on interaction
  - Helper: `getLocationMarkers(locationId, worldState)` → returns set of marker types
  - Helper: `getRegionMarkers(regionId, worldState)` → aggregates location markers
  - A location has "new content" if any visible NPC (current chapter) hasn't been seen
  - Marker types: main_quest (!), side_quest (?), dialogue (...), shop ($), duel/tournament (⚔)
- [ ] `todo-notification-ui.md` — Add markers to all navigation views:
  - WorldMapView: marker badges on region polygons/labels
  - RegionView: marker badges on location markers and cards
  - TownView: marker badges on NPC cards (extend existing quest badges)
  - CSS styles for each marker type (gold, blue, white, green, red)

---

### Phase 5: Quest Log & Story Screen
**Status:** [ ] Not Started

Goal: Add a quest management screen with main quest log, active quests, and story progression.

Todos:
- [ ] `todo-quest-log.md` — New QuestLog component:
  - Three sections: Story Log, Active Quests, Completed Quests
  - Story Log: completed main quests in order with chapter title + story text (FF8 recap)
  - Active Quests: current main quest + active side quests with progress indicators
  - Completed Quests: archive with rewards shown
  - Accessible from nav or within World mode
  - Mobile-responsive layout

---

### Phase 6: Testing, Balance & Polish
**Status:** [ ] Not Started

Goal: Verify full campaign playthrough, balance progression, fix bugs, build APK.

Tasks:
- [ ] Test full chapter 1→13 progression in browser
- [ ] Verify backtracking unlocks (chapters 3, 5, 7 return to earlier regions)
- [ ] Verify TD locations appear correctly in parent towns
- [ ] Verify notification markers appear/disappear properly
- [ ] Balance NPC deck pools and shop prices for progression curve
- [ ] Test quest acceptance, completion, and reward claiming
- [ ] Verify quest log shows correct story progression
- [ ] Mobile responsiveness check at 390x844
- [ ] Build Android APK and update GitHub release v1.0.0

---

## Implementation Notes

### Docker First
All builds, test runs, and dev servers via Docker. Never run npm directly on host.

### Commit Discipline
Each todo completes → test in Docker → commit with descriptive message → push to remote.

### Engine Sync Rule
`frontend/src/game/engine.ts` is source of truth. After any engine change, update `backend/engine.mjs`. (This project likely won't touch the engine.)

### Reporting Format
All human-facing reports: styled HTML in `docs/`. Include stat boxes, colour-coded status, tables.

### Key File Paths
- World data: `frontend/src/data/world.ts` (full rewrite in Phase 2)
- World state: `frontend/src/data/worldState.ts` (extend in Phase 1)
- Types: `frontend/src/types/world.ts` (extend in Phase 1)
- Quests: `frontend/src/data/quests.ts` (rewrite in Phase 3)
- Unlock logic: `frontend/src/data/unlock.ts` (extend in Phase 1)
- MapEditor: `frontend/src/components/admin/MapEditor.tsx` (save feature in Phase 1)
- World UI: `frontend/src/components/world/` (markers in Phase 4)
- New: `frontend/src/components/world/QuestLog.tsx` (Phase 5)
