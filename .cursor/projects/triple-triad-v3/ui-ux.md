# UI/UX Guide — Triple Triad V3

## Visual Design System

### Colour Palette (FFVIII-Inspired)
```css
--bg-primary: #0a0e1a;        /* Deep navy, main background */
--bg-secondary: #111827;       /* Slightly lighter panels */
--bg-card: #1a2235;            /* Card/panel backgrounds */
--accent-gold: #c9a84c;        /* Gold accents, headings, borders */
--accent-blue: #3b82f6;        /* Player colour, interactive elements */
--accent-red: #ef4444;         /* Opponent colour, warnings */
--accent-purple: #7c3aed;      /* Quest/special highlights */
--text-primary: #e5e7eb;       /* Main text */
--text-secondary: #9ca3af;     /* Muted text */
--text-gold: #fbbf24;          /* Important labels */
--border-subtle: #2d3748;      /* Panel borders */
--border-glow: rgba(201, 168, 76, 0.3);  /* Gold glow for hover states */
```

### Typography
- **Headings:** A fantasy-style font (e.g., "Cinzel", "MedievalSharp", or "Pirata One" from Google Fonts) for titles and region names
- **Body:** System sans-serif stack for readability: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Card numbers:** Monospace/tabular for rank display alignment

### Panel Styling
```css
.panel {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}
.panel-glow {
  border-color: var(--accent-gold);
  box-shadow: 0 0 15px var(--border-glow);
}
```

### Button Styles
- **Primary:** Gold gradient background, dark text, hover glow
- **Secondary:** Transparent with gold border, gold text
- **Danger:** Red tint, used for delete/sell actions
- **Disabled:** 50% opacity, no pointer events

---

## Screen Layouts

### Title Screen
```
┌─────────────────────────────────────┐
│         [FFVIII Background Art]      │
│                                      │
│         ╔═══════════════╗            │
│         ║ TRIPLE TRIAD  ║            │
│         ║ Final Fantasy VIII ║       │
│         ╚═══════════════╝            │
│                                      │
│         [ New Game     ]             │
│         [ Continue     ]             │
│         [ How to Play  ]             │
│         [ 2P Duel      ]             │
│                                      │
│   v3.0                 © Fan Project │
└─────────────────────────────────────┘
```
- Full-viewport background image with dark gradient overlay
- Animated title (subtle glow pulse or letter-by-letter reveal)
- "Continue" disabled if no save exists
- Subtle particle effect or floating card animation in background

### World Map Screen
```
┌─────────────────────────────────────┐
│ ← Back    WORLD MAP     Gil: 5000  │
├─────────────────────────────────────┤
│                                      │
│    [FFVIII World Map Image]          │
│    with 7 SVG region overlays:       │
│                                      │
│    ┌──────┐  Hover tooltip:          │
│    │Balamb│  "Balamb — Rules: Open"  │
│    └──────┘                          │
│         ┌───────┐                    │
│         │Galbadia│ (dimmed if locked)│
│         └───────┘                    │
│    ...etc for all 7 regions...       │
│                                      │
├─────────────────────────────────────┤
│ Progress: ████░░░ 3/7 regions        │
│ Active Quests: 2                     │
└─────────────────────────────────────┘
```
- World map fills most of viewport
- Region overlays are semi-transparent coloured polygons
- Hover: region name + rules tooltip, slight highlight
- Click: navigate to Region screen
- Locked regions: greyed out, no tooltip, lock icon overlay
- Bottom bar: progress + quest counter

### Region Screen
```
┌─────────────────────────────────────┐
│ ← World Map   BALAMB   Rules: Open │
├─────────────────────────────────────┤
│                                      │
│   [Zoomed region map section]        │
│                                      │
│   📍 Balamb Town     (3 NPCs) 🏘️   │
│   📍 Balamb Garden   (5 NPCs) 🏘️   │
│   🔒 Fire Cavern     (locked) ⚔️    │
│                                      │
│   Location markers on the map with   │
│   click-to-navigate                  │
│                                      │
├─────────────────────────────────────┤
│ Locations: 2/3 unlocked              │
└─────────────────────────────────────┘
```
- Cropped/zoomed view of the world map showing just this region
- Location markers at correct positions with type icons (town = house icon, dungeon = sword/shield icon)
- Click marker → Town screen (for towns) or Dungeon screen (for dungeons)

