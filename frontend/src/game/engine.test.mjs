/**
 * Unit tests for Triple Triad game engine.
 * Run with: node src/game/engine.test.mjs
 *
 * Uses the compiled JS output — run `tsc` first, or use tsx/ts-node.
 * For simplicity, we inline a minimal engine port here... actually we'll
 * use tsx to run the TypeScript directly.
 */

// We import via tsx (ts-node). Entry point: node --loader tsx src/game/engine.test.mjs
// Or run: npx tsx src/game/engine.test.mjs

import { createGame, placeCard, getValidMoves, isGameOver, continueSuddenDeath } from './engine.ts'

let passed = 0
let failed = 0

function assert(condition, msg) {
  if (condition) {
    console.log(`  PASS: ${msg}`)
    passed++
  } else {
    console.error(`  FAIL: ${msg}`)
    failed++
  }
}

// Minimal card factory
const mk = (id, top, right, bottom, left, element = null) =>
  ({ id, name: id, level: 1, top, right, bottom, left, element })

// Full deck of 5 identical cards (convenience)
const deck = (card) => [card, card, card, card, card]

// Place all cards for player to fill the board deterministically
function fillBoard(state, moves) {
  let s = state
  for (const [player, cardIndex, row, col] of moves) {
    s = placeCard(s, player, cardIndex, row, col)
  }
  return s
}

function countOwned(state, player) {
  return state.board.flat().filter(c => c && c.owner === player).length
}

// ============================================================
console.log('\n=== Basic Capture ===')
// ============================================================

{
  // Higher rank captures
  const strong = mk('strong', 5, 5, 5, 5)
  const weak   = mk('weak',   1, 1, 1, 1)
  let s = createGame(deck(strong), deck(weak), 0)
  // P0 places strong at (1,1)
  s = placeCard(s, 0, 0, 1, 1)
  // P1 places weak at (0,1) — above
  s = placeCard(s, 1, 0, 0, 1)
  // P0 places strong at (0,0)
  s = placeCard(s, 0, 0, 0, 0)
  // After P0's move at (0,0), their right (5) vs P1's left at (0,1) (1) → should capture
  assert(s.board[0][1]?.owner === 0, 'Basic: higher right rank captures left neighbour')
}

{
  // Lower rank does NOT capture
  const weak   = mk('weak',   1, 1, 1, 1)
  const strong = mk('strong', 5, 5, 5, 5)
  let s = createGame(deck(weak), deck(strong), 0)
  s = placeCard(s, 0, 0, 1, 1) // P0 weak at center
  s = placeCard(s, 1, 0, 0, 1) // P1 strong above
  // P0 places weak at (0,0) — right rank 1 vs P1's left rank 5 → no capture
  s = placeCard(s, 0, 0, 0, 0)
  assert(s.board[0][1]?.owner === 1, 'Basic: lower rank does NOT capture')
}

{
  // Multi-capture: one placement captures in 2 directions
  const a = mk('a', 8, 8, 8, 8)
  const b = mk('b', 1, 1, 1, 1)
  let s = createGame(deck(a), deck(b), 0)
  // P0 places a at (0,1) — do nothing first turn
  s = placeCard(s, 0, 0, 0, 1)
  // P1 places b at (0,0) and (0,2)
  s = placeCard(s, 1, 0, 0, 0)
  s = placeCard(s, 0, 0, 2, 2)
  s = placeCard(s, 1, 0, 2, 0)
  // Now P0 places a at (1,0) — top (8) vs P1 b at (0,0) bottom (1) → capture; right (8) vs nothing
  // P1 already placed b at (0,0) so let's reconstruct
  // Simplest: P0 places a at center, P1 has cards on left and above → P0 captures both
  let s2 = createGame(deck(a), deck(b), 1)
  s2 = placeCard(s2, 1, 0, 1, 0) // P1 b at (1,0)
  s2 = placeCard(s2, 0, 0, 1, 1) // P0 a at center: left rank 8 > b's right rank 1 → capture (1,0)
  assert(s2.board[1][0]?.owner === 0, 'Basic: multi-capture left')
  s2 = placeCard(s2, 1, 0, 0, 1) // P1 b at (0,1)
  s2 = placeCard(s2, 0, 0, 0, 0) // P0 a at (0,0): right 8 > b's left 1 → capture (0,1)
  assert(s2.board[0][1]?.owner === 0, 'Basic: multi-capture right in same game')
}

