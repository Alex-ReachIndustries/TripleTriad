# Two-player play (rooms/lobbies, real-time sync) – Todo

**Parent project**: `triple_triad_project.md`

## Resume instructions (if interrupted)

1. **Location**: Repo root `C:\Users\kuron\Fun\TripleTriad`; paths below relative to repo root.
2. **Run / test**: `docker compose up -d --build` then open `http://localhost:${WEB_PORT}` (default 5173). Use two browser tabs/windows to test two-player. Backend (if added) runs in its own service; see `docker compose logs`.
3. **Inspect**: `docker compose logs`, browser DevTools console/network; frontend `frontend/src/`, backend (if any) under `backend/` or `server/`.
4. **Key code**: Game engine (board, turns, capture) per `docs/game-mechanics.md`; room/lobby and real-time sync (WebSocket or similar); frontend game board and room UI.
5. **Goal**: Two people can create/join rooms (or use room codes), play a full Triple Triad match with real-time game state sync.
6. **Todo file usage**: This file. Work each item in plan → implement → evaluate; tick with `[x]` only after evaluate confirms (run in Docker, test with two clients). Add to-dos at the bottom if needed. Task order is not absolute.

---

## To-do list

- [x] Implement core game engine: board state (3x3), turn order, capture logic (adjacent rank comparison, Same/Plus/Combo per docs/rules.md if needed), win/draw; export as a module used by both players (and later AI).
- [x] Add backend service for rooms: create room (return room code), join by code; WebSocket (or polling) per room to broadcast game events (move, game over).
- [x] Frontend – Play flow: entry point to create room or join with code; lobby view showing ready/start state.
- [x] Frontend – Game board UI: 3x3 grid, place card from hand onto cell, show captures and turn indicator; receive opponent moves via real-time updates.
- [x] Wire game engine to backend: validate moves server-side, broadcast state to both clients; handle game lifecycle (start, turn, end).
- [ ] Run in Docker; verify two browser tabs can create/join a room and complete a full match (place 5 cards each, captures, winner).
- [ ] (Add more as you discover)
