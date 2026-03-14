import type { Card } from '../types/card'
import type { TradeRule } from '../types/world'
import type { GameState, PlayerId } from '../game/types'
import { getCapturedCards, ROWS, COLS } from '../game/engine'

export interface TradeResult {
  /** Cards the human player (player 0) gains — already determined. */
  cardsGained: Card[]
  /** Cards the human player (player 0) loses — already determined. */
  cardsLost: Card[]
  /** Whether the player must pick cards from a selection pool. */
  requiresSelection: boolean
  /** Max cards the player can pick (One=1, Diff=N). */
  maxSelections: number
  /** Pool of cards available to pick from (opponent's captured cards). */
  selectionPool: Card[]
}

/**
 * Compute trade results after a 1P game ends.
 * Player is always PlayerId 0, AI is PlayerId 1.
 */
export function computeTradeResult(
  finalState: GameState,
  tradeRule: TradeRule,
  winner: PlayerId | 'draw',
  playerHand: Card[],
  aiHand: Card[],
): TradeResult {
  const empty: TradeResult = { cardsGained: [], cardsLost: [], requiresSelection: false, maxSelections: 0, selectionPool: [] }

  if (winner === 'draw') {
    // Direct still applies on draw; others = no exchange
    if (tradeRule === 'Direct') return computeDirectTrade(finalState)
    return empty
  }

  // Perfect game: if all 9 board cards belong to one player, use All trade
  if (isPerfectGame(finalState)) {
    return computeAllTrade(winner, playerHand, aiHand)
  }

  const { capturedByPlayer0, capturedByPlayer1 } = getCapturedCards(finalState)

  switch (tradeRule) {
    case 'One': return computeOneTrade(winner, capturedByPlayer0, capturedByPlayer1)
    case 'Diff': return computeDiffTrade(finalState, winner, capturedByPlayer0, capturedByPlayer1)
    case 'Direct': return computeDirectTrade(finalState)
    case 'All': return computeAllTrade(winner, playerHand, aiHand)
    default: return empty
  }
}

/** A perfect game is when all 9 board cards belong to a single player. */
function isPerfectGame(finalState: GameState): boolean {
  let count0 = 0, count1 = 0
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = finalState.board[r][c]
      if (!cell) return false
      if (cell.owner === 0) count0++
      else count1++
    }
  }
  return count0 === 9 || count1 === 9
}

function computeOneTrade(
  winner: PlayerId,
  capturedByPlayer0: Card[],
  capturedByPlayer1: Card[],
): TradeResult {
  if (winner === 0) {
    // Player won: pick 1 from cards they captured
    if (capturedByPlayer0.length === 0) {
      return { cardsGained: [], cardsLost: [], requiresSelection: false, maxSelections: 0, selectionPool: [] }
    }
    return {
      cardsGained: [],
      cardsLost: [],
      requiresSelection: true,
      maxSelections: 1,
      selectionPool: capturedByPlayer0,
    }
  }
  // AI won: AI picks 1 randomly from its captures
  if (capturedByPlayer1.length === 0) {
    return { cardsGained: [], cardsLost: [], requiresSelection: false, maxSelections: 0, selectionPool: [] }
  }
  const aiPick = capturedByPlayer1[Math.floor(Math.random() * capturedByPlayer1.length)]
  return {
    cardsGained: [],
    cardsLost: [aiPick],
    requiresSelection: false,
    maxSelections: 0,
    selectionPool: [],
  }
}

function computeDiffTrade(
  finalState: GameState,
  winner: PlayerId,
  capturedByPlayer0: Card[],
  capturedByPlayer1: Card[],
): TradeResult {
  // Score = board ownership + hand remainder
  let count0 = 0, count1 = 0
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = finalState.board[r][c]
      if (cell?.owner === 0) count0++
      else if (cell?.owner === 1) count1++
    }
  }
  count0 += finalState.hands[0].length
  count1 += finalState.hands[1].length
  const diff = Math.abs(count0 - count1)

  if (winner === 0) {
    const max = Math.min(diff, capturedByPlayer0.length)
    if (max === 0) return { cardsGained: [], cardsLost: [], requiresSelection: false, maxSelections: 0, selectionPool: [] }
    return {
      cardsGained: [],
      cardsLost: [],
      requiresSelection: true,
      maxSelections: max,
      selectionPool: capturedByPlayer0,
    }
  }
  // AI picks N
  const n = Math.min(diff, capturedByPlayer1.length)
  const shuffled = [...capturedByPlayer1].sort(() => Math.random() - 0.5)
  return {
    cardsGained: [],
    cardsLost: shuffled.slice(0, n),
    requiresSelection: false,
    maxSelections: 0,
    selectionPool: [],
  }
}

function computeDirectTrade(finalState: GameState): TradeResult {
  const { capturedByPlayer0, capturedByPlayer1 } = getCapturedCards(finalState)
  return {
    cardsGained: capturedByPlayer0,
    cardsLost: capturedByPlayer1,
    requiresSelection: false,
    maxSelections: 0,
    selectionPool: [],
  }
}

function computeAllTrade(
  winner: PlayerId,
  playerHand: Card[],
  aiHand: Card[],
): TradeResult {
  if (winner === 0) {
    return {
      cardsGained: aiHand,
      cardsLost: [],
      requiresSelection: false,
      maxSelections: 0,
      selectionPool: [],
    }
  }
  return {
    cardsGained: [],
    cardsLost: playerHand,
    requiresSelection: false,
    maxSelections: 0,
    selectionPool: [],
  }
}
