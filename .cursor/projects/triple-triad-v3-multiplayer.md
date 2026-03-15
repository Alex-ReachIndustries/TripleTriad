# Project: Triple Triad v3.0.0 — Multiplayer Overhaul

## Executive Summary
Complete rework of the 2-player system into a party/lobby experience with player profiles, spectating, and dual transport (WebSocket for web, Bluetooth LE for Android). Players create or join lobbies hosting up to 30 people. The host selects two players to duel while everyone else spectates. Profile cards with customisable borders, backgrounds, character icons, and taglines provide player identity. Real card inventory is at stake. Success = a polished local/online multiplayer card night experience faithful to the FF8 vibe.

## How to Resume This Project
1. Read this file top to bottom to understand current state
2. **If all phases show `[x] Complete` → the project is finished. Tell the user and stop.**
3. Otherwise, find the first incomplete phase/todo and continue from there
4. Run `/execute-project .cursor/projects/triple-triad-v3-multiplayer.md` to continue from where it left off

---

## Key Design Decisions

### Dual Transport
- **Web (browser)**: Backend WebSocket lobbies (existing server.js, extended)
- **Android (Capacitor)**: BLE via `@capacitor-community/bluetooth-le` for local play. Falls back to backend WebSocket if BLE unavailable.
- Both transports use identical game protocol — only the pipe differs.

### Lobby Architecture
- Up to **30 players** per lobby
- **Host** creates lobby, configures rules, selects duellists
- **All joiners** (including host) enter as spectators
- Host picks **2 players** → Start Duel → everyone enters duel screen
- After duel + reward claim → everyone returns to waiting room
- **One duel at a time** per lobby

### Profile Cards
- **Border**: 10 default plain + unlockable fancy borders (from progression)
- **Background**: 10 default plain + 28 location backgrounds (unlocked by visiting locations)
- **Character icon**: 10 default human + 10 default animal/beast + ~132 NPC portraits (unlocked by meeting/beating NPCs)
- **Tagline**: 2 parts × 2 words each, mix-and-match from 100 first-halves + 100 second-halves = 10,000 combinations
- Stored in localStorage as part of player profile

### Card Stakes
- **Real inventory** — cards won/lost in 2P duels affect world mode inventory
- Trade rules configurable by host, including a **"Friendly"** rule where no cards are exchanged
- Standard trade rules: One, Diff, Direct, All, Friendly

### Spectating
- Spectators see the board + placed cards in real-time
- Spectators only see player hands when **Open** rule is active (fog of war otherwise)
- Read-only view — no interaction during duel

### Tutorial Popups
- 14 existing tutorials must fire correctly in 2P duels (same trigger logic as 1P)
- `seenTutorials` tracked per player in localStorage, shared with 1P progress

---

## Phases

### Phase 1: Research & Architecture
**Status:** [x] Complete

Goal: Produce architecture docs, finalise data models, and resolve any remaining design questions.

Tasks:
- [x] Create guidance docs at `.cursor/projects/triple-triad-v3-multiplayer/`
  - [x] `architecture.md` — transport abstraction, lobby protocol, state sync, BLE pairing flow
  - [x] `ui-ux.md` — screen flow diagrams, mobile layouts, profile card design
  - [x] `data-models.md` — PlayerProfile, Lobby, LobbyPlayer, DuelConfig types
- [x] Design WebSocket protocol extensions (lobby messages, spectator sync, profile exchange)
- [x] Design BLE protocol (service UUID, characteristics, message format)
- [x] Plan transport abstraction layer (interface that WebSocket and BLE both implement)

---

### Phase 2: Player Profile System
**Status:** [x] Complete

Goal: Implement profile data model, customisation UI, and unlock system. Generate default + unlockable art assets.

Todos:
- [ ] `todo-profile-types.md` — PlayerProfile type (name, border, bg, charIcon, tagline, stats: wins/losses/draws, matchHistory summary), persist in localStorage. ProfileCard component for rendering.
- [ ] `todo-profile-defaults.md` — Generate 100+100 tagline word pairs. Define 10 default borders (CSS), 10 default backgrounds (CSS gradients/patterns), 10 human icons, 10 beast icons.
- [ ] `todo-profile-unlocks.md` — Unlock conditions: location backgrounds (visited location), NPC char icons (met/beaten NPC), fancy borders (chapter milestones, quest completions). Hook into worldState progression.
- [ ] `todo-profile-art.md` — Use artgen service to generate: 10 default human portrait icons (512×512), 10 default beast portrait icons (512×512). Save to `frontend/public/profiles/`.
- [ ] `todo-profile-ui.md` — Profile editor screen: border picker grid, background picker grid (locked items greyed with unlock hint), character icon picker (categories: default human, default beast, unlocked NPCs), tagline builder (two dropdown selectors). Live preview of profile card.
- [ ] `todo-profile-stats.md` — Track win/loss/draw counts and recent match history (last 20 matches: opponent name, result, date). Update after each 2P duel.

