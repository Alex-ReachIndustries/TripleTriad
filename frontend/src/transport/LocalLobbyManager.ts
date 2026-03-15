/**
 * LocalLobbyManager: runs lobby logic in-browser (for BLE host on Android).
 * Mirrors the lobby protocol from backend/server.js but executes client-side.
 * The host device acts as both the server and a player.
 */

import type {
  PlayerProfile, DuelConfig, LobbyPhase,
  ClientMessage, ServerMessage, TradeResult,
  LobbyPlayerInfo, LobbyInfo,
} from '../types/multiplayer'
import type { GameState } from '../game/types'
import type { Card } from '../types/card'
import { createGame, placeCard, continueSuddenDeath } from '../game'
import cardsData from '../data/cards.json'

const allCards: Card[] = cardsData.cards as Card[]
const cardMap = new Map(allCards.map(c => [c.id, c]))

const MAX_PLAYERS = 30

interface LocalPlayer {
  id: string
  profile: PlayerProfile
  hand: string[] | null
  isReady: boolean
}

interface ActiveDuel {
  player0Id: string
  player1Id: string
  player0Hand: string[]
  player1Hand: string[]
  gameState: GameState
  tradeResult: TradeResult | null
}

export class LocalLobbyManager {
  private hostId: string
  private hostName: string
  private players: LocalPlayer[] = []
  private config: DuelConfig = { specialRules: [], tradeRule: 'Friendly' }
  private phase: LobbyPhase = 'waiting'
  private activeDuel: ActiveDuel | null = null
  private selectedDuellists: string[] = []

  /** Called when a message should be sent to a specific player (or broadcast) */
  private sendToPlayer: (playerId: string, msg: ServerMessage) => void
  private broadcastAll: (msg: ServerMessage) => void

  constructor(
    hostProfile: PlayerProfile,
    sendToPlayer: (playerId: string, msg: ServerMessage) => void,
    broadcastAll: (msg: ServerMessage) => void,
  ) {
    this.hostId = hostProfile.id
    this.hostName = hostProfile.name
    this.sendToPlayer = sendToPlayer
    this.broadcastAll = broadcastAll
  }

  getLobbyInfo(): LobbyInfo {
    return {
      id: 'local',
      hostName: this.hostName,
      playerCount: this.players.length,
      maxPlayers: MAX_PLAYERS,
      config: this.config,
      phase: this.phase,
    }
  }

  getPlayersInfo(): LobbyPlayerInfo[] {
    return this.players.map(p => ({
      id: p.id,
      profile: p.profile,
      isReady: p.isReady,
    }))
  }

  private sendLobbyState(playerId: string) {
    const isOpen = this.config.specialRules.includes('Open')
    this.sendToPlayer(playerId, {
      type: 'lobby_state',
      lobby: this.getLobbyInfo(),
      players: this.getPlayersInfo(),
      config: this.config,
      phase: this.phase,
      activeDuel: this.activeDuel ? {
        player0Id: this.activeDuel.player0Id,
        player1Id: this.activeDuel.player1Id,
        gameState: {
          ...this.activeDuel.gameState,
          hands: isOpen ? this.activeDuel.gameState.hands : [
            this.activeDuel.gameState.hands[0].map(() => null as any),
            this.activeDuel.gameState.hands[1].map(() => null as any),
          ],
        },
      } : null,
    } as any)
  }

