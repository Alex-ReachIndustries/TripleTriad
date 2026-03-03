import { useState, useMemo } from 'react'
import type { Card } from '../types/card'
import type { SavedDeck } from '../data/deckManager'
import { createDeck, renameDeck, deleteDeck, updateDeckCards, isDeckValid } from '../data/deckManager'
import { rankLabel } from '../types/card'
import { getOwnedCardIds } from '../data/worldState'
import cardsData from '../data/cards.json'

const allCards: Card[] = cardsData.cards as Card[]
const cardMap = new Map(allCards.map(c => [c.id, c]))
const DECK_SIZE = 5

function getCard(id: string): Card | undefined {
  return cardMap.get(id)
}

interface DeckManagerProps {
  savedDecks: SavedDeck[]
  inventory: Record<string, number>
  onUpdateDecks: (decks: SavedDeck[]) => void
  onBack: () => void
}

type ManagerScreen = 'list' | 'edit'

export function DeckManager({ savedDecks, inventory, onUpdateDecks, onBack }: DeckManagerProps) {
  const [screen, setScreen] = useState<ManagerScreen>('list')
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null)
  const [renamingDeckId, setRenamingDeckId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const ownedCardIds = useMemo(() => getOwnedCardIds(inventory), [inventory])
  const ownedCards = useMemo(
    () => ownedCardIds.map(id => getCard(id)).filter((c): c is Card => !!c).sort((a, b) => a.level - b.level),
    [ownedCardIds]
  )

  // --- Deck list screen ---
  if (screen === 'list') {
    return (
      <div className="deck-mgr">
        <div className="deck-mgr-header">
          <button type="button" className="wm-back-btn" onClick={onBack}>
            &larr; Back
          </button>
          <h2 className="deck-mgr-title">Deck Manager</h2>
        </div>

        <div className="deck-mgr-list">
          {savedDecks.map(deck => {
            const valid = isDeckValid(deck, inventory)
            const isRenaming = renamingDeckId === deck.id

            return (
              <div key={deck.id} className={`deck-mgr-item ${valid ? '' : 'invalid'}`}>
                <div className="deck-mgr-item-top">
                  {isRenaming ? (
                    <input
                      type="text"
                      className="deck-mgr-rename-input"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          onUpdateDecks(renameDeck(savedDecks, deck.id, renameValue))
                          setRenamingDeckId(null)
                        }
                        if (e.key === 'Escape') setRenamingDeckId(null)
                      }}
                      onBlur={() => {
                        onUpdateDecks(renameDeck(savedDecks, deck.id, renameValue))
                        setRenamingDeckId(null)
                      }}
                      autoFocus
                    />
                  ) : (
                    <span className="deck-mgr-item-name">
                      {deck.name}
                      {deck.isStarter && <span className="deck-mgr-starter-badge">Starter</span>}
                      {!valid && <span className="deck-mgr-invalid-badge">Invalid</span>}
                    </span>
                  )}

                  <div className="deck-mgr-item-actions">
                    {!deck.isStarter && !isRenaming && (
                      <button
                        type="button"
                        className="deck-mgr-action-btn rename"
                        onClick={() => { setRenamingDeckId(deck.id); setRenameValue(deck.name) }}
                        title="Rename"
                      >
                        Rename
                      </button>
                    )}
                    <button
                      type="button"
                      className="deck-mgr-action-btn edit"
                      onClick={() => { setEditingDeckId(deck.id); setScreen('edit') }}
                      disabled={deck.isStarter}
                      title={deck.isStarter ? 'Cannot edit starter deck' : 'Edit cards'}
                    >
                      Edit
                    </button>
                    {!deck.isStarter && (
                      <button
                        type="button"
                        className="deck-mgr-action-btn delete"
                        onClick={() => {
                          const result = deleteDeck(savedDecks, deck.id, null)
                          onUpdateDecks(result.decks)
                        }}
                        title="Delete"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                {/* Card preview */}
                <div className="deck-mgr-card-preview">
                  {deck.cardIds.map((cardId, i) => {
                    const card = getCard(cardId)
                    return (
                      <div key={`${cardId}-${i}`} className="deck-mgr-preview-card">
                        <img src={`/cards/${cardId}.png`} alt={card?.name ?? cardId} className="deck-mgr-card-img" />
                      </div>
                    )
                  })}
                  {deck.cardIds.length < DECK_SIZE && (
                    Array.from({ length: DECK_SIZE - deck.cardIds.length }, (_, i) => (
                      <div key={`empty-${i}`} className="deck-mgr-preview-card empty">
                        <div className="deck-mgr-empty-slot">?</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {savedDecks.length < 10 && (
          <button
            type="button"
            className="deck-mgr-create-btn"
            onClick={() => {
              const newDecks = createDeck(savedDecks, 'New Deck', [])
              if (newDecks) {
                onUpdateDecks(newDecks)
                const created = newDecks[newDecks.length - 1]
                setEditingDeckId(created.id)
                setScreen('edit')
              }
            }}
          >
            + Create New Deck
          </button>
        )}
      </div>
    )
  }

  // --- Edit deck screen ---
  if (screen === 'edit' && editingDeckId) {
    const editDeck = savedDecks.find(d => d.id === editingDeckId)
    if (!editDeck) {
      setScreen('list')
      return null
    }

    return (
      <DeckEditor
        deck={editDeck}
        inventory={inventory}
        ownedCards={ownedCards}
        onSave={(cardIds) => {
          onUpdateDecks(updateDeckCards(savedDecks, editingDeckId, cardIds))
          setScreen('list')
        }}
        onCancel={() => setScreen('list')}
      />
    )
  }

  return null
}

/* ── Deck Editor sub-component ─────────────── */

function DeckEditor({
  deck,
  inventory,
  ownedCards,
  onSave,
  onCancel,
}: {
  deck: SavedDeck
  inventory: Record<string, number>
  ownedCards: Card[]
  onSave: (cardIds: string[]) => void
  onCancel: () => void
}) {
  const [cardIds, setCardIds] = useState<string[]>(deck.cardIds)

  // Compute available count for each owned card (accounting for how many are in this deck)
  const deckUsage = useMemo(() => {
    const usage: Record<string, number> = {}
    for (const id of cardIds) {
      usage[id] = (usage[id] ?? 0) + 1
    }
    return usage
  }, [cardIds])

  const addCard = (cardId: string) => {
    if (cardIds.length >= DECK_SIZE) return
    const inDeckCount = deckUsage[cardId] ?? 0
    const ownedCount = inventory[cardId] ?? 0
    if (inDeckCount >= ownedCount) return // No more copies available
    setCardIds(prev => [...prev, cardId])
  }

  const removeCard = (index: number) => {
    setCardIds(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="deck-editor">
      <div className="deck-editor-header">
        <button type="button" className="wm-back-btn" onClick={onCancel}>
          &larr; Back
        </button>
        <h2 className="deck-editor-title">Edit: {deck.name}</h2>
        <button
          type="button"
          className="deck-editor-save-btn"
          onClick={() => onSave(cardIds)}
          disabled={cardIds.length !== DECK_SIZE}
        >
          Save ({cardIds.length}/{DECK_SIZE})
        </button>
      </div>

      {/* Current deck slots */}
      <div className="deck-editor-slots">
        {Array.from({ length: DECK_SIZE }, (_, i) => {
          const cardId = cardIds[i]
          const card = cardId ? getCard(cardId) : null
          return (
            <div key={i} className={`deck-editor-slot ${card ? 'filled' : 'empty'}`}>
              {card ? (
                <button type="button" className="deck-editor-slot-btn" onClick={() => removeCard(i)}>
                  <img src={`/cards/${cardId}.png`} alt={card.name} className="deck-editor-slot-img" />
                  <span className="deck-editor-slot-name">{card.name}</span>
                  <span className="deck-editor-remove-hint">&times;</span>
                </button>
              ) : (
                <div className="deck-editor-empty">
                  <span>Slot {i + 1}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Available cards grid */}
      <div className="deck-editor-available">
        <h3 className="deck-editor-available-title">Available Cards</h3>
        <div className="deck-editor-card-grid">
          {ownedCards.map(card => {
            const owned = inventory[card.id] ?? 0
            const used = deckUsage[card.id] ?? 0
            const remaining = owned - used
            const canAdd = remaining > 0 && cardIds.length < DECK_SIZE

            return (
              <button
                key={card.id}
                type="button"
                className={`deck-editor-card ${!canAdd ? 'unavailable' : ''} ${used > 0 ? 'in-deck' : ''}`}
                disabled={!canAdd}
                onClick={() => addCard(card.id)}
              >
                <img src={`/cards/${card.id}.png`} alt={card.name} className="deck-editor-card-img" />
                <div className="deck-editor-card-info">
                  <span className="deck-editor-card-name">{card.name}</span>
                  <span className="deck-editor-card-stats">
                    Lv.{card.level} | {rankLabel(card.top)}-{rankLabel(card.right)}-{rankLabel(card.bottom)}-{rankLabel(card.left)}
                  </span>
                  <span className="deck-editor-card-count">
                    {used > 0 ? `In deck: ${used} / ` : ''}{remaining} avail
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