---

### Phase 3: Lobby System (Backend)
**Status:** [x] Complete

Goal: Extend the backend to support persistent lobbies with multiple players, host controls, spectating, and configurable rules.

Todos:
- [ ] `todo-lobby-backend.md` — Extend server.js: Lobby data structure (host, players[], config, activeDuel state). HTTP endpoints: POST /lobby (create), GET /lobbies (list public), POST /lobby/:id/join. WebSocket messages: join_lobby, leave_lobby, set_config, select_duellists, start_duel, duel_state, duel_ended, player_profile.
- [ ] `todo-lobby-spectate.md` — Spectator sync: broadcast board state to all lobby members during duel. Respect Open rule for hand visibility. Spectator count shown in UI.
- [ ] `todo-lobby-config.md` — DuelConfig: specialRules (Same, Plus, Combo, etc.), tradeRule (One, Diff, Direct, All, Friendly). Host can change config in waiting room. Config sent to all players on update.
- [ ] `todo-lobby-rewards.md` — After duel ends: compute card trades using real inventories. For "Friendly" rule: skip card exchange. Send inventory updates to both players. Broadcast result to spectators.

---

### Phase 4: Lobby System (Frontend)
**Status:** [x] Complete

Goal: Build the complete lobby UI flow — from the 2P home screen through lobby creation, waiting room, duel, and back.

Todos:
- [ ] `todo-2p-home.md` — New 2P home screen: "Host", "Join", "Profile" buttons. Current profile card displayed prominently. Replaces existing PlayPage home.
- [ ] `todo-lobby-host.md` — Host flow: create lobby → enter waiting room. Waiting room shows: joined players' profile cards, rule config panel (special rules toggles + trade rule dropdown including Friendly), "Select Cards" button for hand picker, player selection for duel (tap two profiles → "Start Duel" button).
- [ ] `todo-lobby-join.md` — Join flow: lobby browser screen showing public lobbies (host name, player count, rules, status: waiting/in-duel). Tap to join → enter waiting room as spectator. Hand picker for card selection.
- [ ] `todo-lobby-duel.md` — Duel screen: reuse GameBoard for players, read-only GameBoard for spectators. Victory/defeat fanfares. Reward screen with card trade display. "Return to Lobby" button → back to waiting room.
- [ ] `todo-lobby-hand-picker.md` — Card selection from real inventory (not infinite copies). Pick 5 cards. Validate against inventory counts. Lock selection when ready. Show selected hand in waiting room profile card.

---

### Phase 5: Bluetooth LE Transport (Android)
**Status:** [x] Complete

Goal: Implement BLE-based local multiplayer for Android via Capacitor plugin. One device hosts (peripheral), others scan and join (central).

Todos:
- [ ] `todo-ble-plugin.md` — Install `@capacitor-community/bluetooth-le`. Configure Android permissions (BLUETOOTH, BLUETOOTH_ADMIN, ACCESS_FINE_LOCATION). Add to capacitor.config.ts.
- [ ] `todo-ble-transport.md` — Transport abstraction: `ITransport` interface with connect/disconnect/send/onMessage. `WebSocketTransport` wraps existing WS. `BleTransport` wraps BLE plugin. Factory function selects transport based on platform + user choice.
- [ ] `todo-ble-host.md` — BLE host (peripheral role): advertise custom service UUID, accept connections (up to 30), relay lobby messages between all connected devices. Host device runs lobby logic locally (no backend needed).
- [ ] `todo-ble-join.md` — BLE join (central role): scan for nearby devices advertising the service UUID, show discovered lobbies (host name from advertisement data), connect to selected host. Receive/send lobby messages via BLE characteristics.
- [ ] `todo-ble-fallback.md` — Platform detection: if BLE unavailable (web browser, or Android without BLE), fall back to WebSocket transport. UI shows transport indicator (BLE icon or WiFi icon).

---

### Phase 6: Player Records Screen
**Status:** [x] Complete

Goal: New "Player Records" option on the title screen showing interesting single-player and 2P statistics.

Todos:
- [ ] `todo-records-data.md` — Extend worldState with persistent stats tracking: total 1P wins/losses/draws, total 2P wins/losses/draws, cards gained/lost lifetime counts, total gil earned, dungeons cleared count, quests completed count, time played (track session durations), longest win streak, most-used card, rarest card owned, NPCs defeated count, total matches played. Backward-compat migration for existing saves.
- [ ] `todo-records-ui.md` — Player Records screen: accessible from title screen. Sections for 1P stats, 2P stats, card collection stats, world progress stats. Visual stat boxes with icons. Profile card displayed at top. Mobile responsive.

