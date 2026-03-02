# Project: Triple Triad V2

## Executive Summary
A complete overhaul of the existing browser-based FFVIII Triple Triad implementation, focused on making it professional, polished, and mechanically complete as a single-player experience. The project covers three main areas: (1) completing the game engine with all standard FFVIII special rules, (2) a full UI/UX polish pass covering animations, card visuals, layout, and game feel, and (3) single-player world mode improvements including NPC-specific decks, fix known bugs, and progression polish. Success = a game that feels authentic to FFVIII, looks professional, and is satisfying to play from start to finish.

## How to Resume This Project
1. Read this file top to bottom to understand current state
2. **If all phases show `[x] Complete` → the project is finished. Tell the user and stop.**
3. Otherwise, find the first incomplete phase/todo and continue from there
4. Run `/execute-project .cursor/projects/triple-triad-v2.md` to continue from where it left off

---

## Current Codebase State (Audit Summary)

**Tech Stack:** React 19 + Vite + TypeScript (frontend), Node.js + WebSocket (backend), Docker Compose

**What works:**
- Core 3×3 card game with basic capture rule (rank comparison)
- AI opponents: easy (random), medium (1-ply greedy), hard (2-ply minimax)
- World mode with 10 progressive areas, NPCs, shops, tournaments, gil economy
- Online 2-player via WebSocket rooms
- Accessible UI with ARIA, keyboard support, dark FFVIII-inspired theme
- Persistent deck/collection via localStorage

**Known bugs & gaps:**
- **Special rules not enforced** — Same, Plus, Elemental, Combo, Same Wall, Sudden Death all defined in data but completely ignored by the engine
- **DeckBuilder shows all 110 cards** instead of player's owned collection
- **NPC decks are random** — no per-NPC fixed card pools; world mode lacks authenticity
- **Shop deduplication missing** — can buy the same card multiple times
- **No card/capture animations** — placements are instant; no visual feedback
- **No NPC win/loss tracking** — no rematch system; no escalating difficulty
- **Hard AI has no alpha-beta pruning** — inefficient; can feel slow
- **Map and character images mostly missing** — scaffolded but assets absent
- **No gil reward for wins** — trade rule only; no economy income loop

---

## Phases

### Phase 1: Research & Architecture Planning
**Status:** [x] Complete

Goal: Audit the full codebase, identify all improvements, and write guidance docs.

Notes: Full audit completed via codebase exploration. Key findings documented in Executive Summary and Known Bugs above.

Tasks:
- [x] Audit existing codebase (engine, UI, world data, types)
- [x] Write guidance docs at `.cursor/projects/triple-triad-v2/`
  - [x] `architecture.md` — system design, data models, engine pipeline, key file paths
  - [x] `ui-ux.md` — card layout, animations, board layout, world map, responsive breakpoints
  - [x] `security.md` — XSS, localStorage validation, WS message validation, Docker hardening
  - [x] `best-practices.md` — TypeScript patterns, React patterns, CSS animations, engine immutability, testing

Decisions (resolved):
- **Online 2-player scope:** Keep existing multiplayer as-is; do not extend or polish it. Focus is single-player.
- **Card art:** Real card images are already present at `frontend/public/cards/{id}.png`. Use them — no need for stylised CSS placeholders.
- **Sudden Death:** Required. Must be implemented in Phase 2 alongside the other special rules.

---

### Phase 2: Game Engine — Special Rules Implementation
**Status:** [x] Complete

Goal: Make the engine mechanically complete. Implement all FFVIII standard special rules so world regions feel distinct and matches vary meaningfully.

Rules to implement (in priority order):
1. **Same Rule** — If a placed card shares a rank with 2+ adjacent opponent cards (on the matching sides), those cards are captured. Triggers Combo if applicable.
2. **Plus Rule** — If the sums of opposing ranks on 2+ sides are equal, those opponent cards are captured. Triggers Combo if applicable.
3. **Combo Rule** — After a Same or Plus capture, newly captured cards apply Basic Capture rule to their neighbours (cascade).
4. **Same Wall Rule** — Board edges count as rank 10 for Same rule evaluation.
5. **Elemental Rule** — At game start, each board cell may be randomly assigned an element. Cards on a matching-element cell get +1 to all ranks; non-matching get -1. Engine should support a board elements grid.
6. **Random Rule** — At game start, each player's 5 cards are drawn randomly from their full deck rather than freely chosen. Engine selects 5 random cards from the player's deck; UI should inform the player they have no hand choice this match.
7. **Open Rule** — Both players' hands are visible to each other. No engine logic needed; pure UI flag.
8. **Sudden Death** *(required)* — On a draw, reshuffle all 10 cards proportionally (winner's 6 vs loser's 4 become new hands) and play again on a fresh board. Loop until there is a winner.

