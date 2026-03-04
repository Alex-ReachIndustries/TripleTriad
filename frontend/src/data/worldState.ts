/**
 * World mode player state: inventory and story progress.
 * Persisted to localStorage so progress survives refresh.
 */

import type { SavedDeck } from './deckManager'
import type { SpecialRule } from '../types/world'
import { createStarterDeck, parseSavedDecks } from './deckManager'
import { getQuestById, isQuestComplete } from './quests'

const STORAGE_KEY = 'tripletriad-world'

/** Card ids that the player owns (for world mode deck building and trade). */
export interface WorldPlayerState {
  /** Highest location order unlocked (0 = first location only). */
  unlockedOrder: number
  /** Multi-copy card inventory: cardId → count owned. */
  inventory: Record<string, number>
  /** Cards the player has owned at least once (for collection display). */
  discoveredCards: string[]
  /** Gil (currency) for shops and tournaments. */
  gil: number
  /** Win count per area id. Used to show rematch badges. */
  npcWins: Record<string, number>
  /** Named saved decks. Starter deck always exists at index 0. */
  savedDecks: SavedDeck[]
  /** ID of the last deck the player used in a duel. */
  lastDeckId: string | null
  /** Quest IDs the player has accepted but not yet completed. */
  activeQuests: string[]
  /** Quest IDs the player has completed and claimed rewards for. */
  completedQuests: string[]
  /** Set of dungeon location IDs the player has cleared (beat the boss). */
  clearedDungeons: string[]
  /** Current story chapter (0 = new game, advances with main quest completion). */
  storyChapter: number
  /** Completed main quest IDs in order (for quest log / story recap). */
  mainQuestLog: string[]
  /** Per-location NPC interaction tracking for notification markers: locationId → npcId[]. */
  seenContent: Record<string, string[]>
  /** Last 5 cards used in a 1P duel (card IDs). Used as default hand. */
  lastHand: string[]
  /** Last region where the player completed a 1P duel (for rule spreading). */
  lastPlayedRegionId: string | null
  /** Per-region rule overrides from spreading/abolishing. */
  regionRuleMods: Record<string, { added: SpecialRule[]; removed: SpecialRule[] }>
  /** Tutorial IDs the player has already seen. */
  seenTutorials: string[]
}

/** 5 starter cards – always protected (count can never drop below 1). */
export const STARTER_DECK_IDS: string[] = [
  'geezard', 'funguar', 'bite_bug', 'red_bat', 'blobra',
]

const DEFAULT_GIL = 500

function defaultState(): WorldPlayerState {
  const inventory: Record<string, number> = {}
  for (const id of STARTER_DECK_IDS) {
    inventory[id] = 1
  }
  return {
    unlockedOrder: 0,
    inventory,
    discoveredCards: [...STARTER_DECK_IDS],
    gil: DEFAULT_GIL,
    npcWins: {},
    savedDecks: [createStarterDeck(STARTER_DECK_IDS)],
    lastDeckId: 'starter',
    activeQuests: [],
    completedQuests: [],
    clearedDungeons: [],
    storyChapter: 1,
    mainQuestLog: [],
    seenContent: {},
    lastHand: [...STARTER_DECK_IDS],
    lastPlayedRegionId: null,
    regionRuleMods: {},
    seenTutorials: [],
  }
}

/** Get a flat list of card IDs the player owns (count > 0). */
export function getOwnedCardIds(inventory: Record<string, number>): string[] {
  return Object.entries(inventory)
    .filter(([, count]) => count > 0)
    .map(([id]) => id)
}

