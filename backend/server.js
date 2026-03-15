import http from 'http'
import { readFileSync } from 'fs'
import { WebSocketServer } from 'ws'
import { createGame, placeCard, continueSuddenDeath } from './engine.mjs'

const HTTP_PORT = parseInt(process.env.API_PORT || '3000', 10)

// Load card data at startup
const cardsJsonData = JSON.parse(readFileSync(new URL('./cards.json', import.meta.url), 'utf8'))
const cardMap = new Map(cardsJsonData.cards.map(c => [c.id, c]))
const MAX_PLAYERS_PER_LOBBY = 30
const MAX_LOBBIES_PER_IP = 5

// ─── Legacy rooms (backward compat with v2.x PlayPage) ───

const rooms = new Map()

function randomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

function randomId() {
  return Math.random().toString(36).slice(2, 12) + Date.now().toString(36)
}

// ─── Lobby system ───

const lobbies = new Map()  // lobbyId -> Lobby
const lobbyCreationTimes = new Map()  // IP -> timestamp[]

/**
 * @typedef {Object} LobbyPlayer
 * @property {string} id
 * @property {Object} profile
 * @property {string[]|null} hand - 5 cardIds or null
 * @property {boolean} isReady
 * @property {WebSocket|null} ws
 */

/**
 * @typedef {Object} Lobby
 * @property {string} id
 * @property {string} joinCode
 * @property {string} hostId
 * @property {string} hostName
 * @property {LobbyPlayer[]} players
 * @property {Object} config - { specialRules: string[], tradeRule: string }
 * @property {string} phase - 'waiting' | 'selecting' | 'duelling' | 'rewards'
 * @property {Object|null} activeDuel
 * @property {number} createdAt
 * @property {string[]} selectedDuellists - [player0Id, player1Id] or []
 */

function createLobby(hostProfile, ip) {
  // Rate limit
  const now = Date.now()
  const recent = (lobbyCreationTimes.get(ip) || []).filter(t => now - t < 60000)
  if (recent.length >= MAX_LOBBIES_PER_IP) {
    return { error: 'Too many lobbies created. Wait a minute.' }
  }
  lobbyCreationTimes.set(ip, [...recent, now])

  const id = randomId()
  const joinCode = randomCode()
  const lobby = {
    id,
    joinCode,
    hostId: hostProfile.id,
    hostName: hostProfile.name || 'Host',
    players: [],
    config: { specialRules: [], tradeRule: 'Friendly' },
    phase: 'waiting',
    activeDuel: null,
    createdAt: now,
    selectedDuellists: [],
  }
  lobbies.set(id, lobby)
  return { lobbyId: id, joinCode }
}

function getLobbyInfo(lobby) {
  return {
    id: lobby.id,
    hostName: lobby.hostName,
    playerCount: lobby.players.length,
    maxPlayers: MAX_PLAYERS_PER_LOBBY,
    config: lobby.config,
    phase: lobby.phase,
  }
}

function getPlayerInfo(p) {
  return {
    id: p.id,
    profile: p.profile,
    isReady: p.isReady,
  }
}

function broadcastToLobby(lobby, msg, excludeId) {
  const payload = JSON.stringify(msg)
  for (const p of lobby.players) {
    if (p.id !== excludeId && p.ws?.readyState === 1) {
      p.ws.send(payload)
    }
  }
}

function sendToPlayer(lobby, playerId, msg) {
  const p = lobby.players.find(pl => pl.id === playerId)
  if (p?.ws?.readyState === 1) {
    p.ws.send(JSON.stringify(msg))
  }
}

function sendLobbyState(lobby, ws) {
  const activeDuelInfo = lobby.activeDuel ? {
    player0Id: lobby.activeDuel.player0Id,
    player1Id: lobby.activeDuel.player1Id,
    gameState: sanitizeGameState(lobby.activeDuel.gameState, null, lobby.config.specialRules),
  } : null

  ws.send(JSON.stringify({
    type: 'lobby_state',
    lobby: getLobbyInfo(lobby),
    players: lobby.players.map(getPlayerInfo),
    config: lobby.config,
    phase: lobby.phase,
    activeDuel: activeDuelInfo,
    selectedDuellists: lobby.selectedDuellists,
  }))
}

