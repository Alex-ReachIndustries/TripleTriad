# Project: Triple Triad V3

## Executive Summary
A major expansion and visual overhaul of the Triple Triad browser game, transforming it from a functional prototype into a polished, immersive FFVIII experience. Key deliverables: (1) a stunning title screen with FFVIII-inspired visuals and generated art, (2) a complete world mode rework with 7 region-based navigation, location screens, NPC interactions, shops with buy/sell, side quests, story cutscenes, and progressive difficulty, (3) a full deck management system with named/saved/loadable decks and multi-copy card inventory, (4) a fixed and overhauled 2P mode tied to 1P card inventory, (5) a streamlined pre-duel deck selection flow, and (6) a comprehensive UI/UX visual polish pass ensuring mobile-friendliness for the Android APK. Success = a game that looks and feels like a premium FFVIII fan experience across desktop and mobile.

## How to Resume This Project
1. Read this file top to bottom to understand current state
2. **If all phases show `[x] Complete` → the project is finished. Tell the user and stop.**
3. Otherwise, find the first incomplete phase/todo and continue from there
4. Run `/execute-project .cursor/projects/triple-triad-v3.md` to continue from where it left off

---

## Current Codebase State (V2 Baseline)

**Tech Stack:** React 19 + Vite + TypeScript (frontend), Node.js + WebSocket (backend), Capacitor (Android), Docker Compose

**What V2 delivered (all working):**
- Core 3×3 card game with all FFVIII special rules (Same, Plus, Combo, Same Wall, Elemental, Random, Open, Sudden Death)
- AI opponents: easy (random), medium (greedy), hard (alpha-beta pruning)
- World mode with 10 areas, NPCs, shops, tournaments, gil economy
- Online 2-player via WebSocket rooms
- 110 cards with real PNG art, dark FFVIII-inspired theme
- 42/42 engine unit tests passing
- Android APK via Capacitor

**What V3 addresses (user feedback):**
- Title screen is bland — needs FFVIII visuals / generated art
- How To Play lacks diagrams
- World mode flow needs full rework (regions → locations → NPCs)
- No story cutscenes
- Card inventory is single-copy — needs multi-copy support
- No deck save/load/naming system
- Shops can't sell cards back
- No side quest system
- AI difficulty shouldn't be player-chosen — should scale with progression
- Pre-duel flow shows full deck builder — should be dropdown deck selector
- 2P mode: create room is broken, duel UI is lacking, not tied to 1P inventory
- Overall UI needs visual overhaul + mobile responsiveness

---

## Phases

### Phase 1: Research & Asset Pipeline
**Status:** [x] Complete

Goal: Research FFVIII world geography, plan the 7-region map layout, establish an image generation pipeline in Docker for missing visual assets (NPC art, title screen backgrounds, region backgrounds, diagrams), and produce guidance docs.

Tasks:
- [x] Research FFVIII world map — identify all locations and group into 7 logical regions by landmass
- [x] Map the 7 regions with their constituent locations, rules, and unlock order
- [x] Define asset pipeline approach (CSS/SVG diagrams + curated + Docker generation for portraits)
- [x] Create guidance docs at `.cursor/projects/triple-triad-v3/`
  - [x] `architecture.md` — new data models, navigation flow, state management
  - [x] `ui-ux.md` — screen layouts, mobile breakpoints, visual style guide
  - [x] `world-design.md` — 7 regions with locations, NPCs, shops, quests, difficulty curve, story beats
  - [x] `asset-pipeline.md` — image generation process, asset naming conventions, sizes/formats

Decisions (resolved):
- **Art approach:** CSS/SVG for diagrams, curated images for backgrounds, Docker-based portrait generation for missing NPC art
- **Cutscenes:** Opening cutscene + 3 key story beat cutscenes (entering Galbadia, Centra, Deep Sea)
- **Side quests:** 13 hand-crafted quests with unique dialogue, spread across all regions
- **Starter cards:** 5 weakest Level 1 cards (Geezard, Funguar, Bite Bug, Red Bat, Blobra) — thematic FFVIII starter set
- **World map:** Existing world.jpg with SVG polygon overlays for 7 regions
- **7 Regions:** Balamb, Dollet, Galbadia, FH, Trabia, Centra, Esthar (Lunar merged into Esthar)

---

### Phase 2: Core Data & Systems Overhaul
**Status:** [x] Complete

