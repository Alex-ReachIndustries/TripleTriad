# Triple Triad (FFVIII) – Project

## Resume instructions (if interrupted)

1. **Location**: Workspace is `C:\Users\kuron\Fun\TripleTriad`. Paths below are repo-root-relative unless noted.
2. **Run / test**: From repo root: `docker compose up -d --build` then `docker compose ps` and `docker compose logs --tail 200`. Web app: `http://localhost:${WEB_PORT}` (see `.env` / `.env.example` for `WEB_PORT`). Use browser MCP or Chrome for visual testing.
3. **Inspect**: Check `docker compose logs`, browser DevTools console/network, and any `docs/` or `reports/` output. Validate in Docker and via browser.
4. **Key code**: Entrypoints and config will live under `frontend/`, `backend/` (or monorepo structure); game docs under `docs/`.
5. **Goal**: Recreate Triple Triad from FFVIII as a web app (deck builder, 2P rooms/lobbies, AI), then single-player world mode with FFVIII map/rules/plot/shops/tournaments, then Android APK with mobile-friendly UI.
6. **Project file usage**: This file. Work via **start-todo** / **continue-todo** for each unchecked project item; tick with `[x]` when that item’s todo file is complete. Commit and push to GitHub as you progress. Test with Docker and browser MCP.

---

## Goal

Recreate the Triple Triad minigame from Final Fantasy VIII as documented on the [FF Wiki](https://finalfantasy.fandom.com/wiki/Triple_Triad_(Final_Fantasy_VIII)): full game mechanics, deck builder, two-player online play (rooms/lobbies), AI at three difficulty levels, then a single-player campaign on the FFVIII world map with rule transfer, card collection, plot/characters, money/shops and tournaments, and finally an Android APK with mobile-optimized UI (e.g. Pixel 9 Pro XL).

## Current focus

Phase 2: Implementation of original game mechanics (web app scaffold and deck builder).

## Phases / Milestones

### Phase 1: Research and understanding

- [x] Research and document Triple Triad: read wiki and linked pages (e.g. Final Fantasy VIII Triple Triad cards), extract game flow, all cards with original stats, special rules and regional rules, trade rules; write clear docs (e.g. `docs/game-mechanics.md`, `docs/cards.md`, `docs/rules.md`) for development. (todo: .cursor/todos/triple_triad_phase1_research_todo.md) — done
- [ ] (Add more as you discover)

### Phase 2: Implementation of original game mechanics

- [x] Web app scaffold and deck builder: set up stack (e.g. Vite + React/TS), Docker, env; implement deck builder (select 5 from collection, view cards with ranks/elements). (todo: .cursor/todos/triple_triad_phase2_web_scaffold_deck_builder_todo.md) — done
- [ ] Two-player play: rooms/lobbies (create/join), matchmaking or room codes, real-time game state sync so two people can play a full match.
- [ ] AI opponent: three difficulty levels (easy, medium, hard) with appropriate play intelligence; integrate into same game flow as human vs human.
- [ ] (Add more as you discover)

### Phase 3: Expansion (single-player mode)

- [ ] Single-player world mode: Exact map from FFVIII, locations unlock in story order; rule transfer mechanic; gain/lose cards from matches (starter deck protected); basic plot and progression.
- [ ] Characters and story: FFVIII characters in appropriate locations with in-character dialogue; story beats leading through locations.
- [ ] Economy: money (gil), shops to buy cards, paid tournaments with card prizes.
- [ ] (Add more as you discover)

### Phase 4: Porting to Android

- [ ] Port to Android: standalone APK build (e.g. Capacitor/TWA or React Native), mobile-friendly UI/UX targeting Pixel 9 Pro XL; ensure system UI does not overlap in-game UI (safe areas, fullscreen).
- [ ] (Add more as you discover)
