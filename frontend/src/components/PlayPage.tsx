import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import type { GameState } from '../game'
import type { Card } from '../types/card'
import type { Area } from '../types/world'
import { createGame, placeCard, continueSuddenDeath, getAiMove } from '../game'
import type { Difficulty } from '../game'
import { createRoom, joinRoom, getWsUrl } from '../api/client'
import cardsData from '../data/cards.json'
import { getRegionById, formatRules, getAreaDeckPool } from '../data/world'
import { GameBoard } from './GameBoard'
import { CardView } from './CardView'

const allCards: Card[] = cardsData.cards as Card[]
const DECK_SIZE = 5

/** Winner: 0 = player, 1 = opponent, 'draw' = tie. */
export type WorldMatchResult = 0 | 1 | 'draw'

export interface PlayPageProps {
  worldChallengeLocation?: Area | null
  /** When set, player is in a paid tournament; win grants this card id. */
  tournamentPrize?: string | null
  /** Called when a world challenge or tournament match ends; receives winner (0 = player won). */
  onWorldMatchEnd?: (winner: WorldMatchResult) => void
  onLeaveWorldChallenge?: () => void
  /** Player's owned card ids. When in world challenge mode, only show these in the deck picker. */
  worldPlayerCollection?: string[]
}

function pickRandomDeck(pool: Card[], size: number): Card[] {
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, size)
}

type Screen = 'home' | 'lobby' | 'game' | 'vs-ai-setup'
type GameMode = 'online' | 'vs-ai'