### Town Screen (for `type: 'town'` locations)
```
┌─────────────────────────────────────┐
│ ← Balamb    BALAMB TOWN   Gil: 5000│
├─────────────────────────────────────┤
│                                      │
│  ┌─────────┐  ┌─────────┐          │
│  │ [Portrait]│  │ [Portrait]│       │
│  │ Zell      │  │ Card     │        │
│  │ 💬 Talk  │  │ 🛒 Shop  │        │
│  └─────────┘  └─────────┘          │
│                                      │
│  ┌─────────┐  ┌─────────┐          │
│  │ [Portrait]│  │ [Portrait]│       │
│  │ Student  │  │ Tournament│        │
│  │ ⚔️ Duel │  │ 🏆 Enter │        │
│  └─────────┘  └─────────┘          │
│                                      │
│  📜 Active Quest: Find Ifrit card   │
└─────────────────────────────────────┘
```
- Grid of NPC cards (2-3 columns)
- Each NPC card: portrait, name, type icon, brief text
- Click → opens NPC interaction panel (modal overlay or slide-in)
- Active quest banner at bottom if relevant to this location

### NPC Interaction (Modal/Panel)
```
┌─────────────────────────────────────┐
│ ✕ Close                             │
│                                      │
│  [Large NPC Portrait]                │
│                                      │
│  "Welcome to Balamb! Want to play   │
│   a round of Triple Triad?"         │
│                                      │
│  ┌─────────────────────────────┐    │
│  │ ⚔️ Challenge to Duel       │    │
│  │ 📜 Accept Quest: Find Ifrit│    │
│  └─────────────────────────────┘    │
│                                      │
│  Difficulty: ★★☆☆☆ Novice          │
│  Rules: Open                         │
└─────────────────────────────────────┘
```

### Shop Panel
```
┌─────────────────────────────────────┐
│ ✕ Close          CARD SHOP          │
│                       Gil: 5000     │
├─────────────────────────────────────┤
│  BUY                    SELL        │
├─────────────────────────────────────┤
│  [Card] Cockatrice  100g  [Buy]     │
│  [Card] Grat        150g  [Buy]     │
│  [Card] Buel        200g  [Buy]     │
│                                      │
│  ─── Your Inventory (sellable) ───  │
│  [Card] Bite Bug    x2   50g [Sell] │
│  [Card] Red Bat     x3   50g [Sell] │
└─────────────────────────────────────┘
```
- Buy tab: available cards with prices
- Sell tab: player's inventory (only sellable cards, not last copy of starters)
- Card count shown for owned duplicates
- Confirmation dialog on sell

### Dungeon Screen (for `type: 'dungeon'` locations)
```
┌─────────────────────────────────────┐
│ ← Back     FIRE CAVERN    Gil: 1200│
├─────────────────────────────────────┤
│                                      │
│  "A volcanic cave where fire         │
│   spirits dwell..."                  │
│                                      │
│  ┌─────────────────────────────┐    │
│  │  🔥 BOSS: Ifrit Guardian    │    │
│  │     ★★☆☆☆ Novice           │    │
│  └─────────────────────────────┘    │
│              │                       │
│  ┌─────────────────────────────┐    │
│  │  Floor 2: Fire Spirit       │    │
│  │     ★☆☆☆☆ Beginner  ✅    │    │
│  └─────────────────────────────┘    │
│              │                       │
│  ┌─────────────────────────────┐    │
│  │  Floor 1: Cave Bat          │    │
│  │     ★☆☆☆☆ Beginner  ✅    │    │
│  └─────────────────────────────┘    │
│                                      │
│  ─── Select Deck ───                │
│  ┌─────────────────────────┐        │
│  │ ▼ My Fire Deck          │        │
│  └─────────────────────────┘        │
│  [Card][Card][Card][Card][Card]      │
│                                      │
│  [Enter Dungeon]  [Edit Decks]      │
│                                      │
│  ─── Cleared! ★ ───                │
└─────────────────────────────────────┘
```
- Vertical floor ladder, boss at top, floor 1 at bottom
- Each floor tile: opponent name, difficulty stars, completion checkmark
- Current floor highlighted with glow/border
- Boss tile has special styling (larger, coloured border, boss icon)
- Deck selection dropdown at bottom (same as pre-duel, remembers last deck)
- "Enter Dungeon" commits to the deck — no changes between floors
- Between floors: narrative text overlay with "Continue" button
- On failure: "You have been defeated! Returning to entrance..." overlay
- "Cleared" badge and star when dungeon is completed
- Dungeons are darker/moodier than towns (different colour scheme per dungeon)
- On mobile: floor ladder scrolls vertically, deck selection fixed at bottom