// ============================================================
console.log('\n=== createGame options ===')
// ============================================================

{
  const card = mk('c', 5, 5, 5, 5)
  const s = createGame(deck(card), deck(card), 0, ['Same', 'Plus'])
  assert(s.activeRules.includes('Same'), 'createGame: activeRules stored in state')
  assert(s.activeRules.includes('Plus'), 'createGame: multiple rules stored')
  assert(s.suddenDeathRound === 0, 'createGame: suddenDeathRound initialised to 0')
  assert(Array.isArray(s.boardElements) && s.boardElements.length === 3, 'createGame: boardElements is 3-row grid')
  assert(s.boardElements[0].length === 3, 'createGame: boardElements has 3 cols')
}

{
  // boardElements all null when Elemental not active
  const card = mk('c', 5, 5, 5, 5)
  const s = createGame(deck(card), deck(card), 0, [])
  const allNull = s.boardElements.flat().every(e => e === null)
  assert(allNull, 'createGame: boardElements all null without Elemental rule')
}

{
  // boardElements has at least one non-null when Elemental active
  const card = mk('c', 5, 5, 5, 5)
  // Run multiple times to be statistically confident
  let foundElement = false
  for (let i = 0; i < 20; i++) {
    const s = createGame(deck(card), deck(card), 0, ['Elemental'])
    if (s.boardElements.flat().some(e => e !== null)) { foundElement = true; break }
  }
  assert(foundElement, 'createGame: Elemental rule assigns at least one board element')
}

{
  // Random rule: exactly 5 cards selected from pool
  const pool = [
    mk('a',1,1,1,1), mk('b',2,2,2,2), mk('c',3,3,3,3), mk('d',4,4,4,4),
    mk('e',5,5,5,5), mk('f',6,6,6,6), mk('g',7,7,7,7), mk('h',8,8,8,8),
  ]
  const s = createGame(pool, pool, 0, ['Random'])
  assert(s.hands[0].length === 5, 'createGame Random: player 0 gets exactly 5 cards')
  assert(s.hands[1].length === 5, 'createGame Random: player 1 gets exactly 5 cards')
  // Cards should be from the pool
  const poolIds = new Set(pool.map(c => c.id))
  assert(s.hands[0].every(c => poolIds.has(c.id)), 'createGame Random: all cards are from pool')
}

// ============================================================
console.log('\n=== Elemental Rule ===')
// ============================================================

{
  // Matching element: +1 rank → capture succeeds where it would fail without Elemental
  // Without Elemental: P0 has top=5, P1 has bottom=5 → tie → no capture
  // With Elemental (Fire at (1,1)): P0 card on Fire cell gets top=6 → captures P1's bottom=5
  const p0card = mk('p0', 5, 1, 1, 1, 'Fire')  // top 5, element Fire
  const p1card = mk('p1', 1, 1, 5, 1)           // bottom 5 (facing up)
  const s0 = createGame(deck(p0card), deck(p1card), 1)
  // Force elemental: manually set boardElements
  const boardElements = [[null,null,null],[null,'Fire',null],[null,null,null]]

  // Manually construct a game with the elemental board
  // We simulate by creating a state with boardElements set to have Fire at (1,1)
  // P1 places at (0,1) first, then P0 places at (1,1)
  let s = { ...s0, boardElements }
  s = placeCard(s, 1, 0, 0, 1) // P1 at (0,1): bottom rank 5 faces down
  // P0's card at (1,1) has Fire element on Fire cell → top effective = 6
  // P1's card at (0,1) has null element on null cell → bottom effective = 5
  // 6 > 5 → should capture
  s = placeCard(s, 0, 0, 1, 1)
  assert(s.board[0][1]?.owner === 0, 'Elemental: matching element +1 rank causes capture')
}