function sanitizeGameState(gameState, viewerId, specialRules) {
  if (!gameState) return null
  const isOpen = specialRules.includes('Open')

  // Spectators see card backs unless Open rule
  if (!viewerId) {
    return {
      ...gameState,
      hands: isOpen ? gameState.hands : [
        gameState.hands[0].map(() => null),
        gameState.hands[1].map(() => null),
      ],
    }
  }
  return gameState
}

function computeTradeResult(gameState, tradeRule, player0Hand, player1Hand) {
  if (tradeRule === 'Friendly') return null
  if (!gameState || gameState.phase !== 'ended' || gameState.winner === null) return null

  const board = gameState.board
  const p0Cards = []  // cards owned by player 0 on board
  const p1Cards = []  // cards owned by player 1 on board

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const cell = board[r][c]
      if (!cell) continue
      if (cell.owner === 0) p0Cards.push(cell.card.id)
      else p1Cards.push(cell.card.id)
    }
  }

  // Add unplayed hand cards
  for (const card of gameState.hands[0]) p0Cards.push(card.id)
  for (const card of gameState.hands[1]) p1Cards.push(card.id)

  const winner = gameState.winner
  if (winner === 'draw') return { player0Gained: [], player0Lost: [], player1Gained: [], player1Lost: [] }

  const result = { player0Gained: [], player0Lost: [], player1Gained: [], player1Lost: [] }

  switch (tradeRule) {
    case 'One': {
      // Winner takes one card from loser (the rarest/highest level card they captured)
      if (winner === 0) {
        // P0 won, picks one card from P1's board cards that P0 captured
        const capturedFromP1 = []
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            const cell = board[r][c]
            if (cell && cell.owner === 0 && cell.placedBy === 1) capturedFromP1.push(cell.card)
          }
        }
        if (capturedFromP1.length > 0) {
          capturedFromP1.sort((a, b) => b.level - a.level)
          const taken = capturedFromP1[0].id
          result.player0Gained.push(taken)
          result.player1Lost.push(taken)
        }
      } else {
        const capturedFromP0 = []
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            const cell = board[r][c]
            if (cell && cell.owner === 1 && cell.placedBy === 0) capturedFromP0.push(cell.card)
          }
        }
        if (capturedFromP0.length > 0) {
          capturedFromP0.sort((a, b) => b.level - a.level)
          const taken = capturedFromP0[0].id
          result.player1Gained.push(taken)
          result.player0Lost.push(taken)
        }
      }
      break
    }
    case 'Diff': {
      // Winner takes cards equal to score difference
      const p0Count = p0Cards.length
      const p1Count = p1Cards.length
      const diff = Math.abs(p0Count - p1Count)
      if (winner === 0) {
        const capturedFromP1 = []
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            const cell = board[r][c]
            if (cell && cell.owner === 0 && cell.placedBy === 1) capturedFromP1.push(cell.card)
          }
        }
        capturedFromP1.sort((a, b) => b.level - a.level)
        for (let i = 0; i < Math.min(diff, capturedFromP1.length); i++) {
          result.player0Gained.push(capturedFromP1[i].id)
          result.player1Lost.push(capturedFromP1[i].id)
        }
      } else {
        const capturedFromP0 = []
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            const cell = board[r][c]
            if (cell && cell.owner === 1 && cell.placedBy === 0) capturedFromP0.push(cell.card)
          }
        }
        capturedFromP0.sort((a, b) => b.level - a.level)
        for (let i = 0; i < Math.min(diff, capturedFromP0.length); i++) {
          result.player1Gained.push(capturedFromP0[i].id)
          result.player0Lost.push(capturedFromP0[i].id)
        }
      }
      break
    }
    case 'Direct': {
      // Each player keeps the cards they own on the board (swapping captured ones)
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const cell = board[r][c]
          if (!cell) continue
          if (cell.owner === 0 && cell.placedBy === 1) {
            result.player0Gained.push(cell.card.id)
            result.player1Lost.push(cell.card.id)
          } else if (cell.owner === 1 && cell.placedBy === 0) {
            result.player1Gained.push(cell.card.id)
            result.player0Lost.push(cell.card.id)
          }
        }
      }
      break
    }
    case 'All': {
      // Winner takes ALL of loser's cards
      if (winner === 0) {
        result.player0Gained.push(...player1Hand)
        result.player1Lost.push(...player1Hand)
      } else {
        result.player1Gained.push(...player0Hand)
        result.player0Lost.push(...player0Hand)
      }
      break
    }
  }

  return result
}

