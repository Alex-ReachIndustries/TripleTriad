# UI/UX — v3.0.0 Multiplayer

## Screen Flow

```
Title Screen → "2P Duel" button
│
└── 2P Home Screen
    ┌──────────────────────────────────┐
    │  [Your Profile Card - large]     │
    │                                  │
    │  ┌─────┐ ┌─────┐ ┌─────────┐   │
    │  │Host │ │Join │ │ Profile │   │
    │  └─────┘ └─────┘ └─────────┘   │
    │                                  │
    │  [Back to Title]                 │
    └──────────────────────────────────┘
         │         │         │
         ▼         ▼         ▼
    ┌─────────┐ ┌────────┐ ┌──────────┐
    │ Waiting │ │ Lobby  │ │ Profile  │
    │  Room   │ │Browser │ │ Editor   │
    └────┬────┘ └───┬────┘ └──────────┘
         │         │
         ▼         ▼
    ┌─────────────────┐
    │  Waiting Room   │ (host + joiners land here)
    │                 │
    │ [Player Cards]  │ ← grid of profile cards
    │ [Rule Config]   │ ← host only
    │ [Select Cards]  │ ← pick hand from inventory
    │ [Start Duel]    │ ← host only, after selecting 2 players
    └────────┬────────┘
             ▼
    ┌─────────────────┐
    │  Duel Screen    │
    │                 │
    │ Players: board  │ ← interactive GameBoard
    │ Spectators: ro  │ ← read-only GameBoard
    │                 │
    │ [Reward Screen] │ ← card trade display
    │ [Return]        │ → back to Waiting Room
    └─────────────────┘
```

## Profile Card Design

Visual card representing a player. Used in: 2P home, waiting room, lobby browser.

```
┌─── border (customisable) ───────────┐
│ ┌─────────┐                         │
│ │  char   │  Display Name           │
│ │  icon   │  "Mighty Dragon |       │
│ │ (64×64) │   Gentle Soul"          │
│ └─────────┘                         │
│                                     │
│  W: 42  L: 15  D: 8                │
│         background (customisable)    │
└─────────────────────────────────────┘
```

- **Size**: ~280×120px (desktop), ~240×100px (mobile)
- **Border**: 2-4px decorative border, 10 default styles + unlockable
- **Background**: gradient/pattern/image fill, 10 default + 28 location unlocks
- **Character icon**: 64×64 circular crop, 20 default + ~132 NPC unlocks
- **Name**: 16 char max, free text
- **Tagline**: 2-part phrase, readonly (selected from dropdowns)
- **Stats**: W/L/D counts, compact display

## Profile Editor Screen

```
┌─ Profile Editor ─────────────────────┐
│ [Back]                               │
│                                      │
│ ┌──── Live Preview ────┐            │
│ │   [profile card]     │            │
│ └──────────────────────┘            │
│                                      │
│ Name: [____________]                 │
│                                      │
│ ── Tagline ──                        │
│ Part 1: [▼ Mighty Dragon    ]       │
│ Part 2: [▼ Gentle Soul      ]       │
│                                      │
│ ── Character Icon ──                 │
│ [Humans] [Beasts] [NPCs 🔒]        │
│ ┌──┐┌──┐┌──┐┌──┐┌──┐               │
│ │  ││  ││  ││  ││  │ ...           │
│ └──┘└──┘└──┘└──┘└──┘               │
│                                      │
│ ── Border ──                         │
│ ┌──┐┌──┐┌──┐┌──┐ ...  🔒🔒        │
│ └──┘└──┘└──┘└──┘                    │
│                                      │
│ ── Background ──                     │
│ ┌──┐┌──┐┌──┐┌──┐ ...  🔒🔒        │
│ └──┘└──┘└──┘└──┘                    │
│                                      │
│ [Save]                               │
└──────────────────────────────────────┘
```

- Locked items shown greyed with 🔒, tooltip shows unlock condition
- Categories as tab buttons for character icons
- Border/background shown as small preview swatches
- Live preview updates instantly on selection

## Waiting Room Layout

```
┌─ Waiting Room ───────────────────────┐
│ [Leave] Lobby: "Alex's Room"  [⚙️]  │
│                                      │
│ ── Players (5/30) ──                │
│ ┌─────────┐ ┌─────────┐            │
│ │ profile │ │ profile │ ...        │
│ │  card   │ │  card   │            │
│ │ [✓sel]  │ │ [✓sel]  │            │
│ └─────────┘ └─────────┘            │
│                                      │
│ ── Your Hand ──                      │
│ [Select Cards] or [5 card previews] │
│                                      │
│ ── Rules ── (host: editable)         │
│ Special: [Same] [Plus] [Open]       │
│ Trade: [▼ Friendly    ]             │
│                                      │
│ [Start Duel] (host only, 2 selected)│
└──────────────────────────────────────┘
```

- Profile cards in scrollable grid (wraps on mobile)
- Host taps two profile cards to select duellists (gold highlight)
- Start Duel button enabled only when 2 players selected + both have hands
- Rule toggles are interactive for host, read-only for others
- [⚙️] opens rule config panel on mobile (drawer)

## Lobby Browser

```
┌─ Join a Lobby ──────────────────────┐
│ [Back]                     [🔄]     │
│                                      │
│ ┌────────────────────────────────┐  │
│ │ 🎮 Alex's Room     3/30       │  │
│ │ Rules: Same, Open  Trade: One │  │
│ │ Status: Waiting               │  │
│ └────────────────────────────────┘  │
│ ┌────────────────────────────────┐  │
│ │ 🎮 Luna's Arena    12/30      │  │
│ │ Rules: Plus, Combo Trade: All │  │
│ │ Status: In Duel               │  │
│ └────────────────────────────────┘  │
│ ...                                  │
│                                      │
│ [Android: 📶 Scan Bluetooth]        │
└──────────────────────────────────────┘
```

- Lobby cards show: host name, player count, active rules, trade rule, status
- Status: "Waiting" (green) or "In Duel" (amber) — both joinable
- Tap to join → enter waiting room
- Android: additional "Scan Bluetooth" button at bottom for BLE lobbies
- Refresh button polls GET /lobbies

## Spectator Duel View

Same as player duel view but:
- No clickable cards in hand area
- "Spectating" banner at top
- Opponent and player hands show card backs (unless Open rule)
- Score bar visible
- Capture animations visible
- Victory/defeat fanfare plays for everyone

## Mobile Responsiveness (390×844)

- Profile cards scale to full width on mobile
- Waiting room player grid: 2 columns on mobile, 4+ on desktop
- Rule config: collapsible panel on mobile
- Hand picker: horizontal scroll with larger touch targets
- Lobby browser: full-width cards, stacked