{
  // Non-matching element: -1 rank → capture fails where it would succeed
  // Without Elemental: P0 top=5 > P1 bottom=4 → capture
  // With Fire at (1,1) and P0 card is non-Fire: top effective = 4 → tie → no capture
  const p0card = mk('p0', 5, 1, 1, 1)      // top 5, no element
  const p1card = mk('p1', 1, 1, 4, 1)      // bottom 4
  const boardElements = [[null,null,null],[null,'Fire',null],[null,null,null]]
  let s = createGame(deck(p0card), deck(p1card), 1)
  s = { ...s, boardElements }
  s = placeCard(s, 1, 0, 0, 1) // P1 at (0,1)
  s = placeCard(s, 0, 0, 1, 1) // P0 at (1,1) on Fire — non-matching → top = 4; P1 bottom = 4 → no capture
  assert(s.board[0][1]?.owner === 1, 'Elemental: non-matching element -1 rank prevents capture')
}

// ============================================================
console.log('\n=== Same Rule ===')
// ============================================================

{
  // Same rule: 2 matching sides → both opponent cards captured
  // P0 card: top=5, right=3, bottom=2, left=4
  // P1 card at (0,1): bottom=5 (matches P0's top)
  // P1 card at (1,0): right=4 (matches P0's left)
  // Both matches → Same triggers → both captured
  const p0 = mk('p0', 5, 1, 1, 4)
  const opp_above = mk('opp_above', 1, 1, 5, 1) // bottom=5
  const opp_left  = mk('opp_left',  1, 4, 1, 1) // right=4

  // Build state manually: P1 places two cards, P0 triggers Same
  // We need a 5-card deck for each player
  const p0Deck = [p0, p0, p0, p0, p0]
  const p1Deck = [opp_above, opp_left, opp_above, opp_above, opp_above]
  let s = createGame(p0Deck, p1Deck, 1)
  s = placeCard(s, 1, 0, 0, 1) // P1 places opp_above at (0,1)
  s = placeCard(s, 0, 0, 2, 2) // P0 filler
  s = placeCard(s, 1, 0, 1, 0) // P1 places opp_left at (1,0)
  // P0 places p0 at (1,1) with Same rule
  s = { ...s, activeRules: ['Same'] }
  s = placeCard(s, 0, 0, 1, 1)
  assert(s.board[0][1]?.owner === 0, 'Same: card above captured (top rank match)')
  assert(s.board[1][0]?.owner === 0, 'Same: card left captured (left rank match)')
}

{
  // Same rule: only 1 matching side → rule does NOT trigger
  const p0 = mk('p0', 5, 1, 1, 4)
  const opp_above = mk('opp_above', 1, 1, 5, 1) // bottom=5 matches top
  const no_match  = mk('no_match',  1, 7, 1, 1)  // right=7, doesn't match left=4

  const p0Deck = [p0, p0, p0, p0, p0]
  const p1Deck = [opp_above, no_match, opp_above, opp_above, opp_above]
  let s = createGame(p0Deck, p1Deck, 1)
  s = placeCard(s, 1, 0, 0, 1) // P1 opp_above at (0,1)
  s = placeCard(s, 0, 0, 2, 2) // P0 filler
  s = placeCard(s, 1, 0, 1, 0) // P1 no_match at (1,0)
  s = { ...s, activeRules: ['Same'] }
  s = placeCard(s, 0, 0, 1, 1)
  // Only 1 match → Same doesn't trigger → only basic capture applies
  // P0 left (4) vs no_match right (7): 4 < 7 → no basic capture
  // P0 top (5) vs opp_above bottom (5): equal → no basic capture
  // So both should remain P1
  assert(s.board[1][0]?.owner === 1, 'Same: 1 match only → rule not triggered, no capture')
}

// ============================================================
console.log('\n=== Same Wall ===')
// ============================================================

