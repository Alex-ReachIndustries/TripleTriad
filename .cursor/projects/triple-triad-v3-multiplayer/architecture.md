# Architecture — v3.0.0 Multiplayer

## Transport Abstraction

All multiplayer communication flows through an `ITransport` interface. Two implementations exist:

```typescript
interface ITransport {
  connect(target: string): Promise<void>
  disconnect(): void
  send(msg: LobbyMessage): void
  onMessage(handler: (msg: LobbyMessage) => void): void
  onDisconnect(handler: () => void): void
  readonly connected: boolean
  readonly type: 'websocket' | 'ble'
}
```

### WebSocketTransport
- Wraps existing `WebSocket` connection to backend
- Connect target: `ws://<host>:3000/lobby?lobbyId=<id>&playerId=<id>`
- All messages JSON-serialised
- Used by: web browser (always), Android (fallback)

### BleTransport
- Wraps `@capacitor-community/bluetooth-le`
- Connect target: BLE device ID from scan results
- Messages serialised as JSON UTF-8 over BLE characteristics
- Chunking: messages > 512 bytes split across multiple writes (MTU negotiation)
- Used by: Android only

### Transport Factory
```typescript
function createTransport(mode: 'websocket' | 'ble'): ITransport
```
Platform detection: `Capacitor.isNativePlatform()` determines if BLE is available. User picks mode on Host/Join screen; web always uses WebSocket.

---

## Lobby Protocol (WebSocket)

### HTTP Endpoints (REST)

| Method | Path | Body | Response | Description |
|--------|------|------|----------|-------------|
| POST | /lobby | `{ hostProfile: PlayerProfile }` | `{ lobbyId, joinCode }` | Create lobby |
| GET | /lobbies | — | `{ lobbies: LobbyInfo[] }` | List public lobbies |
| DELETE | /lobby/:id | — | `{ ok: true }` | Host closes lobby |

### WebSocket Connection
```
ws://host:3000/lobby?lobbyId=<id>&playerId=<uuid>
```

### Message Types (Client → Server)

| Type | Payload | Who | Description |
|------|---------|-----|-------------|
| `join` | `{ profile: PlayerProfile }` | Any | Join lobby, send profile |
| `leave` | `{}` | Any | Leave lobby |
| `set_config` | `{ config: DuelConfig }` | Host | Update rules/trade config |
| `select_hand` | `{ cardIds: string[] }` | Any | Lock in 5-card hand |
| `select_duellists` | `{ player0Id, player1Id }` | Host | Pick 2 players |
| `start_duel` | `{}` | Host | Begin duel (both duellists must have hands) |
| `place_card` | `{ cardIndex, row, col }` | Duellist | Place a card |
| `claim_reward` | `{ selectedCardIds?: string[] }` | Winner | Confirm trade selection |
| `return_to_lobby` | `{}` | Duellist | Back to waiting room |

### Message Types (Server → Client)

| Type | Payload | To | Description |
|------|---------|-----|-------------|
| `lobby_state` | `{ players, config, phase, activeDuel }` | All | Full lobby sync |
| `player_joined` | `{ player: LobbyPlayer }` | All | Someone joined |
| `player_left` | `{ playerId }` | All | Someone left |
| `config_updated` | `{ config: DuelConfig }` | All | Rules changed |
| `duel_starting` | `{ player0, player1, rules }` | All | Duel about to begin |
| `duel_state` | `{ gameState, spectatorHands? }` | All | Board update |
| `duel_ended` | `{ winner, tradeResult }` | All | Duel over |
| `reward_applied` | `{ player0Inventory, player1Inventory }` | Duellists | Inventory changes |
| `return_to_waiting` | `{}` | All | Everyone back to lobby |
| `error` | `{ message }` | Sender | Error response |

### Lobby Phases
```
'waiting' → 'selecting' → 'duelling' → 'rewards' → 'waiting'
```

---

## Lobby Protocol (BLE)

### Service Definition
- **Service UUID**: `0000ff00-0000-1000-8000-00805f9b34fb` (custom)
- **Lobby Characteristic** (read/write/notify): `0000ff01-...` — lobby messages
- **Advertisement data**: UTF-8 lobby name (host's display name, truncated to 20 bytes)

### BLE Host (Peripheral)
1. Start advertising with service UUID + lobby name
2. Accept connections (up to 30)
3. Run lobby logic locally (same code as backend, but in-process)
4. On characteristic write: parse as LobbyMessage, process, notify all subscribers
5. On disconnect: remove player from lobby

### BLE Client (Central)
1. Scan for devices advertising service UUID
2. Read advertisement data for lobby name
3. Connect to selected device
4. Subscribe to lobby characteristic for notifications
5. Write to characteristic to send messages

### Message Format
Same JSON `LobbyMessage` types as WebSocket. Chunked if > 512 bytes:
```
[chunk_index:1][total_chunks:1][payload:N]
```
Reassembled on receive before parsing.

---

## State Sync

### Lobby State (Server-Authoritative)
Server/BLE-host holds canonical lobby state:
- Player list with profiles and ready status
- DuelConfig (rules + trade rule)
- Active duel GameState (if duelling)
- Phase: waiting | selecting | duelling | rewards

### Duel State (Server-Authoritative)
- Server runs game engine (`placeCard`, `createGame`)
- Broadcasts full `GameState` after each move
- Spectators receive sanitised state (hands hidden unless Open rule)
- Duellists receive full state (their own hand visible, opponent hand per Open rule)

### Inventory Sync
- Card selection validated server-side against player's declared inventory
- After duel: server computes trade, sends inventory deltas to both players
- Players apply deltas to localStorage worldState
- "Friendly" trade rule: skip trade computation entirely

---

## Security Considerations

- **No auth** — profiles are localStorage-only, no server accounts
- **Inventory trust**: server validates hand selection against declared inventory but can't verify localStorage (acceptable for local/friend play)
- **BLE range**: ~10-100m, inherently local (no internet exposure)
- **WebSocket**: existing CORS policy, no secrets, rooms are ephemeral
- **Room spam**: rate-limit lobby creation (max 5 per IP per minute)
- **Profile data**: sanitise display names and taglines (max length, no HTML)
