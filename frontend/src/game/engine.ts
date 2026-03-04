import type { Card, Element } from '../types/card'
import type { SpecialRule } from '../types/world'
import type { GameState, PlayerId, GameResult, MaybeBoardCell } from './types'

const ROWS = 3
const COLS = 3
const HAND_SIZE = 5

/** Neighbor direction: [dr, dc]. Up = [-1,0], Right = [0,1], Down = [1,0], Left = [0,-1]. */
const NEIGHBORS: [number, number][] = [[-1, 0], [0, 1], [1, 0], [0, -1]]
/** For each direction index, which side of OUR card faces that neighbor: top=0, right=1, bottom=2, left=3. */
const OUR_SIDE: number[] = [0, 1, 2, 3]
/** For each direction index, which side of THEIR card faces us. */
const THEIR_SIDE: number[] = [2, 3, 0, 1]

const ALL_ELEMENTS: Element[] = ['Earth', 'Fire', 'Water', 'Poison', 'Holy', 'Lightning', 'Wind', 'Ice']

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns ranks for a card modified by the Elemental rule at its board position. */
function getEffectiveRanks(
  card: Card,
  row: number,
  col: number,
  boardElements: (Element | null)[][]
): { top: number; right: number; bottom: number; left: number } {
  const el = boardElements[row]?.[col] ?? null
  if (el === null) return { top: card.top, right: card.right, bottom: card.bottom, left: card.left }
  const delta = el === card.element ? 1 : -1
  return {
    top:    Math.max(1, Math.min(10, card.top    + delta)),
    right:  Math.max(1, Math.min(10, card.right  + delta)),
    bottom: Math.max(1, Math.min(10, card.bottom + delta)),
    left:   Math.max(1, Math.min(10, card.left   + delta)),
  }
}

function getRankFromEffective(effective: ReturnType<typeof getEffectiveRanks>, side: number): number {
  const ranks = [effective.top, effective.right, effective.bottom, effective.left]
  return ranks[side] ?? 0
}

/**
 * Returns n randomly selected items from arr without replacement (Fisher-Yates).
 * If n >= arr.length, returns a shuffled copy of the full array.
 */
function pickRandom<T>(arr: T[], n: number): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, n)
}

/** Generates a 3x3 board element grid. Assigns 1–3 random cells random elements if Elemental is active. */
function generateBoardElements(activeRules: SpecialRule[]): (Element | null)[][] {
  const grid: (Element | null)[][] = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => null)
  )
  if (!activeRules.includes('Elemental')) return grid

  const count = 1 + Math.floor(Math.random() * 3) // 1, 2, or 3
  const positions = pickRandom(
    Array.from({ length: ROWS * COLS }, (_, i) => i),
    count
  )
  for (const pos of positions) {
    const r = Math.floor(pos / COLS)
    const c = pos % COLS
    grid[r][c] = ALL_ELEMENTS[Math.floor(Math.random() * ALL_ELEMENTS.length)]
  }
  return grid
}

function emptyBoard(): MaybeBoardCell[][] {
  return Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => null))
}

function deepCopyBoard(board: MaybeBoardCell[][]): MaybeBoardCell[][] {
  return board.map(r => r.map(c => (c ? { ...c } : null)))
}

// ---------------------------------------------------------------------------
// Capture rules
// ---------------------------------------------------------------------------

/**
 * Basic capture: placed card flips adjacent opponent cards where its touching rank
 * is strictly higher than the opponent's touching rank (using Elemental effective ranks).
 * Mutates board in place. Returns captured positions.
 */
function applyBasicCaptures(
  board: MaybeBoardCell[][],
  card: Card,
  owner: PlayerId,
  row: number,
  col: number,
  boardElements: (Element | null)[][]
): { row: number; col: number }[] {
  const opponent: PlayerId = owner === 0 ? 1 : 0
  const captured: { row: number; col: number }[] = []
  const placedRanks = getEffectiveRanks(card, row, col, boardElements)

  NEIGHBORS.forEach(([dr, dc], i) => {
    const nr = row + dr
    const nc = col + dc
    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) return
    const cell = board[nr][nc]
    if (!cell || cell.owner !== opponent) return
    const ourRank = getRankFromEffective(placedRanks, OUR_SIDE[i])
    const theirRanks = getEffectiveRanks(cell.card, nr, nc, boardElements)
    const theirRank = getRankFromEffective(theirRanks, THEIR_SIDE[i])
    if (ourRank > theirRank) {
      cell.owner = owner
      captured.push({ row: nr, col: nc })
    }
  })
  return captured
}

