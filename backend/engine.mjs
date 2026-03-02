/** Minimal Triple Triad engine for server (authoritative). Ranks: top, right, bottom, left. */
const ROWS = 3
const COLS = 3
const HAND_SIZE = 5
const NEIGHBORS = [[-1, 0], [0, 1], [1, 0], [0, -1]]
const OUR_SIDE = [0, 1, 2, 3]
const THEIR_SIDE = [2, 3, 0, 1]

function getRank(card, side) {
  const ranks = [card.top, card.right, card.bottom, card.left]
  return ranks[side] ?? 0
}

function applyCaptures(board, card, owner, row, col) {
  const opponent = owner === 0 ? 1 : 0
  NEIGHBORS.forEach(([dr, dc], i) => {
    const nr = row + dr
    const nc = col + dc
    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) return
    const cell = board[nr][nc]
    if (!cell || cell.owner !== opponent) return
    const ourRank = getRank(card, OUR_SIDE[i])
    const theirRank = getRank(cell.card, THEIR_SIDE[i])
    if (ourRank > theirRank) cell.owner = owner
  })
}

export function createGame(deck0, deck1, firstPlayer) {
  const hand0 = deck0.slice(0, HAND_SIZE)
  const hand1 = deck1.slice(0, HAND_SIZE)
  const board = Array.from({ length: ROWS }, () =>
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

function computeWinner(board, hands) {
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

export function placeCard(state, player, cardIndex, row, col) {
  if (state.phase !== 'playing') throw new Error('Game ended')
  if (player !== state.turn) throw new Error('Not your turn')
  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) throw new Error('Invalid cell')
  if (state.board[row][col] !== null) throw new Error('Cell occupied')
  const hand = state.hands[player]
  if (cardIndex < 0 || cardIndex >= hand.length) throw new Error('Invalid card index')

  const card = hand[cardIndex]
  const newHand = hand.filter((_, i) => i !== cardIndex)
  const newHands = player === 0 ? [newHand, state.hands[1]] : [state.hands[0], newHand]

  const board = state.board.map((r) => r.map((c) => (c ? { ...c } : null)))
  board[row][col] = { card, owner: player }
  applyCaptures(board, card, player, row, col)

  const nextTurn = player === 0 ? 1 : 0
  const boardFull = board.flat().every((c) => c !== null)
  const phase = boardFull ? 'ended' : 'playing'
  const winner = phase === 'ended' ? computeWinner(board, newHands) : null

  return {
    board,
    hands: newHands,
    turn: nextTurn,
    firstPlayer: state.firstPlayer,
    phase,
    winner,
  }
}
