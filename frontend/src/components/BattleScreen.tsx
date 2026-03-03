import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import type { GameState } from '../game'
import type { Card } from '../types/card'
import type { NPC } from '../types/world'
import type { SavedDeck } from '../data/deckManager'
import type { Difficulty } from '../game'
import { createGame, placeCard, continueSuddenDeath, getAiMove, getDifficultyForTier } from '../game'
import { getLocationById, getRegionById, formatRules } from '../data/world'
import { getDeckById, isDeckValid } from '../data/deckManager'
import { isStarterCard } from '../data/worldState'
import { GameBoard } from './GameBoard'
import { DeckManager } from './DeckManager'
import cardsData from '../data/cards.json'

const allCards: Card[] = cardsData.cards as Card[]
const allCardIds = allCards.map(c => c.id)
const cardMap = new Map(allCards.map(c => [c.id, c]))
const DECK_SIZE = 5

function getCard(id: string): Card | undefined {
  return cardMap.get(id)
}

function pickRandomDeck(pool: Card[], size: number): Card[] {
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, size)
}

export interface BattleResult {
  winner: 0 | 1 | 'draw'
  npcId: string | null
  isTournament: boolean
  tournamentPrize: string | null
  gilReward: number
  cardGained: string | null
  cardLost: string | null
}

export interface BattleScreenProps {
  npcId: string | null
  npc: NPC | null
  locationId: string
  tournamentPrize: string | null
  worldPlayerInventory: Record<string, number>
  savedDecks: SavedDeck[]
  lastDeckId: string | null
  onSetLastDeckId: (deckId: string) => void
  onUpdateDecks: (decks: SavedDeck[]) => void
  onMatchComplete: (result: BattleResult) => void
  onCancel: () => void
}

type BattlePhase = 'pre-duel' | 'game' | 'reward'

