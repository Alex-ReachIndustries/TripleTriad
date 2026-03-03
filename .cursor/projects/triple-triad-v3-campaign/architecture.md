# Architecture Guide — V3 Campaign (FF8 Storyline Redesign)

## Overview

This document covers the data model extensions and architectural decisions for the FF8 campaign redesign. The core change is replacing the flat region-order progression with a **story chapter** system where a single integer (`storyChapter`) controls what content is available.

---

## Story Chapter System

### Core Concept
- `storyChapter` is an integer starting at 0 (new game) and advancing to 13 (endgame)
- Each main quest completion increments `storyChapter`
- Locations use `{ type: 'story_chapter', count: N }` unlock conditions
- NPCs use `minChapter`/`maxChapter` for chapter-gated visibility
- This enables **backtracking**: the same region/town can gain new content at later chapters

### State Changes to WorldPlayerState
```typescript
interface WorldPlayerState {
  // Existing fields (unchanged)
  inventory: Record<string, number>
  gil: number
  npcWins: Record<string, number>
  activeQuests: string[]
  completedQuests: string[]
  clearedDungeons: string[]
  discoveredCards: string[]
  savedDecks: SavedDeck[]
  lastDeckId: string | null
  unlockedOrder: number

  // NEW fields
  storyChapter: number            // 0 = new game, advances with main quest
  mainQuestLog: string[]          // Completed main quest IDs, in order
  seenContent: Record<string, string[]>  // locationId → npcId[] (for notifications)
}
```

### Default values for new fields
```typescript
storyChapter: 0
mainQuestLog: []
seenContent: {}
```

### Migration
On load, if `storyChapter` is missing, default to 0. Existing saves from V3 will start the new campaign fresh. The `unlockedOrder` field is kept for backward compat but `storyChapter` takes precedence for the new unlock system.

---

## Type Extensions

### UnlockCondition — new `story_chapter` type
```typescript
export interface UnlockCondition {
  type: 'default' | 'beat_npc' | 'clear_dungeon' | 'unique_wins_in_location'
       | 'unique_wins_in_region' | 'quest_count' | 'story_chapter'
  targetId?: string
  count?: number  // For story_chapter: the chapter number required
}
```

### NPC — chapter visibility
```typescript
export interface NPC {
  // ... existing fields ...
  minChapter?: number  // NPC only visible when storyChapter >= minChapter
  maxChapter?: number  // NPC only visible when storyChapter <= maxChapter
}
```

If neither is set, NPC is always visible. If only `minChapter` is set, NPC appears from that chapter onward. If only `maxChapter` is set, NPC disappears after that chapter.

### Location — TD parent linking
```typescript
export interface Location {
  // ... existing fields ...
  parentTownId?: string  // For TD locations: the town location ID this dungeon is accessed from
}
```

TD locations with `parentTownId` set will NOT appear as markers on the region map. Instead, they appear as special NPC-like entries in the parent town's NPC grid, with a cave icon.

### Quest — main quest flag
```typescript
export interface Quest {
  // ... existing fields ...
  isMainQuest?: boolean  // true = part of the main storyline, advances storyChapter on completion
  storyText?: string     // Narrative text shown in quest log after completion
  chapterTitle?: string  // e.g. "Chapter 1: The SeeD Exam"
}
```

---

## TD (Town-Dungeon) Implementation

### Data Model
- A TD location is a `Location` with `type: 'dungeon'` and `parentTownId: 'some_town_id'`
- It has its own NPCs (dungeon floor opponents) like any dungeon
- It does NOT have its own mapX/mapY since it doesn't appear on the region map

### UI Flow
1. Player enters a town → sees NPC grid
2. One of the "NPCs" is actually a TD entry: shows cave icon, dungeon name, difficulty info
3. Clicking it navigates to the DungeonView for that TD location
4. Back button from DungeonView returns to the parent town

### Rendering in TownView
TD locations for a given town are fetched with:
```typescript
const tdLocations = getLocationsByParentTown(townId)
```
They render as special cards in the NPC grid with:
- Cave icon (🏔️ or similar)
- Dungeon name
- Floor count + boss info
- Chapter-gated visibility (may only appear at certain chapters)

---

## Notification Marker System

