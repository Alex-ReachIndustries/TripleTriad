/**
 * Multiplayer types for v3.0.0 lobby system, profiles, and duels.
 */

import type { Card } from './card'
import type { SpecialRule } from './world'
import type { GameState } from '../game/types'

// ─── Trade Rules ───

export type TradeRule2P = 'One' | 'Diff' | 'Direct' | 'All' | 'Friendly'

// ─── Player Profile ───

export interface ProfileStats {
  wins: number
  losses: number
  draws: number
}

export interface MatchRecord {
  opponentName: string
  result: 'win' | 'loss' | 'draw'
  date: string // ISO date string
}

export interface PlayerProfile {
  id: string                    // UUID
  name: string                  // Display name, max 16 chars
  taglinePart1: number          // Index into TAGLINE_PART1 (0-99)
  taglinePart2: number          // Index into TAGLINE_PART2 (0-99)
  borderId: string              // e.g. 'default_solid', 'unlock_crystal'
  backgroundId: string          // e.g. 'default_slate', 'loc_balamb_garden'
  charIconId: string            // e.g. 'human_01', 'beast_05', 'npc_quistis'
  stats: ProfileStats
  matchHistory: MatchRecord[]   // Last 20 matches
}

// ─── Profile Customisation Definitions ───

export type ProfileUnlockCondition =
  | { type: 'chapter'; chapter: number }
  | { type: 'quest'; questId: string }
  | { type: 'wins'; count: number }
  | { type: 'dungeons_cleared'; count: number }
  | { type: 'location_visited'; locationId: string }
  | { type: 'npc_beaten'; npcId: string }

export interface BorderDef {
  id: string
  name: string
  css: string                    // CSS border shorthand
  unlockCondition: ProfileUnlockCondition | null
}

export interface BackgroundDef {
  id: string
  name: string
  css: string                    // CSS gradient/pattern/color
  locationId?: string            // If unlocked by visiting a location
  unlockCondition: ProfileUnlockCondition | null
}

export interface CharIconDef {
  id: string
  name: string
  src: string                    // Path to image file
  category: 'human' | 'beast' | 'npc'
  npcId?: string                 // If unlocked by meeting/beating an NPC
  unlockCondition: ProfileUnlockCondition | null
}

// ─── Duel Configuration ───

export interface DuelConfig {
  specialRules: SpecialRule[]
  tradeRule: TradeRule2P
}

// ─── Lobby Types ───

export type LobbyPhase = 'waiting' | 'selecting' | 'duelling' | 'rewards'

export interface LobbyPlayerInfo {
  id: string
  profile: PlayerProfile
  isReady: boolean
}

export interface LobbyInfo {
  id: string
  hostName: string
  playerCount: number
  maxPlayers: number             // 30
  config: DuelConfig
  phase: LobbyPhase
}

export interface ActiveDuelInfo {
  player0Id: string
  player1Id: string
  gameState: GameState
  /** Hands visible only to duellists and when Open rule is active */
  hands?: { player0?: Card[]; player1?: Card[] }
}

// ─── Lobby Messages ───

export type ClientMessage =
  | { type: 'join'; profile: PlayerProfile }
  | { type: 'leave' }
  | { type: 'set_config'; config: DuelConfig }
  | { type: 'select_hand'; cardIds: string[] }
  | { type: 'select_duellists'; player0Id: string; player1Id: string }
  | { type: 'start_duel' }
  | { type: 'place_card'; cardIndex: number; row: number; col: number }
  | { type: 'claim_reward'; selectedCardIds?: string[] }
  | { type: 'return_to_lobby' }

export type ServerMessage =
  | { type: 'lobby_state'; lobby: LobbyInfo; players: LobbyPlayerInfo[]; config: DuelConfig; phase: LobbyPhase; activeDuel: ActiveDuelInfo | null }
  | { type: 'player_joined'; player: LobbyPlayerInfo }
  | { type: 'player_left'; playerId: string }
  | { type: 'config_updated'; config: DuelConfig }
  | { type: 'hand_locked'; playerId: string }
  | { type: 'duel_starting'; player0: LobbyPlayerInfo; player1: LobbyPlayerInfo; config: DuelConfig }
  | { type: 'duel_state'; gameState: GameState; hands?: { player0?: Card[]; player1?: Card[] } }
  | { type: 'duel_ended'; winner: 0 | 1 | 'draw'; tradeResult: TradeResult | null }
  | { type: 'reward_applied'; deltas: { gained: string[]; lost: string[] } }
  | { type: 'return_to_waiting' }
  | { type: 'error'; message: string }

export type LobbyMessage = ClientMessage | ServerMessage

// ─── Trade Result ───

export interface TradeResult {
  player0Gained: string[]       // Card IDs gained by player 0
  player0Lost: string[]         // Card IDs lost by player 0
  player1Gained: string[]
  player1Lost: string[]
}

// ─── Transport ───

export interface ITransport {
  connect(target: string): Promise<void>
  disconnect(): void
  send(msg: ClientMessage): void
  onMessage(handler: (msg: ServerMessage) => void): void
  onDisconnect(handler: () => void): void
  readonly connected: boolean
  readonly type: 'websocket' | 'ble'
}
