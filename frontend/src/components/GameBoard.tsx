import { useState } from 'react'
import type { GameState, PlayerId } from '../game'
import { CardView } from './CardView'
import { rankLabel } from '../types/card'
import { ROWS, COLS } from '../game'

interface GameBoardProps {
  state: GameState
  myPlayer: PlayerId
  onPlace: (cardIndex: number, row: number, col: number) => void
}

export function GameBoard({ state, myPlayer, onPlace }: GameBoardProps) {
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null)
  const isMyTurn = state.phase === 'playing' && state.turn === myPlayer
  const hand = state.hands[myPlayer]

  const handleCellClick = (row: number, col: number) => {
    if (state.phase !== 'playing' || state.turn !== myPlayer) return
    if (state.board[row][col] !== null) return
    if (selectedCardIndex === null || selectedCardIndex >= hand.length) return
    onPlace(selectedCardIndex, row, col)
    setSelectedCardIndex(null)
  }

  return (
    <div className="game-board-container">
      <div className="game-status">
        {state.phase === 'ended' ? (
          state.winner === myPlayer ? (
            <p className="won">You win!</p>
          ) : state.winner === 'draw' ? (
            <p>Draw.</p>
          ) : (
            <p className="lost">You lose.</p>
          )
        ) : (
          <p>{isMyTurn ? 'Your turn' : "Opponent's turn"}</p>
        )}
      </div>
      <div
        className="game-board"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gap: 4,
          maxWidth: 320,
        }}
      >
        {Array.from({ length: ROWS * COLS }, (_, i) => {
          const row = Math.floor(i / COLS)
          const col = i % COLS
          const cell = state.board[row][col]
          return (
            <div
              key={i}
              role="button"
              tabIndex={0}
              className="board-cell"
              onClick={() => handleCellClick(row, col)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleCellClick(row, col)
              }}
              style={{
                minHeight: 80,
                border: '2px solid #555',
                borderRadius: 8,
                background: cell ? '#1a2a4a' : (isMyTurn ? '#0f1f3a' : '#0a1525'),
                cursor: isMyTurn && !cell ? 'pointer' : 'default',
              }}
            >
              {cell ? (
                <div className={`board-card owner-${cell.owner}`}>
                  <span className="board-card-name">{cell.card.name}</span>
                  <span className="board-card-ranks">
                    {rankLabel(cell.card.top)} {rankLabel(cell.card.right)}{' '}
                    {rankLabel(cell.card.bottom)} {rankLabel(cell.card.left)}
                  </span>
                </div>
              ) : (
                <span className="board-cell-empty">+</span>
              )}
            </div>
          )
        })}
      </div>
      <div className="game-hand">
        <h3>Your hand</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {hand.map((card, idx) => (
            <div
              key={`${card.id}-${idx}`}
              role="button"
              tabIndex={0}
              onClick={() => isMyTurn && setSelectedCardIndex(idx)}
              onKeyDown={(e) => {
                if (isMyTurn && (e.key === 'Enter' || e.key === ' ')) setSelectedCardIndex(idx)
              }}
              style={{ cursor: isMyTurn ? 'pointer' : 'default' }}
            >
              <CardView
                card={card}
                compact
                selected={selectedCardIndex === idx}
              />
            </div>
          ))}
        </div>
        {isMyTurn && hand.length > 0 && (
          <p className="hint">
            {selectedCardIndex !== null ? 'Click an empty cell to place.' : 'Select a card, then click a cell.'}
          </p>
        )}
      </div>
    </div>
  )
}
