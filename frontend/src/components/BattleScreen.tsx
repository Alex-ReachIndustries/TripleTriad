import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import type { GameState } from '../game'
import type { Card } from '../types/card'
import type { NPC, SpecialRule } from '../types/world'
import type { Difficulty } from '../game'
import type { TradeResult } from '../data/tradeRules'
import { createGame, placeCard, continueSuddenDeath, getAiMove, getDifficultyForTier } from '../game'
import { getLocationById, getRegionById, formatRules } from '../data/world'
import { computeTradeResult } from '../data/tradeRules'
import { cleanLastHand, getActiveRegionRules, attemptRuleSpreading } from '../data/worldState'
import { getTutorialsForRules, TUTORIALS } from '../data/tutorials'
import type { TutorialDef } from '../data/tutorials'
import { TutorialPopup } from './TutorialPopup'
import { GameBoard } from './GameBoard'
import cardsData from '../data/cards.json'

const allCards: Card[] = cardsData.cards as Card[]
const cardMap = new Map(allCards.map(c => [c.id, c]))
const DECK_SIZE = 5
const TUTORIALS_LOOKUP = new Map(TUTORIALS.map(t => [t.id, t]))

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
  cardsGained: string[]
  cardsLost: string[]
  isDungeonBoss: boolean
  dungeonLocationId: string | null
}

export interface BattleScreenProps {
  npcId: string | null
  npc: NPC | null
  locationId: string
  tournamentPrize: string | null
  worldPlayerInventory: Record<string, number>
  lastHand: string[]
  storyChapter: number
  lastPlayedRegionId: string | null
  regionRuleMods: Record<string, { added: SpecialRule[]; removed: SpecialRule[] }>
  onSetLastHand: (hand: string[]) => void
  onRuleSpread: (newMods: Record<string, { added: SpecialRule[]; removed: SpecialRule[] }>) => void
  onDuelRegionUpdate: (regionId: string) => void
  onMatchComplete: (result: BattleResult) => void
  onCancel: () => void
  seenTutorials: string[]
  onMarkTutorialSeen: (tutorialId: string) => void
}

type BattlePhase = 'pre-duel' | 'game' | 'reward'

