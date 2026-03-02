/** Triple Triad engine — authoritative server copy. Mirrors frontend/src/game/engine.ts exactly. */
const ROWS = 3
const COLS = 3
const HAND_SIZE = 5

const NEIGHBORS = [[-1, 0], [0, 1], [1, 0], [0, -1]]
const OUR_SIDE  = [0, 1, 2, 3]
const THEIR_SIDE = [2, 3, 0, 1]

const ALL_ELEMENTS = ['Earth', 'Fire', 'Water', 'Poison', 'Holy', 'Lightning', 'Wind', 'Ice']

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getEffectiveRanks(card, row, col, boardElements) {
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

function getRankFromEffective(effective, side) {
  const ranks = [effective.top, effective.right, effective.bottom, effective.left]
  return ranks[side] ?? 0
}

function pickRandom(arr, n) {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, n)
}

function generateBoardElements(activeRules) {
  const grid = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => null)
  )
  if (!activeRules.includes('Elemental')) return grid

  const count = 1 + Math.floor(Math.random() * 3)
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

function emptyBoard() {
  return Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => null))
}

function deepCopyBoard(board) {
  return board.map(r => r.map(c => (c ? { ...c } : null)))
}

// ---------------------------------------------------------------------------
// Capture rules
// ---------------------------------------------------------------------------

function applyBasicCaptures(board, card, owner, row, col, boardElements) {
  const opponent = owner === 0 ? 1 : 0
  const captured = []
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

function applySameRule(board, card, owner, row, col, activeRules, boardElements) {
  const opponent = owner === 0 ? 1 : 0
  const sameWall = activeRules.includes('Same Wall')
  const placedRanks = getEffectiveRanks(card, row, col, boardElements)
  const matches = []

  NEIGHBORS.forEach(([dr, dc], i) => {
    const nr = row + dr
    const nc = col + dc
    const ourRank = getRankFromEffective(placedRanks, OUR_SIDE[i])
    const outOfBounds = nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS

    if (outOfBounds) {
      if (sameWall && ourRank === 10) matches.push({ nr: -1, nc: -1, dirIdx: i })
      return
    }

    const cell = board[nr][nc]
    if (!cell) return
    const theirRanks = getEffectiveRanks(cell.card, nr, nc, boardElements)
    const theirRank = getRankFromEffective(theirRanks, THEIR_SIDE[i])
    if (ourRank === theirRank) matches.push({ nr, nc, dirIdx: i })
  })

  if (matches.length < 2) return []

  const captured = []
  for (const { nr, nc } of matches) {
    if (nr < 0) continue
    const cell = board[nr][nc]
    if (cell && cell.owner === opponent) {
      cell.owner = owner
      captured.push({ row: nr, col: nc })
    }
  }
  return captured
}

function applyPlusRule(board, card, owner, row, col, boardElements) {
  const opponent = owner === 0 ? 1 : 0
  const placedRanks = getEffectiveRanks(card, row, col, boardElements)
  const sideSums = []

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

  const sumCounts = new Map()
  for (const { sum } of sideSums) sumCounts.set(sum, (sumCounts.get(sum) ?? 0) + 1)
  const validSums = new Set()
  for (const [sum, count] of sumCounts) if (count >= 2) validSums.add(sum)
  if (validSums.size === 0) return []

  const captured = []
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

function applyComboRule(board, initialCaptures, owner, boardElements) {
  const visited = new Set(initialCaptures.map(p => `${p.row},${p.col}`))
  const queue = [...initialCaptures]
  const allCombo = []

  while (queue.length > 0) {
    const pos = queue.shift()
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

export function createGame(deck0, deck1, firstPlayer, activeRules = []) {
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

export function placeCard(state, player, cardIndex, row, col) {
  if (state.phase !== 'playing') throw new Error('Game is not in playing phase')
  if (player !== state.turn) throw new Error('Not your turn')
  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) throw new Error('Invalid cell')
  if (state.board[row][col] !== null) throw new Error('Cell already occupied')
  const hand = state.hands[player]
  if (cardIndex < 0 || cardIndex >= hand.length) throw new Error('Invalid card index')

  const card = hand[cardIndex]
  const newHand = hand.filter((_, i) => i !== cardIndex)
  const newHands = player === 0 ? [newHand, state.hands[1]] : [state.hands[0], newHand]

  const board = deepCopyBoard(state.board)
  board[row][col] = { card, owner: player }

  const { activeRules, boardElements } = state
  const allCaptures = []

  const basicCaptures = applyBasicCaptures(board, card, player, row, col, boardElements)
  allCaptures.push(...basicCaptures)

  let sameCaptures = []
  if (activeRules.includes('Same')) {
    sameCaptures = applySameRule(board, card, player, row, col, activeRules, boardElements)
    allCaptures.push(...sameCaptures)
  }

  let plusCaptures = []
  if (activeRules.includes('Plus')) {
    plusCaptures = applyPlusRule(board, card, player, row, col, boardElements)
    allCaptures.push(...plusCaptures)
  }

  if (activeRules.includes('Combo')) {
    const specialCaptures = [...sameCaptures, ...plusCaptures]
    if (specialCaptures.length > 0) {
      const comboCaptures = applyComboRule(board, specialCaptures, player, boardElements)
      allCaptures.push(...comboCaptures)
    }
  }

  const boardFull = board.flat().every(c => c !== null)
  const nextTurn = player === 0 ? 1 : 0

  if (!boardFull) {
    return {
      board, hands: newHands, turn: nextTurn,
      firstPlayer: state.firstPlayer, phase: 'playing', winner: null,
      activeRules, lastCaptures: allCaptures, boardElements,
      suddenDeathRound: state.suddenDeathRound,
    }
  }

  const result = computeWinner(board, newHands)

  if (result === 'draw' && activeRules.includes('Sudden Death')) {
    const boardCards = board.flat().map(c => c.card)
    const allCards = [...boardCards, ...newHands[0], ...newHands[1]]
    const shuffled = pickRandom(allCards, allCards.length)
    const newHand0 = shuffled.slice(0, HAND_SIZE)
    const newHand1 = shuffled.slice(HAND_SIZE, HAND_SIZE * 2)
    const newFirstPlayer = state.firstPlayer === 0 ? 1 : 0
    return {
      board: emptyBoard(), hands: [newHand0, newHand1],
      turn: newFirstPlayer, firstPlayer: newFirstPlayer,
      phase: 'sudden_death', winner: null,
      activeRules, lastCaptures: allCaptures,
      boardElements: generateBoardElements(activeRules),
      suddenDeathRound: state.suddenDeathRound + 1,
    }
  }

  return {
    board, hands: newHands, turn: nextTurn,
    firstPlayer: state.firstPlayer, phase: 'ended', winner: result,
    activeRules, lastCaptures: allCaptures, boardElements,
    suddenDeathRound: state.suddenDeathRound,
  }
}

export function continueSuddenDeath(state) {
  if (state.phase !== 'sudden_death') throw new Error('Not in sudden_death phase')
  return { ...state, phase: 'playing' }
}

function computeWinner(board, hands) {
  let count0 = 0, count1 = 0
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

export function getValidMoves(state) {
  if (state.phase !== 'playing') return []
  const hand = state.hands[state.turn]
  const moves = []
  for (let cardIndex = 0; cardIndex < hand.length; cardIndex++) {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (state.board[r][c] === null) moves.push({ cardIndex, row: r, col: c })
      }
    }
  }
  return moves
}

export function getWinner(state) { return state.winner }
export function isGameOver(state) { return state.phase === 'ended' }

export { ROWS, COLS, HAND_SIZE }
