/**
 * WaitingRoom: lobby waiting screen with player cards, rule config, hand selection.
 */

import { useState, useMemo, useCallback } from 'react'
import type { DuelConfig } from '../../types/multiplayer'
import type { SpecialRule } from '../../types/world'
import type { Card } from '../../types/card'
import type { LobbyState } from '../../hooks/useLobby'
import { getDeckById, isDeckValid } from '../../data/deckManager'
import type { SavedDeck } from '../../data/deckManager'
import { ProfileCard } from './ProfileCard'
import cardsData from '../../data/cards.json'
import './WaitingRoom.css'

const cardMap = new Map((cardsData.cards as Card[]).map(c => [c.id, c]))

const ALL_SPECIAL_RULES: SpecialRule[] = [
  'Open', 'Same', 'Same Wall', 'Plus', 'Combo', 'Elemental', 'Random', 'Sudden Death',
]

const ALL_TRADE_RULES = ['Friendly', 'One', 'Diff', 'Direct', 'All'] as const

interface WaitingRoomProps {
  lobbyState: LobbyState
  isHost: boolean
  worldInventory: Record<string, number>
  savedDecks: SavedDeck[]
  onSetConfig: (config: DuelConfig) => void
  onSelectHand: (cardIds: string[]) => void
  onSelectDuellists: (p0Id: string, p1Id: string) => void
  onStartDuel: () => void
  onLeave: () => void
  onUpdateDecks: (decks: SavedDeck[]) => void
}