### Data: seenContent
```typescript
seenContent: Record<string, string[]>  // locationId → [npcId, npcId, ...]
```

When a player interacts with an NPC (opens dialogue, visits shop, initiates duel, etc.), the NPC's ID is added to the location's seen list:
```typescript
function markNpcSeen(state: WorldPlayerState, locationId: string, npcId: string): WorldPlayerState {
  const existing = state.seenContent[locationId] ?? []
  if (existing.includes(npcId)) return state
  return {
    ...state,
    seenContent: {
      ...state.seenContent,
      [locationId]: [...existing, npcId]
    }
  }
}
```

### Computing markers
```typescript
type MarkerType = 'main_quest' | 'side_quest' | 'dialogue' | 'shop' | 'duel'

function getLocationMarkers(locationId: string, state: WorldPlayerState): MarkerType[] {
  const npcs = getVisibleNpcs(locationId, state.storyChapter)
  const seen = state.seenContent[locationId] ?? []
  const markers: MarkerType[] = []

  for (const npc of npcs) {
    if (seen.includes(npc.id)) continue // Already seen
    if (npc.questId && isMainQuest(npc.questId)) markers.push('main_quest')
    else if (npc.questId) markers.push('side_quest')
    else if (npc.type === 'dialogue') markers.push('dialogue')
    else if (npc.type === 'shop') markers.push('shop')
    else if (npc.type === 'duel' || npc.type === 'tournament') markers.push('duel')
  }

  return [...new Set(markers)] // Deduplicate
}
```

Region markers = union of all location markers within that region.

### When seenContent resets
When `storyChapter` advances, some NPCs may change (new ones appear, old ones may disappear). The seenContent for affected locations should NOT be cleared — new NPCs simply won't be in the seen list and will trigger markers automatically.

---

## MapEditor Persistence

### Approach: localStorage overrides
The MapEditor already generates updated TypeScript code. We add a simpler persistence layer:

1. **Save**: Store a JSON object `{ regions: { [id]: mapBounds }, locations: { [id]: { mapX, mapY } } }` in localStorage under key `tripletriad-map-overrides`
2. **Load**: In `world.ts` data functions, check for overrides and merge them on top of hardcoded data
3. **Clear**: Remove the localStorage key to revert to defaults
4. **Export**: Download button writes the JSON as a file for safekeeping

### Merge function
```typescript
function applyMapOverrides(regions: Region[], locations: Location[]): { regions: Region[], locations: Location[] } {
  const overrides = loadMapOverrides()  // from localStorage
  if (!overrides) return { regions, locations }

  const mergedRegions = regions.map(r => ({
    ...r,
    mapBounds: overrides.regions?.[r.id] ?? r.mapBounds
  }))

  const mergedLocations = locations.map(l => ({
    ...l,
    mapX: overrides.locations?.[l.id]?.mapX ?? l.mapX,
    mapY: overrides.locations?.[l.id]?.mapY ?? l.mapY
  }))

  return { regions: mergedRegions, locations: mergedLocations }
}
```

---

## Chapter → Location Mapping Reference

| Ch | Region | New Locations |
|----|--------|--------------|
| 1 | Balamb | Balamb Garden (T), Balamb (T), Fire Cavern (D), Dollet (T), Radio Tower (D) |
| 2 | Galbadia | Timber (T), Galbadia Garden (T), Deling City (T), Tomb of Unknown King (D), Deling Sewers (TD), Winhill (T), D-District Prison (D), Galbadia Missile Base (D) |
| 3 | Balamb | Balamb Garden Basement (TD) |
| 4 | FH | Fisherman's Horizon (T) |
| 5 | Balamb | Balamb Under Siege! (TD) |
| 6 | Trabia | Roaming Forest (D), Trabia Garden (T) |
| 7 | Galbadia | Galbadia Garden Revolution! (TD) |
| 8 | Centra | Edea's House (T), White SeeD Ship (T) |
| 9 | Esthar | Great Salt Lake (D), Esthar City (T), Lunar Base (D), Sorceress Memorial (T) |
| 10 | Centra | Deep Sea Research Centre (D) |
| 11 | Trabia | Shumi Village (T) |
| 12 | Esthar | Lunatic Pandora (D) |
| 13 | Centra | Centra Excavation Site (D), Centra Ruins (D) |
