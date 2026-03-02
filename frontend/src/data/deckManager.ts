/**
 * Saved deck management: create, rename, delete, update decks.
 * Decks are stored within WorldPlayerState and persisted to localStorage.
 */

export interface SavedDeck {
  id: string
  name: string
  cardIds: string[]  // exactly 5
  isStarter: boolean // starter deck cannot be deleted or renamed
}

const DECK_SIZE = 5
const MAX_DECKS = 10

let nextId = 1
function generateId(): string {
  return `deck_${Date.now()}_${nextId++}`
}

/** Create the default starter deck from the 5 starter card IDs. */
export function createStarterDeck(starterCardIds: string[]): SavedDeck {
  return {
    id: 'starter',
    name: 'Starter Deck',
    cardIds: starterCardIds.slice(0, DECK_SIZE),
    isStarter: true,
  }
}

/** Create a new saved deck. Returns null if max decks reached. */
export function createDeck(
  decks: SavedDeck[],
  name: string,
  cardIds: string[]
): SavedDeck[] | null {
  if (decks.length >= MAX_DECKS) return null
  const newDeck: SavedDeck = {
    id: generateId(),
    name: name.trim() || 'New Deck',
    cardIds: cardIds.slice(0, DECK_SIZE),
    isStarter: false,
  }
  return [...decks, newDeck]
}

/** Rename a deck. Starter deck cannot be renamed. */
export function renameDeck(
  decks: SavedDeck[],
  deckId: string,
  newName: string
): SavedDeck[] {
  return decks.map((d) =>
    d.id === deckId && !d.isStarter
      ? { ...d, name: newName.trim() || d.name }
      : d
  )
}

/** Delete a deck. Starter deck cannot be deleted. Returns updated list and a fallback lastDeckId. */
export function deleteDeck(
  decks: SavedDeck[],
  deckId: string,
  currentLastDeckId: string | null
): { decks: SavedDeck[]; lastDeckId: string | null } {
  const target = decks.find((d) => d.id === deckId)
  if (!target || target.isStarter) return { decks, lastDeckId: currentLastDeckId }
  const updated = decks.filter((d) => d.id !== deckId)
  const lastDeckId = currentLastDeckId === deckId
    ? (updated[0]?.id ?? null)
    : currentLastDeckId
  return { decks: updated, lastDeckId }
}

/** Update the card IDs in a deck. */
export function updateDeckCards(
  decks: SavedDeck[],
  deckId: string,
  cardIds: string[]
): SavedDeck[] {
  return decks.map((d) =>
    d.id === deckId && !d.isStarter
      ? { ...d, cardIds: cardIds.slice(0, DECK_SIZE) }
      : d
  )
}

/** Validate that all cards in a deck are in the player's inventory. */
export function isDeckValid(
  deck: SavedDeck,
  inventory: Record<string, number>
): boolean {
  if (deck.cardIds.length !== DECK_SIZE) return false
  // Count how many of each card the deck uses
  const usage: Record<string, number> = {}
  for (const id of deck.cardIds) {
    usage[id] = (usage[id] ?? 0) + 1
  }
  // Check each card has enough copies in inventory
  for (const [id, needed] of Object.entries(usage)) {
    if ((inventory[id] ?? 0) < needed) return false
  }
  return true
}

/** Get a deck by ID, or return the starter deck as fallback. */
export function getDeckById(decks: SavedDeck[], deckId: string | null): SavedDeck | undefined {
  if (!deckId) return decks.find((d) => d.isStarter)
  return decks.find((d) => d.id === deckId) ?? decks.find((d) => d.isStarter)
}

/** Parse saved decks from raw storage data, ensuring starter deck exists. */
export function parseSavedDecks(raw: unknown, starterCardIds: string[]): SavedDeck[] {
  const starter = createStarterDeck(starterCardIds)
  if (!Array.isArray(raw)) return [starter]

  const decks: SavedDeck[] = []
  let hasStarter = false

  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue
    const d = item as Record<string, unknown>
    if (typeof d.id !== 'string' || typeof d.name !== 'string') continue
    if (!Array.isArray(d.cardIds)) continue
    const cardIds = (d.cardIds as unknown[]).filter((id): id is string => typeof id === 'string')

    const isStarter = d.isStarter === true || d.id === 'starter'
    if (isStarter) {
      hasStarter = true
      decks.push({ ...starter, cardIds: starter.cardIds }) // Always use current starter cards
    } else {
      decks.push({
        id: d.id,
        name: d.name,
        cardIds: cardIds.slice(0, DECK_SIZE),
        isStarter: false,
      })
    }
  }

  if (!hasStarter) decks.unshift(starter)
  return decks
}
