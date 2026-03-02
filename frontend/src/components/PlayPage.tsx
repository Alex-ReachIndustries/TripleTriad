import { useState, useCallback, useEffect } from 'react'
import type { GameState } from '../game'
import type { Card } from '../types/card'
import { createRoom, joinRoom, getWsUrl } from '../api/client'
import cardsData from '../data/cards.json'
import { GameBoard } from './GameBoard'
import { CardView } from './CardView'

const allCards: Card[] = cardsData.cards as Card[]
const DECK_SIZE = 5

type Screen = 'home' | 'lobby' | 'game'

export function PlayPage() {
  const [screen, setScreen] = useState<Screen>('home')
  const [code, setCode] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [roomId, setRoomId] = useState<string | null>(null)
  const [player, setPlayer] = useState<0 | 1 | null>(null)
  const [deck, setDeck] = useState<Card[]>([])
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [ws, setWs] = useState<WebSocket | null>(null)
  const [error, setError] = useState<string | null>(null)

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

  if (screen === 'home') {
    return (
      <div className="play-page">
        <h1>Play Triple Triad</h1>
        {error && <p className="error">{error}</p>}
        <section>
          <button type="button" onClick={handleCreate}>Create room</button>
          <p className="or">— or —</p>
          <input
            type="text"
            placeholder="Room code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            maxLength={6}
          />
          <button type="button" onClick={handleJoin}>Join room</button>
        </section>
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

  if (screen === 'game' && gameState && player !== null) {
    return (
      <div className="play-page game">
        <GameBoard state={gameState} myPlayer={player} onPlace={sendPlace} />
      </div>
    )
  }

  return <div className="play-page">Loading…</div>
}