Engine changes needed:
- `createGame()` → accept `activeRules: SpecialRule[]` and `boardElements?: Element[][]`
- `placeCard()` → route capture logic through rule pipeline
- Add `applySameRule()`, `applyPlusRule()`, `applyComboRule()`, `applyElementalModifiers()` functions
- Propagate `activeRules` from world region data through `WorldPage → PlayPage → createGame()`
- Update backend `engine.mjs` to mirror frontend changes (keep them in sync)

Todos:
- [x] `todo-engine-rules.md` — Implement Same, Plus, Combo, Same Wall, Elemental, Random, Sudden Death in engine.ts; sync to engine.mjs; add unit tests

---

### Phase 3: World Mode — Authenticity & Bug Fixes
**Status:** [x] Complete

Goal: Make the single-player world mode feel authentic to FFVIII. NPCs should have real card pools, progression should feel rewarding, and known bugs should be fixed.

Tasks:
- **NPC-specific decks** — Define a fixed 10-card pool per world area opponent. At match start, opponent draws 5 random cards from their pool (scales with area difficulty).
- **NPC win/loss tracking** — Track which NPCs have been beaten; show a "Rematch" option; optionally escalate NPC difficulty on rematch.
- **DeckBuilder bug fix** — DeckBuilder should only show cards in `worldState.collection`, not all 110 cards.
- **Shop deduplication** — Purchasing a card you already own should warn the user or be blocked.
- **Gil rewards for wins** — Add a small gil reward (50–200 depending on area) for winning world duels so the economy loop feels complete.
- **Region rules enforcement** — Wire `area.rules` from `world.ts` into the game engine via PlayPage so regional rules actually apply.
- **Trade rule completeness** — "One" trade rule is functional; document clearly whether Diff/Direct/All are in scope for V2 *(Recommendation: out of scope; One is sufficient)*.

Todos:
- [x] `todo-world-npc-decks.md` — Define per-NPC card pools and implement deck selection logic
- [x] `todo-world-fixes.md` — DeckBuilder filter fix, shop deduplication, gil rewards, region rule wiring

---

### Phase 4: UI/UX Overhaul
**Status:** [x] Complete

Goal: Make the game look and feel professional. Every interaction should have visual feedback; the game board should feel tactile; the overall aesthetic should feel like a polished FFVIII mini-game.

#### 4a. Card Component Polish
- **Real card art** — Load from `frontend/public/cards/{card.id}.png` (all 110 cards confirmed present). Display art as the card face background; ranks and element badge overlay on top.
- **Rank display** — Numbers readable at all card sizes; "A" for rank 10. Use a semi-transparent overlay strip or corner badges so they're legible over card art.
- **Element icon** — Small element badge on cards with an element (top-right corner)
- **Ownership color** — Coloured border/tint overlay (blue = player, red = opponent) rather than replacing the art
- **Card back** — Unplayed cards in hand show a card-back design until played
- **Hover/focus states** — Lift + glow on hover; clear selected state

#### 4b. Game Board Animations
- **Card placement** — Smooth slide-in animation when a card is placed on the board (150ms ease-out)
- **Capture flash** — Captured cards briefly flash before flipping to new owner colour
- **Card flip animation** — 3D Y-axis flip (300ms) to reveal new owner colour; CSS `transform: rotateY()`
- **Turn indicator** — Animated pulse on active player's hand or score badge
- **Win/draw overlay** — Full-board overlay with winner announcement + "Play Again" / "Return to World" buttons

#### 4c. Game Board Layout
- **Score display** — Persistent card count for each player (top of board)
- **Active rules display** — Show which special rules are in effect for current match
- **Board sizing** — Cards should be larger; board should fill available vertical space on desktop
- **Mobile layout** — Hand should stack below board; portrait orientation optimised

