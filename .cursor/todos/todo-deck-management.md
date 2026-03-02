# Todo: Deck Management System

## Goal
Add a named/saved deck system. Players can create, rename, delete, and switch between multiple decks. A default "Starter Deck" (5 basic cards) always exists and cannot be deleted. Last-used deck is remembered. Max 10 saved decks. Persisted to localStorage.

## Data Model
```typescript
interface SavedDeck {
  id: string        // UUID
  name: string      // User-chosen name
  cardIds: string[] // Exactly 5 card IDs
  isStarter: boolean // True for the immutable starter deck
}
```

## Files to Create/Modify
- `frontend/src/data/deckManager.ts` — NEW: SavedDeck type, CRUD functions, localStorage persistence
- `frontend/src/data/worldState.ts` — Add savedDecks[] and lastDeckId to WorldPlayerState

## Steps

- [ ] 1. Create `deckManager.ts` with SavedDeck interface, CRUD functions (create, rename, delete, update cards), persistence
- [ ] 2. Add `savedDecks: SavedDeck[]` and `lastDeckId: string | null` to WorldPlayerState
- [ ] 3. Update `defaultState()` with starter deck pre-created
- [ ] 4. Update `loadWorldState()` to parse/migrate savedDecks
- [ ] 5. Validate deck operations (can't delete starter, can't exceed 10 decks, cards must be in inventory)
- [ ] 6. Docker build + verify no TypeScript errors