export function loadWorldState(): WorldPlayerState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw) as unknown
    if (typeof parsed !== 'object' || parsed === null) return defaultState()
    const o = parsed as Record<string, unknown>
    const unlockedOrder = typeof o.unlockedOrder === 'number' ? o.unlockedOrder : 0

    // Parse inventory — support both new Record format and legacy string[] migration
    let inventory: Record<string, number>
    if (typeof o.inventory === 'object' && o.inventory !== null && !Array.isArray(o.inventory)) {
      // New format: Record<string, number>
      inventory = {}
      for (const [k, v] of Object.entries(o.inventory as Record<string, unknown>)) {
        if (typeof v === 'number' && v > 0) {
          inventory[k] = v
        }
      }
    } else if (Array.isArray(o.collection)) {
      // Legacy migration: convert string[] collection to inventory
      inventory = {}
      for (const item of o.collection as unknown[]) {
        if (typeof item === 'string') {
          inventory[item] = (inventory[item] ?? 0) + 1
        }
      }
    } else {
      inventory = {}
      for (const id of STARTER_DECK_IDS) {
        inventory[id] = 1
      }
    }

    // Ensure starters always have at least count 1
    for (const id of STARTER_DECK_IDS) {
      if (!inventory[id] || inventory[id] < 1) {
        inventory[id] = 1
      }
    }

    const gil = typeof o.gil === 'number' && o.gil >= 0 ? o.gil : DEFAULT_GIL
    const npcWins: Record<string, number> = (
      typeof o.npcWins === 'object' && o.npcWins !== null && !Array.isArray(o.npcWins)
        ? Object.fromEntries(
            Object.entries(o.npcWins as Record<string, unknown>)
              .filter(([, v]) => typeof v === 'number')
              .map(([k, v]) => [k, v as number])
          )
        : {}
    )
    const savedDecks = parseSavedDecks(o.savedDecks, STARTER_DECK_IDS)
    const lastDeckId = typeof o.lastDeckId === 'string' ? o.lastDeckId : 'starter'
    const activeQuests = Array.isArray(o.activeQuests)
      ? (o.activeQuests as unknown[]).filter((v): v is string => typeof v === 'string')
      : []
    const completedQuests = Array.isArray(o.completedQuests)
      ? (o.completedQuests as unknown[]).filter((v): v is string => typeof v === 'string')
      : []
    const clearedDungeons = Array.isArray(o.clearedDungeons)
      ? (o.clearedDungeons as unknown[]).filter((v): v is string => typeof v === 'string')
      : []

    // Parse discoveredCards — backfill from current inventory for legacy saves
    let discoveredCards: string[] = Array.isArray(o.discoveredCards)
      ? (o.discoveredCards as unknown[]).filter((v): v is string => typeof v === 'string')
      : []
    // Ensure all currently-owned cards are in discovered set
    const discoveredSet = new Set(discoveredCards)
    for (const id of Object.keys(inventory)) {
      if (inventory[id] > 0 && !discoveredSet.has(id)) {
        discoveredCards.push(id)
      }
    }

    // Parse new campaign fields with graceful defaults for legacy saves
    const storyChapter = typeof o.storyChapter === 'number' ? o.storyChapter : 0
    const mainQuestLog = Array.isArray(o.mainQuestLog)
      ? (o.mainQuestLog as unknown[]).filter((v): v is string => typeof v === 'string')
      : []
    const seenContent: Record<string, string[]> = {}
    if (typeof o.seenContent === 'object' && o.seenContent !== null && !Array.isArray(o.seenContent)) {
      for (const [locId, npcs] of Object.entries(o.seenContent as Record<string, unknown>)) {
        if (Array.isArray(npcs)) {
          seenContent[locId] = (npcs as unknown[]).filter((v): v is string => typeof v === 'string')
        }
      }
    }

    const lastHand = Array.isArray(o.lastHand)
      ? (o.lastHand as unknown[]).filter((v): v is string => typeof v === 'string')
      : [...STARTER_DECK_IDS]

    const lastPlayedRegionId = typeof o.lastPlayedRegionId === 'string' ? o.lastPlayedRegionId : null

    const regionRuleMods: Record<string, { added: SpecialRule[]; removed: SpecialRule[] }> = {}
    if (typeof o.regionRuleMods === 'object' && o.regionRuleMods !== null && !Array.isArray(o.regionRuleMods)) {
      for (const [regionId, mods] of Object.entries(o.regionRuleMods as Record<string, unknown>)) {
        if (typeof mods === 'object' && mods !== null) {
          const m = mods as Record<string, unknown>
          const added = Array.isArray(m.added) ? (m.added as unknown[]).filter((v): v is SpecialRule => typeof v === 'string') : []
          const removed = Array.isArray(m.removed) ? (m.removed as unknown[]).filter((v): v is SpecialRule => typeof v === 'string') : []
          if (added.length > 0 || removed.length > 0) {
            regionRuleMods[regionId] = { added, removed }
          }
        }
      }
    }

    const seenTutorials = Array.isArray(o.seenTutorials)
      ? (o.seenTutorials as unknown[]).filter((v): v is string => typeof v === 'string')
      : []

    return { unlockedOrder, inventory, discoveredCards, gil, npcWins, savedDecks, lastDeckId, activeQuests, completedQuests, clearedDungeons, storyChapter, mainQuestLog, seenContent, lastHand, lastPlayedRegionId, regionRuleMods, seenTutorials }
  } catch {
    return defaultState()
  }
}