/**
 * Same rule: if 2+ adjacent sides have equal touching ranks (using effective ranks),
 * captures those opponent cards. Supports Same Wall (out-of-bounds edge = rank 10).
 * Mutates board in place. Returns captured positions.
 */
function applySameRule(
  board: MaybeBoardCell[][],
  card: Card,
  owner: PlayerId,
  row: number,
  col: number,
  activeRules: SpecialRule[],
  boardElements: (Element | null)[][]
): { row: number; col: number }[] {
  const opponent: PlayerId = owner === 0 ? 1 : 0
  const sameWall = activeRules.includes('Same Wall')
  const placedRanks = getEffectiveRanks(card, row, col, boardElements)

  // Collect matching sides (including walls)
  const matches: { nr: number; nc: number; dirIdx: number }[] = []

  NEIGHBORS.forEach(([dr, dc], i) => {
    const nr = row + dr
    const nc = col + dc
    const ourRank = getRankFromEffective(placedRanks, OUR_SIDE[i])
    const outOfBounds = nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS

    if (outOfBounds) {
      // Same Wall: edge counts as rank 10
      if (sameWall && ourRank === 10) {
        matches.push({ nr: -1, nc: -1, dirIdx: i }) // sentinel for wall match
      }
      return
    }

    const cell = board[nr][nc]
    if (!cell) return // empty cell, not a wall match

    const theirRanks = getEffectiveRanks(cell.card, nr, nc, boardElements)
    const theirRank = getRankFromEffective(theirRanks, THEIR_SIDE[i])
    if (ourRank === theirRank) {
      matches.push({ nr, nc, dirIdx: i })
    }
  })

  if (matches.length < 2) return []

  // Capture only actual opponent cards (not wall matches)
  const captured: { row: number; col: number }[] = []
  for (const { nr, nc } of matches) {
    if (nr < 0) continue // wall match — no cell to capture
    const cell = board[nr][nc]
    if (cell && cell.owner === opponent) {
      cell.owner = owner
      captured.push({ row: nr, col: nc })
    }
  }
  return captured
}

/**
 * Plus rule: if 2+ adjacent sides share the same sum of touching ranks,
 * captures opponent cards on those sides.
 * Mutates board in place. Returns captured positions.
 */
function applyPlusRule(
  board: MaybeBoardCell[][],
  card: Card,
  owner: PlayerId,
  row: number,
  col: number,
  boardElements: (Element | null)[][]
): { row: number; col: number }[] {
  const opponent: PlayerId = owner === 0 ? 1 : 0
  const placedRanks = getEffectiveRanks(card, row, col, boardElements)

  // Collect sums for all occupied neighbours
  const sideSums: { nr: number; nc: number; sum: number }[] = []

  NEIGHBORS.forEach(([dr, dc], i) => {
    const nr = row + dr
    const nc = col + dc
    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) return
    const cell = board[nr][nc]
    if (!cell) return
    const ourRank = getRankFromEffective(placedRanks, OUR_SIDE[i])
    const theirRanks = getEffectiveRanks(cell.card, nr, nc, boardElements)
    const theirRank = getRankFromEffective(theirRanks, THEIR_SIDE[i])
    sideSums.push({ nr, nc, sum: ourRank + theirRank })
  })

  // Find sums that appear 2+ times
  const sumCounts = new Map<number, number>()
  for (const { sum } of sideSums) {
    sumCounts.set(sum, (sumCounts.get(sum) ?? 0) + 1)
  }
  const validSums = new Set<number>()
  for (const [sum, count] of sumCounts) {
    if (count >= 2) validSums.add(sum)
  }
  if (validSums.size === 0) return []

  // Capture opponent cards on matching-sum sides
  const captured: { row: number; col: number }[] = []
  for (const { nr, nc, sum } of sideSums) {
    if (!validSums.has(sum)) continue
    const cell = board[nr][nc]
    if (cell && cell.owner === opponent) {
      cell.owner = owner
      captured.push({ row: nr, col: nc })
    }
  }
  return captured
}

