import http from 'http'
import { WebSocketServer } from 'ws'
import { createGame, placeCard } from './engine.mjs'

const HTTP_PORT = parseInt(process.env.API_PORT || '3000', 10)
const rooms = new Map() // roomId -> { code, player0: ws|null, player1: ws|null, decks: [null,null], state: null|GameState }

function randomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

function randomRoomId() {
  return Math.random().toString(36).slice(2, 12)
}

async function handleReq(req, res) {
  res.setHeader('Access-Control-Origin', '*')
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.writeHead(204)
    res.end()
    return
  }
  if (req.url === '/room' && req.method === 'POST') {
    const roomId = randomRoomId()
    const code = randomCode()
    rooms.set(roomId, { code, player0: null, player1: null, decks: [null, null], state: null })
    res.setHeader('Content-Type', 'application/json')
    res.writeHead(200)
    res.end(JSON.stringify({ roomId, code }))
    return
  }
  if (req.url === '/room/join' && req.method === 'POST') {
    const body = await new Promise((resolve) => {
      let d = ''
      req.on('data', (c) => (d += c))
      req.on('end', () => resolve(d))
    })
    const { code } = JSON.parse(body || '{}')
    const entry = [...rooms.entries()].find(([, r]) => r.code === code)
    if (!entry) {
      res.writeHead(404)
      res.end(JSON.stringify({ error: 'Room not found' }))
      return
    }
    res.setHeader('Content-Type', 'application/json')
    res.writeHead(200)
    res.end(JSON.stringify({ roomId: entry[0] }))
    return
  }
  res.writeHead(404)
  res.end()
}

const httpServer = http.createServer(handleReq)

const wss = new WebSocketServer({ server: httpServer, path: '/ws' })

wss.on('connection', (ws, req) => {
  const u = new URL(req.url || '', 'http://x')
  const roomId = u.searchParams.get('roomId')
  const player = u.searchParams.get('player') === '1' ? 1 : 0
  if (!roomId || !rooms.has(roomId)) {
    ws.close(1008, 'Invalid room')
    return
  }
  const room = rooms.get(roomId)
  if (player === 0) room.player0 = ws
  else room.player1 = ws

  function sendToBoth(msg) {
    const payload = JSON.stringify(msg)
    room.player0?.send(payload)
    room.player1?.send(payload)
  }

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString())
      if (msg.type === 'set_deck') {
        room.decks[player] = msg.deck || null
        sendToBoth({ type: 'lobby', decksReady: room.decks[0] && room.decks[1] })
        if (room.decks[0] && room.decks[1] && !room.state) {
          const firstPlayer = Math.random() < 0.5 ? 0 : 1
          room.state = createGame(room.decks[0], room.decks[1], firstPlayer)
          sendToBoth({ type: 'start', state: room.state })
        }
        return
      }
      if (msg.type === 'place' && room.state) {
        const { cardIndex, row, col } = msg
        const newState = placeCard(room.state, player, cardIndex, row, col)
        room.state = newState
        sendToBoth({ type: 'state', state: newState })
      }
    } catch (e) {
      ws.send(JSON.stringify({ type: 'error', error: e.message }))
    }
  })

  ws.on('close', () => {
    if (player === 0) room.player0 = null
    else room.player1 = null
  })
})

httpServer.listen(HTTP_PORT, '0.0.0.0', () => {
  console.log(`Backend HTTP+WS on ${HTTP_PORT}`)
})