// ─── HTTP handlers ───

async function readBody(req) {
  return new Promise((resolve) => {
    let d = ''
    req.on('data', (c) => (d += c))
    req.on('end', () => resolve(d))
  })
}

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown'
}

async function handleReq(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(204); res.end(); return
  }

  const url = new URL(req.url || '', 'http://x')

  // ─── Legacy room endpoints ───
  if (url.pathname === '/room' && req.method === 'POST') {
    const roomId = randomId()
    const code = randomCode()
    rooms.set(roomId, { code, player0: null, player1: null, decks: [null, null], state: null })
    res.setHeader('Content-Type', 'application/json')
    res.writeHead(200)
    res.end(JSON.stringify({ roomId, code }))
    return
  }

  if (url.pathname === '/room/join' && req.method === 'POST') {
    const body = await readBody(req)
    const { code } = JSON.parse(body || '{}')
    const entry = [...rooms.entries()].find(([, r]) => r.code === code)
    if (!entry) {
      res.writeHead(404); res.end(JSON.stringify({ error: 'Room not found' })); return
    }
    res.setHeader('Content-Type', 'application/json')
    res.writeHead(200)
    res.end(JSON.stringify({ roomId: entry[0] }))
    return
  }

  // ─── Lobby endpoints ───
  if (url.pathname === '/lobby' && req.method === 'POST') {
    const body = await readBody(req)
    const { hostProfile } = JSON.parse(body || '{}')
    if (!hostProfile?.id || !hostProfile?.name) {
      res.writeHead(400); res.end(JSON.stringify({ error: 'hostProfile required' })); return
    }
    const ip = getClientIp(req)
    const result = createLobby(hostProfile, ip)
    if (result.error) {
      res.writeHead(429); res.end(JSON.stringify({ error: result.error })); return
    }
    res.setHeader('Content-Type', 'application/json')
    res.writeHead(200)
    res.end(JSON.stringify(result))
    return
  }

  if (url.pathname === '/lobbies' && req.method === 'GET') {
    const lobbyList = [...lobbies.values()].map(getLobbyInfo)
    res.setHeader('Content-Type', 'application/json')
    res.writeHead(200)
    res.end(JSON.stringify({ lobbies: lobbyList }))
    return
  }

  const lobbyMatch = url.pathname.match(/^\/lobby\/([^/]+)$/)
  if (lobbyMatch && req.method === 'DELETE') {
    const lobbyId = lobbyMatch[1]
    const lobby = lobbies.get(lobbyId)
    if (!lobby) {
      res.writeHead(404); res.end(JSON.stringify({ error: 'Lobby not found' })); return
    }
    // Disconnect all players
    for (const p of lobby.players) {
      p.ws?.close(1000, 'Lobby closed')
    }
    lobbies.delete(lobbyId)
    res.setHeader('Content-Type', 'application/json')
    res.writeHead(200)
    res.end(JSON.stringify({ ok: true }))
    return
  }

  res.writeHead(404); res.end()
}

const httpServer = http.createServer(handleReq)

// ─── WebSocket: legacy /ws path ───

const wss = new WebSocketServer({ noServer: true })
const lobbyWss = new WebSocketServer({ noServer: true })

