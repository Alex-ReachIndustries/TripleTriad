# Todo: Multi-Copy Inventory System

## Goal
Replace the single-copy `collection: string[]` with a multi-copy `inventory: Record<string, number>` system. Players can now own multiple copies of each card. Starter cards (5, reduced from 10) are protected with always >= 1 count. Shops allow selling cards back at 50% price.

## Files to Modify
- `frontend/src/data/worldState.ts` — Core state, types, persistence, trade logic
- `frontend/src/App.tsx` — State mutations (buy, trade, tournament prize)
- `frontend/src/components/WorldPage.tsx` — Shop UI (show count, allow re-buy, add sell button)
- `frontend/src/components/DeckBuilder.tsx` — Filter by inventory keys
- `frontend/src/components/PlayPage.tsx` — Filter displayCards by inventory keys

## Steps

- [ ] 1. Update `WorldPlayerState` interface: `collection: string[]` → `inventory: Record<string, number>`
- [ ] 2. Reduce STARTER_DECK_IDS from 10 to 5 (geezard, funguar, bite_bug, red_bat, blobra)
- [ ] 3. Update `defaultState()` to initialise inventory from starter IDs (each count = 1)
- [ ] 4. Update `loadWorldState()` to parse inventory format + migrate old string[] format
- [ ] 5. Update `isStarterCard()` for new 5-card set
- [ ] 6. Add helper: `getOwnedCardIds(inventory)` → returns string[] of cards with count > 0
- [ ] 7. Update `applyTradeRuleOne()` — win: increment count or add new; lose: decrement count (protect starters >= 1)
- [ ] 8. Update `App.tsx` — handleBuyCard: increment inventory count (allow re-buying)
- [ ] 9. Update `App.tsx` — handleWorldMatchEnd: tournament prize adds to inventory
- [ ] 10. Add `handleSellCard` in App.tsx — decrement inventory, add 50% price to gil (protect starters)
- [ ] 11. Update `WorldPage.tsx` — shop shows owned count, allows re-buying, adds sell button
- [ ] 12. Update `DeckBuilder.tsx` — use getOwnedCardIds() for filtering
- [ ] 13. Update `PlayPage.tsx` — use getOwnedCardIds() for filtering
- [ ] 14. Docker build + test in browser
