import { useState, useMemo } from 'react'
import type { Card } from '../types/card'
import { getOwnedCardIds } from '../data/worldState'
import { CardView } from './CardView'
import cardsData from '../data/cards.json'

const DECK_SIZE = 5
const allCards: Card[] = cardsData.cards as Card[]

interface DeckBuilderProps {
  /** Card inventory: cardId → count. If provided, only owned cards are shown. */
  inventory?: Record<string, number>
}

export function DeckBuilder({ inventory }: DeckBuilderProps = {}) {
  const [deck, setDeck] = useState<Card[]>([])
  const collection = useMemo(() => {
    if (!inventory || Object.keys(inventory).length === 0) return allCards
    const ownedIds = getOwnedCardIds(inventory)
    return allCards.filter((c) => ownedIds.includes(c.id))
  }, [inventory])

  const toggleInDeck = (card: Card) => {
    setDeck((prev) => {
      const inDeck = prev.some((c) => c.id === card.id)
      if (inDeck) return prev.filter((c) => c.id !== card.id)
      if (prev.length >= DECK_SIZE) return prev
      return [...prev, card]
    })
  }

  const inDeck = (card: Card) => deck.some((c) => c.id === card.id)

  return (
    <div className="deck-builder">
      <h1>Triple Triad – Deck Builder</h1>
      <p className="deck-summary">
        Deck: {deck.length}/{DECK_SIZE} cards
      </p>
      <section className="current-deck">
        <h2>Current deck</h2>
        <div className="deck-slots">
          {Array.from({ length: DECK_SIZE }, (_, i) => (
            <div key={i} className="deck-slot">
              {deck[i] ? (
                <CardView
                  card={deck[i]}
                  selected
                  onSelect={() => toggleInDeck(deck[i])}
                  compact
                />
              ) : (
                <div className="empty-slot">Empty</div>
              )}
            </div>
          ))}
        </div>
      </section>
      <section className="collection">
        <h2>Collection ({collection.length} cards)</h2>
        <div className="card-grid">
          {collection.map((card) => (
            <CardView
              key={card.id}
              card={card}
              selected={inDeck(card)}
              onSelect={() => toggleInDeck(card)}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
