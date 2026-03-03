import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import type { GameState } from '../game'
import type { Card } from '../types/card'
import type { SavedDeck } from '../data/deckManager'
import { createGame, placeCard, continueSuddenDeath, getAiMove } from '../game'
import type { Difficulty } from '../game'
import { createRoom, joinRoom, getWsUrl } from '../api/client'
import cardsData from '../data/cards.json'
import { getDeckById, isDeckValid } from '../data/deckManager'
import { GameBoard } from './GameBoard'
import { DeckManager } from './DeckManager'

const allCards: Card[] = cardsData.cards as Card[]
const cardMap = new Map(allCards.map(c => [c.id, c]))
const DECK_SIZE = 5

export interface PlayPageProps {
  /** Player's card inventory. */
  worldPlayerInventory?: Record<string, number>
  /** Saved decks from world state */
  savedDecks?: SavedDeck[]
  /** Last used deck ID */
  lastDeckId?: string | null
  /** Update last used deck ID */
  onSetLastDeckId?: (deckId: string) => void
  /** Update saved decks */
  onUpdateDecks?: (decks: SavedDeck[]) => void
}

function pickRandomDeck(pool: Card[], size: number): Card[] {
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, size)
}

function getCard(id: string): Card | undefined {
  return cardMap.get(id)
}

type Screen = 'home' | 'lobby' | 'game' | 'pre-duel' | 'deck-manager'
type GameMode = 'online' | 'vs-ai'