### Pre-Duel Screen
```
┌─────────────────────────────────────┐
│ ← Back                              │
├─────────────────────────────────────┤
│                                      │
│  VS                                  │
│  [Opponent Portrait]                 │
│  Balamb Student                      │
│  Difficulty: ★☆☆☆☆ Beginner        │
│  Rules: Open                         │
│                                      │
│  ─── Select Your Deck ───           │
│  ┌─────────────────────────┐        │
│  │ ▼ My Fire Deck          │        │
│  └─────────────────────────┘        │
│                                      │
│  [Card][Card][Card][Card][Card]      │
│  (preview of 5 cards in deck)        │
│                                      │
│  [Edit Decks]    [Start Duel]       │
│                                      │
└─────────────────────────────────────┘
```
- Dropdown shows all saved decks
- Defaults to `lastDeckId`
- Card preview row shows the 5 cards in selected deck
- "Edit Decks" → DeckManager (back returns here)
- "Start Duel" disabled if deck invalid (missing cards from inventory)

### Deck Manager
```
┌─────────────────────────────────────┐
│ ← Back         DECK MANAGER         │
├─────────────────────────────────────┤
│  Your Decks:                         │
│  ┌───────────────────────────────┐  │
│  │ ⭐ Starter Deck (default)    │  │
│  │ 🔥 My Fire Deck     [Edit]   │  │
│  │ 💧 Water Power      [Edit]   │  │
│  │ + Create New Deck             │  │
│  └───────────────────────────────┘  │
├─────────────────────────────────────┤
│  Editing: My Fire Deck  [Rename]    │
│                                      │
│  Deck (5/5):                         │
│  [Card][Card][Card][Card][Card]      │
│                                      │
│  Inventory:                          │
│  [Card x2][Card x1][Card x3]...     │
│  (click to add/remove)               │
│                                      │
│  [Delete Deck]         [Save]       │
└─────────────────────────────────────┘
```

### Game Board (Existing — Minor Tweaks)
No major layout changes. Ensure:
- Score bar always visible at top
- Rules indicator visible
- Hand cards always visible below board
- On mobile: stack hand below board, make cards touch-friendly

---

## Mobile Breakpoints

| Breakpoint | Target | Key Adjustments |
|---|---|---|
| ≤ 360px | Small phones | Single-column everything, smaller card sizes |
| ≤ 414px | Standard phones | 2-column NPC grid, compact panels |
| ≤ 768px | Tablets (portrait) | 3-column NPC grid, side panel for interactions |
| > 768px | Desktop/landscape | Full layouts as designed above |

### Mobile-Specific Rules
- All tap targets: minimum 44×44px
- No horizontal scrolling on any screen
- World map: pinch-to-zoom or use a scrollable container
- Card grids: responsive columns (auto-fill, minmax(80px, 1fr))
- Modals: full-screen on mobile, centered panel on desktop
- Navigation: bottom bar on mobile with Home / Map / Decks / Quests

---

## Animation Guidelines

| Animation | Duration | Easing | Notes |
|---|---|---|---|
| Screen transition | 200ms | ease-in-out | Slide left/right or fade |
| Card hover lift | 150ms | ease-out | transform: translateY(-4px) |
| Region hover highlight | 200ms | ease | opacity change on SVG overlay |
| NPC panel slide-in | 250ms | ease-out | From right on desktop, bottom on mobile |
| Card placement on board | 260ms | ease-out | Scale from 0.8 → 1.0 |
| Card capture flip | 560ms | ease-in-out | rotateY(180deg) |
| Quest complete | 400ms | spring | Scale pulse + gold particle burst |
| Shop purchase | 200ms | ease | Brief green flash on card |

### Performance Rules
- Use `transform` and `opacity` only (GPU-accelerated)
- Never animate `width`, `height`, `top`, `left`
- Use `will-change` sparingly (only during animation)
- Disable non-essential animations on `prefers-reduced-motion`

---

## Accessibility Checklist
- All interactive elements: `role`, `aria-label`, keyboard navigable
- Colour contrast: 4.5:1 minimum for text
- Screen reader: `aria-live` for game state changes
- Focus management: auto-focus on panel open, return focus on close
- Skip link: maintain existing skip-to-main-content
