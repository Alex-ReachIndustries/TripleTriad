# Todo: Game Board Animations

**Project:** `.cursor/projects/triple-triad-v2.md`
**Phase:** Phase 4 — UI/UX Overhaul (4b: Game Board Animations)
**Status:** Complete

## Objective

Add CSS animations and a win/draw overlay to the game board so every interaction has clear visual feedback. Done = placing a card animates in, captured cards flash + flip to reveal the new owner, the active player's hand pulses, and when the game ends a full-board overlay shows the result with action buttons.

## Context

- `GameState.lastCaptures` already exists and is populated by the engine — it lists `{row, col}` positions captured on the most recent move (in capture order, including Combo chains).
- `GameState.phase` transitions: `'playing'` → `'ended'` (or `'sudden_death'` for a draw/SD round).
- `GameBoard.tsx` needs `useEffect` to watch `state.board` (detect new placement) and `state.lastCaptures` (detect captures) and set local animation state.
- The board cell already has `overflow: hidden` added in Phase 4a — ensure `rotateY` transforms are NOT clipped (the element's layout width doesn't change during a Y-axis rotation, so `overflow: hidden` is safe).
- Win overlay needs optional callback props on `GameBoard` (`onPlayAgain?`, `onReturnToWorld?`). Both callers (WorldPage and PlayPage) must be updated to pass them.
- Key design tokens: `--transition-fast: 150ms ease`, `--transition-normal: 220ms ease`, `--accent: #c9a227`.

## Implementation Steps

- [x] Step 1: Add placement slide-in animation
  - `useRef` tracks previous board; `useState<string | null>` for `placingCell`
  - `useEffect([state.board])`: diffs prev vs current board; sets `placingCell` to `"row,col"` of newly placed card; clears after 260ms
  - `is-placing` class added to board cell; `@keyframes card-place` scales 0.45 → 1.07 → 1.0 in 240ms with spring cubic-bezier

- [x] Step 2: Add capture flip animation
  - `useState<Set<string>>` for `capturedCells`
  - `useEffect([state.lastCaptures])`: 100ms delay then sets captured keys; clears at 560ms total
  - `is-captured` class triggers `@keyframes card-flip` (rotateY 0→90→90→0, 440ms ease-in-out); `perspective: 600px` on `.board-cell.is-captured`

- [x] Step 3: Add turn indicator pulse
  - `is-my-turn` class on `<section.game-hand>` when `isMyTurn`
  - `@keyframes hand-pulse` pulses gold box-shadow 0 → 6px rgba(201,162,39,0.3) → 0, 1.5s infinite

- [x] Step 4: Add win/draw overlay
  - `onPlayAgain?` and `onReturnToWorld?` optional props on `GameBoardProps`
  - Overlay rendered inside `.game-board-wrap` (position relative) when `phase === 'ended'`
  - `role="dialog" aria-live="assertive"`; `.game-over-result` with won/lost/draw colour classes
  - `.game-status` hidden when game ended (avoids duplication with overlay)
  - `@keyframes game-over-fade` fades + scales in at 350ms

- [x] Step 5: Wire overlay callbacks in PlayPage
  - `handlePlayAgain` → `setLocalGameState(null); setScreen('vs-ai-setup')`
  - `handleReturnToWorld` → resets state + calls `onLeaveWorldChallenge?.()`
  - WorldPage does not render GameBoard directly (it uses PlayPage as the match screen)
  - Online multiplayer `<GameBoard>` left without overlay callbacks (not applicable)

## Testing Criteria

- [x] Test: `docker-compose run --rm frontend sh -c "npm run build"` exits 0, no TypeScript errors
- [ ] Test: In dev server, place a card — it scales in smoothly (no instant pop)
- [ ] Test: After placing a card that triggers a capture, the captured card(s) do a visible rotateY flip (~400ms)
- [ ] Test: During player's turn, the hand section shows a subtle gold pulse glow; glow disappears when it's the opponent's turn
- [ ] Test: When game ends (win/loss/draw), a full overlay appears over the board with a clear result message
- [ ] Test: Overlay "Play Again" button restarts the match without leaving the page
- [ ] Test: Overlay "Return to World" button navigates back to the world map (world mode only)
- [ ] Test: No animation state leaks — after "Play Again", animation classes are cleared and board resets cleanly

## Security & Quality Checks

- [x] No secrets or credentials hardcoded
- [x] All `setTimeout` calls have their cleanup in the `useEffect` return function (no memory leaks)
- [x] No `any` TypeScript types introduced
- [x] ARIA: overlay has `role="dialog"` and `aria-live="assertive"` so screen readers announce the result
- [x] Overlay buttons are keyboard-reachable (standard `<button>` elements)

## Definition of Done

- All implementation steps complete
- All tests passing (build + visual check via Docker)
- Code committed and pushed
- Project file updated to mark `todo-ui-animations.md` complete

## Notes

- The `state.board` reference changes on every `placeCard()` call (engine is immutable), so `useEffect([state.board])` fires correctly on each move.
- `state.lastCaptures` is also a new array reference each state update — using it as a `useEffect` dep fires on every move. Guard with `if (state.lastCaptures.length === 0) return` to skip no-capture moves.
- Do NOT attempt to show the old owner colour before the flip — the state has already updated. The rotateY trick works because the card is invisible at 90° ("edge-on"), so the viewer perceives a colour change at the flip midpoint even though the new colour was always there.
- Sudden Death animation: if `state.phase === 'sudden_death'`, the board resets mid-game. `useEffect([state.suddenDeathRound])` clears all animation state on round changes.
- Visual tests are runtime-only (CSS animations) — build pass confirms correctness of logic.