export function WaitingRoom({
  lobbyState,
  isHost,
  worldInventory,
  savedDecks,
  onSetConfig,
  onSelectHand,
  onSelectDuellists,
  onStartDuel,
  onLeave,
}: WaitingRoomProps) {
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const [selectedDeckId, setSelectedDeckId] = useState<string>(savedDecks[0]?.id ?? 'starter')
  const [handLocked, setHandLocked] = useState(false)
  const [showRuleConfig, setShowRuleConfig] = useState(false)

  const { players, config, error, selectedDuellists } = lobbyState

  // Resolve deck cards using real inventory
  const resolvedDeck = useMemo(() => {
    const sd = getDeckById(savedDecks, selectedDeckId)
    if (!sd) return []
    return sd.cardIds.map(id => cardMap.get(id)).filter((c): c is Card => !!c)
  }, [savedDecks, selectedDeckId])

  const selectedSavedDeck = useMemo(() => getDeckById(savedDecks, selectedDeckId), [savedDecks, selectedDeckId])
  const deckIsValid = selectedSavedDeck ? isDeckValid(selectedSavedDeck, worldInventory) : false

  const handleToggleRule = useCallback((rule: SpecialRule) => {
    if (!isHost) return
    const current = config.specialRules
    const updated = current.includes(rule)
      ? current.filter(r => r !== rule)
      : [...current, rule]
    onSetConfig({ ...config, specialRules: updated })
  }, [isHost, config, onSetConfig])

  const handleTradeRuleChange = useCallback((tradeRule: string) => {
    if (!isHost) return
    onSetConfig({ ...config, tradeRule: tradeRule as DuelConfig['tradeRule'] })
  }, [isHost, config, onSetConfig])

  const handlePlayerSelect = useCallback((playerId: string) => {
    if (!isHost) return
    setSelectedPlayers(prev => {
      if (prev.includes(playerId)) {
        return prev.filter(id => id !== playerId)
      }
      if (prev.length >= 2) {
        return [prev[1], playerId]
      }
      return [...prev, playerId]
    })
  }, [isHost])

  const handleSelectDuellists = useCallback(() => {
    if (selectedPlayers.length === 2) {
      onSelectDuellists(selectedPlayers[0], selectedPlayers[1])
    }
  }, [selectedPlayers, onSelectDuellists])

  const handleLockHand = useCallback(() => {
    if (resolvedDeck.length !== 5 || !deckIsValid) return
    const cardIds = resolvedDeck.map(c => c.id)
    onSelectHand(cardIds)
    setHandLocked(true)
  }, [resolvedDeck, deckIsValid, onSelectHand])

  const effectiveSelected = selectedDuellists.length === 2 ? selectedDuellists : selectedPlayers

  // Can start duel?
  const canStart = isHost
    && effectiveSelected.length === 2
    && players.find(p => p.id === effectiveSelected[0])?.isReady
    && players.find(p => p.id === effectiveSelected[1])?.isReady

  return (
    <div className="waiting-room">
      <div className="waiting-room__header">
        <button type="button" className="waiting-room__leave" onClick={onLeave}>Leave</button>
        <h1 className="waiting-room__title">
          {lobbyState.lobby?.hostName || 'Host'}'s Room
        </h1>
        {isHost && (
          <button
            type="button"
            className="waiting-room__config-toggle"
            onClick={() => setShowRuleConfig(!showRuleConfig)}
          >
            Rules
          </button>
        )}
      </div>

      {error && <div className="waiting-room__error">{error}</div>}

      {/* Rule Config Panel (host only, collapsible on mobile) */}
      {(showRuleConfig || !isHost) && (
        <div className="waiting-room__rules">
          <h2 className="waiting-room__section-title">Rules</h2>
          <div className="waiting-room__rule-toggles">
            {ALL_SPECIAL_RULES.map(rule => (
              <button
                key={rule}
                type="button"
                className={`waiting-room__rule-btn ${config.specialRules.includes(rule) ? 'active' : ''}`}
                onClick={() => handleToggleRule(rule)}
                disabled={!isHost}
              >
                {rule}
              </button>
            ))}
          </div>
          <div className="waiting-room__trade-row">
            <label className="waiting-room__trade-label">Trade Rule:</label>
            <select
              className="waiting-room__trade-select"
              value={config.tradeRule}
              onChange={e => handleTradeRuleChange(e.target.value)}
              disabled={!isHost}
            >
              {ALL_TRADE_RULES.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Players Grid */}
      <div className="waiting-room__section">
        <h2 className="waiting-room__section-title">
          Players ({players.length}/30)
        </h2>
        <div className="waiting-room__players">
          {players.map(p => (
            <ProfileCard
              key={p.id}
              profile={p.profile}
              selected={effectiveSelected.includes(p.id)}
              onClick={isHost ? () => handlePlayerSelect(p.id) : undefined}
              className={`${p.isReady ? 'player-ready' : ''} ${p.id === lobbyState.lobby?.hostName ? 'is-host' : ''}`}
            />
          ))}
          {players.length === 0 && (
            <div className="waiting-room__empty">Waiting for players...</div>
          )}
        </div>
        {isHost && effectiveSelected.length === 2 && selectedDuellists.length === 0 && (
          <button
            type="button"
            className="waiting-room__confirm-duellists"
            onClick={handleSelectDuellists}
          >
            Confirm Duellists
          </button>
        )}
      </div>

      {/* Hand Selection */}
      <div className="waiting-room__section">
        <h2 className="waiting-room__section-title">Your Hand</h2>
        {!handLocked ? (
          <>
            <div className="waiting-room__deck-row">
              <label className="waiting-room__deck-label">Deck:</label>
              <select
                className="waiting-room__deck-select"
                value={selectedDeckId}
                onChange={e => setSelectedDeckId(e.target.value)}
              >
                {savedDecks.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} {isDeckValid(d, worldInventory) ? '' : '(invalid)'}
                  </option>
                ))}
              </select>
            </div>
            {resolvedDeck.length > 0 && (
              <div className="waiting-room__hand-preview">
                {resolvedDeck.map((card, i) => (
                  <div key={`${card.id}-${i}`} className="waiting-room__hand-card">
                    <img src={`/cards/${card.id}.png`} alt={card.name} className="waiting-room__card-img" />
                    <span className="waiting-room__card-name">{card.name}</span>
                  </div>
                ))}
              </div>
            )}
            {!deckIsValid && selectedSavedDeck && (
              <div className="waiting-room__invalid">
                Deck invalid — some cards not in your inventory.
              </div>
            )}
            <button
              type="button"
              className="waiting-room__lock-btn"
              onClick={handleLockHand}
              disabled={!deckIsValid || resolvedDeck.length !== 5}
            >
              Lock Hand
            </button>
          </>
        ) : (
          <div className="waiting-room__hand-locked">
            <div className="waiting-room__hand-preview">
              {resolvedDeck.map((card, i) => (
                <div key={`${card.id}-${i}`} className="waiting-room__hand-card">
                  <img src={`/cards/${card.id}.png`} alt={card.name} className="waiting-room__card-img" />
                </div>
              ))}
            </div>
            <span className="waiting-room__ready-badge">Ready!</span>
          </div>
        )}
      </div>

      {/* Start Duel (host only) */}
      {isHost && (
        <button
          type="button"
          className="waiting-room__start-btn"
          onClick={onStartDuel}
          disabled={!canStart}
        >
          {canStart ? 'Start Duel' : effectiveSelected.length < 2 ? 'Select 2 players' : 'Waiting for hands...'}
        </button>
      )}
    </div>
  )
}