/**
 * Combo rule: for each card newly captured by Same/Plus, apply basic capture
 * as if that card was just placed. Cascades until no new captures occur.
 * Mutates board in place. Returns all additionally captured positions.
 */
function applyComboRule(
  board: MaybeBoardCell[][],
  initialCaptures: { row: number; col: number }[],
  owner: PlayerId,
  boardElements: (Element | null)[][]
): { row: number; col: number }[] {
  const visited = new Set<string>(initialCaptures.map(p => `${p.row},${p.col}`))
  const queue = [...initialCaptures]
  const allCombo: { row: number; col: number }[] = []

  while (queue.length > 0) {
    const pos = queue.shift()!
    const cell = board[pos.row][pos.col]
    if (!cell) continue

    const newCaptures = applyBasicCaptures(board, cell.card, owner, pos.row, pos.col, boardElements)
    for (const cap of newCaptures) {
      const key = `${cap.row},${cap.col}`
      if (!visited.has(key)) {
        visited.add(key)
        queue.push(cap)
        allCombo.push(cap)
      }
    }
  }
  return allCombo
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create initial game state.
 * @param deck0 Player 0's deck (or full pool if Random rule active)
 * @param deck1 Player 1's deck (or full pool if Random rule active)
 * @param firstPlayer Who goes first
 * @param activeRules Special rules active for this game
 */
export function createGame(
  deck0: Card[],
  deck1: Card[],
  firstPlayer: PlayerId,
  activeRules: SpecialRule[] = []
): GameState {
  const hand0 = activeRules.includes('Random') ? pickRandom(deck0, HAND_SIZE) : deck0.slice(0, HAND_SIZE)
  const hand1 = activeRules.includes('Random') ? pickRandom(deck1, HAND_SIZE) : deck1.slice(0, HAND_SIZE)
  const boardElements = generateBoardElements(activeRules)
  return {
    board: emptyBoard(),
    hands: [hand0, hand1],
    turn: firstPlayer,
    firstPlayer,
    phase: 'playing',
    winner: null,
    activeRules,
    lastCaptures: [],
    boardElements,
    suddenDeathRound: 0,
  }
}

/**
 * Place a card from the current player's hand onto the board.
 * Runs the full capture pipeline (Basic → Same → Plus → Combo).
 * Handles Sudden Death redistribution on a draw.
 * Returns new state (throws on invalid move).
 */
export function placeCard(
  state: GameState,
  player: PlayerId,
  cardIndex: number,
  row: number,
  col: number
): GameState {
  if (state.phase !== 'playing') throw new Error('Game is not in playing phase')
  if (player !== state.turn) throw new Error('Not your turn')
  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) throw new Error('Invalid cell')
  if (state.board[row][col] !== null) throw new Error('Cell already occupied')
  const hand = state.hands[player]
  if (cardIndex < 0 || cardIndex >= hand.length) throw new Error('Invalid card index')

  const card = hand[cardIndex]
  const newHand = hand.filter((_, i) => i !== cardIndex)
  const newHands: [Card[], Card[]] =
    player === 0 ? [newHand, state.hands[1]] : [state.hands[0], newHand]

  const board = deepCopyBoard(state.board)
  board[row][col] = { card, owner: player, placedBy: player }

  const { activeRules, boardElements } = state
  const allCaptures: { row: number; col: number }[] = []

  // 1. Basic captures
  const basicCaptures = applyBasicCaptures(board, card, player, row, col, boardElements)
  allCaptures.push(...basicCaptures)

  // 2. Same rule
  let sameCaptures: { row: number; col: number }[] = []
  if (activeRules.includes('Same')) {
    sameCaptures = applySameRule(board, card, player, row, col, activeRules, boardElements)
    allCaptures.push(...sameCaptures)
  }

  // 3. Plus rule
  let plusCaptures: { row: number; col: number }[] = []
  if (activeRules.includes('Plus')) {
    plusCaptures = applyPlusRule(board, card, player, row, col, boardElements)
    allCaptures.push(...plusCaptures)
  }

  // 4. Combo rule (triggered by Same/Plus captures)
  if (activeRules.includes('Combo')) {
    const specialCaptures = [...sameCaptures, ...plusCaptures]
    if (specialCaptures.length > 0) {
      const comboCaptures = applyComboRule(board, specialCaptures, player, boardElements)
      allCaptures.push(...comboCaptures)
    }
  }

  const boardFull = board.flat().every(c => c !== null)
  const nextTurn: PlayerId = player === 0 ? 1 : 0

  if (!boardFull) {
    return {
      board,
      hands: newHands,
      turn: nextTurn,
      firstPlayer: state.firstPlayer,
      phase: 'playing',
      winner: null,
      activeRules,
      lastCaptures: allCaptures,
      boardElements,
      suddenDeathRound: state.suddenDeathRound,
    }
  }

  // Board full — compute result
  const result = computeWinner(board, newHands)

  if (result === 'draw' && activeRules.includes('Sudden Death')) {
    // Collect all 10 cards: 9 from board + 1 remaining in the hand of whoever went second
    const boardCards = board.flat().map(c => c!.card)
    const allCards = [...boardCards, ...newHands[0], ...newHands[1]]
    const shuffled = pickRandom(allCards, allCards.length)
    const newHand0 = shuffled.slice(0, HAND_SIZE)
    const newHand1 = shuffled.slice(HAND_SIZE, HAND_SIZE * 2)
    const newFirstPlayer: PlayerId = state.firstPlayer === 0 ? 1 : 0

    return {
      board: emptyBoard(),
      hands: [newHand0, newHand1],
      turn: newFirstPlayer,
      firstPlayer: newFirstPlayer,
      phase: 'sudden_death',
      winner: null,
      activeRules,
      lastCaptures: allCaptures,
      boardElements: generateBoardElements(activeRules),
      suddenDeathRound: state.suddenDeathRound + 1,
    }
  }

  return {
    board,
    hands: newHands,
    turn: nextTurn,
    firstPlayer: state.firstPlayer,
    phase: 'ended',
    winner: result,
    activeRules,
    lastCaptures: allCaptures,
    boardElements,
    suddenDeathRound: state.suddenDeathRound,
  }
}