httpServer.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url || '', 'http://x')
  if (url.pathname === '/ws') {
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req))
  } else if (url.pathname === '/lobby') {
    lobbyWss.handleUpgrade(req, socket, head, (ws) => lobbyWss.emit('connection', ws, req))
  } else {
    socket.destroy()
  }
})

// Legacy room connections
wss.on('connection', (ws, req) => {
  const u = new URL(req.url || '', 'http://x')
  const roomId = u.searchParams.get('roomId')
  const player = u.searchParams.get('player') === '1' ? 1 : 0
  if (!roomId || !rooms.has(roomId)) {
    ws.close(1008, 'Invalid room'); return
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
        const newState = placeCard(room.state, player, msg.cardIndex, msg.row, msg.col)
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

// ─── WebSocket: new lobby system /lobby ───

lobbyWss.on('connection', (ws, req) => {
  const u = new URL(req.url || '', 'http://x')
  const lobbyId = u.searchParams.get('lobbyId')
  const playerId = u.searchParams.get('playerId')

  if (!lobbyId || !lobbies.has(lobbyId)) {
    ws.send(JSON.stringify({ type: 'error', message: 'Lobby not found' }))
    ws.close(1008, 'Invalid lobby')
    return
  }

  const lobby = lobbies.get(lobbyId)

  // Store connection context
  let myPlayerId = playerId

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString())
      handleLobbyMessage(lobby, ws, myPlayerId, msg)
    } catch (e) {
      ws.send(JSON.stringify({ type: 'error', message: e.message }))
    }
  })

  ws.on('close', () => {
    if (!myPlayerId) return
    const idx = lobby.players.findIndex(p => p.id === myPlayerId)
    if (idx >= 0) {
      lobby.players.splice(idx, 1)
      broadcastToLobby(lobby, { type: 'player_left', playerId: myPlayerId })

      // If host left, transfer host or close lobby
      if (myPlayerId === lobby.hostId) {
        if (lobby.players.length > 0) {
          lobby.hostId = lobby.players[0].id
          lobby.hostName = lobby.players[0].profile.name
          // Broadcast updated lobby state
          for (const p of lobby.players) {
            if (p.ws?.readyState === 1) sendLobbyState(lobby, p.ws)
          }
        } else {
          lobbies.delete(lobby.id)
        }
      }
    }
  })
})

