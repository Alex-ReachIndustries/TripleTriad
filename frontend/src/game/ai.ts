import type { GameState, PlayerId } from './types'
import type { DifficultyTier } from '../types/world'
import { placeCard, getValidMoves, isGameOver } from './engine'

export type Difficulty = 'easy' | 'medium' | 'hard'

/** Map NPC difficulty tier (1-5) to AI strategy. */
export function getDifficultyForTier(tier: DifficultyTier): Difficulty {
  if (tier <= 1) return 'easy'
  if (tier <= 3) return 'medium'
  return 'hard'
}

/** Count cells owned by player (0–9). */
function countOwned(state: GameState, player: PlayerId): number {
  let n = 0
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const cell = state.board[r][c]
      if (cell && cell.owner === player) n++
    }
  }
  return n
}

/** Evaluate state for AI (player 1): positive = good for AI. */
function evaluate(state: GameState): number {
  if (state.phase === 'ended' && state.winner !== null) {
    if (state.winner === 1) return 100
    if (state.winner === 0) return -100
    return 0
  }
  return countOwned(state, 1) - countOwned(state, 0)
}

/** Pick a random valid move. */
function easyMove(state: GameState): { cardIndex: number; row: number; col: number } {
  const moves = getValidMoves(state)
  if (moves.length === 0) throw new Error('No valid moves')
  return moves[Math.floor(Math.random() * moves.length)]
}

/** Pick move that maximizes immediate board score for AI (player 1). */
function mediumMove(state: GameState): { cardIndex: number; row: number; col: number } {
  const moves = getValidMoves(state)
  if (moves.length === 0) throw new Error('No valid moves')
  let bestScore = -Infinity
  let bestMove = moves[0]
  for (const move of moves) {
    const next = placeCard(state, 1, move.cardIndex, move.row, move.col)
    const score = evaluate(next)
    if (score > bestScore) {
      bestScore = score
      bestMove = move
    }
  }
  return bestMove
}

/** Minimax with alpha-beta pruning. Maximises for player 1 (AI), minimises for player 0 (human). */
function minimax(state: GameState, depth: number, alpha: number, beta: number): number {
  if (depth === 0 || isGameOver(state)) return evaluate(state)
  const moves = getValidMoves(state)
  if (moves.length === 0) return evaluate(state)
  const player = state.turn
  if (player === 1) {
    let best = -Infinity
    for (const move of moves) {
      const next = placeCard(state, 1, move.cardIndex, move.row, move.col)
      const score = minimax(next, depth - 1, alpha, beta)
      if (score > best) best = score
      if (best > alpha) alpha = best
      if (beta <= alpha) break
    }
    return best
  } else {
    let best = Infinity
    for (const move of moves) {
      const next = placeCard(state, 0, move.cardIndex, move.row, move.col)
      const score = minimax(next, depth - 1, alpha, beta)
      if (score < best) best = score
      if (best < beta) beta = best
      if (beta <= alpha) break
    }
    return best
  }
}

/** Dynamic depth: search deeper as game progresses and branching factor shrinks. */
function calcDepth(state: GameState): number {
  const cardsLeft = state.hands[0].length + state.hands[1].length
  if (cardsLeft <= 4) return 6
  if (cardsLeft <= 6) return 5
  return 4
}

/** Pick move using minimax with alpha-beta pruning (4–6-ply depending on cards remaining). */
function hardMove(state: GameState): { cardIndex: number; row: number; col: number } {
  const moves = getValidMoves(state)
  if (moves.length === 0) throw new Error('No valid moves')
  const depth = calcDepth(state)
  let bestScore = -Infinity
  let bestMove = moves[0]
  for (const move of moves) {
    const next = placeCard(state, 1, move.cardIndex, move.row, move.col)
    const score = minimax(next, depth - 1, bestScore, Infinity)
    if (score > bestScore) {
      bestScore = score
      bestMove = move
    }
  }
  return bestMove
}

/**
 * Return a valid move for the AI (player 1). state.turn must be 1 and phase === 'playing'.
 */
export function getAiMove(
  state: GameState,
  difficulty: Difficulty
): { cardIndex: number; row: number; col: number } {
  if (state.phase !== 'playing' || state.turn !== 1) {
    throw new Error('AI can only move when it is player 1 and game is playing')
  }
  const moves = getValidMoves(state)
  if (moves.length === 0) throw new Error('No valid moves for AI')
  switch (difficulty) {
    case 'easy':
      return easyMove(state)
    case 'medium':
      return mediumMove(state)
    case 'hard':
      return hardMove(state)
    default:
      return easyMove(state)
  }
}
