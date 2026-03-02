import { useState, useEffect, useRef } from 'react'
import type { GameState, PlayerId, MaybeBoardCell } from '../game'
import { CardView } from './CardView'
import { ROWS, COLS } from '../game'

interface GameBoardProps {
  state: GameState
  myPlayer: PlayerId
  onPlace: (cardIndex: number, row: number, col: number) => void
  onPlayAgain?: () => void
  onReturnToWorld?: () => void
}

export function GameBoard({ state, myPlayer, onPlace, onPlayAgain, onReturnToWorld }: GameBoardProps) {
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null)
  const [placingCell, setPlacingCell] = useState<string | null>(null)
  const [capturedCells, setCapturedCells] = useState<Set<string>>(new Set())
  const prevBoardRef = useRef<MaybeBoardCell[][] | null>(null)

  const isMyTurn = state.phase === 'playing' && state.turn === myPlayer
  const hand = state.hands[myPlayer]
  const opponentId: PlayerId = myPlayer === 0 ? 1 : 0

  // Score: hand cards + board cards owned by each player
  const boardCells = state.board.flat()
  const myScore = hand.length + boardCells.filter((c) => c?.owner === myPlayer).length
  const opponentScore = state.hands[opponentId].length + boardCells.filter((c) => c?.owner === opponentId).length

  // Placement animation: detect card going from null → non-null on the board
  useEffect(() => {
    if (!prevBoardRef.current) {
      prevBoardRef.current = state.board
      return
    }
    const prev = prevBoardRef.current
    prevBoardRef.current = state.board

    let placedKey: string | null = null
    outer: for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!prev[r][c] && state.board[r][c]) {
          placedKey = `${r},${c}`
          break outer
        }
      }
    }

    if (placedKey) {
      setPlacingCell(placedKey)
      const t = setTimeout(() => setPlacingCell(null), 260)
      return () => clearTimeout(t)
    }
  }, [state.board])

  // Capture flip animation: triggered when lastCaptures changes
  useEffect(() => {
    if (state.lastCaptures.length === 0) return
    const keys = new Set(state.lastCaptures.map((c) => `${c.row},${c.col}`))
    const t1 = setTimeout(() => setCapturedCells(keys), 100)
    const t2 = setTimeout(() => setCapturedCells(new Set()), 560)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [state.lastCaptures])

  // Clear animation state on sudden death round resets
  useEffect(() => {
    setPlacingCell(null)
    setCapturedCells(new Set())
    prevBoardRef.current = null
  }, [state.suddenDeathRound])

  const handleCellClick = (row: number, col: number) => {
    if (state.phase !== 'playing' || state.turn !== myPlayer) return
    if (state.board[row][col] !== null) return
    if (selectedCardIndex === null || selectedCardIndex >= hand.length) return
    onPlace(selectedCardIndex, row, col)
    setSelectedCardIndex(null)
  }

  return (
    <div className="game-board-container">
      {/* Score bar */}
      <div className="score-bar" aria-label={`Scores: You ${myScore}, Opponent ${opponentScore}`}>
        <div className="score-block score-block-player">
          <span className="score-label">You</span>
          <span className="score-value">{myScore}</span>
        </div>
        <div className="score-center">
          {state.phase !== 'ended' && (
            <span className="score-turn-text" role="status" aria-live="polite" aria-atomic="true">
              {isMyTurn ? 'Your turn' : "Opponent's turn"}
            </span>
          )}
        </div>
        <div className="score-block score-block-opponent">
          <span className="score-label">Opponent</span>
          <span className="score-value">{opponentScore}</span>
        </div>
      </div>

      {/* Active rules indicator */}
      {state.activeRules.length > 0 && (
        <div className="rules-bar" aria-label={`Active rules: ${state.activeRules.join(', ')}`}>
          {state.activeRules.map((rule) => (
            <span key={rule} className="rule-badge">{rule}</span>
          ))}
        </div>
      )}

      <div className="game-board-wrap">
        <div
          className="game-board"
          role="grid"
          aria-label="Game board, 3 by 3 grid"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${COLS}, 1fr)`,
            gap: 4,
          }}
        >
          {Array.from({ length: ROWS * COLS }, (_, i) => {
            const row = Math.floor(i / COLS)
            const col = i % COLS
            const cell = state.board[row][col]
            const playable = isMyTurn && !cell
            const cellKey = `${row},${col}`
            return (
              <div
                key={i}
                role="button"
                tabIndex={playable ? 0 : -1}
                aria-label={cell ? `Cell row ${row + 1} column ${col + 1}: ${cell.card.name}` : playable ? `Empty cell, row ${row + 1} column ${col + 1}. Click to place card.` : `Cell row ${row + 1} column ${col + 1}`}
                className={`board-cell ${cell ? 'has-card' : ''} ${cell ? `owner-${cell.owner}` : ''} ${playable ? 'playable' : ''} ${placingCell === cellKey ? 'is-placing' : ''} ${capturedCells.has(cellKey) ? 'is-captured' : ''}`}
                onClick={() => handleCellClick(row, col)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleCellClick(row, col)
                  }
                }}
                style={{ borderRadius: 8, cursor: playable ? 'pointer' : 'default' }}
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

        {state.phase === 'ended' && (
          <div className="game-over-overlay" role="dialog" aria-live="assertive" aria-label="Game result">
            <div className="game-over-content">
              {state.winner === myPlayer ? (
                <p className="game-over-result won">You Win!</p>
              ) : state.winner === 'draw' ? (
                <p className="game-over-result draw">Draw</p>
              ) : (
                <p className="game-over-result lost">You Lose</p>
              )}
              <div className="game-over-actions">
                {onPlayAgain && (
                  <button type="button" className="game-over-btn primary" onClick={onPlayAgain}>
                    Play Again
                  </button>
                )}
                {onReturnToWorld && (
                  <button type="button" className="game-over-btn" onClick={onReturnToWorld}>
                    Return to World
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <section className={`game-hand${isMyTurn ? ' is-my-turn' : ''}`} aria-labelledby="hand-heading">
        <h3 id="hand-heading">Your hand</h3>
        <div className="hand-cards-grid">
          {hand.map((card, idx) => (
            <div
              key={`${card.id}-${idx}`}
              role="button"
              tabIndex={isMyTurn ? 0 : -1}
              aria-label={`Card ${idx + 1}: ${card.name}. ${selectedCardIndex === idx ? 'Selected. Click a board cell to place.' : 'Click to select, then click a board cell to place.'}`}
              className="hand-card-btn"
              onClick={() => isMyTurn && setSelectedCardIndex(idx)}
              onKeyDown={(e) => {
                if (isMyTurn && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault()
                  setSelectedCardIndex(idx)
                }
              }}
              style={{ cursor: isMyTurn ? 'pointer' : 'default' }}
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
