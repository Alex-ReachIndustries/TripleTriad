# Triple Triad (FFVIII) – Project Summary

This document summarizes the Triple Triad web and Android app.

## What's implemented

- **World Mode (1P)** – Full FFVIII-inspired single-player campaign:
  - 6 regions, ~30 locations following the FF8 storyline across 13 story chapters.
  - ~100+ NPCs with dialogue, card shops, and tournaments.
  - 13 main quests and ~20 side quests with notification markers (!, ?, $, ⚔, ...).
  - All 8 special rules (Open, Same, Same Wall, Plus, Combo, Elemental, Random, Sudden Death) distributed across regions.
  - All 4 trade rules (One, Diff, Direct, All) per region.
  - Rule spreading mechanic after Chapter 5 — dueling in a new region can carry rules from your last-played region.
  - Queen of Cards NPC for late-game rule manipulation (spread/abolish for gil).
  - Tutorial popup system — context-triggered tutorials for each rule, reviewable from Guide tab.
  - Quest log with story recap, active/completed/available quest sections.
  - Deck manager — save/load multiple decks from your card collection.
  - 110 cards with AI-generated artwork.

- **2P Duel** – Create or join a room (6-character code), play vs another human online, or vs AI (easy / medium / hard). Full 3×3 game with all capture rules.

- **AI** – Alpha-beta pruning AI with difficulty levels. NPC decks are level-appropriate.

- **Settings** – Text scale slider (70%–150%) and card overlay scale slider (0 = art only, up to 150%). Persisted to localStorage.

- **Android** – Capacitor app with:
  - Edge-to-edge display with safe area insets injected via Java.
  - System back button navigation (tabs → world → title → minimize).
  - AI-generated app icon (blue/gold card game design).

## How to run

| Target   | Command / steps |
|----------|------------------|
| **Web**  | From repo root: `docker compose up -d --build`. Open `http://localhost:5173`. |
| **Android APK** | See `docs/android-build.md`. Pre-built APK available on GitHub Releases. |

## Key paths

| Area        | Path / file |
|------------|-------------|
| Game engine | `frontend/src/game/engine.ts` |
| Engine (backend mirror) | `backend/engine.mjs` |
| Types | `frontend/src/game/types.ts` |
| Card images | `frontend/public/cards/{id}.png` (all 110) |
| Components | `frontend/src/components/` |
| World data | `frontend/src/data/world.ts` |
| World state | `frontend/src/data/worldState.ts` |
| Tutorial data | `frontend/src/data/tutorials.ts` |
| Theme & layout | `frontend/src/App.css` |
| Settings | `frontend/src/components/SettingsScreen.tsx` |
| Android | `frontend/android/`, `frontend/capacitor.config.ts` |
| Art generation | `artgen/` (SDXL-Turbo via Docker) |
| Docs | `docs/` |

## Navigation structure

- **Title Screen**: Continue, New Game, How to Play, 2P Duel, Settings
- **Game View** (top nav): Home | World | Collection | Quests | Guide
  - World: map, regions, towns, NPCs, shops, tournaments
  - Collection: deck manager
  - Quests: quest log with story progress
  - Guide: tutorials menu (seen/locked)
- **Battle Screen**: full-screen during NPC duels (nav hidden)
- **2P Duel**: full-screen (nav hidden), accessed from title screen only