export function PlayPage({
  worldPlayerInventory,
  savedDecks = [],
  lastDeckId = null,
  onSetLastDeckId,
  onUpdateDecks,
}: PlayPageProps = {}) {
  const [screen, setScreen] = useState<Screen>('home')
  const [gameMode, setGameMode] = useState<GameMode>('online')
  const [code, setCode] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [roomId, setRoomId] = useState<string | null>(null)
  const [player, setPlayer] = useState<0 | 1 | null>(null)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [localGameState, setLocalGameState] = useState<GameState | null>(null)
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [ws, setWs] = useState<WebSocket | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedDeckId, setSelectedDeckId] = useState<string>(lastDeckId ?? 'starter')
  const aiScheduledRef = useRef(false)

  // --- Online room handlers ---
  const handleCreate = async () => {
    setError(null)
    try {
      const { roomId: id, code: c } = await createRoom()
      setRoomId(id)
      setCode(c)
      setPlayer(0)
      setScreen('lobby')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create room')
    }
  }

  const handleJoin = async () => {
    setError(null)
    if (!joinCode.trim()) return
    try {
      const { roomId: id } = await joinRoom(joinCode.trim())
      setRoomId(id)
      setPlayer(1)
      setScreen('lobby')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to join room')
    }
  }

  useEffect(() => {
    if (screen !== 'lobby' || !roomId || player === null) return
    const url = getWsUrl(roomId, player)
    const socket = new WebSocket(url)
    socket.onopen = () => {
      setWs(socket)
    }
    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string)
        if (msg.type === 'start') {
          setGameState(msg.state)
          setScreen('game')
          setLobbyStatus('waiting')
        } else if (msg.type === 'lobby') {
          if (msg.decksReady) {
            setLobbyStatus('opponent-ready')
          }
        } else if (msg.type === 'state') {
          setGameState(msg.state)
        } else if (msg.type === 'error') {
          setError(msg.error)
        }
      } catch (_) {}
    }
    socket.onerror = () => setError('Connection error')
    return () => {
      socket.close()
      setWs(null)
    }
  }, [screen, roomId, player])

  // --- Resolve saved deck to Card[] ---
  const resolvedDeck = useMemo(() => {
    const sd = getDeckById(savedDecks, selectedDeckId)
    if (!sd) return []
    return sd.cardIds.map(id => getCard(id)).filter((c): c is Card => !!c)
  }, [savedDecks, selectedDeckId])

  const selectedSavedDeck = useMemo(() => getDeckById(savedDecks, selectedDeckId), [savedDecks, selectedDeckId])
  const deckIsValid = selectedSavedDeck ? isDeckValid(selectedSavedDeck, worldPlayerInventory ?? {}) : false

  const [lobbyStatus, setLobbyStatus] = useState<'waiting' | 'ready' | 'opponent-ready'>('waiting')

  const sendReady = useCallback(() => {
    if (!ws || resolvedDeck.length !== DECK_SIZE || !deckIsValid) return
    onSetLastDeckId?.(selectedDeckId)
    ws.send(JSON.stringify({ type: 'set_deck', deck: resolvedDeck }))
    setLobbyStatus('ready')
  }, [ws, resolvedDeck, deckIsValid, selectedDeckId, onSetLastDeckId])

  const sendPlace = useCallback(
    (cardIndex: number, row: number, col: number) => {
      if (!ws) return
      ws.send(JSON.stringify({ type: 'place', cardIndex, row, col }))
    },
    [ws]
  )

  // --- Start freestyle AI duel ---
  const handleStartVsAi = useCallback(() => {
    if (resolvedDeck.length !== DECK_SIZE) return
    setError(null)
    onSetLastDeckId?.(selectedDeckId)
    const aiDeck = pickRandomDeck(allCards, DECK_SIZE)
    const firstPlayer = Math.random() < 0.5 ? 0 : 1
    const initial = createGame(resolvedDeck, aiDeck, firstPlayer, [])
    setLocalGameState(initial)
    setScreen('game')
  }, [resolvedDeck, selectedDeckId, onSetLastDeckId])

  // --- AI move effect ---
  const handleLocalPlace = useCallback(
    (cardIndex: number, row: number, col: number) => {
      if (!localGameState || localGameState.turn !== 0 || localGameState.phase !== 'playing') return
      setLocalGameState(placeCard(localGameState, 0, cardIndex, row, col))
    },
    [localGameState]
  )

  useEffect(() => {
    if (gameMode !== 'vs-ai' || screen !== 'game' || !localGameState) return
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
      } catch (e) {
        setError(e instanceof Error ? e.message : 'AI move failed')
      } finally {
        aiScheduledRef.current = false
      }
    }, 500)
    return () => clearTimeout(id)
  }, [gameMode, screen, localGameState, difficulty])

  // Sudden Death auto-continue
  useEffect(() => {
    if (gameMode !== 'vs-ai' || !localGameState || localGameState.phase !== 'sudden_death') return
    const id = setTimeout(() => {
      setLocalGameState(continueSuddenDeath(localGameState))
    }, 1200)
    return () => clearTimeout(id)
  }, [gameMode, localGameState])

  // ========== SCREENS ==========

  // --- Home (2P hub + freestyle AI) ---
  if (screen === 'home') {
    return (
      <div className="play-page duel-home">
        <h2 className="duel-home-title">Duel</h2>
        <p className="duel-home-subtitle">Challenge opponents or play online</p>
        {error && <p className="pre-duel-invalid">{error}</p>}

        <section className="duel-home-options" aria-label="Play options">
          {/* Online 2P section */}
          <div className="duel-home-section">
            <h3 className="duel-home-section-title">Online Multiplayer</h3>
            <div className="duel-home-row">
              <button type="button" className="duel-home-btn primary" onClick={handleCreate}>
                Create Room
              </button>
            </div>
            <div className="duel-home-divider">or join an existing room</div>
            <div className="duel-home-join-row">
              <label htmlFor="join-room-code" className="visually-hidden">Room code to join</label>
              <input
                id="join-room-code"
                type="text"
                className="duel-home-code-input"
                placeholder="ROOM CODE"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
              />
              <button type="button" className="duel-home-btn secondary" onClick={handleJoin}>
                Join
              </button>
            </div>
          </div>

          {/* AI section */}
          <div className="duel-home-section">
            <h3 className="duel-home-section-title">Solo Practice</h3>
            <button
              type="button"
              className="duel-home-btn primary"
              onClick={() => { setGameMode('vs-ai'); setScreen('pre-duel') }}
            >
              Play vs AI
            </button>
          </div>
        </section>
      </div>
    )
  }

  // --- Pre-duel: deck selection for freestyle AI ---
  if (screen === 'pre-duel') {
    return (
      <div className="play-page pre-duel">
        <div className="pre-duel-header">
          <button
            type="button"
            className="back"
            onClick={() => { setScreen('home'); setGameMode('online') }}
          >
            &larr; Back
          </button>
          <h2 className="pre-duel-title">Play vs AI</h2>
        </div>

        {/* Difficulty selector */}
        <div className="pre-duel-difficulty-select">
          <label htmlFor="freestyle-difficulty">Difficulty:</label>
          <select
            id="freestyle-difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        {/* Deck selector dropdown */}
        <div className="pre-duel-deck-section">
          <div className="pre-duel-deck-row">
            <label htmlFor="pre-duel-deck-select" className="pre-duel-deck-label">Deck:</label>
            <select
              id="pre-duel-deck-select"
              className="pre-duel-deck-dropdown"
              value={selectedDeckId}
              onChange={(e) => setSelectedDeckId(e.target.value)}
            >
              {savedDecks.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} {isDeckValid(d, worldPlayerInventory ?? {}) ? '' : '(invalid)'}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="pre-duel-edit-decks-btn"
              onClick={() => setScreen('deck-manager')}
            >
              Edit Decks
            </button>
          </div>

          {/* Card preview */}
          {resolvedDeck.length > 0 && (
            <div className="pre-duel-deck-preview">
              {resolvedDeck.map((card, i) => (
                <div key={`${card.id}-${i}`} className="pre-duel-preview-card">
                  <img src={`/cards/${card.id}.png`} alt={card.name} className="pre-duel-card-img" />
                  <span className="pre-duel-card-name">{card.name}</span>
                </div>
              ))}
            </div>
          )}

          {!deckIsValid && selectedSavedDeck && (
            <p className="pre-duel-invalid">
              This deck is invalid — some cards may not be in your inventory.
            </p>
          )}
        </div>

        {/* Start button */}
        <button
          type="button"
          className="pre-duel-start-btn"
          disabled={!deckIsValid || resolvedDeck.length !== DECK_SIZE}
          onClick={handleStartVsAi}
        >
          Start Duel
        </button>
      </div>
    )
  }

  // --- Deck Manager sub-screen ---
  if (screen === 'deck-manager') {
    return (
      <div className="play-page deck-manager-page">
        <DeckManager
          savedDecks={savedDecks}
          inventory={worldPlayerInventory ?? {}}
          onUpdateDecks={(decks) => onUpdateDecks?.(decks)}
          onBack={() => setScreen('pre-duel')}
        />
      </div>
    )
  }

  // --- Lobby (2P online) ---
  if (screen === 'lobby') {
    const isReady = lobbyStatus === 'ready' || lobbyStatus === 'opponent-ready'

    return (
      <div className="play-page lobby-2p">
        <div className="lobby-2p-header">
          <button
            type="button"
            className="back"
            onClick={() => { setScreen('home'); setGameMode('online'); setLobbyStatus('waiting'); ws?.close() }}
          >
            &larr; Leave
          </button>
          <h2 className="lobby-2p-title">2P Lobby</h2>
        </div>

        {/* Room code + status */}
        <div className="lobby-2p-room">
          {player === 0 && (
            <div className="lobby-2p-code">
              <span className="lobby-2p-code-label">Room Code:</span>
              <span className="lobby-2p-code-value">{code}</span>
              <span className="lobby-2p-code-hint">Share this code with your opponent</span>
            </div>
          )}
          {player === 1 && (
            <div className="lobby-2p-joined">Connected to room</div>
          )}
        </div>

        {/* Player status indicators */}
        <div className="lobby-2p-players">
          <div className={`lobby-2p-player ${player === 0 ? 'you' : ''}`}>
            <div className="lobby-2p-player-label">Player 1 {player === 0 ? '(You)' : ''}</div>
            <div className={`lobby-2p-player-status ${player === 0 && isReady ? 'ready' : ws ? 'connected' : 'waiting'}`}>
              {player === 0 && isReady ? 'Ready' : ws ? 'Connected' : 'Waiting...'}
            </div>
          </div>
          <div className="lobby-2p-vs">VS</div>
          <div className={`lobby-2p-player ${player === 1 ? 'you' : ''}`}>
            <div className="lobby-2p-player-label">Player 2 {player === 1 ? '(You)' : ''}</div>
            <div className={`lobby-2p-player-status ${player === 1 && isReady ? 'ready' : ws ? 'connected' : 'waiting'}`}>
              {player === 1 && isReady ? 'Ready' : ws ? 'Connected' : 'Waiting...'}
            </div>
          </div>
        </div>

        {/* Deck selection — uses saved decks */}
        <div className="lobby-2p-deck-section">
          <div className="pre-duel-deck-row">
            <label htmlFor="lobby-deck-select" className="pre-duel-deck-label">Your Deck:</label>
            <select
              id="lobby-deck-select"
              className="pre-duel-deck-dropdown"
              value={selectedDeckId}
              onChange={(e) => setSelectedDeckId(e.target.value)}
              disabled={isReady}
            >
              {savedDecks.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} {isDeckValid(d, worldPlayerInventory ?? {}) ? '' : '(invalid)'}
                </option>
              ))}
            </select>
          </div>

          {/* Card preview */}
          {resolvedDeck.length > 0 && (
            <div className="pre-duel-deck-preview">
              {resolvedDeck.map((card, i) => (
                <div key={`${card.id}-${i}`} className="pre-duel-preview-card">
                  <img src={`/cards/${card.id}.png`} alt={card.name} className="pre-duel-card-img" />
                  <span className="pre-duel-card-name">{card.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ready button */}
        <button
          type="button"
          className="pre-duel-start-btn"
          onClick={sendReady}
          disabled={!deckIsValid || resolvedDeck.length !== DECK_SIZE || !ws || isReady}
        >
          {isReady ? 'Waiting for opponent...' : 'Ready!'}
        </button>

        {error && <p className="pre-duel-invalid">{error}</p>}
      </div>
    )
  }

  // --- Game (vs AI - freestyle) ---
  if (screen === 'game' && gameMode === 'vs-ai' && localGameState) {
    const handlePlayAgain = () => {
      setLocalGameState(null)
      setScreen('pre-duel')
    }
    return (
      <div className="play-page game">
        <button type="button" className="back" onClick={() => { setScreen('home'); setGameMode('online'); setLocalGameState(null) }}>
          &larr; Back to menu
        </button>
        <GameBoard
          state={localGameState}
          myPlayer={0}
          onPlace={handleLocalPlace}
          onPlayAgain={handlePlayAgain}
        />
      </div>
    )
  }

  // --- Game (online 2P) ---
  if (screen === 'game' && gameMode === 'online' && gameState && player !== null) {
    return (
      <div className="play-page game">
        <GameBoard state={gameState} myPlayer={player} onPlace={sendPlace} />
      </div>
    )
  }

  return <div className="play-page">Loading...</div>
}