  handleMessage(playerId: string, msg: ClientMessage): void {
    switch (msg.type) {
      case 'join': {
        if (this.players.length >= MAX_PLAYERS) {
          this.sendToPlayer(playerId, { type: 'error', message: 'Lobby is full' })
          return
        }
        const existing = this.players.find(p => p.id === msg.profile.id)
        if (existing) {
          existing.profile = msg.profile
        } else {
          this.players.push({
            id: msg.profile.id,
            profile: msg.profile,
            hand: null,
            isReady: false,
          })
        }
        this.sendLobbyState(playerId)
        // Broadcast join to others
        const playerInfo = this.getPlayersInfo().find(p => p.id === msg.profile.id)!
        this.broadcastExcept(playerId, { type: 'player_joined', player: playerInfo })
        break
      }

      case 'leave': {
        this.players = this.players.filter(p => p.id !== playerId)
        this.broadcastAll({ type: 'player_left', playerId })
        break
      }

      case 'set_config': {
        if (playerId !== this.hostId) {
          this.sendToPlayer(playerId, { type: 'error', message: 'Only host can change config' })
          return
        }
        this.config = msg.config
        this.broadcastAll({ type: 'config_updated', config: this.config })
        break
      }

      case 'select_hand': {
        const player = this.players.find(p => p.id === playerId)
        if (!player) return
        if (!Array.isArray(msg.cardIds) || msg.cardIds.length !== 5) {
          this.sendToPlayer(playerId, { type: 'error', message: 'Hand must be exactly 5 cards' })
          return
        }
        player.hand = msg.cardIds
        player.isReady = true
        this.broadcastAll({ type: 'hand_locked', playerId })
        break
      }

      case 'select_duellists': {
        if (playerId !== this.hostId) return
        const p0 = this.players.find(p => p.id === msg.player0Id)
        const p1 = this.players.find(p => p.id === msg.player1Id)
        if (!p0 || !p1) {
          this.sendToPlayer(playerId, { type: 'error', message: 'Selected players not in lobby' })
          return
        }
        this.selectedDuellists = [msg.player0Id, msg.player1Id]
        // Use 'as any' for this non-standard message type (handled in useLobby default case)
        this.broadcastAll({ type: 'duellists_selected', player0Id: msg.player0Id, player1Id: msg.player1Id } as any)
        break
      }

      case 'start_duel': {
        if (playerId !== this.hostId) return
        if (this.selectedDuellists.length !== 2) {
          this.sendToPlayer(playerId, { type: 'error', message: 'Select two duellists first' })
          return
        }

        const [p0Id, p1Id] = this.selectedDuellists
        const p0 = this.players.find(p => p.id === p0Id)
        const p1 = this.players.find(p => p.id === p1Id)

        if (!p0?.hand || !p1?.hand) {
          this.sendToPlayer(playerId, { type: 'error', message: 'Both duellists must select their hand' })
          return
        }

        const p0Cards = p0.hand.map(id => cardMap.get(id)).filter((c): c is Card => !!c)
        const p1Cards = p1.hand.map(id => cardMap.get(id)).filter((c): c is Card => !!c)

        if (p0Cards.length !== 5 || p1Cards.length !== 5) {
          this.sendToPlayer(playerId, { type: 'error', message: 'Invalid card selection' })
          return
        }

        const firstPlayer = Math.random() < 0.5 ? 0 : 1
        const gameState = createGame(p0Cards, p1Cards, firstPlayer, this.config.specialRules)

        this.phase = 'duelling'
        this.activeDuel = {
          player0Id: p0Id,
          player1Id: p1Id,
          player0Hand: [...p0.hand],
          player1Hand: [...p1.hand],
          gameState,
          tradeResult: null,
        }

        const p0Info = this.getPlayersInfo().find(p => p.id === p0Id)!
        const p1Info = this.getPlayersInfo().find(p => p.id === p1Id)!
        this.broadcastAll({
          type: 'duel_starting',
          player0: p0Info,
          player1: p1Info,
          config: this.config,
        })

        this.broadcastDuelState()
        break
      }

      case 'place_card': {
        if (!this.activeDuel) return
        const { player0Id, player1Id } = this.activeDuel
        const isP0 = playerId === player0Id
        const isP1 = playerId === player1Id
        if (!isP0 && !isP1) return

        const currentPlayer = isP0 ? 0 : 1
        if (this.activeDuel.gameState.turn !== currentPlayer) {
          this.sendToPlayer(playerId, { type: 'error', message: 'Not your turn' })
          return
        }

        try {
          const newState = placeCard(this.activeDuel.gameState, currentPlayer, msg.cardIndex, msg.row, msg.col)
          this.activeDuel.gameState = newState

          if (newState.phase === 'sudden_death') {
            setTimeout(() => {
              if (this.activeDuel) {
                this.activeDuel.gameState = continueSuddenDeath(this.activeDuel.gameState)
                this.broadcastDuelState()
              }
            }, 1200)
          }

          this.broadcastDuelState()

          if (newState.phase === 'ended') {
            const tradeResult = this.computeTradeResult(newState)
            this.activeDuel.tradeResult = tradeResult
            this.phase = 'rewards'

            setTimeout(() => {
              this.broadcastAll({
                type: 'duel_ended',
                winner: newState.winner as 0 | 1 | 'draw',
                tradeResult,
              })
            }, 600)
          }
        } catch (e: any) {
          this.sendToPlayer(playerId, { type: 'error', message: e.message })
        }
        break
      }

      case 'return_to_lobby': {
        this.activeDuel = null
        this.phase = 'waiting'
        this.selectedDuellists = []
        for (const p of this.players) {
          p.hand = null
          p.isReady = false
        }
        this.broadcastAll({ type: 'return_to_waiting' })
        // Send full state to everyone
        for (const p of this.players) {
          this.sendLobbyState(p.id)
        }
        break
      }
    }
  }

