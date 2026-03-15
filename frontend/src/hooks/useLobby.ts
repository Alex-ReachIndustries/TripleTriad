/**
 * useLobby: manages lobby connection, state, and message handling.
 * Transport-agnostic — works with WebSocket or BLE transports.
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import type {
  PlayerProfile, DuelConfig, LobbyPlayerInfo, LobbyPhase,
  LobbyInfo, ServerMessage, ActiveDuelInfo, ITransport,
} from '../types/multiplayer'
import type { GameState } from '../game/types'
import { WebSocketTransport } from '../transport/WebSocketTransport'
import { getLobbyWsUrl } from '../api/client'

export interface LobbyState {
  lobby: LobbyInfo | null
  players: LobbyPlayerInfo[]
  config: DuelConfig
  phase: LobbyPhase
  activeDuel: ActiveDuelInfo | null
  selectedDuellists: string[]
  connected: boolean
  error: string | null
  duelGameState: GameState | null
  duelWinner: 0 | 1 | 'draw' | null
  tradeResult: any | null
}

const initialState: LobbyState = {
  lobby: null,
  players: [],
  config: { specialRules: [], tradeRule: 'Friendly' },
  phase: 'waiting',
  activeDuel: null,
  selectedDuellists: [],
  connected: false,
  error: null,
  duelGameState: null,
  duelWinner: null,
  tradeResult: null,
}

function setupMessageHandler(transport: ITransport, setState: React.Dispatch<React.SetStateAction<LobbyState>>) {
  transport.onMessage((msg: ServerMessage) => {
    switch (msg.type) {
      case 'lobby_state':
        setState(prev => ({
          ...prev,
          lobby: msg.lobby,
          players: msg.players,
          config: msg.config,
          phase: msg.phase,
          activeDuel: msg.activeDuel,
          selectedDuellists: (msg as any).selectedDuellists || [],
          error: null,
        }))
        break

      case 'player_joined':
        setState(prev => ({
          ...prev,
          players: prev.players.some(p => p.id === msg.player.id)
            ? prev.players.map(p => p.id === msg.player.id ? msg.player : p)
            : [...prev.players, msg.player],
        }))
        break

      case 'player_left':
        setState(prev => ({
          ...prev,
          players: prev.players.filter(p => p.id !== msg.playerId),
        }))
        break

      case 'config_updated':
        setState(prev => ({ ...prev, config: msg.config }))
        break

      case 'hand_locked':
        setState(prev => ({
          ...prev,
          players: prev.players.map(p =>
            p.id === msg.playerId ? { ...p, isReady: true } : p
          ),
        }))
        break

      case 'duel_starting':
        setState(prev => ({
          ...prev,
          phase: 'duelling',
          activeDuel: {
            player0Id: msg.player0.id,
            player1Id: msg.player1.id,
            gameState: null as any,
          },
        }))
        break

      case 'duel_state':
        setState(prev => ({
          ...prev,
          duelGameState: msg.gameState,
          phase: 'duelling',
        }))
        break

      case 'duel_ended':
        setState(prev => ({
          ...prev,
          phase: 'rewards',
          duelWinner: msg.winner,
          tradeResult: msg.tradeResult,
        }))
        break

      case 'return_to_waiting':
        setState(prev => ({
          ...prev,
          phase: 'waiting',
          activeDuel: null,
          duelGameState: null,
          duelWinner: null,
          tradeResult: null,
          selectedDuellists: [],
        }))
        break

      case 'error':
        setState(prev => ({ ...prev, error: msg.message }))
        break

      default: {
        const anyMsg = msg as any
        if (anyMsg.type === 'duellists_selected') {
          setState(prev => ({
            ...prev,
            selectedDuellists: [anyMsg.player0Id, anyMsg.player1Id],
          }))
        }
      }
    }
  })

  transport.onDisconnect(() => {
    setState(prev => ({ ...prev, connected: false }))
  })
}

export function useLobby(profile: PlayerProfile) {
  const [state, setState] = useState<LobbyState>(initialState)
  const transportRef = useRef<ITransport | null>(null)
  const profileRef = useRef(profile)
  profileRef.current = profile

  /** Connect via WebSocket to a backend-hosted lobby */
  const connect = useCallback(async (lobbyId: string) => {
    const transport = new WebSocketTransport()
    transportRef.current = transport
    setupMessageHandler(transport, setState)

    try {
      const url = getLobbyWsUrl(lobbyId, profileRef.current.id)
      await transport.connect(url)
      setState(prev => ({ ...prev, connected: true, error: null }))
      transport.send({ type: 'join', profile: profileRef.current })
    } catch (e) {
      setState(prev => ({ ...prev, error: e instanceof Error ? e.message : 'Connection failed' }))
    }
  }, [])

  /** Connect using a pre-created transport (e.g. BleHostTransport or BleTransport) */
  const connectWithTransport = useCallback(async (transport: ITransport) => {
    transportRef.current = transport
    setupMessageHandler(transport, setState)

    try {
      await transport.connect('')  // BLE transports handle their own connection target
      setState(prev => ({ ...prev, connected: true, error: null }))
      // For BLE host, the join is handled internally by BleHostTransport
      // For BLE client, send join after connecting
      if (transport.type === 'ble') {
        transport.send({ type: 'join', profile: profileRef.current })
      }
    } catch (e) {
      setState(prev => ({ ...prev, error: e instanceof Error ? e.message : 'Connection failed' }))
    }
  }, [])

  const disconnect = useCallback(() => {
    transportRef.current?.send({ type: 'leave' })
    transportRef.current?.disconnect()
    transportRef.current = null
    setState(initialState)
  }, [])

  const setConfig = useCallback((config: DuelConfig) => {
    transportRef.current?.send({ type: 'set_config', config })
  }, [])

  const selectHand = useCallback((cardIds: string[]) => {
    transportRef.current?.send({ type: 'select_hand', cardIds })
  }, [])

  const selectDuellists = useCallback((player0Id: string, player1Id: string) => {
    transportRef.current?.send({ type: 'select_duellists', player0Id, player1Id })
  }, [])

  const startDuel = useCallback(() => {
    transportRef.current?.send({ type: 'start_duel' })
  }, [])

  const placeCard = useCallback((cardIndex: number, row: number, col: number) => {
    transportRef.current?.send({ type: 'place_card', cardIndex, row, col })
  }, [])

  const returnToLobby = useCallback(() => {
    transportRef.current?.send({ type: 'return_to_lobby' })
  }, [])

  useEffect(() => {
    return () => {
      transportRef.current?.disconnect()
    }
  }, [])

  return {
    state,
    connect,
    connectWithTransport,
    disconnect,
    setConfig,
    selectHand,
    selectDuellists,
    startDuel,
    placeCard,
    returnToLobby,
  }
}