export function PlayPage({ worldChallengeLocation = null, tournamentPrize = null, onWorldMatchEnd, onLeaveWorldChallenge, worldPlayerCollection }: PlayPageProps = {}) {
  const [screen, setScreen] = useState<Screen>(worldChallengeLocation || tournamentPrize ? 'vs-ai-setup' : 'home')
  const [gameMode, setGameMode] = useState<GameMode>('online')
  const [code, setCode] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [roomId, setRoomId] = useState<string | null>(null)
  const [player, setPlayer] = useState<0 | 1 | null>(null)
  const [deck, setDeck] = useState<Card[]>([])
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [localGameState, setLocalGameState] = useState<GameState | null>(null)
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [ws, setWs] = useState<WebSocket | null>(null)
  const [error, setError] = useState<string | null>(null)
  const aiScheduledRef = useRef(false)

  // In world/tournament mode, only show owned cards in the vs-ai deck picker
  const displayCards = useMemo(() => {
    if ((worldChallengeLocation || tournamentPrize) && worldPlayerCollection && worldPlayerCollection.length > 0) {
      return allCards.filter((c) => worldPlayerCollection.includes(c.id))
    }
    return allCards
  }, [worldChallengeLocation, tournamentPrize, worldPlayerCollection])

  useEffect(() => {
    if (worldChallengeLocation || tournamentPrize) {
      setGameMode('vs-ai')
      setScreen('vs-ai-setup')
    }
  }, [worldChallengeLocation, tournamentPrize])

  useEffect(() => {
    if (localGameState?.phase === 'ended' && gameMode === 'vs-ai' && (worldChallengeLocation || tournamentPrize) && onWorldMatchEnd) {
      const winner = localGameState.winner ?? 'draw'
      onWorldMatchEnd(winner)
    }
  }, [localGameState?.phase, localGameState?.winner, gameMode, worldChallengeLocation, tournamentPrize, onWorldMatchEnd])

  const toggleDeck = useCallback((card: Card) => {
    setDeck((prev) => {
      const inDeck = prev.some((c) => c.id === card.id)
      if (inDeck) return prev.filter((c) => c.id !== card.id)
      if (prev.length >= DECK_SIZE) return prev
      return [...prev, card]
    })
  }, [])

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

  const sendReady = useCallback(() => {
    if (!ws || deck.length !== DECK_SIZE) return
    ws.send(JSON.stringify({ type: 'set_deck', deck }))
  }, [ws, deck])

  const sendPlace = useCallback(
    (cardIndex: number, row: number, col: number) => {
      if (!ws) return
      ws.send(JSON.stringify({ type: 'place', cardIndex, row, col }))
    },
    [ws]
  )

  const handlePlayVsAi = useCallback(() => {
    setError(null)
    setGameMode('vs-ai')
    setScreen('vs-ai-setup')
  }, [])

  const handleStartVsAi = useCallback(() => {
    if (deck.length !== DECK_SIZE) return
    setError(null)
    const aiPool = worldChallengeLocation
      ? getAreaDeckPool(worldChallengeLocation.id, allCards)
      : allCards
    const aiDeck = pickRandomDeck(aiPool, DECK_SIZE)
    const firstPlayer = Math.random() < 0.5 ? 0 : 1
    const region = worldChallengeLocation
      ? getRegionById(worldChallengeLocation.regionId)
      : null
    const activeRules = region?.rules ?? []
    const initial = createGame(deck, aiDeck, firstPlayer, activeRules)
    setLocalGameState(initial)
    setScreen('game')
  }, [deck, worldChallengeLocation])

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

  // Sudden Death: after board full draw, auto-continue to new round after a brief pause
  useEffect(() => {
    if (gameMode !== 'vs-ai' || !localGameState || localGameState.phase !== 'sudden_death') return
    const id = setTimeout(() => {
      setLocalGameState(continueSuddenDeath(localGameState))
    }, 1200)
    return () => clearTimeout(id)
  }, [gameMode, localGameState])

  if (screen === 'home') {
    return (
      <div className="play-page">
        <h1>Play Triple Triad</h1>
        {error && <p className="error">{error}</p>}
        <section aria-label="Play options">
          <button type="button" onClick={handleCreate}>Create room</button>
          <p className="or">— or —</p>
          <label htmlFor="join-room-code" className="visually-hidden">Room code to join</label>
          <input
            id="join-room-code"
            type="text"
            placeholder="Room code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            maxLength={6}
          />
          <button type="button" onClick={handleJoin}>Join room</button>
          <p className="or">— or —</p>
          <button type="button" onClick={handlePlayVsAi}>Play vs AI</button>
        </section>
      </div>
    )
  }

  if (screen === 'vs-ai-setup') {
    return (
      <div className="play-page lobby">
        <h1>Play vs AI</h1>
        {(worldChallengeLocation || tournamentPrize) && (
          <div className="world-challenge-note" role="status">
            {tournamentPrize ? (
              <p><strong>Tournament!</strong> Win to win a prize card.</p>
            ) : worldChallengeLocation ? (
              <>
                <p>Playing at <strong>{worldChallengeLocation.name}</strong></p>
                {getRegionById(worldChallengeLocation.regionId) && (
                  <p className="world-region-rules">
                    Region rules: {formatRules(getRegionById(worldChallengeLocation.regionId)!.rules)}. Trade: {getRegionById(worldChallengeLocation.regionId)!.tradeRule}.
                  </p>
                )}
              </>
            ) : null}
          </div>
        )}
        <button type="button" className="back" onClick={() => { setScreen('home'); setGameMode('online'); onLeaveWorldChallenge?.() }}>
          ← Back
        </button>
        <p>
          <label>Difficulty: </label>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </p>
        <p>Choose 5 cards, then click Start game.</p>
        <div className="lobby-deck">
          {Array.from({ length: DECK_SIZE }, (_, i) => (
            <div key={i} className="deck-slot">
              {deck[i] ? (
                <CardView card={deck[i]} selected onSelect={() => toggleDeck(deck[i])} compact />
              ) : (
                <div className="empty-slot">Empty</div>
              )}
            </div>
          ))}
        </div>
        <div className="card-grid" style={{ marginTop: 8 }}>
          {displayCards.map((card) => (
            <CardView
              key={card.id}
              card={card}
              selected={deck.some((c) => c.id === card.id)}
              onSelect={() => toggleDeck(card)}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={handleStartVsAi}
          disabled={deck.length !== DECK_SIZE}
        >
          Start game ({deck.length}/{DECK_SIZE})
        </button>
      </div>
    )
  }

  if (screen === 'lobby') {
    return (
      <div className="play-page lobby">
        <h1>Lobby</h1>
        {player === 0 && (
          <p className="room-code">Room code: <strong>{code}</strong></p>
        )}
        <p>Choose 5 cards, then click Ready.</p>
        <div className="lobby-deck">
          {Array.from({ length: DECK_SIZE }, (_, i) => (
            <div key={i} className="deck-slot">
              {deck[i] ? (
                <CardView card={deck[i]} selected onSelect={() => toggleDeck(deck[i])} compact />
              ) : (
                <div className="empty-slot">Empty</div>
              )}
            </div>
          ))}
        </div>
        <div className="card-grid" style={{ marginTop: 8 }}>
          {allCards.map((card) => (
            <CardView
              key={card.id}
              card={card}
              selected={deck.some((c) => c.id === card.id)}
              onSelect={() => toggleDeck(card)}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={sendReady}
          disabled={deck.length !== DECK_SIZE || !ws}
        >
          Ready ({deck.length}/{DECK_SIZE})
        </button>
      </div>
    )
  }

  if (screen === 'game' && gameMode === 'vs-ai' && localGameState) {
    const handlePlayAgain = () => {
      setLocalGameState(null)
      setScreen('vs-ai-setup')
    }
    const handleReturnToWorld = () => {
      setScreen('home')
      setGameMode('online')
      setLocalGameState(null)
      onLeaveWorldChallenge?.()
    }
    return (
      <div className="play-page game">
        {(worldChallengeLocation || tournamentPrize) && (
          <div className="world-challenge-note">
            {tournamentPrize ? <p>Tournament — win for a prize card!</p> : worldChallengeLocation ? (
              <>
                <p>At {worldChallengeLocation.name}</p>
                {getRegionById(worldChallengeLocation.regionId) && (
                  <p className="world-region-rules">{formatRules(getRegionById(worldChallengeLocation.regionId)!.rules)}</p>
                )}
              </>
            ) : null}
          </div>
        )}
        <button type="button" className="back" onClick={() => { setScreen('home'); setGameMode('online'); setLocalGameState(null); onLeaveWorldChallenge?.() }}>
          ← Back to menu
        </button>
        <GameBoard
          state={localGameState}
          myPlayer={0}
          onPlace={handleLocalPlace}
          onPlayAgain={handlePlayAgain}
          onReturnToWorld={handleReturnToWorld}
        />
      </div>
    )
  }

  if (screen === 'game' && gameMode === 'online' && gameState && player !== null) {
    return (
      <div className="play-page game">
        <GameBoard state={gameState} myPlayer={player} onPlace={sendPlace} />
      </div>
    )
  }

  return <div className="play-page">Loading…</div>
}