  private broadcastExcept(excludeId: string, msg: ServerMessage) {
    for (const p of this.players) {
      if (p.id !== excludeId) {
        this.sendToPlayer(p.id, msg)
      }
    }
  }

  private broadcastDuelState() {
    if (!this.activeDuel) return
    const { player0Id, player1Id, gameState } = this.activeDuel
    const isOpen = this.config.specialRules.includes('Open')

    for (const p of this.players) {
      const hands = {
        player0: (p.id === player0Id || isOpen) ? gameState.hands[0] : undefined,
        player1: (p.id === player1Id || isOpen) ? gameState.hands[1] : undefined,
      }

      this.sendToPlayer(p.id, {
        type: 'duel_state',
        gameState: {
          ...gameState,
          hands: [
            (p.id === player0Id || isOpen) ? gameState.hands[0] : gameState.hands[0].map(() => null as any),
            (p.id === player1Id || isOpen) ? gameState.hands[1] : gameState.hands[1].map(() => null as any),
          ],
        },
        hands,
      })
    }
  }

  private computeTradeResult(gameState: GameState): TradeResult | null {
    if (this.config.tradeRule === 'Friendly') return null
    if (!gameState || gameState.phase !== 'ended' || gameState.winner === null) return null

    const board = gameState.board
    const winner = gameState.winner
    if (winner === 'draw') return { player0Gained: [], player0Lost: [], player1Gained: [], player1Lost: [] }

    const result: TradeResult = { player0Gained: [], player0Lost: [], player1Gained: [], player1Lost: [] }

    switch (this.config.tradeRule) {
      case 'One': {
        const captured = this.getCapturedCards(board, winner === 0 ? 1 : 0, winner as 0 | 1)
        if (captured.length > 0) {
          captured.sort((a, b) => b.level - a.level)
          const taken = captured[0].id
          if (winner === 0) { result.player0Gained.push(taken); result.player1Lost.push(taken) }
          else { result.player1Gained.push(taken); result.player0Lost.push(taken) }
        }
        break
      }
      case 'Diff': {
        const p0Count = this.countOwned(board, 0) + gameState.hands[0].length
        const p1Count = this.countOwned(board, 1) + gameState.hands[1].length
        const diff = Math.abs(p0Count - p1Count)
        const captured = this.getCapturedCards(board, winner === 0 ? 1 : 0, winner as 0 | 1)
        captured.sort((a, b) => b.level - a.level)
        for (let i = 0; i < Math.min(diff, captured.length); i++) {
          if (winner === 0) { result.player0Gained.push(captured[i].id); result.player1Lost.push(captured[i].id) }
          else { result.player1Gained.push(captured[i].id); result.player0Lost.push(captured[i].id) }
        }
        break
      }
      case 'Direct': {
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            const cell = board[r][c]
            if (!cell) continue
            if (cell.owner === 0 && cell.placedBy === 1) {
              result.player0Gained.push(cell.card.id); result.player1Lost.push(cell.card.id)
            } else if (cell.owner === 1 && cell.placedBy === 0) {
              result.player1Gained.push(cell.card.id); result.player0Lost.push(cell.card.id)
            }
          }
        }
        break
      }
      case 'All': {
        if (winner === 0) {
          result.player0Gained.push(...this.activeDuel!.player1Hand)
          result.player1Lost.push(...this.activeDuel!.player1Hand)
        } else {
          result.player1Gained.push(...this.activeDuel!.player0Hand)
          result.player0Lost.push(...this.activeDuel!.player0Hand)
        }
        break
      }
    }
    return result
  }

  private getCapturedCards(board: GameState['board'], placedBy: 0 | 1, owner: 0 | 1): Card[] {
    const cards: Card[] = []
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const cell = board[r][c]
        if (cell && cell.owner === owner && cell.placedBy === placedBy) {
          cards.push(cell.card)
        }
      }
    }
    return cards
  }

  private countOwned(board: GameState['board'], player: 0 | 1): number {
    let count = 0
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (board[r][c]?.owner === player) count++
      }
    }
    return count
  }
}
