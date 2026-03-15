# Data Models — v3.0.0 Multiplayer

## PlayerProfile

```typescript
interface PlayerProfile {
  id: string                    // UUID, generated on first launch
  name: string                  // Display name, max 16 chars
  taglinePart1: number          // Index into TAGLINE_PART1 array (0-99)
  taglinePart2: number          // Index into TAGLINE_PART2 array (0-99)
  borderId: string              // e.g. 'default_gold', 'unlock_crystal'
  backgroundId: string          // e.g. 'default_gradient_blue', 'loc_balamb_garden'
  charIconId: string            // e.g. 'human_01', 'beast_05', 'npc_quistis'
  stats: ProfileStats
  matchHistory: MatchRecord[]   // Last 20 matches
}

interface ProfileStats {
  wins: number
  losses: number
  draws: number
}

interface MatchRecord {
  opponentName: string
  result: 'win' | 'loss' | 'draw'
  date: string                  // ISO date string
}
```

**Storage**: `localStorage` key `'tripletriad-profile'`. Loaded on app start, saved on change.

---

## Profile Customisation Options

### Borders
```typescript
interface BorderDef {
  id: string
  name: string
  css: string                   // CSS border shorthand or class
  unlockCondition: UnlockCondition | null  // null = default (always available)
}

type UnlockCondition =
  | { type: 'chapter'; chapter: number }
  | { type: 'quest'; questId: string }
  | { type: 'wins'; count: number }
  | { type: 'dungeons_cleared'; count: number }
```

### Backgrounds
```typescript
interface BackgroundDef {
  id: string
  name: string
  css: string                   // CSS gradient/pattern
  locationId?: string           // If unlocked by visiting a location
  unlockCondition: UnlockCondition | null
}
```

### Character Icons
```typescript
interface CharIconDef {
  id: string
  name: string
  src: string                   // Path to image file
  category: 'human' | 'beast' | 'npc'
  npcId?: string                // If unlocked by meeting/beating an NPC
  unlockCondition: UnlockCondition | null
}
```

### Taglines
```typescript
// 100 entries each
const TAGLINE_PART1: string[] = [
  "Mighty Dragon", "Silent Knight", "Crimson Flame", ...
]
const TAGLINE_PART2: string[] = [
  "Gentle Soul", "Iron Will", "Dark Secret", ...
]

// Display: `${TAGLINE_PART1[profile.taglinePart1]} | ${TAGLINE_PART2[profile.taglinePart2]}`
```

---

## Lobby Types

```typescript
interface Lobby {
  id: string                    // UUID
  joinCode: string              // 6-char uppercase code
  hostId: string                // PlayerProfile.id of host
  hostName: string              // Host display name
  players: LobbyPlayer[]       // All connected players (max 30)
  config: DuelConfig
  phase: LobbyPhase
  activeDuel: ActiveDuel | null
  createdAt: number             // timestamp
}

type LobbyPhase = 'waiting' | 'selecting' | 'duelling' | 'rewards'

interface LobbyPlayer {
  id: string                    // PlayerProfile.id
  profile: PlayerProfile
  hand: string[] | null         // 5 cardIds or null if not selected
  isReady: boolean              // Has selected hand
  ws: WebSocket | null          // Server-side only (not sent to clients)
}

interface LobbyInfo {
  id: string
  hostName: string
  playerCount: number
  maxPlayers: number            // 30
  config: DuelConfig
  phase: LobbyPhase
}
```

---

## Duel Configuration

```typescript
interface DuelConfig {
  specialRules: SpecialRule[]   // Same, Plus, Combo, Same Wall, Elemental, Random, Open, Sudden Death
  tradeRule: TradeRule
}

type TradeRule = 'One' | 'Diff' | 'Direct' | 'All' | 'Friendly'
// 'Friendly' = no card exchange after duel
```

---

## Active Duel State

```typescript
interface ActiveDuel {
  player0Id: string
  player1Id: string
  player0Hand: string[]         // 5 cardIds
  player1Hand: string[]         // 5 cardIds
  gameState: GameState          // From engine
  tradeResult: TradeResult | null
}
```

---

## Lobby Messages

```typescript
type LobbyMessage =
  // Client → Server
  | { type: 'join'; profile: PlayerProfile }
  | { type: 'leave' }
  | { type: 'set_config'; config: DuelConfig }
  | { type: 'select_hand'; cardIds: string[] }
  | { type: 'select_duellists'; player0Id: string; player1Id: string }
  | { type: 'start_duel' }
  | { type: 'place_card'; cardIndex: number; row: number; col: number }
  | { type: 'claim_reward'; selectedCardIds?: string[] }
  | { type: 'return_to_lobby' }
  // Server → Client
  | { type: 'lobby_state'; lobby: LobbyInfo; players: LobbyPlayerInfo[]; config: DuelConfig; phase: LobbyPhase; activeDuel: ActiveDuelInfo | null }
  | { type: 'player_joined'; player: LobbyPlayerInfo }
  | { type: 'player_left'; playerId: string }
  | { type: 'config_updated'; config: DuelConfig }
  | { type: 'hand_locked'; playerId: string }
  | { type: 'duel_starting'; player0: LobbyPlayerInfo; player1: LobbyPlayerInfo; config: DuelConfig }
  | { type: 'duel_state'; gameState: GameState; hands?: { player0?: Card[]; player1?: Card[] } }
  | { type: 'duel_ended'; winner: 0 | 1 | 'draw'; tradeResult: any }
  | { type: 'reward_applied'; deltas: { gained: string[]; lost: string[] } }
  | { type: 'return_to_waiting' }
  | { type: 'error'; message: string }

// Sanitised player info (no WebSocket ref)
interface LobbyPlayerInfo {
  id: string
  profile: PlayerProfile
  isReady: boolean
}
```

---

## Unlock Check Function

```typescript
function isUnlocked(condition: UnlockCondition | null, worldState: WorldPlayerState): boolean {
  if (!condition) return true  // Default items always unlocked
  switch (condition.type) {
    case 'chapter': return worldState.storyChapter >= condition.chapter
    case 'quest': return worldState.completedQuests.includes(condition.questId)
    case 'wins': return Object.values(worldState.npcWins).reduce((a, b) => a + b, 0) >= condition.count
    case 'dungeons_cleared': return worldState.clearedDungeons.length >= condition.count
  }
}

// Location backgrounds: unlocked when location visited (unlockedOrder covers this)
// NPC icons: unlocked when NPC beaten (npcWins[npcId] > 0) or seen (seenContent)
```
