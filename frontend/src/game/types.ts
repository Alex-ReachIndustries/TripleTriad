import type { Card, Element } from '../types/card'
import type { SpecialRule } from '../types/world'

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
  /**
   * 'playing' = game in progress.
   * 'sudden_death' = board full with a draw; state has been reshuffled for a new round.
   * 'ended' = game is over, winner is set.
   */
  phase: 'playing' | 'ended' | 'sudden_death'
  /** Set when phase === 'ended': 0, 1, or 'draw'. */
  winner: PlayerId | 'draw' | null
  /** Active special rules for this game (e.g. Same, Plus, Combo). */
  activeRules: SpecialRule[]
  /** Board positions captured on the most recent move, for animation (in capture order). */
  lastCaptures: { row: number; col: number }[]
  /** Element assigned to each board cell for the Elemental rule. null = no element. */
  boardElements: (Element | null)[][]
  /** 0 = normal game, 1+ = which Sudden Death round we are on. */
  suddenDeathRound: number
}

export type GameResult = PlayerId | 'draw'
