# Web app scaffold and deck builder – Todo

**Parent project**: `triple_triad_project.md`

## Resume instructions (if interrupted)

1. **Location**: Repo root `C:\Users\kuron\Fun\TripleTriad`; paths below relative to repo root.
2. **Run / test**: `docker compose up -d --build` then open `http://localhost:${WEB_PORT}` (see `.env`; default 5173). Validate in Docker and via browser (Chrome / browser MCP).
3. **Inspect**: `docker compose logs --tail 200`, browser DevTools console/network; frontend in `frontend/` (or chosen app dir).
4. **Key code**: `frontend/` (Vite + React/TS), `docker-compose.yml`, `.env.example`, `docs/cards-data.json` for card data.
5. **Goal**: Set up web stack (Vite + React/TS), Docker, env; implement deck builder (select 5 from collection, view cards with ranks/elements).
6. **Todo file usage**: This file. Work each item in plan → implement → evaluate; tick with `[x]` only after evaluate confirms (run in Docker, check in browser). Add to-dos at the bottom if needed. Task order is not absolute.

---

## To-do list

- [x] Add Docker setup: `docker-compose.yml` (frontend service), `.env.example` with `WEB_PORT`, `.gitignore` for `.env`.
- [x] Scaffold frontend: Vite + React + TypeScript in `frontend/`, npm install, dev script; serve from container on `WEB_PORT`.
- [x] Load card data: use `docs/cards-data.json` (or copy into `frontend/public` / import) and define types for card (id, name, level, top, right, bottom, left, element).
- [x] Deck builder UI: collection view (list or grid of cards), select up to 5 for current deck, show each card with name, level, ranks (top/right/bottom/left), and element if present.
- [x] Run app in Docker and verify in browser: page loads, deck builder shows cards and allows selecting 5; no console errors.
- [ ] (Add more as you discover)