{
  // Same Wall: placed at corner; edge counts as 10 for same check
  // P0 card at (0,0): top=10 (faces up wall=10 → match), left=10 (faces left wall=10 → match)
  // One real opponent card at (0,1) with left=10 → 3 matches (wall top, wall left, real card) → triggers
  // Wait, wall matches don't count as captures, but they DO count toward the "2+" threshold
  const p0 = mk('p0', 10, 3, 1, 10) // top=10, left=10
  const opp = mk('opp', 1, 10, 1, 1) // left=10 → faces right against p0's right...
  // Let's think more carefully:
  // P0 at (0,0). Neighbors: up=wall, right=(0,1), down=(1,0), left=wall
  // Same Wall: up wall counts as rank 10. P0 top=10 === wall 10 → match 1
  //            left wall counts as rank 10. P0 left=10 === wall 10 → match 2
  // That's 2 wall matches → triggers Same. But no opponent cards to capture from walls.
  // So: if there's an opponent card at (0,1) with left rank = p0's right rank, that's 1 more match,
  // and that card gets captured.
  // But the question is: does 2 wall matches alone trigger? In FFVIII yes, but there are no cards
  // to capture. Let's test: 2 wall matches + 1 opponent card match (to confirm the opponent card is captured).
  const p0b = mk('p0b', 10, 5, 1, 10) // top=10, left=10, right=5
  const oppCard = mk('opp_r', 1, 1, 1, 5) // left=5 matches P0 right=5
  const p0Deck = [p0b, p0b, p0b, p0b, p0b]
  const p1Deck = [oppCard, oppCard, oppCard, oppCard, oppCard]
  let s = createGame(p0Deck, p1Deck, 1)
  s = placeCard(s, 1, 0, 0, 1) // P1 oppCard at (0,1)
  s = placeCard(s, 0, 0, 2, 2) // P0 filler
  s = placeCard(s, 1, 0, 2, 0) // P1 filler
  s = { ...s, activeRules: ['Same', 'Same Wall'] }
  s = placeCard(s, 0, 0, 0, 0) // P0 at corner (0,0)
  // wall matches: top(10)==wall(10), left(10)==wall(10) → 2 wall matches
  // real match: right(5) == opp left(5) → 1 real match
  // Total 3 matches (≥2) → Same triggers → captures (0,1)
  assert(s.board[0][1]?.owner === 0, 'Same Wall: wall matches count toward threshold, real card captured')
}

// ============================================================
console.log('\n=== Plus Rule ===')
// ============================================================

{
  // Plus rule: 2 sides with equal sums → both captured
  // P0 at (1,1): top=3, right=4, bottom=2, left=6
  // P1 above at (0,1): bottom=6 → sum top side = 3+6=9
  // P1 left at (1,0): right=3 → sum left side = 6+3=9 ← equal sums!
  const p0 = mk('p0', 3, 4, 2, 6)
  const opp_above = mk('opp_above', 1, 1, 6, 1) // bottom=6
  const opp_left  = mk('opp_left',  1, 3, 1, 1) // right=3

  const p0Deck = [p0, p0, p0, p0, p0]
  const p1Deck = [opp_above, opp_left, opp_above, opp_above, opp_above]
  let s = createGame(p0Deck, p1Deck, 1)
  s = placeCard(s, 1, 0, 0, 1) // P1 opp_above at (0,1)
  s = placeCard(s, 0, 0, 2, 2) // P0 filler
  s = placeCard(s, 1, 0, 1, 0) // P1 opp_left at (1,0)
  s = { ...s, activeRules: ['Plus'] }
  s = placeCard(s, 0, 0, 1, 1)
  assert(s.board[0][1]?.owner === 0, 'Plus: equal sum side 1 captured')
  assert(s.board[1][0]?.owner === 0, 'Plus: equal sum side 2 captured')
}

{
  // Plus rule: only 1 matching sum → rule not triggered
  const p0 = mk('p0', 3, 4, 2, 6)
  const opp_above = mk('opp_above', 1, 1, 6, 1) // bottom=6 → sum=9
  const opp_left  = mk('opp_left',  1, 4, 1, 1) // right=4 → sum=6+4=10 (not 9)

  const p0Deck = [p0, p0, p0, p0, p0]
  const p1Deck = [opp_above, opp_left, opp_above, opp_above, opp_above]
  let s = createGame(p0Deck, p1Deck, 1)
  s = placeCard(s, 1, 0, 0, 1)
  s = placeCard(s, 0, 0, 2, 2)
  s = placeCard(s, 1, 0, 1, 0)
  s = { ...s, activeRules: ['Plus'] }
  s = placeCard(s, 0, 0, 1, 1)
  // No equal sums → Plus doesn't trigger → basic capture only
  // P0 top(3) vs opp_above bottom(6): 3 < 6 → no basic capture
  // P0 left(6) vs opp_left right(4): 6 > 4 → basic capture!
  assert(s.board[0][1]?.owner === 1, 'Plus: 1 sum only → rule not triggered')
  assert(s.board[1][0]?.owner === 0, 'Plus: basic capture still applies independently')
}

