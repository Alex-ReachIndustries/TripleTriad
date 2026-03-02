import type { Card } from '../types/card'

export type PlayerId = 0 | 1

export interface BoardCell {
  card: Card
  owner: PlayerId
}

export type MaybeBoardCell = BoardCell | null

/** 3x3 board: state.board[row][col]. Row and col 0..2. */
export interface GameState {
  board: MaybeBoardCell[][]
  /** Each player's hand; 5 cards at start, one played per turn. */
  hands: [Card[], Card[]]
  /** Who places the next card (0 or 1). */
  turn: PlayerId
  /** Who went first (coin flip). */
  firstPlayer: PlayerId
  /** After 9 placements, game ends. */
  phase: 'playing' | 'ended'
  /** Set when phase === 'ended': 0, 1, or 'draw'. */
  winner: PlayerId | 'draw' | null
}

export type GameResult = PlayerId | 'draw'