function handleLobbyMessage(lobby, ws, playerId, msg) {
  switch (msg.type) {
    case 'join': {
      if (lobby.players.length >= MAX_PLAYERS_PER_LOBBY) {
        ws.send(JSON.stringify({ type: 'error', message: 'Lobby is full' }))
        return
      }
      // Prevent duplicate join
      const existing = lobby.players.find(p => p.id === msg.profile.id)
      if (existing) {
        existing.ws = ws
        existing.profile = msg.profile
      } else {
        lobby.players.push({
          id: msg.profile.id,
          profile: msg.profile,
          hand: null,
          isReady: false,
          ws,
        })
      }

      // Send full lobby state to joiner
      sendLobbyState(lobby, ws)

      // Broadcast join to others
      broadcastToLobby(lobby, {
        type: 'player_joined',
        player: getPlayerInfo(lobby.players.find(p => p.id === msg.profile.id)),
      }, msg.profile.id)
      break
    }

    case 'leave': {
      const idx = lobby.players.findIndex(p => p.id === playerId)
      if (idx >= 0) {
        lobby.players.splice(idx, 1)
        broadcastToLobby(lobby, { type: 'player_left', playerId })
      }
      ws.close(1000, 'Left lobby')
      break
    }

    case 'set_config': {
      if (playerId !== lobby.hostId) {
        ws.send(JSON.stringify({ type: 'error', message: 'Only host can change config' }))
        return
      }
      if (lobby.phase !== 'waiting') {
        ws.send(JSON.stringify({ type: 'error', message: 'Cannot change config during duel' }))
        return
      }
      lobby.config = msg.config
      broadcastToLobby(lobby, { type: 'config_updated', config: lobby.config })
      // Also send to host
      ws.send(JSON.stringify({ type: 'config_updated', config: lobby.config }))
      break
    }

    case 'select_hand': {
      const player = lobby.players.find(p => p.id === playerId)
      if (!player) return
      if (!Array.isArray(msg.cardIds) || msg.cardIds.length !== 5) {
        ws.send(JSON.stringify({ type: 'error', message: 'Hand must be exactly 5 cards' }))
        return
      }
      player.hand = msg.cardIds
      player.isReady = true
      broadcastToLobby(lobby, { type: 'hand_locked', playerId })
      ws.send(JSON.stringify({ type: 'hand_locked', playerId }))
      break
    }

    case 'select_duellists': {
      if (playerId !== lobby.hostId) {
        ws.send(JSON.stringify({ type: 'error', message: 'Only host can select duellists' }))
        return
      }
      const { player0Id, player1Id } = msg
      const p0 = lobby.players.find(p => p.id === player0Id)
      const p1 = lobby.players.find(p => p.id === player1Id)
      if (!p0 || !p1) {
        ws.send(JSON.stringify({ type: 'error', message: 'Selected players not in lobby' }))
        return
      }
      lobby.selectedDuellists = [player0Id, player1Id]
      broadcastToLobby(lobby, { type: 'duellists_selected', player0Id, player1Id })
      ws.send(JSON.stringify({ type: 'duellists_selected', player0Id, player1Id }))
      break
    }

    case 'start_duel': {
      if (playerId !== lobby.hostId) {
        ws.send(JSON.stringify({ type: 'error', message: 'Only host can start duel' }))
        return
      }
      if (lobby.selectedDuellists.length !== 2) {
        ws.send(JSON.stringify({ type: 'error', message: 'Select two duellists first' }))
        return
      }

      const [p0Id, p1Id] = lobby.selectedDuellists
      const p0 = lobby.players.find(p => p.id === p0Id)
      const p1 = lobby.players.find(p => p.id === p1Id)

      if (!p0?.hand || !p1?.hand) {
        ws.send(JSON.stringify({ type: 'error', message: 'Both duellists must select their hand first' }))
        return
      }

      // Resolve card objects from IDs using preloaded card data
      const p0Cards = p0.hand.map(id => cardMap.get(id)).filter(Boolean)
      const p1Cards = p1.hand.map(id => cardMap.get(id)).filter(Boolean)

      if (p0Cards.length !== 5 || p1Cards.length !== 5) {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid card selection' }))
        return
      }

      const firstPlayer = Math.random() < 0.5 ? 0 : 1
      const gameState = createGame(p0Cards, p1Cards, firstPlayer, lobby.config.specialRules)

      lobby.phase = 'duelling'
      lobby.activeDuel = {
        player0Id: p0Id,
        player1Id: p1Id,
        player0Hand: [...p0.hand],
        player1Hand: [...p1.hand],
        gameState,
        tradeResult: null,
      }

      // Send duel_starting to all
      const duelStartMsg = {
        type: 'duel_starting',
        player0: getPlayerInfo(p0),
        player1: getPlayerInfo(p1),
        config: lobby.config,
      }
      for (const p of lobby.players) {
        if (p.ws?.readyState === 1) {
          p.ws.send(JSON.stringify(duelStartMsg))
        }
      }

      // Send full state to duellists, sanitized to spectators
      broadcastDuelState(lobby)
      break
    }

    case 'place_card': {
      if (!lobby.activeDuel) return
      const { player0Id, player1Id } = lobby.activeDuel
      const isP0 = playerId === player0Id
      const isP1 = playerId === player1Id
      if (!isP0 && !isP1) return

      const currentPlayer = isP0 ? 0 : 1
      if (lobby.activeDuel.gameState.turn !== currentPlayer) {
        ws.send(JSON.stringify({ type: 'error', message: 'Not your turn' }))
        return
      }

      try {
        let newState = placeCard(lobby.activeDuel.gameState, currentPlayer, msg.cardIndex, msg.row, msg.col)
        lobby.activeDuel.gameState = newState

        // Handle sudden death
        if (newState.phase === 'sudden_death') {
          setTimeout(() => {
            lobby.activeDuel.gameState = continueSuddenDeath(lobby.activeDuel.gameState)
            broadcastDuelState(lobby)
          }, 1200)
        }

        broadcastDuelState(lobby)

        // Check if game ended
        if (newState.phase === 'ended') {
          const tradeResult = computeTradeResult(
            newState,
            lobby.config.tradeRule,
            lobby.activeDuel.player0Hand,
            lobby.activeDuel.player1Hand,
          )
          lobby.activeDuel.tradeResult = tradeResult
          lobby.phase = 'rewards'

          setTimeout(() => {
            for (const p of lobby.players) {
              if (p.ws?.readyState === 1) {
                p.ws.send(JSON.stringify({
                  type: 'duel_ended',
                  winner: newState.winner,
                  tradeResult,
                }))
              }
            }
          }, 600)
        }
      } catch (e) {
        ws.send(JSON.stringify({ type: 'error', message: e.message }))
      }
      break
    }

    case 'return_to_lobby': {
      if (!lobby.activeDuel) return
      const { player0Id, player1Id } = lobby.activeDuel
      if (playerId !== player0Id && playerId !== player1Id && playerId !== lobby.hostId) return

      // Reset duel state
      lobby.activeDuel = null
      lobby.phase = 'waiting'
      lobby.selectedDuellists = []

      // Reset all players' ready state
      for (const p of lobby.players) {
        p.hand = null
        p.isReady = false
      }

      // Broadcast return
      for (const p of lobby.players) {
        if (p.ws?.readyState === 1) {
          p.ws.send(JSON.stringify({ type: 'return_to_waiting' }))
          sendLobbyState(lobby, p.ws)
        }
      }
      break
    }

    default:
      ws.send(JSON.stringify({ type: 'error', message: `Unknown message type: ${msg.type}` }))
  }
}

