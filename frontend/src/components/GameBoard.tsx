import { useState } from 'react'
import type { GameState, PlayerId } from '../game'
import { CardView } from './CardView'
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
      <div className="game-status" role="status" aria-live="polite" aria-atomic="true">
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
        role="grid"
        aria-label="Game board, 3 by 3 grid"
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
          const playable = isMyTurn && !cell
          return (
            <div
              key={i}
              role="button"
              tabIndex={playable ? 0 : -1}
              aria-label={cell ? `Cell row ${row + 1} column ${col + 1}: ${cell.card.name}` : playable ? `Empty cell, row ${row + 1} column ${col + 1}. Click to place card.` : `Cell row ${row + 1} column ${col + 1}`}
              className={`board-cell ${cell ? 'has-card' : ''} ${cell ? `owner-${cell.owner}` : ''} ${playable ? 'playable' : ''}`}
              onClick={() => handleCellClick(row, col)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleCellClick(row, col)
                }
              }}
              style={{
                minHeight: 80,
                borderRadius: 8,
                cursor: playable ? 'pointer' : 'default',
              }}
            >
              {cell ? (
                <CardView card={cell.card} owner={cell.owner} compact showName={false} />
              ) : (
                <span className="board-cell-empty">+</span>
              )}
            </div>
          )
        })}
      </div>
      <section className="game-hand" aria-labelledby="hand-heading">
        <h3 id="hand-heading">Your hand</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {hand.map((card, idx) => (
            <div
              key={`${card.id}-${idx}`}
              role="button"
              tabIndex={isMyTurn ? 0 : -1}
              aria-label={`Card ${idx + 1}: ${card.name}. ${selectedCardIndex === idx ? 'Selected. Click a board cell to place.' : 'Click to select, then click a board cell to place.'}`}
              onClick={() => isMyTurn && setSelectedCardIndex(idx)}
              onKeyDown={(e) => {
                if (isMyTurn && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault()
                  setSelectedCardIndex(idx)
                }
              }}
              style={{ cursor: isMyTurn ? 'pointer' : 'default', minHeight: 44, minWidth: 44 }}
            >
              <CardView
                card={card}
                compact
                showName={false}
                selected={selectedCardIndex === idx}
              />
            </div>
          ))}
        </div>
        {isMyTurn && hand.length > 0 && (
          <p className="hint" role="status" aria-live="polite">
            {selectedCardIndex !== null ? 'Click an empty cell to place.' : 'Select a card, then click a cell.'}
          </p>
        )}
      </section>
    </div>
  )
}