export function BattleScreen({
  npcId,
  npc,
  locationId,
  tournamentPrize,
  worldPlayerInventory,
  savedDecks,
  lastDeckId,
  onSetLastDeckId,
  onUpdateDecks,
  onMatchComplete,
  onCancel,
}: BattleScreenProps) {
  const [phase, setPhase] = useState<BattlePhase>('pre-duel')
  const [selectedDeckId, setSelectedDeckId] = useState<string>(lastDeckId ?? 'starter')
  const [localGameState, setLocalGameState] = useState<GameState | null>(null)
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null)
  const [showDeckManager, setShowDeckManager] = useState(false)
  const aiScheduledRef = useRef(false)
  const resultComputedRef = useRef(false)

  // Resolve saved deck to Card[]
  const resolvedDeck = useMemo(() => {
    const sd = getDeckById(savedDecks, selectedDeckId)
    if (!sd) return []
    return sd.cardIds.map(id => getCard(id)).filter((c): c is Card => !!c)
  }, [savedDecks, selectedDeckId])

  const selectedSavedDeck = useMemo(() => getDeckById(savedDecks, selectedDeckId), [savedDecks, selectedDeckId])
  const deckIsValid = selectedSavedDeck ? isDeckValid(selectedSavedDeck, worldPlayerInventory) : false

  // Resolve region + rules
  const location = useMemo(() => getLocationById(locationId), [locationId])
  const region = useMemo(() => location ? getRegionById(location.regionId) : null, [location])
  const activeRules = useMemo(() => region?.rules ?? [], [region])

  // --- Start duel ---
  const handleStartDuel = useCallback(() => {
    if (resolvedDeck.length !== DECK_SIZE) return
    onSetLastDeckId(selectedDeckId)

    const npcDeckPool = npc?.deckPool?.length
      ? allCards.filter(c => npc.deckPool!.includes(c.id))
      : allCards
    const aiDeck = pickRandomDeck(npcDeckPool, DECK_SIZE)

    const diff = npc?.difficultyTier ? getDifficultyForTier(npc.difficultyTier) : 'medium'
    setDifficulty(diff)

    const firstPlayer = Math.random() < 0.5 ? 0 : 1
    const initial = createGame(resolvedDeck, aiDeck, firstPlayer as 0 | 1, activeRules)
    setLocalGameState(initial)
    resultComputedRef.current = false
    setPhase('game')
  }, [resolvedDeck, npc, activeRules, selectedDeckId, onSetLastDeckId])

  // --- Player move ---
  const handleLocalPlace = useCallback(
    (cardIndex: number, row: number, col: number) => {
      if (!localGameState || localGameState.turn !== 0 || localGameState.phase !== 'playing') return
      setLocalGameState(placeCard(localGameState, 0, cardIndex, row, col))
    },
    [localGameState]
  )

  // --- AI move ---
  useEffect(() => {
    if (phase !== 'game' || !localGameState) return
    if (localGameState.phase !== 'playing' || localGameState.turn !== 1) {
      aiScheduledRef.current = false
      return
    }
    if (aiScheduledRef.current) return
    aiScheduledRef.current = true
    const id = setTimeout(() => {
      try {
        const move = getAiMove(localGameState, difficulty)
        setLocalGameState(placeCard(localGameState, 1, move.cardIndex, move.row, move.col))
      } catch {
        // AI move failed — ignore
      } finally {
        aiScheduledRef.current = false
      }
    }, 500)
    return () => clearTimeout(id)
  }, [phase, localGameState, difficulty])

  // --- Sudden Death auto-continue ---
  useEffect(() => {
    if (phase !== 'game' || !localGameState || localGameState.phase !== 'sudden_death') return
    const id = setTimeout(() => {
      setLocalGameState(continueSuddenDeath(localGameState))
    }, 1200)
    return () => clearTimeout(id)
  }, [phase, localGameState])

  // --- Game ended → compute result and transition to reward ---
  useEffect(() => {
    if (phase !== 'game' || !localGameState || localGameState.phase !== 'ended') return
    if (resultComputedRef.current) return
    resultComputedRef.current = true

    const winner = localGameState.winner ?? 'draw'
    const gilReward = winner === 0 ? (npc?.gilReward ?? 0) : 0
    const isTournament = !!tournamentPrize

    // Pre-compute trade (matches applyTradeRuleOne logic)
    let cardGained: string | null = null
    let cardLost: string | null = null

    if (!isTournament && winner !== 'draw') {
      if (winner === 0) {
        // Player won: gain random card from all cards
        cardGained = allCardIds[Math.floor(Math.random() * allCardIds.length)]
      } else {
        // Player lost: lose random non-starter card
        const canLose = Object.entries(worldPlayerInventory).filter(([id, count]) => {
          if (count <= 0) return false
          if (isStarterCard(id)) return count > 1
          return true
        }).map(([id]) => id)
        if (canLose.length > 0) {
          cardLost = canLose[Math.floor(Math.random() * canLose.length)]
        }
      }
    }

    const result: BattleResult = {
      winner,
      npcId,
      isTournament,
      tournamentPrize: winner === 0 ? tournamentPrize : null,
      gilReward,
      cardGained,
      cardLost,
    }
    setBattleResult(result)

    const timer = setTimeout(() => setPhase('reward'), 1500)
    return () => clearTimeout(timer)
  }, [phase, localGameState, npc, npcId, tournamentPrize, worldPlayerInventory])

  // --- Reward screen actions ---
  const handleDismissReward = useCallback(() => {
    if (battleResult) onMatchComplete(battleResult)
  }, [battleResult, onMatchComplete])

  const handleRematch = useCallback(() => {
    setLocalGameState(null)
    setBattleResult(null)
    resultComputedRef.current = false
    setPhase('pre-duel')
  }, [])

  // --- Deck manager sub-screen ---
  if (showDeckManager) {
    return (
      <div className="battle-screen">
        <DeckManager
          savedDecks={savedDecks}
          inventory={worldPlayerInventory}
          onUpdateDecks={onUpdateDecks}
          onBack={() => setShowDeckManager(false)}
        />
      </div>
    )
  }

  // ========== PRE-DUEL ==========
  if (phase === 'pre-duel') {
    return (
      <div className="battle-screen battle-pre-duel">
        <div className="battle-header">
          <button type="button" className="back" onClick={onCancel}>
            &larr; Back
          </button>
          <h2 className="battle-title">
            {tournamentPrize ? 'Tournament Match' : 'Challenge'}
          </h2>
        </div>

        {/* Opponent info */}
        {npc && (
          <div className="battle-opponent">
            <div className="battle-opponent-name">
              vs. {npc.name}
            </div>
            {npc.difficultyTier && (
              <div className="battle-difficulty">
                {'★'.repeat(npc.difficultyTier)}{'☆'.repeat(5 - npc.difficultyTier)}
              </div>
            )}
            {!tournamentPrize && npc.gilReward != null && npc.gilReward > 0 && (
              <div className="battle-reward-info">Reward: {npc.gilReward} Gil</div>
            )}
          </div>
        )}

        {tournamentPrize && (
          <div className="battle-opponent">
            <div className="battle-opponent-name">Tournament — win for a prize card!</div>
          </div>
        )}

        {/* Active rules */}
        {activeRules.length > 0 && (
          <div className="battle-rules">
            <span className="battle-rules-label">Rules:</span> {formatRules(activeRules)}
            {region?.tradeRule && <span className="battle-trade"> | Trade: {region.tradeRule}</span>}
          </div>
        )}

        {/* Deck selector */}
        <div className="battle-deck-section">
          <div className="battle-deck-row">
            <label htmlFor="battle-deck-select" className="battle-deck-label">Deck:</label>
            <select
              id="battle-deck-select"
              className="battle-deck-dropdown"
              value={selectedDeckId}
              onChange={(e) => setSelectedDeckId(e.target.value)}
            >
              {savedDecks.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} {isDeckValid(d, worldPlayerInventory) ? '' : '(invalid)'}
                </option>
              ))}
            </select>
            <button type="button" className="battle-edit-decks-btn" onClick={() => setShowDeckManager(true)}>
              Edit Decks
            </button>
          </div>

          {resolvedDeck.length > 0 && (
            <div className="battle-deck-preview">
              {resolvedDeck.map((card, i) => (
                <div key={`${card.id}-${i}`} className="battle-preview-card">
                  <img src={`/cards/${card.id}.png`} alt={card.name} className="battle-card-img" />
                  <span className="battle-card-name">{card.name}</span>
                </div>
              ))}
            </div>
          )}

          {!deckIsValid && selectedSavedDeck && (
            <p className="battle-invalid">
              This deck is invalid — some cards may not be in your inventory.
            </p>
          )}
        </div>

        <button
          type="button"
          className="battle-start-btn"
          disabled={!deckIsValid || resolvedDeck.length !== DECK_SIZE}
          onClick={handleStartDuel}
        >
          Start Duel
        </button>
      </div>
    )
  }

  // ========== GAME ==========
  if (phase === 'game' && localGameState) {
    return (
      <div className="battle-screen battle-game">
        <GameBoard
          state={localGameState}
          myPlayer={0}
          onPlace={handleLocalPlace}
          hideEndOverlay
        />
      </div>
    )
  }

  // ========== REWARD ==========
  if (phase === 'reward' && battleResult) {
    const resultClass = battleResult.winner === 0 ? 'victory' : battleResult.winner === 1 ? 'defeat' : 'draw'
    const resultText = battleResult.winner === 0 ? 'VICTORY' : battleResult.winner === 1 ? 'DEFEAT' : 'DRAW'
    const gainedCard = battleResult.cardGained ? getCard(battleResult.cardGained) : null
    const lostCard = battleResult.cardLost ? getCard(battleResult.cardLost) : null
    const prizeCard = battleResult.tournamentPrize ? getCard(battleResult.tournamentPrize) : null

    return (
      <div className="battle-screen battle-reward-screen">
        <div className={`battle-reward-result ${resultClass}`}>{resultText}</div>

        {battleResult.gilReward > 0 && (
          <div className="battle-reward-gil">+{battleResult.gilReward} Gil</div>
        )}

        {prizeCard && (
          <div className="battle-reward-card gained">
            <p className="battle-reward-card-label">Prize Card</p>
            <img src={`/cards/${prizeCard.id}.png`} alt={prizeCard.name} className="battle-reward-card-img" />
            <span className="battle-reward-card-name">{prizeCard.name}</span>
          </div>
        )}

        {gainedCard && !battleResult.isTournament && (
          <div className="battle-reward-card gained">
            <p className="battle-reward-card-label">Card Won</p>
            <img src={`/cards/${gainedCard.id}.png`} alt={gainedCard.name} className="battle-reward-card-img" />
            <span className="battle-reward-card-name">{gainedCard.name}</span>
          </div>
        )}

        {lostCard && (
          <div className="battle-reward-card lost">
            <p className="battle-reward-card-label">Card Lost</p>
            <img src={`/cards/${lostCard.id}.png`} alt={lostCard.name} className="battle-reward-card-img" />
            <span className="battle-reward-card-name">{lostCard.name}</span>
          </div>
        )}

        {battleResult.winner === 'draw' && !battleResult.isTournament && (
          <div className="battle-reward-trade-msg">No cards exchanged.</div>
        )}

        <div className="battle-reward-actions">
          <button type="button" className="battle-reward-btn primary" onClick={handleDismissReward}>
            {battleResult.winner === 0 ? 'Claim Rewards' : 'Continue'}
          </button>
          <button type="button" className="battle-reward-btn" onClick={handleRematch}>
            Rematch
          </button>
        </div>
      </div>
    )
  }

  return <div className="battle-screen">Loading...</div>
}
