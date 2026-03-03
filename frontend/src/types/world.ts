/**
 * V3 World mode types: 6 regions → locations → NPCs.
 * Towns have free-roam NPC grids; dungeons have sequential floor gauntlets.
 * Story chapter system controls progression and NPC visibility.
 */

export type SpecialRule =
  | 'Open'
  | 'Same'
  | 'Same Wall'
  | 'Sudden Death'
  | 'Random'
  | 'Plus'
  | 'Combo'
  | 'Elemental'

export type TradeRule = 'One' | 'Diff' | 'Direct' | 'All'

export type NpcType = 'dialogue' | 'shop' | 'duel' | 'tournament'

/** Difficulty tiers 1-5 mapping to AI strategy + deck strength. */
export type DifficultyTier = 1 | 2 | 3 | 4 | 5

export interface Region {
  id: string
  name: string
  /** Default special rules for this region. */
  rules: SpecialRule[]
  /** Default trade rule for this region. */
  tradeRule: TradeRule
  /** Story order (0 = starter region, 6 = endgame). */
  order: number
  /** Description shown in tooltips. */
  description: string
  /** SVG polygon points for map overlay (% of image dimensions). */
  mapBounds: string
  /** What the player must do to unlock this region. Null = unlocked by default. */
  unlockCondition: UnlockCondition | null
}

export interface UnlockCondition {
  /** Type of condition. */
  type: 'default' | 'beat_npc' | 'clear_dungeon' | 'unique_wins_in_location' | 'unique_wins_in_region' | 'quest_count' | 'story_chapter'
  /** For beat_npc: NPC id. For clear_dungeon: location id. For unique_wins: location/region id. */
  targetId?: string
  /** For unique_wins: how many unique NPC wins needed. For quest_count: how many quests. For story_chapter: chapter number required. */
  count?: number
}

export interface Location {
  id: string
  name: string
  regionId: string
  /** 'town' = free-roam NPC grid; 'dungeon' = sequential floor gauntlet. */
  type: 'town' | 'dungeon'
  /** Order within region (0 = first location). */
  order: number
  /** X position on region sub-map, 0–100 (percent). */
  mapX: number
  /** Y position on region sub-map, 0–100 (percent). */
  mapY: number
  /** What the player must do to unlock this location. Null = unlocked with region. */
  unlockCondition: UnlockCondition | null
  /** Dungeon flavour text (dungeon type only). */
  flavour?: string
  /** For TD (Town-Dungeon) locations: the parent town location ID this dungeon is accessed from. */
  parentTownId?: string
}

export interface NpcDialogue {
  /** Shown when NPC is available to interact with (or challenge). */
  challenge?: string
  /** Shown after player defeats this NPC (during cooldown). */
  defeated?: string
  /** Shown when NPC is available for rematch. */
  rematch?: string
  /** General dialogue (for dialogue-type NPCs). */
  text?: string
  /** Dungeon floor intro text. */
  floorIntro?: string
  /** Dungeon floor defeated text. */
  floorDefeated?: string
}

export interface ShopInventory {
  cardId: string
  buyPrice: number
  /** Sell price is auto-calculated as floor(buyPrice / 2). */
}

export interface NPC {
  id: string
  name: string
  locationId: string
  type: NpcType
  /** Portrait image path. */
  portrait?: string
  /** Dialogue lines for various states. */
  dialogue: NpcDialogue
  /** For duel NPCs: difficulty tier (1-5). */
  difficultyTier?: DifficultyTier
  /** For duel NPCs: card IDs the AI draws from (8-10 cards). */
  deckPool?: string[]
  /** For duel NPCs: gil awarded on win. */
  gilReward?: number
  /** For shop NPCs: items they sell. */
  shopItems?: ShopInventory[]
  /** For tournament NPCs: entry fee. */
  tournamentEntryFee?: number
  /** For tournament NPCs: prize pool card IDs. */
  tournamentPrizePool?: string[]
  /** For dungeon NPCs: floor order (0 = floor 1, 1 = floor 2, ...). */
  floorOrder?: number
  /** For dungeon NPCs: true if this is the boss floor. */
  isBoss?: boolean
  /** Quest ID this NPC offers (for dialogue NPCs with quests). */
  questId?: string
  /** Story chapter minimum — NPC only visible when storyChapter >= this value. */
  minChapter?: number
  /** Story chapter maximum — NPC only visible when storyChapter <= this value. */
  maxChapter?: number
}

// ─── Legacy type aliases (backward compat until UI migration) ───

/** @deprecated Use Location instead. */
export type Area = Location & {
  opponentName?: string
  opponentImagePath?: string
  opponentDeckPool?: string[]
  gilReward?: number
  difficultyTier?: DifficultyTier
}

/** @deprecated Use NPC instead. */
export type SpotType = 'duel' | 'shop' | 'tournament'

/** @deprecated Use NPC instead. */
export interface Spot {
  id: string
  name: string
  areaId: string
  type: SpotType
  opponentName?: string
  opponentImagePath?: string
  order: number
}