Goal: Rebuild the foundational data models and systems to support multi-copy card inventory, named/saved decks, side quests, and the new 7-region world hierarchy. This phase is pure data/logic — no UI changes yet.

Todos:
- [x] `todo-inventory-system.md` — Replace single-copy `collection: string[]` with multi-copy `inventory: Record<string, number>` (cardId → count). Update worldState persistence, trade rules, shop logic. Protect 5 starter cards (always >= 1 count). Add sell-back at shops (50% price).
- [x] `todo-deck-management.md` — New `SavedDeck` type `{ id, name, cardIds: string[] }`. CRUD operations: create, rename, delete, set-active. Persist to localStorage. Default "Starter Deck" always exists (5 basic cards, undeletable). Remember last-used deck. Limit of e.g. 10 saved decks.
- [x] `todo-world-data-redesign.md` — 7 regions, 17 locations (12 towns + 5 dungeons), 68 NPCs with full dialogue, deck pools, difficulty tiers, shop items. Legacy backward-compat functions preserved.
- [x] `todo-progressive-difficulty.md` — DifficultyTier (1-5) mapped to AI strategy: 1=easy, 2-3=medium, 4-5=hard. World mode auto-sets difficulty from NPC tier, freestyle retains manual selector.
- [x] `todo-side-quest-system.md` — 13 hand-crafted quests (8 find_card, 3 beat_npc, 2 clear_dungeon). Quest types, state tracking (active/completed/clearedDungeons), accept/claim/reward helpers.

---

### Phase 3: Title Screen, How To Play & Story Cutscenes
**Status:** [ ] Not Started

Goal: Transform the title screen into a visually striking FFVIII-inspired landing page. Add diagrams to How To Play. Implement a story cutscene system for world mode entry.

Todos:
- [ ] `todo-title-screen.md` — Redesign with FFVIII-inspired background art (generated or sourced), animated title text, atmospheric styling (particles, gradient overlays, maybe a subtle card-flip animation). Include menu: New Game / Continue / How to Play / 2P Duel.
- [ ] `todo-how-to-play.md` — Add visual diagrams: card anatomy diagram (showing rank positions), step-by-step capture example, special rules illustrations (Same, Plus, Combo, Elemental). Use generated images or SVG/CSS diagrams.
- [ ] `todo-story-cutscene.md` — Simple cutscene system: full-screen illustrated panels with text overlay and "Next" button. Opening cutscene when starting a new game (introducing Triple Triad in the FFVIII world). Optionally brief cutscenes at region transitions.

---

### Phase 4: World Mode — Region Map & Navigation
**Status:** [ ] Not Started

Goal: Replace the current flat world map with a 7-region hierarchical navigation system. The world map shows highlighted regions on the FFVIII world map; clicking a region shows a zoomed region screen with location markers; clicking a location shows a location screen with NPCs.

Todos:
- [ ] `todo-world-map-regions.md` — New WorldMapPage: display the FFVIII world map with 7 clickable/hoverable region overlays (SVG polygons or image map). Hover shows region name + active rules tooltip. Click navigates to RegionPage. Locked regions shown dimmed. Progress indicator.
- [ ] `todo-region-screen.md` — New RegionPage: zoomed portion of world map for the selected region. Location markers placed at correct positions. Locked locations shown with lock icon. Unlocked locations show name + NPC count. Click navigates to LocationPage. Region rules displayed prominently. Back button → world map.
- [ ] `todo-town-screen.md` — TownPage (for `type: 'town'` locations): shows the location name, background, and a grid/list of NPCs with their portrait art. Each NPC card shows: name, type icon (dialogue/shop/duel/tournament), and brief description. Click NPC → opens NPC interaction (dialogue panel, shop UI, pre-duel screen, or tournament entry). Active quests indicator. Gil display. Back button → region.
- [ ] `todo-dungeon-screen.md` — DungeonPage (for `type: 'dungeon'` locations): vertical path UI showing sequential floors from bottom to top, with boss at the top. Player selects deck ONCE before entering. Each floor shows opponent name, tier, and completion status. Current floor highlighted. Losing any floor returns to dungeon entrance. Brief narrative text between floors. "Cleared" badge once boss is beaten. Can be re-entered for rematches.
- [ ] `todo-npc-interactions.md` — NPC interaction panels (town only): Dialogue NPC shows conversation text (with quest offers if applicable). Shop NPC shows buy/sell interface. Duel NPC shows pre-duel deck selection. Tournament NPC shows entry fee, prize info, and pre-duel deck selection. All interactions stay within the town screen (modal or side panel).

