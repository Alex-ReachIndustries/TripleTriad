# Todo: World Data Redesign

## Goal
Replace the flat V2 world model (8 regions, 10 areas, spots) with the V3 hierarchical model:
- 7 Regions with unlock conditions and map bounds
- 17 Locations (12 towns + 5 dungeons) with type field
- ~50 NPCs with full dialogue, deck pools, difficulty tiers
- Dungeon NPCs have floor order and isBoss flag
- All data matches world-design.md exactly

## Files to Modify
- `frontend/src/types/world.ts` — New V3 type definitions
- `frontend/src/data/world.ts` — Complete rewrite with V3 data
- `frontend/src/data/shops.ts` — Update shop data to match V3 locations/prices

## Steps
- [x] 1. Rewrite types/world.ts with V3 interfaces (Region, Location, NPC, UnlockCondition)
- [x] 2. Rewrite data/world.ts with all 7 regions, 17 locations, 68 NPCs from world-design.md
- [x] 3. Update data/shops.ts with V3 shop data derived from NPC objects
- [x] 4. Keep legacy exports for backward compat (getAreas, getSpots) until UI migration
- [x] 5. Docker build + verify no TypeScript errors — verified in browser
