/**
 * World mode player state: inventory and story progress.
 * Persisted to localStorage so progress survives refresh.
 */

import type { SavedDeck } from './deckManager'
import { createStarterDeck, parseSavedDecks } from './deckManager'

const STORAGE_KEY = 'tripletriad-world'

/** Card ids that the player owns (for world mode deck building and trade). */
export interface WorldPlayerState {
  /** Highest location order unlocked (0 = first location only). */
  unlockedOrder: number
  /** Multi-copy card inventory: cardId → count owned. */
  inventory: Record<string, number>
  /** Gil (currency) for shops and tournaments. */
  gil: number
  /** Win count per area id. Used to show rematch badges. */
  npcWins: Record<string, number>
  /** Named saved decks. Starter deck always exists at index 0. */
  savedDecks: SavedDeck[]
  /** ID of the last deck the player used in a duel. */
  lastDeckId: string | null
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
    gil: DEFAULT_GIL,
    npcWins: {},
    savedDecks: [createStarterDeck(STARTER_DECK_IDS)],
    lastDeckId: 'starter',
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
    return { unlockedOrder, inventory, gil, npcWins, savedDecks, lastDeckId }
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

/** Remove a card from inventory (decrement count, respecting starter card protection). */
export function removeFromInventory(inventory: Record<string, number>, cardId: string, count = 1): Record<string, number> {
  const current = inventory[cardId] ?? 0
  const minCount = isStarterCard(cardId) ? 1 : 0
  const newCount = Math.max(minCount, current - count)
  if (newCount === current) return inventory // no change
  return { ...inventory, [cardId]: newCount }
}

/**
 * Apply trade rule "One": winner gains one card, loser loses one (starter protected).
 * For world vs AI: player is always 0; if player wins they gain a random card from the
 * opponent's deck pool; if player loses they lose a random non-starter card.
 */
export function applyTradeRuleOne(
  state: WorldPlayerState,
  playerWon: boolean,
  allCardIds: string[]
): WorldPlayerState {
  if (playerWon) {
    // Winner gains a random card (can be one they already own — multi-copy)
    if (allCardIds.length === 0) return state
    const add = allCardIds[Math.floor(Math.random() * allCardIds.length)]
    return { ...state, inventory: addToInventory(state.inventory, add) }
  }
  // Loser loses a random non-starter card (or one with count > 1 for starters)
  const canLose = Object.entries(state.inventory).filter(([id, count]) => {
    if (count <= 0) return false
    if (isStarterCard(id)) return count > 1 // Can only lose extras of starters
    return true
  }).map(([id]) => id)
  if (canLose.length === 0) return state
  const remove = canLose[Math.floor(Math.random() * canLose.length)]
  return { ...state, inventory: removeFromInventory(state.inventory, remove) }
}