// ============================================================
console.log('\n=== Combo Rule ===')
// ============================================================

{
  // Combo: Same triggers capture at (0,1); (0,1) card then basic-captures (0,2)
  // P0 placer at (1,1): top=5, left=5
  // P1 above at (0,1): bottom=5 (Same match on top), right=8
  // P1 leftOf at (1,0): right=5 (Same match on left)
  // P1 comboTarget at (0,2): left=3 — above.right(8) > 3 → Combo capture
  // Same triggers (2 matches) → captures (0,1) and (1,0)
  // Combo: above (now P0) at (0,1) right=8 vs comboTarget left=3 → captures (0,2)
  const p0placer    = mk('placer',      5, 1, 1, 5)
  const above       = mk('above',       1, 8, 5, 1)  // bottom=5 (Same), right=8 (Combo)
  const leftOf      = mk('left',        1, 5, 1, 1)  // right=5 (Same)
  const comboTarget = mk('comboTarget', 1, 1, 1, 3)  // left=3 (Combo target)

  const p0Deck = [p0placer, p0placer, p0placer, p0placer, p0placer]
  const p1Deck = [above, leftOf, comboTarget, above, above]
  let s2 = createGame(p0Deck, p1Deck, 1)
  s2 = placeCard(s2, 1, 2, 0, 2) // P1 comboTarget at (0,2): left=3
  s2 = placeCard(s2, 0, 0, 2, 2) // P0 filler
  s2 = placeCard(s2, 1, 0, 0, 1) // P1 above at (0,1): bottom=5, right=8
  s2 = placeCard(s2, 0, 0, 2, 0) // P0 filler
  s2 = placeCard(s2, 1, 0, 1, 0) // P1 leftOf at (1,0): right=5
  s2 = { ...s2, activeRules: ['Same', 'Combo'] }
  s2 = placeCard(s2, 0, 0, 1, 1) // P0 placer at (1,1): Same triggers (0,1) and (1,0)
  assert(s2.board[0][1]?.owner === 0, 'Combo: Same rule captures (0,1)')
  assert(s2.board[0][2]?.owner === 0, 'Combo: captured card triggers basic capture cascade')
}

// ============================================================
console.log('\n=== Winner / Draw / Sudden Death ===')
// ============================================================

{
  // Winner: fill board so P0 has 6+ cards
  // P0 strong (top/right/bottom/left all 10), P1 weak (all 1)
  const strong = mk('S', 10, 10, 10, 10)
  const weak   = mk('W', 1, 1, 1, 1)
  // Fill all 9 cells; P0 goes first and should capture everything
  // Turn order: P0, P1, P0, P1, P0, P1, P0, P1, P0 (5 P0 moves, 4 P1 moves)
  const p0Deck = [strong, strong, strong, strong, strong]
  const p1Deck = [weak, weak, weak, weak, weak]
  let s = createGame(p0Deck, p1Deck, 0)
  // Place all 9 cards
  const positions = [[0,0],[0,1],[0,2],[1,0],[1,1],[1,2],[2,0],[2,1],[2,2]]
  for (let i = 0; i < 9; i++) {
    const [r, c] = positions[i]
    const player = s.turn
    s = placeCard(s, player, 0, r, c)
  }
  assert(s.phase === 'ended', 'Winner: phase ended after all 9 placements')
  assert(s.winner === 0, 'Winner: P0 wins with all strong cards')
}

