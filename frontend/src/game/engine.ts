import type { Card } from '../types/card'
import type { GameState, PlayerId, GameResult, MaybeBoardCell } from './types'

const ROWS = 3
const COLS = 3
const HAND_SIZE = 5

/** Neighbor direction: [dr, dc]. Up = [-1,0], Right = [0,1], Down = [1,0], Left = [0,-1]. */
const NEIGHBORS: [number, number][] = [[-1, 0], [0, 1], [1, 0], [0, -1]]
/** For each direction [dr,dc], which side of OUR card faces that neighbor: top=0, right=1, bottom=2, left=3. */
const OUR_SIDE: number[] = [0, 1, 2, 3] // up -> our top, right -> our right, down -> our bottom, left -> our left
/** For each direction [dr,dc], which side of THEIR card faces us. Neighbor above us: their bottom faces us = index 2. */
const THEIR_SIDE: number[] = [2, 3, 0, 1] // up: their bottom; right: their left; down: their top; left: their right

function getRank(card: Card, side: number): number {
  const ranks = [card.top, card.right, card.bottom, card.left]
  return ranks[side] ?? 0
}

/**
 * Create initial game state. Decks are copied; first 5 cards form each hand.
 */
export function createGame(
  deck0: Card[],
  deck1: Card[],
  firstPlayer: PlayerId
): GameState {
  const hand0 = deck0.slice(0, HAND_SIZE)
  const hand1 = deck1.slice(0, HAND_SIZE)
  const board: MaybeBoardCell[][] = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => null)
  )
  return {
    board,
    hands: [hand0, hand1],
    turn: firstPlayer,
    firstPlayer,
    phase: 'playing',
    winner: null,
  }
}

/**
 * Apply capture rule: when we place at (r, c), flip any adjacent opponent card
 * where our touching rank is strictly higher than theirs.
 */
function applyCaptures(
  board: MaybeBoardCell[][],
  card: Card,
  owner: PlayerId,
  row: number,
  col: number
): void {
  const opponent: PlayerId = owner === 0 ? 1 : 0
  NEIGHBORS.forEach(([dr, dc], i) => {
    const nr = row + dr
    const nc = col + dc
    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) return
    const cell = board[nr][nc]
    if (!cell || cell.owner !== opponent) return
    const ourRank = getRank(card, OUR_SIDE[i])
    const theirRank = getRank(cell.card, THEIR_SIDE[i])
    if (ourRank > theirRank) {
      cell.owner = owner
    }
  })
}

/**
 * Place a card from the current player's hand onto the board. Returns new state or throws.
 */
export function placeCard(
  state: GameState,
  player: PlayerId,
  cardIndex: number,
  row: number,
  col: number
): GameState {
  if (state.phase !== 'playing') {
    throw new Error('Game has ended')
  }
  if (player !== state.turn) {
    throw new Error('Not your turn')
  }
  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) {
    throw new Error('Invalid cell')
  }
  if (state.board[row][col] !== null) {
    throw new Error('Cell already occupied')
  }
  const hand = state.hands[player]
  if (cardIndex < 0 || cardIndex >= hand.length) {
    throw new Error('Invalid card index')
  }

  const card = hand[cardIndex]
  const newHand = hand.filter((_, i) => i !== cardIndex)
  const newHands: [Card[], Card[]] =
    player === 0 ? [newHand, state.hands[1]] : [state.hands[0], newHand]

  const board = state.board.map((r) => r.map((c) => (c ? { ...c } : null)))
  board[row][col] = { card, owner: player }
  applyCaptures(board, card, player, row, col)

  const nextTurn: PlayerId = player === 0 ? 1 : 0
  const boardFull = board.flat().every((c) => c !== null)
  const phase = boardFull ? 'ended' : 'playing'
  const winner = phase === 'ended' ? computeWinner(board, newHands) : null

  return {
    board,
    hands: newHands,
    turn: nextTurn,
    firstPlayer: state.firstPlayer,
    phase: phase as GameState['phase'],
    winner,
  }
}

/**
 * Score: count board ownership; add 1 for the player who has 1 card left (went second).
 */
function computeWinner(
  board: MaybeBoardCell[][],
  hands: [Card[], Card[]]
): GameResult {
  let count0 = 0
  let count1 = 0
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = board[r][c]
      if (!cell) continue
      if (cell.owner === 0) count0++
      else count1++
    }
  }
  if (hands[0].length === 1) count0++
  if (hands[1].length === 1) count1++
  if (count0 > count1) return 0
  if (count1 > count0) return 1
  return 'draw'
}

export function getWinner(state: GameState): GameResult | null {
  return state.winner
}

export function isGameOver(state: GameState): boolean {
  return state.phase === 'ended'
}

export { ROWS, COLS, HAND_SIZE }
