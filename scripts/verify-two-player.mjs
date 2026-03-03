#!/usr/bin/env node
/**
 * Verify two-player flow: create room, join, both send decks, play full match.
 * Run: docker compose run --rm -v ${PWD}/scripts:/scripts -w /app backend node /scripts/verify-two-player.mjs
 */
import WebSocket from 'ws'

const API = process.env.API_URL || 'http://backend:3000'
const WS_BASE = API.replace(/^http/, 'ws')

const SAMPLE_DECK = [
  { id: 'geezard', name: 'Geezard', level: 1, top: 1, right: 5, bottom: 4, left: 1, element: null },
  { id: 'funguar', name: 'Funguar', level: 1, top: 5, right: 3, bottom: 1, left: 1, element: null },
  { id: 'bite_bug', name: 'Bite Bug', level: 1, top: 1, right: 3, bottom: 3, left: 5, element: null },
  { id: 'red_bat', name: 'Red Bat', level: 1, top: 6, right: 2, bottom: 1, left: 1, element: null },
  { id: 'blobra', name: 'Blobra', level: 1, top: 2, right: 3, bottom: 1, left: 5, element: null },
]

async function createRoom() {
  const r = await fetch(`${API}/room`, { method: 'POST' })
  if (!r.ok) throw new Error('Create room failed')
  return r.json()
}

async function joinRoom(code) {
  const r = await fetch(`${API}/room/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  })
  if (!r.ok) throw new Error('Join room failed')
  return r.json()
}

function wsConnect(roomId, player) {
  return new Promise((resolve, reject) => {
    const url = `${WS_BASE}/ws?roomId=${roomId}&player=${player}`
    const ws = new WebSocket(url)
    ws.on('open', () => resolve(ws))
    ws.on('error', reject)
  })
}

async function main() {
  const { roomId, code } = await createRoom()
  console.log('Created room', roomId, code)
  const { roomId: joinId } = await joinRoom(code)
  if (joinId !== roomId) throw new Error('Join returned wrong roomId')
  console.log('Joined room OK')

  const ws0 = await wsConnect(roomId, 0)
  const ws1 = await wsConnect(roomId, 1)

  const deck = SAMPLE_DECK
  ws0.send(JSON.stringify({ type: 'set_deck', deck }))
  ws1.send(JSON.stringify({ type: 'set_deck', deck }))

  const gotStart = await new Promise((resolve) => {
    const onMsg = (data) => {
      const msg = JSON.parse(data.toString())
      if (msg.type === 'start') resolve(msg.state)
    }
    ws0.on('message', onMsg)
    ws1.on('message', onMsg)
  })
  console.log('Game started, firstPlayer:', gotStart.turn)

  const moves = [
    [0, 0, 1, 1], [1, 0, 2, 2], [0, 1, 0, 0], [1, 1, 2, 0], [0, 2, 0, 2],
    [1, 2, 1, 0], [0, 3, 2, 1], [1, 3, 0, 1], [0, 4, 1, 2],
  ]
  let state = gotStart
  for (const [player, cardIdx, row, col] of moves) {
    const ws = player === 0 ? ws0 : ws1
    ws.send(JSON.stringify({ type: 'place', cardIndex: cardIdx, row, col }))
    state = await new Promise((resolve) => {
      const handler = (data) => {
        const msg = JSON.parse(data.toString())
        if (msg.type === 'state') resolve(msg.state)
      }
      ws0.once('message', handler)
      ws1.once('message', handler)
    })
  }
  console.log('Game ended. Winner:', state.winner, 'Phase:', state.phase)
  if (state.phase !== 'ended') throw new Error('Game did not end')
  ws0.close()
  ws1.close()
  console.log('Two-player verification PASSED')
}

main().catch((e) => { console.error(e); process.exit(1) })
