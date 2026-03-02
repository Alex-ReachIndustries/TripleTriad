# Architecture Guide — Triple Triad V3

## Overview

V3 transforms the flat area-based world into a hierarchical Region → Location → NPC system, adds multi-copy card inventory, named/saved decks, side quests, and progressive difficulty. The frontend remains a React 19 SPA; the backend WebSocket server is extended for 2P inventory validation.

---

## Navigation Flow (New)

```
AppView:
  'title'     → TitleScreen (New Game / Continue / How to Play / 2P Duel)
  'howto'     → HowToPlay (with diagrams)
  'cutscene'  → CutscenePlayer (story panels)
  'worldmap'  → WorldMapPage (7-region overview)
  'region'    → RegionPage (locations within selected region)
  'town'      → TownPage (NPC grid for town locations)
  'dungeon'   → DungeonPage (floor ladder for dungeon locations)
  'preduel'   → PreDuelPage (deck selector + opponent info)
  'game'      → GameBoard (active duel)
  'deckmanager' → DeckManagerPage (create/edit/delete decks)
  'twoplayer' → TwoPlayerLobby → GameBoard
```

### Navigation Stack
Use a simple stack-based navigation model (array of views) so "Back" always returns to the previous screen:
```typescript
type NavEntry = { view: AppView; params?: Record<string, string> }
const [navStack, setNavStack] = useState<NavEntry[]>([{ view: 'title' }])

function navigate(view: AppView, params?: Record<string, string>) {
  setNavStack(prev => [...prev, { view, params }])
}
function goBack() {
  setNavStack(prev => prev.length > 1 ? prev.slice(0, -1) : prev)
}
```

---

## Data Models

### Multi-Copy Inventory

Replace `collection: string[]` with `inventory: Record<string, number>`:

```typescript
interface WorldPlayerState {
  unlockedRegions: string[]           // Region IDs unlocked
  unlockedLocations: string[]         // Location IDs unlocked
  inventory: Record<string, number>   // cardId → count owned (min 1 for starters)
  gil: number
  npcWins: Record<string, number>     // npcId → win count
  activeQuests: string[]              // Quest IDs currently active
  completedQuests: string[]           // Quest IDs completed
  savedDecks: SavedDeck[]
  lastDeckId: string | null           // ID of last-used deck
  storyProgress: number               // 0 = not started, increments at story beats
}
```

**Migration:** On load, detect old format (`collection: string[]`) and convert to `Record<string, number>` with count = 1 per card.

### Saved Decks

```typescript
interface SavedDeck {
  id: string                          // UUID
  name: string                        // User-chosen name, max 20 chars
  cardIds: string[]                   // Exactly 5 card IDs
  isStarter: boolean                  // true for the default starter deck (undeletable)
}
```

**Constraints:**
- Max 10 saved decks
- "Starter Deck" always exists, uses the 5 starter cards, cannot be deleted or edited
- Deck references cards by ID; validation checks inventory count before duel start
- `lastDeckId` persisted so the dropdown defaults to the last-used deck

### Region → Location → NPC Hierarchy

```typescript
interface Region {
  id: string
  name: string
  rules: SpecialRule[]
  tradeRule: TradeRule
  description: string                 // Shown on hover in world map
  mapBounds: { x1: number; y1: number; x2: number; y2: number }  // % coords for SVG overlay
  unlockCondition: { type: 'story'; storyProgress: number } | { type: 'default' }
  order: number                       // Display/progression order (0-6)
}

interface Location {
  id: string
  name: string
  regionId: string
  type: 'town' | 'dungeon'           // NEW: determines UI and gameplay flow
  description: string
  flavourText?: string                // Dungeon intro text
  mapX: number                        // % position within region bounds
  mapY: number
  unlockCondition: { type: 'story'; storyProgress: number } | { type: 'npc_wins'; npcId: string; count: number }
  order: number                       // Display order within region
}
// Towns: NPC grid, free-roam, shops/dialogue/duels/tournaments
// Dungeons: Linear floor gauntlet → boss. Player commits deck before entering.
//   Losing any floor = kicked back to entrance. No shops/dialogue inside.

interface NPC {
  id: string
  name: string
  locationId: string
  type: 'dialogue' | 'shop' | 'duel' | 'tournament'
  portrait: string                    // Path to portrait image
  dialogue: string[]                  // Array of dialogue lines (cycle through)
  // Duel-specific
  deckPool?: string[]                 // Card IDs to draw from (8-12 cards)
  difficultyTier?: 1 | 2 | 3 | 4 | 5 // Maps to AI difficulty + deck quality
  gilReward?: number
  // Dungeon-specific (only for NPCs in dungeon locations)
  floorOrder?: number                 // 0-based floor index (0 = first floor)
  isBoss?: boolean                    // true for the final floor opponent
  floorIntro?: string                 // Narrative text shown before this floor's duel
  floorDefeated?: string              // Text shown after beating this floor
  // Shop-specific
  shopItems?: ShopItem[]
  // Tournament-specific
  entryFee?: number
  prizePool?: string[]                // Card IDs for random prize
  // Quest-specific
  questId?: string                    // Quest this NPC offers
}

interface ShopItem {
  cardId: string
  buyPrice: number
  sellPrice: number                   // Typically 50% of buy price
}
```