#### 4d. World Map Polish
- **Map markers** — Clearer locked/unlocked visual distinction; animated pulse on newly unlocked area
- **Area panel** — Cleaner layout for NPCs, shops, and tournaments
- **Progress indicator** — Visual progress bar or breadcrumb showing world advancement

#### 4e. Navigation & General UX
- **Back navigation** — Consistent back buttons/keyboard support across all screens
- **Loading states** — Spinner/skeleton when AI is "thinking" (>300ms delay)
- **Error boundaries** — Graceful fallbacks for missing images, WebSocket errors
- **Deck overview** — Compact visual of current 5-card deck visible before entering a match

Todos:
- [x] `todo-ui-cards.md` — Card component redesign: real card art from `/public/cards/{id}.png`, rank overlays, element badge, ownership colour tint/border, hover states
- [x] `todo-ui-animations.md` — Placement slide-in, capture flash, card flip 3D animation, win overlay
- [x] `todo-ui-board.md` — Score display, active rules indicator, board sizing, mobile layout
- [x] `todo-ui-world.md` — Map marker polish, area panel layout, progress indicator, deck overview

---

### Phase 5: Performance & Code Quality
**Status:** [ ] Not Started

Goal: Ensure the codebase is clean, performant, and maintainable before shipping.

Tasks:
- **AI optimisation** — Add alpha-beta pruning to hard AI minimax; cap search depth dynamically
- **Engine sync** — Verify `backend/engine.mjs` exactly mirrors `frontend/src/game/engine.ts` after Phase 2 changes
- **Type safety audit** — Ensure all new types are exported and used consistently; no `any` types
- **Bundle size check** — Verify production build is reasonable; no unnecessary deps
- **Mobile responsive test** — Test layout at 320px, 375px, 414px, 768px breakpoints

Todos:
- [ ] `todo-perf-ai.md` — Alpha-beta pruning for hard AI + dynamic depth cap
- [ ] `todo-perf-cleanup.md` — Engine sync, type audit, bundle check, responsive testing

---

### Phase 6: Evaluation & Reporting
**Status:** [ ] Not Started

Goal: Verify the project is in a deliverable state and produce a final report.

Tasks:
- [ ] Run full build via Docker (`docker-compose up --build`) and confirm no errors
- [ ] Play through world mode from Balamb Town to Lunar Gate; verify rules apply correctly
- [ ] Test all 3 AI difficulties; verify special rules trigger correctly in engine unit tests
- [ ] Verify DeckBuilder only shows owned cards
- [ ] Verify card flip animations work in Chromium and Firefox
- [ ] Produce `docs/final-report.html` (styled HTML) covering:
  - What was built and how it works
  - Test results and evidence of correctness (with pass/fail counts in stat boxes)
  - Known limitations (e.g., no iOS testing, Diff/Direct/All trade rules not implemented)
  - Suggested future expansions (sound, iOS, leaderboards, Diff/Direct/All trade rules)

---

## Implementation Notes

### Docker First
All builds, test runs, and dev servers must use Docker. Check `docker-compose.yml` before running anything.
```bash
docker-compose up --build       # Start full stack
docker-compose run frontend sh  # One-off frontend commands
```

### Commit Discipline
Each todo completes → test in Docker → commit with descriptive message → **push to remote** before moving on.
```bash
git push origin main   # Always push after every commit
```

### Reporting Format
All human-facing reports (phase summaries, final report, interim status updates) must be written as **styled HTML files** — not plain markdown. Reports should include:
- Clear section headings with visual hierarchy
- Summary cards / stat boxes for key metrics (e.g. tests passed, features completed)
- Colour-coded status indicators (green = done, amber = in progress, red = blocked)
- Any relevant tables formatted as proper HTML tables
- Saved to `docs/` with a `.html` extension (e.g. `docs/final-report.html`)

### Engine Sync Rule
`frontend/src/game/engine.ts` is the source of truth. After any engine change, update `backend/engine.mjs` to match exactly (it mirrors the frontend engine for server authority).

### Special Rules Implementation Order
Same → Plus → Combo → Same Wall → Elemental → Sudden Death. Each rule is additive; implement and test before adding the next.