function broadcastDuelState(lobby) {
  if (!lobby.activeDuel) return
  const { player0Id, player1Id, gameState } = lobby.activeDuel
  const isOpen = lobby.config.specialRules.includes('Open')

  for (const p of lobby.players) {
    if (p.ws?.readyState !== 1) continue

    let hands
    if (p.id === player0Id) {
      // Player 0 sees their own hand, and opponent hand only if Open
      hands = {
        player0: gameState.hands[0],
        player1: isOpen ? gameState.hands[1] : undefined,
      }
    } else if (p.id === player1Id) {
      // Player 1 sees their own hand, and opponent hand only if Open
      hands = {
        player0: isOpen ? gameState.hands[0] : undefined,
        player1: gameState.hands[1],
      }
    } else {
      // Spectator: only see hands if Open
      hands = isOpen ? {
        player0: gameState.hands[0],
        player1: gameState.hands[1],
      } : undefined
    }

    p.ws.send(JSON.stringify({
      type: 'duel_state',
      gameState: {
        ...gameState,
        hands: [
          p.id === player0Id || isOpen ? gameState.hands[0] : gameState.hands[0].map(() => null),
          p.id === player1Id || isOpen ? gameState.hands[1] : gameState.hands[1].map(() => null),
        ],
      },
      hands,
    }))
  }
}

// ─── Cleanup stale lobbies (every 5 minutes) ───

setInterval(() => {
  const cutoff = Date.now() - 3600000  // 1 hour
  for (const [id, lobby] of lobbies) {
    if (lobby.createdAt < cutoff && lobby.players.length === 0) {
      lobbies.delete(id)
    }
  }
  // Clean stale legacy rooms
  for (const [id, room] of rooms) {
    if (!room.player0 && !room.player1) {
      rooms.delete(id)
    }
  }
}, 300000)

httpServer.listen(HTTP_PORT, '0.0.0.0', () => {
  console.log(`Backend HTTP+WS on ${HTTP_PORT}`)
})