---

### Phase 5: Pre-Duel Flow & Deck Selection
**Status:** [ ] Not Started

Goal: Replace the full deck builder screen before duels with a streamlined deck selection dropdown. Add quick access to deck editing without losing navigation context.

Todos:
- [ ] `todo-pre-duel-screen.md` — New PreDuelPage: shows opponent info (name, portrait, difficulty indicator), active rules for the match, and a dropdown to select from saved decks (default = last used deck, "Starter Deck" always in list). "Edit Decks" button opens the deck manager. "Start Duel" button (enabled only with valid 5-card deck). Back button returns to the location/NPC that initiated the duel.
- [ ] `todo-deck-manager-ui.md` — Full deck manager screen: list of saved decks (create/rename/delete), deck editor (add/remove cards from inventory, shows card count available). Navigate here from pre-duel "Edit Decks" button. Back button returns to the pre-duel screen (NOT home). Also accessible from main menu for general deck management.

---

### Phase 6: 2P Mode Fix & Overhaul
**Status:** [ ] Not Started

Goal: Fix the broken room creation, overhaul the 2P duel UI, and tie 2P mode to the 1P card inventory so both players can only use cards they actually own.

Todos:
- [ ] `todo-2p-room-fix.md` — Debug and fix the create room flow. Test WebSocket connection, room creation API, and room joining. Ensure the full flow works: create → get code → share → opponent joins → both see lobby.
- [ ] `todo-2p-inventory-tie.md` — 2P mode deck selection only shows cards from the player's 1P world inventory. If no world save exists, provide the starter deck only. AI opponents in 2P mode (if applicable) also use cards from a defined pool, not all 110.
- [ ] `todo-2p-duel-ui.md` — Overhaul the 2P duel UI: proper lobby with player status indicators, deck preview, ready-up system. During game: same quality GameBoard as 1P with score, rules display, animations. Post-game: rematch option, return to lobby. Match the visual quality of the 1P experience.

---

### Phase 7: UI/UX Visual Overhaul & Mobile Responsiveness
**Status:** [ ] Not Started

Goal: Give the entire application a visual upgrade to make it feel like a premium FFVIII fan game. Ensure every screen is mobile-friendly for the Android APK. Everything should always be visible (no hidden overflow, no cut-off elements).

Todos:
- [ ] `todo-visual-design-system.md` — Establish a cohesive FFVIII-inspired design system: colour palette (dark blues, golds, deep purples), typography (fantasy-styled headings, readable body), card/panel styling (bevelled edges, gradient borders, subtle glow effects), button styles, transitions. Apply across all screens.
- [ ] `todo-screen-layouts.md` — Audit and redesign every screen layout for visual impact: title screen, how to play, world map, region, location, NPC interaction, pre-duel, deck manager, game board, 2P lobby. Ensure nothing is cut off, all content is scrollable where needed, and key information is always visible.
- [ ] `todo-mobile-responsive.md` — Mobile-first responsive pass: test all screens at 360px, 390px, 414px, 768px breakpoints. Stack layouts vertically on mobile. Touch-friendly tap targets (min 44px). Card grids responsive. Game board fits in viewport. Deck selection usable on small screens. Test via Capacitor Android emulator or device.
- [ ] `todo-animations-polish.md` — Add/refine animations throughout: screen transitions (slide/fade), card hover effects, region map hover highlights, NPC interaction transitions, quest completion celebrations, shop purchase confirmations. Keep animations performant on mobile (use CSS transforms, avoid layout thrashing).

---

### Phase 8: Integration Testing & Android Build
**Status:** [ ] Not Started

Goal: End-to-end testing of all game flows, Android APK build verification, and cross-browser/device testing.

Tasks:
- [ ] Full playthrough test: new game → story cutscene → world map → all regions/locations → complete side quests → final area
- [ ] Deck management test: create/rename/delete decks, verify persistence across sessions
- [ ] 2P mode test: create room, join room, play full game, rematch
- [ ] Shop test: buy and sell cards, verify inventory updates
- [ ] Progressive difficulty test: verify AI scales correctly from early to late game
- [ ] Mobile test: build Android APK via Capacitor, test on device/emulator at multiple screen sizes
- [ ] Cross-browser test: Chrome, Firefox, Safari (if available)
- [ ] Performance test: verify smooth animations on mobile, no memory leaks in long sessions
- [ ] Visual test via Playwright MCP: screenshot every screen and verify layout/styling