export function saveWorldState(state: WorldPlayerState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (_) {
    // ignore quota or other errors
  }
}

export function isStarterCard(cardId: string): boolean {
  return STARTER_DECK_IDS.includes(cardId)
}

/** Add a card to inventory (increment count). */
export function addToInventory(inventory: Record<string, number>, cardId: string, count = 1): Record<string, number> {
  return { ...inventory, [cardId]: (inventory[cardId] ?? 0) + count }
}

/** Mark a card as discovered (call alongside addToInventory). */
export function markDiscovered(discovered: string[], cardId: string): string[] {
  if (discovered.includes(cardId)) return discovered
  return [...discovered, cardId]
}

/** Remove a card from inventory (decrement count, respecting starter card protection). */
export function removeFromInventory(inventory: Record<string, number>, cardId: string, count = 1): Record<string, number> {
  const current = inventory[cardId] ?? 0
  const minCount = isStarterCard(cardId) ? 1 : 0
  const newCount = Math.max(minCount, current - count)
  if (newCount === current) return inventory // no change
  return { ...inventory, [cardId]: newCount }
}

/**
 * Validate lastHand against current inventory.
 * Removes any card IDs whose inventory count has been exhausted.
 * Returns the cleaned hand (may have fewer than 5 cards).
 */
export function cleanLastHand(lastHand: string[], inventory: Record<string, number>): string[] {
  const usage: Record<string, number> = {}
  const result: string[] = []
  for (const id of lastHand) {
    const used = usage[id] ?? 0
    const available = inventory[id] ?? 0
    if (used < available) {
      result.push(id)
      usage[id] = used + 1
    }
  }
  return result
}

/**
 * Remove a card from inventory AND clean lastHand if needed.
 */
export function removeCardAndCleanHand(state: WorldPlayerState, cardId: string, count = 1): WorldPlayerState {
  const newInventory = removeFromInventory(state.inventory, cardId, count)
  const newLastHand = cleanLastHand(state.lastHand, newInventory)
  return { ...state, inventory: newInventory, lastHand: newLastHand }
}

// ─── Story chapter helpers ───

/** Mark an NPC as seen at a location (for notification tracking). */
export function markNpcSeen(state: WorldPlayerState, locationId: string, npcId: string): WorldPlayerState {
  const existing = state.seenContent[locationId] ?? []
  if (existing.includes(npcId)) return state
  return {
    ...state,
    seenContent: {
      ...state.seenContent,
      [locationId]: [...existing, npcId],
    },
  }
}

/** Advance the story chapter and log the completed main quest. */
export function advanceStoryChapter(state: WorldPlayerState, mainQuestId: string): WorldPlayerState {
  return {
    ...state,
    storyChapter: state.storyChapter + 1,
    mainQuestLog: [...state.mainQuestLog, mainQuestId],
  }
}

// ─── Quest helpers ───

/** Accept a quest: add its ID to activeQuests if not already active or completed. */
export function acceptQuest(state: WorldPlayerState, questId: string): WorldPlayerState {
  if (state.activeQuests.includes(questId) || state.completedQuests.includes(questId)) return state
  if (!getQuestById(questId)) return state
  return { ...state, activeQuests: [...state.activeQuests, questId] }
}

/**
 * Check and claim a completed quest's reward.
 * Returns updated state with reward applied and quest moved to completedQuests.
 * Returns unchanged state if quest is not active or conditions not met.
 */
export function claimQuestReward(state: WorldPlayerState, questId: string): WorldPlayerState {
  if (!state.activeQuests.includes(questId)) return state
  const quest = getQuestById(questId)
  if (!quest) return state
  const dungeonSet = new Set(state.clearedDungeons)
  if (!isQuestComplete(quest, state.inventory, state.npcWins, dungeonSet)) return state

  let inventory = state.inventory
  let gil = state.gil

  // Award gil
  if (quest.reward.gil > 0) {
    gil += quest.reward.gil
  }

  // Award card(s)
  let discoveredCards = state.discoveredCards
  if (quest.reward.cardId) {
    const count = quest.reward.cardCount ?? 1
    inventory = addToInventory(inventory, quest.reward.cardId, count)
    discoveredCards = markDiscovered(discoveredCards, quest.reward.cardId)
  }

  let next: WorldPlayerState = {
    ...state,
    inventory,
    discoveredCards,
    gil,
    activeQuests: state.activeQuests.filter((id) => id !== questId),
    completedQuests: [...state.completedQuests, questId],
  }

  // Main quests advance the story chapter
  if (quest.isMainQuest) {
    next = advanceStoryChapter(next, questId)
  }

  return next
}