---

### Phase 7: Tutorial Integration for 2P
**Status:** [x] Complete

Goal: Ensure all 14 tutorial popups fire correctly during 2P duels, using the same trigger logic as 1P.

Todos:
- [ ] `todo-2p-tutorials.md` — Pass seenTutorials + onMarkTutorialSeen to lobby duel component. Call getTutorialsForRules() when host starts duel with configured rules. Show tutorial queue before duel begins (same flow as BattleScreen). Verify all 14 tutorials: basic_gameplay, open, same, plus, combo, same_wall, elemental, random, sudden_death, trade_one, trade_diff, trade_direct, trade_all, rule_spreading. Add tutorial for new "Friendly" trade rule.

---

### Phase 8: Polish, Testing & Build
**Status:** [ ] In Progress

Goal: End-to-end testing, mobile responsiveness, APK build, and final report.

Tasks:
- [ ] Test full web flow: create lobby → join from another tab → host configures rules → select duellists → play duel → rewards applied → return to lobby
- [ ] Test spectator view: third player joins, watches duel, correct hand visibility based on Open rule
- [ ] Test profile customisation: create profile, unlock items via 1P progression, verify unlocks appear
- [ ] Test real inventory stakes: cards won/lost in 2P reflected in world mode
- [ ] Test Friendly trade rule: no cards exchanged
- [ ] Test BLE flow on Android: host advertises → join scans → connect → play duel locally
- [ ] Test BLE fallback: web browser correctly falls back to WebSocket
- [ ] Test tutorial popups in 2P for all rule types
- [ ] Mobile responsiveness at 390×844 for all new screens
- [ ] Build Android APK
- [ ] Commit, push, GitHub release v3.0.0
- [ ] Produce `docs/v3-final-report.html`

---

## Screen Flow

```
Title Screen
└── 2P Duel → 2P Home Screen
    ├── Profile → Profile Editor (border, bg, icon, tagline)
    ├── Host → [Web: create backend lobby | Android: BLE advertise OR backend]
    │   └── Waiting Room
    │       ├── Rule Config (host only)
    │       ├── Select Cards (pick 5 from inventory)
    │       ├── Player List (profile cards, tap 2 to select)
    │       └── Start Duel (host only, 2 players selected)
    │           └── Duel Screen
    │               ├── Players: GameBoard (interactive)
    │               ├── Spectators: GameBoard (read-only)
    │               └── Reward Screen → Return to Waiting Room
    └── Join → Lobby Browser
        ├── [Web: GET /lobbies list]
        ├── [Android: BLE scan + backend list]
        └── Tap lobby → Waiting Room (as spectator)
```

## Key Files (Existing)

| File | Relevance |
|------|-----------|
| `frontend/src/components/PlayPage.tsx` | Current 2P hub — will be heavily reworked |
| `frontend/src/api/client.ts` | HTTP + WebSocket client — extend for lobbies |
| `backend/server.js` | WebSocket server — extend with lobby protocol |
| `backend/engine.mjs` | Game engine (must stay synced with frontend) |
| `frontend/src/components/GameBoard.tsx` | Shared board UI — add spectator mode |
| `frontend/src/data/tutorials.ts` | 14 tutorials — integrate into 2P |
| `frontend/src/data/worldState.ts` | Progression data — used for profile unlocks |
| `frontend/src/data/world.ts` | 28 locations, 132 NPCs — unlock sources |
| `frontend/src/components/SettingsScreen.tsx` | Settings pattern — reuse for profile |

## Key Files (New)

| File | Purpose |
|------|---------|
| `frontend/src/types/multiplayer.ts` | PlayerProfile, Lobby, DuelConfig, LobbyMessage types |
| `frontend/src/data/profile.ts` | Profile CRUD, unlock checks, tagline word lists |
| `frontend/src/components/multiplayer/` | 2PHome, ProfileEditor, LobbyBrowser, WaitingRoom, SpectatorBoard |
| `frontend/src/transport/` | ITransport, WebSocketTransport, BleTransport |
| `frontend/public/profiles/` | Default profile icons (generated via artgen) |

## Implementation Notes

### Docker First
All builds, test runs, and dev servers via Docker. Never run npm directly on host.

### Commit Discipline
Each todo completes → test in Docker → commit with descriptive message → push to remote.

### Engine Sync Rule
`frontend/src/game/engine.ts` remains source of truth. After any engine change, update `backend/engine.mjs`.

### Art Generation
Use artgen service (port 8091) for default profile icons. 20 images total (10 human + 10 beast).

### Reporting Format
All human-facing reports: styled HTML in `docs/`.