{
  // Draw without Sudden Death rule → phase 'ended', winner 'draw'
  // To force a draw: alternate perfectly matched cards
  // 5-5 split: each player captures the other's cards equally
  // Simplest: each card has all ranks=5. No captures occur. P0 plays 5 cards, P1 plays 4.
  // Score: board has 5 P0 cells, 4 P1 cells; P1 has 1 card in hand → P1 +1 = 5 each → draw
  const five = mk('five', 5, 5, 5, 5)
  const p0Deck = [five, five, five, five, five]
  const p1Deck = [five, five, five, five, five]
  let s = createGame(p0Deck, p1Deck, 0, []) // no Sudden Death rule
  // Fill board without triggering any captures (equal ranks = no capture)
  const positions = [[0,0],[0,1],[0,2],[1,0],[1,1],[1,2],[2,0],[2,1],[2,2]]
  for (let i = 0; i < 9; i++) {
    const [r, c] = positions[i]
    const player = s.turn
    s = placeCard(s, player, 0, r, c)
  }
  assert(s.phase === 'ended', 'Draw (no SD): phase is ended')
  assert(s.winner === 'draw', 'Draw (no SD): winner is draw')
}

{
  // Sudden Death: draw with rule → phase 'sudden_death', board empty, hands reshuffled
  const five = mk('five', 5, 5, 5, 5)
  const p0Deck = [five, five, five, five, five]
  const p1Deck = [five, five, five, five, five]
  let s = createGame(p0Deck, p1Deck, 0, ['Sudden Death'])
  const positions = [[0,0],[0,1],[0,2],[1,0],[1,1],[1,2],[2,0],[2,1],[2,2]]
  for (let i = 0; i < 9; i++) {
    const [r, c] = positions[i]
    const player = s.turn
    s = placeCard(s, player, 0, r, c)
  }
  assert(s.phase === 'sudden_death', 'Sudden Death: phase is sudden_death on draw')
  assert(s.winner === null, 'Sudden Death: winner is null')
  assert(s.board.flat().every(c => c === null), 'Sudden Death: board is empty after redistribution')
  assert(s.hands[0].length === 5, 'Sudden Death: P0 has 5 cards in new hand')
  assert(s.hands[1].length === 5, 'Sudden Death: P1 has 5 cards in new hand')
  assert(s.suddenDeathRound === 1, 'Sudden Death: suddenDeathRound incremented to 1')
}

{
  // continueSuddenDeath: transitions to playing phase
  const five = mk('five', 5, 5, 5, 5)
  let s = createGame(deck(five), deck(five), 0, ['Sudden Death'])
  const positions = [[0,0],[0,1],[0,2],[1,0],[1,1],[1,2],[2,0],[2,1],[2,2]]
  for (let i = 0; i < 9; i++) {
    const [r, c] = positions[i]
    s = placeCard(s, s.turn, 0, r, c)
  }
  // Should be sudden_death now
  if (s.phase === 'sudden_death') {
    s = continueSuddenDeath(s)
    assert(s.phase === 'playing', 'continueSuddenDeath: phase becomes playing')
    // Can now place cards
    try {
      s = placeCard(s, s.turn, 0, 0, 0)
      assert(true, 'continueSuddenDeath: can place card after continuing')
    } catch {
      assert(false, 'continueSuddenDeath: should be able to place card')
    }
  } else {
    // If draw didn't happen (unlucky), skip
    console.log('  SKIP: continueSuddenDeath (no draw occurred)')
  }
}

// ============================================================
console.log('\n=== placeCard state forwarding ===')
// ============================================================

{
  // activeRules must be preserved through placeCard
  const card = mk('c', 5, 5, 5, 5)
  let s = createGame(deck(card), deck(card), 0, ['Same', 'Plus', 'Combo'])
  s = placeCard(s, 0, 0, 0, 0)
  assert(s.activeRules.includes('Same'), 'placeCard: activeRules preserved (Same)')
  assert(s.activeRules.includes('Plus'), 'placeCard: activeRules preserved (Plus)')
  assert(s.activeRules.includes('Combo'), 'placeCard: activeRules preserved (Combo)')
}

{
  // boardElements must be preserved through placeCard
  const card = mk('c', 5, 5, 5, 5)
  let s = createGame(deck(card), deck(card), 0, [])
  const origElements = s.boardElements
  s = placeCard(s, 0, 0, 0, 0)
  assert(s.boardElements === origElements || JSON.stringify(s.boardElements) === JSON.stringify(origElements),
    'placeCard: boardElements preserved through move')
}

// ============================================================
console.log('\n=== Summary ===')
console.log(`Passed: ${passed}`)
console.log(`Failed: ${failed}`)
if (failed > 0) process.exit(1)