/** Mark a dungeon as cleared (used when player beats the boss floor). */
export function markDungeonCleared(state: WorldPlayerState, dungeonLocationId: string): WorldPlayerState {
  if (state.clearedDungeons.includes(dungeonLocationId)) return state
  return { ...state, clearedDungeons: [...state.clearedDungeons, dungeonLocationId] }
}

// ─── Rule spreading helpers ───

const MAX_RULES_PER_REGION = 5

/** Compute active rules for a region = base rules + mods (added/removed). */
export function getActiveRegionRules(
  baseRules: SpecialRule[],
  regionId: string,
  regionRuleMods: Record<string, { added: SpecialRule[]; removed: SpecialRule[] }>,
): SpecialRule[] {
  const mods = regionRuleMods[regionId]
  if (!mods) return baseRules
  let result = baseRules.filter(r => !mods.removed.includes(r))
  for (const rule of mods.added) {
    if (!result.includes(rule)) result.push(rule)
  }
  return result
}

export interface SpreadResult {
  spreadRule: SpecialRule | null
  abolishedRule: SpecialRule | null
  newRegionRuleMods: Record<string, { added: SpecialRule[]; removed: SpecialRule[] }>
}

/**
 * Attempt rule spreading when starting a duel.
 * 30% spread chance, 15% abolish chance. Gated by ch≥5 and different region.
 */
export function attemptRuleSpreading(
  currentRegionId: string,
  currentActiveRules: SpecialRule[],
  lastPlayedRegionId: string | null,
  lastRegionActiveRules: SpecialRule[],
  storyChapter: number,
  regionRuleMods: Record<string, { added: SpecialRule[]; removed: SpecialRule[] }>,
): SpreadResult {
  const noChange: SpreadResult = { spreadRule: null, abolishedRule: null, newRegionRuleMods: regionRuleMods }
  if (storyChapter < 5) return noChange
  if (!lastPlayedRegionId || lastPlayedRegionId === currentRegionId) return noChange

  let spreadRule: SpecialRule | null = null
  let abolishedRule: SpecialRule | null = null
  let newMods = { ...regionRuleMods }

  // 30% chance: spread a rule from last region
  if (Math.random() < 0.30 && currentActiveRules.length < MAX_RULES_PER_REGION) {
    const candidates = lastRegionActiveRules.filter(r => !currentActiveRules.includes(r))
    if (candidates.length > 0) {
      spreadRule = candidates[Math.floor(Math.random() * candidates.length)]
      const existing = newMods[currentRegionId] ?? { added: [], removed: [] }
      newMods = { ...newMods, [currentRegionId]: { ...existing, added: [...existing.added, spreadRule] } }
    }
  }

  // 15% chance: abolish a rule from current region
  if (Math.random() < 0.15) {
    const pool = spreadRule ? [...currentActiveRules, spreadRule] : currentActiveRules
    if (pool.length > 1) {
      abolishedRule = pool[Math.floor(Math.random() * pool.length)]
      const existing = newMods[currentRegionId] ?? { added: [], removed: [] }
      newMods = { ...newMods, [currentRegionId]: { ...existing, removed: [...existing.removed, abolishedRule] } }
    }
  }

  if (!spreadRule && !abolishedRule) return noChange
  return { spreadRule, abolishedRule, newRegionRuleMods: newMods }
}

/** Manually spread a rule to a region (Queen of Cards). */
export function spreadRuleToRegion(state: WorldPlayerState, rule: SpecialRule, regionId: string): WorldPlayerState {
  const existing = state.regionRuleMods[regionId] ?? { added: [], removed: [] }
  if (existing.added.includes(rule)) return state
  return {
    ...state,
    regionRuleMods: {
      ...state.regionRuleMods,
      [regionId]: { ...existing, added: [...existing.added, rule] },
    },
  }
}

/** Manually abolish a rule from a region (Queen of Cards). */
export function abolishRuleFromRegion(state: WorldPlayerState, rule: SpecialRule, regionId: string): WorldPlayerState {
  const existing = state.regionRuleMods[regionId] ?? { added: [], removed: [] }
  if (existing.removed.includes(rule)) return state
  return {
    ...state,
    regionRuleMods: {
      ...state.regionRuleMods,
      [regionId]: { ...existing, removed: [...existing.removed, rule] },
    },
  }
}

// Trade rules are now handled by tradeRules.ts using capture-based logic.
