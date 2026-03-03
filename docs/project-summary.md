# Triple Triad (FFVIII) – Project Summary

This document summarizes the completed Triple Triad web and Android app as of project completion.

## What’s implemented

- **Deck Builder** – Choose 5 cards from a collection of 110 (with images). Cards show ranks, level, element.
- **Play** – Create or join a room (6-character code), play vs another human online, or vs AI (easy / medium / hard). Full 3×3 game with capture rules.
- **World** – Single-player mode on an FFVIII world map:
  - Clickable location markers (unlock order: Balamb Town → … → Lunar Gate).
  - Region rules and trade rule in a tooltip on marker hover/focus.
  - Per-location: characters with dialogue, shop (when available), tournament (when available). Gil, challenge, buy cards, enter tournaments.
- **Android** – Capacitor app; safe-area insets; build APK from `frontend/android` (see below).

## How to run

| Target   | Command / steps |
|----------|------------------|
| **Web**  | From repo root: `docker compose up -d --build`. Open `http://localhost:5173` (or `WEB_PORT` from `.env`). |
| **Android** | `cd frontend`, `npm run android:sync`, then `npx cap run android` (or `npx cap open android`). Requires Android SDK. See `docs/android-build.md`. |

## Key paths

| Area        | Path / file |
|------------|-------------|
| Game logic | `frontend/src/game/` |
| Deck / play / world UI | `frontend/src/components/` (DeckBuilder, PlayPage, GameBoard, WorldPage) |
| World data | `frontend/src/data/world.ts`, `worldState.ts`, `characters.ts`, `shops.ts` |
| Theme & layout | `frontend/src/App.css`, `docs/ui-ux-guidelines.md` |
| Android     | `frontend/android/`, `frontend/capacitor.config.ts` |
| Docs        | `docs/game-mechanics.md`, `docs/cards.md`, `docs/rules.md`, `docs/android-build.md` |

## Optional next steps

- Add more character/NPC images (e.g. in `frontend/public/characters/`, `frontend/public/npcs/`).
- Configure Android release signing and build a signed APK.
- Add iOS via Capacitor (`npx cap add ios`).
- Deploy web app to a host; ensure backend WebSocket URL is correct for production.
