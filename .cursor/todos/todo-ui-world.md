# Todo: World Map Polish

**Project:** `.cursor/projects/triple-triad-v2.md`
**Phase:** Phase 4 — UI/UX Overhaul (4d: World Map Polish)
**Status:** Complete

## Objective

Polish the world map and challenge setup screens: clearer locked/unlocked marker distinction (with a pulse on the latest unlocked area), a simple progress bar, a cleaner area panel, and a more prominent deck overview before matches. Done = world mode looks purposeful and professional, not just functional.

## Context

- 10 areas total, `order` 0–9. `unlockedOrder` prop = highest unlocked area order.
- `area.order <= unlockedOrder` → unlocked; otherwise locked.
- "Newest" unlocked area = `area.order === unlockedOrder` (except order 0 at game start).
- `WorldPage` receives `unlockedOrder`, `gil`, `collection`, `npcWins` props; calls `onChallenge` etc.
- `PlayPage` handles the actual match setup — the `vs-ai-setup` screen shows the deck picker.
- `WorldPage` does NOT render `CardView` currently; deck overview lives in `PlayPage`.
- CSS design tokens: `--surface`, `--surface-alt`, `--border`, `--accent`, `--text-muted`, `--player-0`, `--player-1`.

## Implementation Steps

- [x] Step 1: Progress indicator at top of world map
  - In `WorldPage.tsx`: add a `.world-progress` bar above the map section
  - Show: "Areas: {unlockedOrder + 1} / 10" label and a horizontal fill bar
  - Fill width = `(unlockedOrder + 1) / 10 * 100%`; colour = `var(--accent)`
  - In `App.css`: `.world-progress` flex row; label + bar; `.world-progress-bar` with track + fill

- [x] Step 2: Sharper locked/unlocked marker distinction + "newest" pulse
  - In `WorldPage.tsx` map marker render: for locked areas add `filter: grayscale(1)` and show '🔒' icon before the label text
  - For the newest unlocked area (`unlocked && area.order === unlockedOrder && unlockedOrder > 0`): add `is-new` class to the marker
  - In `App.css`: `.world-map-marker.locked { filter: grayscale(0.9); opacity: 0.55; }` (stronger than current 0.7)
  - `@keyframes marker-pulse` — scale 1 → 1.08 → 1, gold box-shadow appears/disappears, 2s ease-in-out 3 iterations; apply to `.world-map-marker.is-new`

- [x] Step 3: Cleaner area panel visual hierarchy
  - In `WorldPage.tsx`: wrap the `location-detail` content sections (characters, spots) in `.detail-section` divs with a `.detail-section-heading` h4
  - Add section icons as text prefixes: Characters → "👥 Characters", Duels → "⚔ Challenge", Shop → "🛒 Shop", Tournament → "🏆 Tournament"
  - In `App.css`: `.detail-section { margin-bottom: 1rem; }` and `.detail-section-heading { font-size: 0.85rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); margin: 0 0 0.5rem; border-bottom: 1px solid var(--border); padding-bottom: 0.25rem; }`

- [x] Step 4: Deck overview in challenge setup
  - In `PlayPage.tsx` vs-ai-setup screen: add a "Your deck:" heading above the `.lobby-deck` div when `worldChallengeLocation` is set (only relevant in world mode)
  - Change the deck slot compact cards to use `showName={true}` so card names show, helping identification before a match
  - This only changes the lobby deck display (deck slot header + name visibility), not the collection grid

## Testing Criteria

- [x] Test: `docker-compose run --rm frontend sh -c "npm run build"` exits 0, no TypeScript errors
- [x] Test: World map page shows progress bar "Areas: 1 / 10" at game start (only Balamb Town unlocked)
- [x] Test: Locked area markers are clearly grayed out with lock icon; unlocked markers are bright
- [x] Test: After advancing in world mode (unlockedOrder increases), the newest area marker shows a gold pulse animation
- [x] Test: Clicking an unlocked area shows the detail panel with clearly labelled sections (⚔ Challenge, 🛒 Shop etc.)
- [x] Test: In world challenge setup (PlayPage), deck overview shows "Your deck:" heading with card names visible

## Security & Quality Checks

- [x] No secrets or credentials hardcoded
- [x] No `any` TypeScript types introduced
- [x] Section headings are accessible (proper heading level h4, not just styled divs)
- [x] Pulse animation respects `prefers-reduced-motion` — add `@media (prefers-reduced-motion: reduce)` to disable marker-pulse

## Definition of Done

- All implementation steps complete
- All tests passing (build + visual check via Docker)
- Code committed and pushed
- Project file updated to mark `todo-ui-world.md` complete

## Notes

- Keep the existing tooltip (`.world-map-marker-tooltip`) and ARIA labels as-is — just add the is-new/locked visual treatment.
- The deck overview change (Step 4) is minimal — just showName + a heading. Don't restructure the entire PlayPage deck picker.
- `unlockedOrder` starts at 0 (Balamb Town unlocked). The pulse should NOT fire on initial load (order 0) — only on areas where `order > 0`.