---

### Phase 9: Evaluation & Reporting
**Status:** [ ] Not Started

Goal: Verify the project is in a deliverable state and produce a final report.

Tasks:
- [ ] Run all engine tests and confirm they pass (42/42 minimum, plus any new tests)
- [ ] Run full Docker build (`docker-compose up --build`) and confirm no errors
- [ ] Visual audit of every screen via browser (Playwright MCP)
- [ ] Produce `docs/v3-final-report.html` (styled HTML) covering:
  - What was built: all new features, screens, and systems
  - Before/after comparison of key screens
  - Test results with pass/fail counts
  - Mobile responsiveness evidence (screenshots at multiple breakpoints)
  - Known limitations and areas for future improvement
  - Asset pipeline documentation

---

## Implementation Notes

### Docker First
All builds, test runs, and dev servers must use Docker. Never run npm directly on host.
```bash
docker-compose up --build       # Start full stack
docker-compose run frontend sh  # One-off frontend commands
```

### Image Generation Pipeline
Set up a Docker container for generating missing visual assets. Options to evaluate in Phase 1:
- **Stable Diffusion (local):** Docker image with SD model, generate FFVIII-style art via API
- **CSS/SVG diagrams:** For How To Play diagrams, prefer code-generated visuals (reproducible, lightweight)
- **Manual asset curation:** Source from public domain / fan art with attribution if generation quality is insufficient

### Commit Discipline
Each todo completes → test in Docker → commit with descriptive message → **push to remote** before moving on.

### Reporting Format
All human-facing reports must be **styled HTML files** in `docs/`. Include stat boxes, colour-coded status, tables.

### Engine Sync Rule
`frontend/src/game/engine.ts` remains the source of truth. After any engine change, update `backend/engine.mjs` to match exactly.

### Navigation Architecture (New for V3)
```
Title Screen
├── New Game → Story Cutscene → World Map
├── Continue → World Map (resume saved progress)
├── How to Play → Tutorial with diagrams
└── 2P Duel → 2P Lobby

World Map (7 regions)
└── Region Screen (locations within region)
    ├── Town Location → NPC grid
    │   ├── Dialogue NPC → Text panel (may offer quest)
    │   ├── Shop NPC → Buy/Sell interface
    │   ├── Duel NPC → Pre-Duel Screen → GameBoard
    │   └── Tournament NPC → Pre-Duel Screen → GameBoard
    └── Dungeon Location → Floor ladder UI
        ├── Select deck → Enter dungeon
        ├── Floor 1 → GameBoard → Floor 2 → ... → Boss
        └── Clear → Rewards + unlock next

Pre-Duel Screen
├── Select deck (dropdown, remembers last used)
├── Edit Decks → Deck Manager → Back to Pre-Duel
└── Start Duel → GameBoard

Deck Manager (accessible from Pre-Duel or Main Menu)
├── List saved decks
├── Create / Rename / Delete deck
└── Edit deck (add/remove cards from inventory)
```

### Key Data Model Changes (V3)
```typescript
// Multi-copy inventory (replaces string[])
inventory: Record<string, number>  // cardId → count owned

// Saved decks
interface SavedDeck {
  id: string
  name: string
  cardIds: string[]  // exactly 5
}

// Region hierarchy
Region → Location[] → NPC[]

// NPC types
NPC.type: 'dialogue' | 'shop' | 'duel' | 'tournament'

// Side quests
interface Quest {
  id: string
  giverNpcId: string
  type: 'find_card' | 'beat_npc' | 'clear_dungeon'
  targetId: string
  reward: { type: 'card' | 'gil', value: string | number }
  status: 'available' | 'active' | 'completed'
}

// Location types
Location.type: 'town' | 'dungeon'  // towns = NPC grid, dungeons = floor gauntlet

// Progressive difficulty (no player choice)
NPC.difficultyTier: 1-5  // maps to AI strategy + deck strength
```

### Playwright MCP Testing
The Playwright MCP browser tools are available for visual testing. Use `browser_navigate` to load the app, `browser_snapshot` to inspect accessibility trees, and `browser_take_screenshot` to capture visual state of every screen during development and testing phases.