/**
 * After a Sudden Death redistribution (phase === 'sudden_death'), call this to
 * begin the next round. Transitions phase back to 'playing'.
 */
export function continueSuddenDeath(state: GameState): GameState {
  if (state.phase !== 'sudden_death') throw new Error('Not in sudden_death phase')
  return { ...state, phase: 'playing' }
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

/** All valid (cardIndex, row, col) for the current turn. */
export function getValidMoves(state: GameState): { cardIndex: number; row: number; col: number }[] {
  if (state.phase !== 'playing') return []
  const hand = state.hands[state.turn]
  const moves: { cardIndex: number; row: number; col: number }[] = []
  for (let cardIndex = 0; cardIndex < hand.length; cardIndex++) {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (state.board[r][c] === null) moves.push({ cardIndex, row: r, col: c })
      }
    }
  }
  return moves
}

export function getWinner(state: GameState): GameResult | null {
  return state.winner
}

export function isGameOver(state: GameState): boolean {
  return state.phase === 'ended'
}

/**
 * After a game ends, returns the cards each player captured
 * (cards on the board now owned by them but originally placed by the opponent).
 */
export function getCapturedCards(state: GameState): {
  capturedByPlayer0: Card[]
  capturedByPlayer1: Card[]
} {
  const capturedByPlayer0: Card[] = []
  const capturedByPlayer1: Card[] = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = state.board[r][c]
      if (!cell) continue
      if (cell.owner === 0 && cell.placedBy === 1) {
        capturedByPlayer0.push(cell.card)
      } else if (cell.owner === 1 && cell.placedBy === 0) {
        capturedByPlayer1.push(cell.card)
      }
    }
  }
  return { capturedByPlayer0, capturedByPlayer1 }
}

export { ROWS, COLS, HAND_SIZE }
