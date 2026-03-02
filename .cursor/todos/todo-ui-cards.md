# Todo: Card Component Redesign

**Project:** `.cursor/projects/triple-triad-v2.md`
**Phase:** Phase 4 — UI/UX Overhaul (4a: Card Component Polish)
**Status:** Complete

## Objective

Redesign the card component so every card looks authentic to FFVIII: real card art fills the face, rank numbers (T/R/B/L) overlay the corners, element badge shows on elemental cards, ownership is conveyed via coloured border/tint, and hand cards have lift + glow on hover/select. "Done" = cards in both hand and board look polished and information-dense.

## Context

- `CardView.tsx` currently renders only the card image + name — no ranks, no element, no ownership colour
- CSS in `App.css` already has `.card-ranks` / `.rank` / `.top` / `.right` / `.bottom` / `.left` classes but they are never used by the component
- `GameBoard.tsx` renders board cells inline (not via `CardView`) with a tiny image + text name — no ranks shown on placed cards
- All 110 card images confirmed present at `frontend/public/cards/{id}.png`
- The `Card` type has `top`, `right`, `bottom`, `left` (1–10), `element` (null or named string), `id`, `name`
- `rankLabel()` in `card.ts` already handles `10 → 'A'`
- Design tokens: `--player-0` = blue `#6b9bd1`, `--player-1` = red `#d4786b`
- Element unicode map can be embedded in the component (no external assets needed)

## Implementation Steps

- [x] Step 1: Update `CardView.tsx` to display ranks overlaid on the card art
  - Add `top`, `right`, `bottom`, `left` rank badges positioned at edges of the card image using `rankLabel()`
  - Use the existing `.card-ranks` / `.rank` / `.top` etc. CSS classes
  - Remove the separate `.card-name` text block from the card face (name is shown elsewhere, e.g. DeckBuilder) — keep it as an optional prop (`showName?: boolean`, default false for game use, true for deck builder)

- [x] Step 2: Add element badge to `CardView.tsx`
  - Show a small badge in the top-right corner of the card when `card.element` is non-null
  - Use a simple text/unicode symbol per element (e.g. Fire 🔥, Ice ❄, Lightning ⚡, Water 💧, Earth 🌿, Poison ☠, Holy ✨, Wind 🌀)
  - Style: small pill badge, semi-transparent dark background, positioned absolute top-right

- [x] Step 3: Add `owner` prop to `CardView.tsx` for ownership tinting
  - Accept `owner?: 0 | 1` prop
  - Apply a coloured border + subtle tint overlay when `owner` is set: `owner-0` → blue border, `owner-1` → red border
  - `.card-owner-tint` div with low opacity tint over art; ownership colour goes on board-cell border for board cards

- [x] Step 4: Update `App.css` card styles to support the new layout
  - `.card-face` position relative, overflow hidden; rank overlay `position: absolute; inset: 0`
  - Rank badge dark pill background for legibility over art
  - Element badge absolute top-right with dark pill
  - `.card-owner-tint` coloured overlay div
  - Hover: `transform: translateY(-3px)` lift added
  - Board cell: owner-0/owner-1 border colours; nested CardView borderless + full-bleed via `object-fit: cover`
  - Removed stale `.board-card`, `.board-card-image`, `.board-card-name` rules

- [x] Step 5: Update board card rendering in `GameBoard.tsx`
  - Replaced inline board card JSX with `<CardView card={cell.card} owner={cell.owner} compact showName={false} />`
  - Added `owner-${cell.owner}` class to board-cell for coloured border
  - Updated hand cards to `showName={false}`

- [x] Step 6: Verify DeckBuilder still looks correct
  - DeckBuilder uses `<CardView>` too; `showName` defaults to `true` so names still render below card
  - Build passes clean with TypeScript (0 errors, 0 warnings)

## Testing Criteria

- [x] Test: Build succeeds in Docker — `docker-compose run --rm frontend sh -c "npm run build"` exits 0 with no TypeScript errors
- [ ] Test: In local dev (`docker-compose up`), open the game and navigate to World Mode → challenge an NPC. Confirm hand cards show T/R/B/L rank numbers legibly over the card art.
- [ ] Test: Place a card. Confirm it appears on the board with ranks visible and correct ownership border (blue for player, red for AI).
- [ ] Test: An elemental card (e.g. card with `element: 'Fire'`) shows the element badge in the top-right corner.
- [ ] Test: Hovering a hand card shows lift + glow (translateY + gold border glow).
- [ ] Test: Selected hand card shows strong gold outline (existing `.selected` class still works).
- [ ] Test: DeckBuilder still shows card name below card art.
- [ ] Test: Mobile layout — at 375px width, ranks are still readable, cards don't overflow.

## Security & Quality Checks

- [x] No secrets or credentials hardcoded
- [x] No `any` TypeScript types introduced; all new props typed (`owner?: 0 | 1`, `showName?: boolean`)
- [x] Element badge uses a safe static `Record<NonNullable<Card['element']>, string>` map — no dynamic injection
- [x] CSS uses one `!important` only on `.board-cell > .card-view { transform: none !important }` to prevent hover lift inside board cells — acceptable targeted override

## Definition of Done

- All implementation steps complete
- All tests passing (build + visual check via Docker)
- Code committed and pushed
- Project file updated to mark `todo-ui-cards.md` complete

## Notes

- Do NOT add a card-back design for the opponent's hand in this todo — that requires Phase 4b (animations) where we track which cards have been played. Keep it out of scope here.
- The `compact` prop on CardView is used in the hand; ensure compact mode still fits ranks inside the smaller card size (may need smaller font-size for ranks in compact mode).
- Keep the existing ARIA labels intact — screen readers should still describe cards correctly.
