# Triple Triad research and documentation – Todo

**Parent project**: `triple_triad_project.md`

## Resume instructions (if interrupted)

1. **Location**: Repo root `C:\Users\kuron\Fun\TripleTriad`; paths below relative to repo root.
2. **Run / test**: No app yet. Validate by ensuring `docs/game-mechanics.md`, `docs/cards.md`, `docs/rules.md` exist and are complete. When Docker exists: `docker compose up -d --build` then open app in browser.
3. **Inspect**: `docs/` folder for game-mechanics, cards, and rules documentation.
4. **Key code**: Documentation only in this phase; `docs/` is the deliverable.
5. **Goal**: Extract and document Triple Triad game flow, all cards with original stats, special/regional/trade rules from the FF Wiki so the game can be implemented accurately.
6. **Todo file usage**: This file. Work each item in plan → implement → evaluate; tick with `[x]` only after evaluate confirms. Add to-dos at the bottom if needed; replace oversized items with 2–5 subtodos. Task order is not absolute.

---

## To-do list

- [x] Fetch and parse main Triple Triad wiki plus linked pages (e.g. FFVIII Triple Triad cards list) for mechanics, card data, and rules.
- [x] Write `docs/game-mechanics.md`: flow of play, setup, turn order, capture rules, winning condition, draw/sudden death.
- [x] Write `docs/cards.md`: all cards from original game with id, name, level, ranks (top/right/bottom/left), element if any; note starter deck and one-of-a-kind (GF/character).
- [x] Write `docs/rules.md`: special rules (Open, Same, Same Wall, Sudden Death, Random, Plus, Combo, Elemental), rules per region table, trade rules (One, Difference, Direct, All) and how they change.
- [x] Validate: confirm all three docs exist, cross-check mechanics and rules against wiki, and that card list is complete enough for implementation.
- [ ] (Add more as you discover)
