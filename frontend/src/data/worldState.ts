/**
 * World mode player state: collection and story progress.
 * Persisted to localStorage so progress survives refresh.
 */

const STORAGE_KEY = 'tripletriad-world'

/** Card ids that the player owns (for world mode deck building and trade). */
export interface WorldPlayerState {
  /** Highest location order unlocked (0 = first location only). */
  unlockedOrder: number
  /** Card ids in the player's collection. Starter deck is protected from loss. */
  collection: string[]
  /** Gil (currency) for shops and tournaments. */
  gil: number
  /** Win count per area id. Used to show rematch badges. */
  npcWins: Record<string, number>
}

/** First 10 card ids – starter deck, protected from being lost in matches. */
export const STARTER_DECK_IDS: string[] = [
  'geezard', 'funguar', 'bite_bug', 'red_bat', 'blobra',
  'gayla', 'gesper', 'fastitocalon_f', 'blood_soul', 'caterchipillar',
]

const DEFAULT_GIL = 1000

function defaultState(): WorldPlayerState {
  return {
    unlockedOrder: 0,
    collection: [...STARTER_DECK_IDS],
    gil: DEFAULT_GIL,
    npcWins: {},
  }
}

export function loadWorldState(): WorldPlayerState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw) as unknown
    if (typeof parsed !== 'object' || parsed === null) return defaultState()
    const o = parsed as Record<string, unknown>
    const unlockedOrder = typeof o.unlockedOrder === 'number' ? o.unlockedOrder : 0
    const collection = Array.isArray(o.collection)
      ? (o.collection as unknown[]).filter((id): id is string => typeof id === 'string')
      : [...STARTER_DECK_IDS]
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
    return { unlockedOrder, collection, gil, npcWins }
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

/**
 * Apply trade rule "One": winner gains one card, loser loses one (starter protected).
 * For world vs AI: player is always 0; if player wins they gain a random card from pool;
 * if player loses they lose a random non-starter card from collection.
 */
export function applyTradeRuleOne(
  state: WorldPlayerState,
  playerWon: boolean,
  allCardIds: string[]
): WorldPlayerState {
  if (playerWon) {
    const notOwned = allCardIds.filter((id) => !state.collection.includes(id))
    const add = notOwned.length > 0 ? notOwned[Math.floor(Math.random() * notOwned.length)] : null
    if (!add) return state
    return { ...state, collection: [...state.collection, add] }
  }
  const canLose = state.collection.filter((id) => !isStarterCard(id))
  if (canLose.length === 0) return state
  const remove = canLose[Math.floor(Math.random() * canLose.length)]
  return { ...state, collection: state.collection.filter((id) => id !== remove) }
}