### Side Quest System

```typescript
interface Quest {
  id: string
  name: string
  description: string
  giverNpcId: string
  type: 'find_card' | 'beat_npc'
  targetId: string                    // Card ID or NPC ID depending on type
  reward: QuestReward
  prerequisite?: string               // Another quest ID that must be completed first
}

interface QuestReward {
  type: 'card' | 'gil' | 'both'
  cardId?: string
  cardCount?: number
  gilAmount?: number
}
```

**Quest flow:**
1. Player talks to dialogue NPC with `questId` set
2. NPC offers quest via dialogue
3. Player accepts → quest added to `activeQuests`
4. Player fulfills condition (acquires target card / beats target NPC / clears dungeon)
5. Player returns to giver NPC → reward delivered, quest moved to `completedQuests`

Note: Quest type `clear_dungeon` completes when the player defeats the boss of the specified dungeon.

### Progressive Difficulty

```typescript
// Difficulty tier mapping
const DIFFICULTY_TIERS: Record<number, { aiLevel: 'easy' | 'medium' | 'hard'; description: string }> = {
  1: { aiLevel: 'easy', description: 'Beginner' },
  2: { aiLevel: 'easy', description: 'Novice' },      // Easy AI but slightly better deck
  3: { aiLevel: 'medium', description: 'Intermediate' },
  4: { aiLevel: 'medium', description: 'Advanced' },   // Medium AI with strong deck
  5: { aiLevel: 'hard', description: 'Expert' },
}
```

NPC difficulty is determined by their `difficultyTier` property, NOT chosen by the player. Early-game NPCs (Balamb) use tier 1-2, mid-game (Galbadia/FH) use tier 2-3, late-game (Esthar) use tier 4-5.

---

## State Management

### localStorage Keys
```
tripletriad-world     → WorldPlayerState (JSON)
tripletriad-settings  → { musicVolume, sfxVolume, ... } (future)
```

### State Flow
- `App.tsx` owns the master `WorldPlayerState`
- Passed down via props (no context/Redux needed given the component tree depth)
- `saveWorldState()` called on every mutation
- Migration function runs on load to handle V2 → V3 format changes

---

## Backend Changes (Minimal)

### 2P Inventory Validation
- When a player sets their deck in 2P mode, the server should validate that the deck contains exactly 5 cards
- The server does NOT need to validate inventory (trust the client for card ownership — this is a fan game, not competitive esports)
- Fix the broken room creation endpoint (debug WebSocket lifecycle)

### Engine Sync
No engine changes needed for V3 — the game engine is complete from V2. Only the data layer and UI change.

---

## File Structure (New/Modified)

```
frontend/src/
├── components/
│   ├── TitleScreen.tsx          (redesign)
│   ├── HowToPlay.tsx            (add diagrams)
│   ├── CutscenePlayer.tsx       (NEW)
│   ├── WorldMapPage.tsx         (NEW - replaces WorldPage)
│   ├── RegionPage.tsx           (NEW)
│   ├── TownPage.tsx             (NEW - NPC grid for town locations)
│   ├── DungeonPage.tsx          (NEW - floor ladder for dungeon locations)
│   ├── NpcInteraction.tsx       (NEW - dialogue/shop/duel/tournament panels)
│   ├── PreDuelPage.tsx          (NEW)
│   ├── DeckManagerPage.tsx      (NEW - replaces DeckBuilder for management)
│   ├── ShopPanel.tsx            (NEW - buy/sell interface)
│   ├── QuestLog.tsx             (NEW - active/completed quests view)
│   ├── PlayPage.tsx             (keep for 2P, refactor)
│   ├── GameBoard.tsx            (keep, minor tweaks)
│   └── CardView.tsx             (keep)
├── data/
│   ├── regions.ts               (NEW - 7 regions)
│   ├── locations.ts             (NEW - all locations)
│   ├── npcs.ts                  (NEW - all NPCs with types, decks, shops)
│   ├── quests.ts                (NEW - all quest definitions)
│   ├── cutscenes.ts             (NEW - cutscene panel data)
│   ├── world.ts                 (DEPRECATED - keep for reference, remove later)
│   ├── worldState.ts            (MAJOR REWRITE - new state shape)
│   ├── cards.json               (keep as-is)
│   ├── characters.ts            (keep, extend)
│   └── shops.ts                 (DEPRECATED - replaced by NPC shop data)
├── types/
│   ├── card.ts                  (keep)
│   ├── world.ts                 (REWRITE - new Region/Location/NPC/Quest types)
│   └── character.ts             (keep)
└── game/
    ├── engine.ts                (no changes)
    ├── ai.ts                    (no changes)
    └── types.ts                 (no changes)
```

---

## Migration Strategy

1. **Phase 2** builds new data layer alongside old one (old code still works)
2. **Phase 4** introduces new UI components that use new data layer
3. **Phase 7** removes deprecated files and any remaining references to old `WorldPage`
4. At no point should the app be broken mid-migration — both old and new paths coexist until switchover