export function BattleScreen({
  npcId,
  npc,
  locationId,
  tournamentPrize,
  worldPlayerInventory,
  lastHand,
  storyChapter,
  lastPlayedRegionId,
  regionRuleMods,
  onSetLastHand,
  onRuleSpread,
  onDuelRegionUpdate,
  onMatchComplete,
  onCancel,
  seenTutorials,
  onMarkTutorialSeen,
}: BattleScreenProps) {
  const [phase, setPhase] = useState<BattlePhase>('pre-duel')
  const [localGameState, setLocalGameState] = useState<GameState | null>(null)
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null)
  const [tradeResult, setTradeResult] = useState<TradeResult | null>(null)
  const [selectedTradeIndices, setSelectedTradeIndices] = useState<Set<number>>(new Set())
  const aiScheduledRef = useRef(false)
  const resultComputedRef = useRef(false)
  const aiDeckRef = useRef<Card[]>([])
  const playerDeckRef = useRef<Card[]>([])

  // Card selection state for pre-duel inventory picker
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>(() =>
    cleanLastHand(lastHand, worldPlayerInventory).slice(0, DECK_SIZE)
  )

  // Build list of available cards from inventory for the picker
  const availableCards = useMemo(() => {
    const cards: { card: Card; count: number }[] = []
    for (const [id, count] of Object.entries(worldPlayerInventory)) {
      if (count <= 0) continue
      const card = getCard(id)
      if (card) cards.push({ card, count })
    }
    return cards.sort((a, b) => a.card.level - b.card.level || a.card.name.localeCompare(b.card.name))
  }, [worldPlayerInventory])

  // Count how many of each card are currently selected
  const selectedUsage = useMemo(() => {
    const usage: Record<string, number> = {}
    for (const id of selectedCardIds) {
      usage[id] = (usage[id] ?? 0) + 1
    }
    return usage
  }, [selectedCardIds])

  // Resolve selected cards to Card[]
  const resolvedDeck = useMemo(() =>
    selectedCardIds.map(id => getCard(id)).filter((c): c is Card => !!c),
    [selectedCardIds]
  )

  const deckReady = resolvedDeck.length === DECK_SIZE

  // Resolve region + rules (dynamic: base + mods)
  const location = useMemo(() => getLocationById(locationId), [locationId])
  const region = useMemo(() => location ? getRegionById(location.regionId) : null, [location])
  const locationBg = useMemo(() => `/locations/${locationId}.png`, [locationId])
  const bgStyle = useMemo(() => ({ backgroundImage: `url(${locationBg})` }), [locationBg])
  const activeRules = useMemo(
    () => region ? getActiveRegionRules(region.rules, region.id, regionRuleMods) : [],
    [region, regionRuleMods]
  )

  // Rule spread notification
  const [spreadNotification, setSpreadNotification] = useState<{
    spreadRule: SpecialRule | null
    abolishedRule: SpecialRule | null
  } | null>(null)

  // Tutorial queue — shown before duel starts
  const [tutorialQueue, setTutorialQueue] = useState<TutorialDef[]>([])
  const [pendingDuelStart, setPendingDuelStart] = useState(false)
  const tutorialCompletingRef = useRef(false)

  // --- Add card to selection ---
  const addCard = useCallback((cardId: string) => {
    if (selectedCardIds.length >= DECK_SIZE) return
    const used = selectedUsage[cardId] ?? 0
    const available = worldPlayerInventory[cardId] ?? 0
    if (used >= available) return
    setSelectedCardIds(prev => [...prev, cardId])
  }, [selectedCardIds.length, selectedUsage, worldPlayerInventory])

  // --- Remove card from selection (by slot index) ---
  const removeCard = useCallback((index: number) => {
    setSelectedCardIds(prev => prev.filter((_, i) => i !== index))
  }, [])

  // --- Actually begin the duel (after tutorials) ---
  const beginDuel = useCallback(() => {
    // Attempt rule spreading
    let effectiveRules = activeRules
    if (region) {
      const lastRegion = lastPlayedRegionId ? getRegionById(lastPlayedRegionId) : null
      const lastRegionRules = lastRegion
        ? getActiveRegionRules(lastRegion.rules, lastRegion.id, regionRuleMods)
        : []
      const spread = attemptRuleSpreading(
        region.id, activeRules, lastPlayedRegionId, lastRegionRules,
        storyChapter, regionRuleMods,
      )
      if (spread.spreadRule || spread.abolishedRule) {
        onRuleSpread(spread.newRegionRuleMods)
        setSpreadNotification({ spreadRule: spread.spreadRule, abolishedRule: spread.abolishedRule })
        effectiveRules = getActiveRegionRules(region.rules, region.id, spread.newRegionRuleMods)
        // Trigger rule spreading tutorial if unseen
        if (!seenTutorials.includes('tut_rule_spreading')) {
          const spreadTut = TUTORIALS_LOOKUP.get('tut_rule_spreading')
          if (spreadTut) {
            setTutorialQueue([spreadTut])
            onMarkTutorialSeen('tut_rule_spreading')
          }
        }
      }
    }

    const npcDeckPool = npc?.deckPool?.length
      ? allCards.filter(c => npc.deckPool!.includes(c.id))
      : allCards
    const aiDeck = pickRandomDeck(npcDeckPool, DECK_SIZE)
    aiDeckRef.current = aiDeck
    playerDeckRef.current = [...resolvedDeck]

    const diff = npc?.difficultyTier ? getDifficultyForTier(npc.difficultyTier) : 'medium'
    setDifficulty(diff)

    const firstPlayer = Math.random() < 0.5 ? 0 : 1
    const initial = createGame(resolvedDeck, aiDeck, firstPlayer as 0 | 1, effectiveRules)
    setLocalGameState(initial)
    resultComputedRef.current = false
    setTradeResult(null)
    setSelectedTradeIndices(new Set())
    setPhase('game')
  }, [resolvedDeck, npc, activeRules, region, lastPlayedRegionId, regionRuleMods, storyChapter, onRuleSpread, seenTutorials, onMarkTutorialSeen])

  // --- Handle tutorial completion (guarded against double-fires) ---
  const handleTutorialComplete = useCallback(() => {
    if (tutorialCompletingRef.current) return
    if (tutorialQueue.length > 0) {
      tutorialCompletingRef.current = true
      const current = tutorialQueue[0]
      onMarkTutorialSeen(current.id)
      setTutorialQueue(prev => {
        const next = prev.slice(1)
        // Unlock for next tutorial (or for beginDuel)
        if (next.length > 0) {
          requestAnimationFrame(() => { tutorialCompletingRef.current = false })
        }
        return next
      })
    }
  }, [tutorialQueue, onMarkTutorialSeen])

  // --- Auto-start duel when tutorials are done ---
  useEffect(() => {
    if (pendingDuelStart && tutorialQueue.length === 0) {
      setPendingDuelStart(false)
      tutorialCompletingRef.current = false
      try {
        beginDuel()
      } catch {
        // If game creation fails, return to pre-duel
        setPhase('pre-duel')
      }
    }
  }, [pendingDuelStart, tutorialQueue.length, beginDuel])

  // --- Start duel (checks tutorials first) ---
  const handleStartDuel = useCallback(() => {
    if (resolvedDeck.length !== DECK_SIZE) return
    onSetLastHand(selectedCardIds)

    // Check for unseen tutorials before starting
    const isFirstDuel = !seenTutorials.includes('tut_basic_gameplay')
    const tutorials = getTutorialsForRules(activeRules, region?.tradeRule ?? 'One', seenTutorials, isFirstDuel)
    if (tutorials.length > 0) {
      setTutorialQueue(tutorials)
      setPendingDuelStart(true)
      return
    }

    beginDuel()
  }, [resolvedDeck, selectedCardIds, activeRules, onSetLastHand, region, seenTutorials, beginDuel])

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
        // AI move failed
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

  // --- Game ended → compute trade result ---
  useEffect(() => {
    if (phase !== 'game' || !localGameState || localGameState.phase !== 'ended') return
    if (resultComputedRef.current) return
    resultComputedRef.current = true

    const winner = localGameState.winner ?? 'draw'
    const gilReward = winner === 0 ? (npc?.gilReward ?? 0) : 0
    const isTournament = !!tournamentPrize
    const tradeRule = region?.tradeRule ?? 'One'

    let trade: TradeResult | null = null
    if (!isTournament) {
      trade = computeTradeResult(localGameState, tradeRule, winner, playerDeckRef.current, aiDeckRef.current)
      setTradeResult(trade)
    }

    if (!trade || !trade.requiresSelection) {
      const result: BattleResult = {
        winner,
        npcId,
        isTournament,
        tournamentPrize: winner === 0 ? tournamentPrize : null,
        gilReward,
        cardsGained: (trade?.cardsGained ?? []).map(c => c.id),
        cardsLost: (trade?.cardsLost ?? []).map(c => c.id),
        isDungeonBoss: !!(npc?.isBoss && winner === 0),
        dungeonLocationId: npc?.isBoss && winner === 0 ? locationId : null,
      }
      setBattleResult(result)
    }

    const timer = setTimeout(() => setPhase('reward'), 1500)
    return () => clearTimeout(timer)
  }, [phase, localGameState, npc, npcId, tournamentPrize, region])

  // --- Trade card selection confirm ---
  const handleConfirmTradeSelection = useCallback(() => {
    if (!tradeResult || !localGameState) return
    const winner = localGameState.winner ?? 'draw'
    const gilReward = winner === 0 ? (npc?.gilReward ?? 0) : 0

    const selectedCards = Array.from(selectedTradeIndices).map(i => tradeResult.selectionPool[i])
    const result: BattleResult = {
      winner,
      npcId,
      isTournament: !!tournamentPrize,
      tournamentPrize: winner === 0 ? tournamentPrize : null,
      gilReward,
      cardsGained: selectedCards.map(c => c.id),
      cardsLost: tradeResult.cardsLost.map(c => c.id),
      isDungeonBoss: !!(npc?.isBoss && winner === 0),
      dungeonLocationId: npc?.isBoss && winner === 0 ? locationId : null,
    }
    setBattleResult(result)
  }, [tradeResult, selectedTradeIndices, localGameState, npc, npcId, tournamentPrize])

  const toggleTradeCard = useCallback((index: number) => {
    if (!tradeResult) return
    setSelectedTradeIndices(prev => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else if (next.size < tradeResult.maxSelections) {
        next.add(index)
      }
      return next
    })
  }, [tradeResult])

  const handleDismissReward = useCallback(() => {
    if (battleResult) {
      if (region) onDuelRegionUpdate(region.id)
      onMatchComplete(battleResult)
    }
  }, [battleResult, onMatchComplete, onDuelRegionUpdate, region])

  const handleRematch = useCallback(() => {
    setLocalGameState(null)
    setBattleResult(null)
    setTradeResult(null)
    setSelectedTradeIndices(new Set())
    resultComputedRef.current = false
    setPhase('pre-duel')
  }, [])

  // ========== PRE-DUEL: Inventory Card Picker ==========
  if (phase === 'pre-duel') {
    return (
      <div className="battle-screen battle-pre-duel" style={bgStyle}>
        <div className="battle-header">
          <button type="button" className="back" onClick={onCancel}>
            &larr; Back
          </button>
          <h2 className="battle-title">
            {tournamentPrize ? 'Tournament Match' : 'Challenge'}
          </h2>
        </div>

        {npc && (
          <div className="battle-opponent">
            {npc.portrait && (
              <div className="battle-opponent-portrait">
                <img src={npc.portrait} alt={npc.name} />
              </div>
            )}
            <div className="battle-opponent-name">vs. {npc.name}</div>
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

        {(activeRules.length > 0 || region?.tradeRule) && (
          <div className="battle-rules">
            {activeRules.length > 0 && (
              <><span className="battle-rules-label">Rules:</span> {formatRules(activeRules)}</>
            )}
            {region?.tradeRule && <span className="battle-trade"> | Trade: {region.tradeRule}</span>}
          </div>
        )}

        {spreadNotification && (
          <div className="battle-spread-notification">
            {spreadNotification.spreadRule && (
              <div className="spread-added">The <strong>{spreadNotification.spreadRule}</strong> rule has spread to this region!</div>
            )}
            {spreadNotification.abolishedRule && (
              <div className="spread-removed">The <strong>{spreadNotification.abolishedRule}</strong> rule was abolished.</div>
            )}
          </div>
        )}

        {/* Selected hand slots */}
        <div className="battle-hand-slots">
          <p className="battle-hand-label">Your Hand ({selectedCardIds.length}/{DECK_SIZE})</p>
          <div className="battle-hand-row">
            {Array.from({ length: DECK_SIZE }).map((_, i) => {
              const cardId = selectedCardIds[i]
              const card = cardId ? getCard(cardId) : undefined
              return (
                <button
                  key={i}
                  type="button"
                  className={`battle-hand-slot ${card ? 'filled' : 'empty'}`}
                  onClick={() => card && removeCard(i)}
                  title={card ? `Remove ${card.name}` : 'Empty slot'}
                >
                  {card ? (
                    <img src={`/cards/${card.id}.png`} alt={card.name} className="battle-hand-slot-img" />
                  ) : (
                    <span className="battle-hand-slot-empty">+</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Inventory grid */}
        <div className="battle-inventory">
          <p className="battle-inventory-label">Select cards from your collection:</p>
          <div className="battle-inventory-grid">
            {availableCards.map(({ card, count }) => {
              const used = selectedUsage[card.id] ?? 0
              const remaining = count - used
              const disabled = remaining <= 0 || selectedCardIds.length >= DECK_SIZE
              return (
                <button
                  key={card.id}
                  type="button"
                  className={`battle-inv-card ${disabled ? 'disabled' : ''} ${used > 0 ? 'in-use' : ''}`}
                  onClick={() => !disabled && addCard(card.id)}
                  disabled={disabled}
                >
                  <img src={`/cards/${card.id}.png`} alt={card.name} className="battle-inv-card-img" />
                  <span className="battle-inv-card-name">{card.name}</span>
                  {count > 1 && (
                    <span className="battle-inv-card-count">x{remaining}/{count}</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <button
          type="button"
          className="battle-start-btn"
          disabled={!deckReady}
          onClick={handleStartDuel}
        >
          {deckReady ? 'Start Duel' : `Select ${DECK_SIZE - selectedCardIds.length} more card${DECK_SIZE - selectedCardIds.length !== 1 ? 's' : ''}`}
        </button>

        {tutorialQueue.length > 0 && (
          <TutorialPopup
            key={tutorialQueue[0].id}
            tutorial={tutorialQueue[0]}
            onComplete={handleTutorialComplete}
          />
        )}
      </div>
    )
  }

  // ========== GAME ==========
  if (phase === 'game' && localGameState) {
    return (
      <div className="battle-screen battle-game" style={bgStyle}>
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
  if (phase === 'reward') {
    const winner = localGameState?.winner ?? 'draw'
    const resultClass = winner === 0 ? 'victory' : winner === 1 ? 'defeat' : 'draw'
    const resultText = winner === 0 ? 'VICTORY' : winner === 1 ? 'DEFEAT' : 'DRAW'
    const isTournament = !!tournamentPrize
    const prizeCard = battleResult?.tournamentPrize ? getCard(battleResult.tournamentPrize) : null
    const gilReward = winner === 0 ? (npc?.gilReward ?? 0) : 0

    // Trade selection phase (One/Diff — player picks cards)
    if (tradeResult?.requiresSelection && !battleResult) {
      return (
        <div className="battle-screen battle-reward-screen" style={bgStyle}>
          <div className={`battle-reward-result ${resultClass}`}>{resultText}</div>

          {gilReward > 0 && (
            <div className="battle-reward-gil">+{gilReward} Gil</div>
          )}

          <div className="battle-trade-pick">
            <p className="battle-trade-pick-label">
              Pick {tradeResult.maxSelections} card{tradeResult.maxSelections > 1 ? 's' : ''} to take:
            </p>
            <div className="battle-trade-pool">
              {tradeResult.selectionPool.map((card, i) => (
                <button
                  key={`${card.id}-${i}`}
                  type="button"
                  className={`battle-trade-card ${selectedTradeIndices.has(i) ? 'selected' : ''}`}
                  onClick={() => toggleTradeCard(i)}
                >
                  <img src={`/cards/${card.id}.png`} alt={card.name} className="battle-trade-card-img" />
                  <span className="battle-trade-card-name">{card.name}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              className="battle-start-btn"
              disabled={selectedTradeIndices.size !== tradeResult.maxSelections}
              onClick={handleConfirmTradeSelection}
            >
              Confirm ({selectedTradeIndices.size}/{tradeResult.maxSelections})
            </button>
          </div>
        </div>
      )
    }

    // Final reward display
    if (battleResult) {
      const gainedCards = battleResult.cardsGained.map(id => getCard(id)).filter((c): c is Card => !!c)
      const lostCards = battleResult.cardsLost.map(id => getCard(id)).filter((c): c is Card => !!c)

      return (
        <div className="battle-screen battle-reward-screen" style={bgStyle}>
          <div className={`battle-reward-result ${resultClass}`}>{resultText}</div>

          {battleResult.gilReward > 0 && (
            <div className="battle-reward-gil">+{battleResult.gilReward} Gil</div>
          )}

          {prizeCard && (
            <div className="battle-reward-card gained">
              <p className="battle-reward-card-label">Prize Card</p>
              <img src={`/cards/${prizeCard.id}.png`} alt={prizeCard.name} className="battle-reward-card-img" />
              <span className="battle-reward-card-name">{prizeCard.name}</span>
              <span className="battle-reward-card-owned">Owned: {(worldPlayerInventory[prizeCard.id] ?? 0) + 1}</span>
            </div>
          )}

          {gainedCards.length > 0 && !isTournament && (
            <div className="battle-reward-cards-list">
              <p className="battle-reward-card-label">Cards Won</p>
              <div className="battle-reward-cards-row">
                {gainedCards.map((card, i) => (
                  <div key={`gain-${card.id}-${i}`} className="battle-reward-card gained">
                    <img src={`/cards/${card.id}.png`} alt={card.name} className="battle-reward-card-img" />
                    <span className="battle-reward-card-name">{card.name}</span>
                    <span className="battle-reward-card-owned">Owned: {(worldPlayerInventory[card.id] ?? 0) + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {lostCards.length > 0 && (
            <div className="battle-reward-cards-list">
              <p className="battle-reward-card-label">Cards Lost</p>
              <div className="battle-reward-cards-row">
                {lostCards.map((card, i) => (
                  <div key={`loss-${card.id}-${i}`} className="battle-reward-card lost">
                    <img src={`/cards/${card.id}.png`} alt={card.name} className="battle-reward-card-img" />
                    <span className="battle-reward-card-name">{card.name}</span>
                    <span className="battle-reward-card-owned">Owned: {Math.max(0, (worldPlayerInventory[card.id] ?? 0) - 1)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {battleResult.winner === 'draw' && !isTournament && gainedCards.length === 0 && lostCards.length === 0 && (
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
  }

  // Fallback: if stuck (e.g. game phase but no state), recover to pre-duel
  return (
    <div className="battle-screen">
      <p>Loading...</p>
      <button type="button" className="battle-start-btn" onClick={() => { setPhase('pre-duel'); setLocalGameState(null) }}>
        Return to Card Selection
      </button>
    </div>
  )
}
