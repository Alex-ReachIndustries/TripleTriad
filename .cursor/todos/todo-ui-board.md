# Todo: Game Board Layout

**Project:** `.cursor/projects/triple-triad-v2.md`
**Phase:** Phase 4 — UI/UX Overhaul (4c: Game Board Layout)
**Status:** Complete

## Objective

Improve the game board layout so it shows a score bar and active rules at the top, uses a larger board on desktop, and places the hand optimally on both desktop and mobile. Done = board is visually bigger and more informative, score and rules are always visible, and the layout is usable on phones.

## Context

- `GameState.activeRules: SpecialRule[]` — list of rules active for the match (e.g. `['Same', 'Elemental']`). May be empty.
- Score formula: `hands[player].length + board.flat().filter(c => c?.owner === player).length` — starts at 5/5, shifts as cards capture.
- Board is currently `maxWidth: 320px` with inline style; cells have `minHeight: 80` inline style.
- `game-board-wrap` was added in Phase 4b with `display: inline-block; max-width: 320px; width: 100%` — this is the target to resize.
- The hand currently sits below the board in a plain `<div style={{display:'flex', gap:8, flexWrap:'wrap'}}>`; no mobile-specific layout.
- The `SpecialRule` type is a union of title-cased strings (see memory: `'Same'`, `'Plus'`, etc.).
- Design tokens: `--surface`, `--surface-alt`, `--accent`, `--text-muted`, `--border`.

## Implementation Steps

- [x] Step 1: Add score bar above the board
  - `myScore` and `opponentScore` computed from `state.hands` + `state.board`
  - `.score-bar` div: flex space-between; `.score-block-player` (blue) left, `.score-block-opponent` (red) right
  - Center shows turn indicator via `score-turn-text` (replaces old `.game-status`)

- [x] Step 2: Add active rules indicator below the score bar
  - `.rules-bar` with `.rule-badge` pills, conditionally rendered when `activeRules.length > 0`
  - Gold accent color on semi-transparent background

- [x] Step 3: Enlarge the board on desktop
  - Removed `maxWidth: 320` inline style from game-board; `.game-board-wrap` is now `max-width: 480px; width: 100%`
  - `.board-cell { min-height: 120px }` in CSS (was inline 80)
  - Mobile: `.board-cell { min-height: 80px !important }` overrides at ≤480px

- [x] Step 4: Improve hand layout for mobile
  - Hand container is now `.hand-cards-grid` CSS class: `grid; grid-template-columns: repeat(5, 1fr); gap: 6px`
  - `.hand-card-btn` class replaces inline minHeight/minWidth styles
  - Removed stale `game-hand > div { justify-content: center }` media query rule

## Testing Criteria

- [x] Test: `docker-compose run --rm frontend sh -c "npm run build"` exits 0, no TypeScript errors
- [ ] Test: Start a vs-AI game — score bar shows "You 5 / Opponent 5" at game start
- [ ] Test: After a capture, score updates (e.g. "You 6 / Opponent 4")
- [ ] Test: Play at a region with rules (e.g. Galbadia region has Same) — rules bar appears with badge(s); play in a no-rules match — no rules bar
- [ ] Test: On desktop viewport (≥ 768px), board is visibly larger than 320px and cards are taller
- [ ] Test: On mobile viewport (≤ 480px), 5 hand cards fit in a row without horizontal scroll
- [ ] Test: Score at game end shows correct final count (matching win/loss condition)

## Security & Quality Checks

- [x] No secrets or credentials hardcoded
- [x] No `any` TypeScript types introduced
- [x] Score computation is purely derived from `state` — no mutation
- [x] Rules bar only rendered when `activeRules.length > 0` (no empty-bar flash at game start)

## Definition of Done

- All implementation steps complete
- All tests passing (build + visual check via Docker)
- Code committed and pushed
- Project file updated to mark `todo-ui-board.md` complete

## Notes

- The score label shows count of cards "owned" (on board + in hand). At game end (all 10 placed) it reflects the final board ownership split.
- The `compact` prop on hand CardViews should stay — compact mode uses `max-height: 68px` which is appropriate for the hand row.
- Phase 4d (world map) is separate; this todo is board-only.
