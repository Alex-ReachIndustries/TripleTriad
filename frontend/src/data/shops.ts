/**
 * Shop and tournament data for world mode economy.
 * V3: shop/tournament data is now stored on NPC objects in world.ts.
 * This module provides backward-compatible lookup functions.
 */

import { getNpcs } from './world'

export interface ShopItem {
  cardId: string
  price: number
}

export interface Shop {
  locationId: string
  items: ShopItem[]
}

export interface Tournament {
  locationId: string
  entryFee: number
  /** Card ids; winner receives one at random. */
  prizePool: string[]
}

/**
 * Find shop data by NPC ID (used when the legacy Spot.id is a shop NPC).
 * Falls back to searching by location ID for broader matches.
 */
export function getShopAtLocation(id: string): Shop | undefined {
  const npcs = getNpcs()
  // Direct NPC ID match
  const npc = npcs.find((n) => n.id === id && n.type === 'shop' && n.shopItems)
  if (npc?.shopItems) {
    return {
      locationId: npc.id,
      items: npc.shopItems.map((si) => ({ cardId: si.cardId, price: si.buyPrice })),
    }
  }
  // Fallback: find any shop NPC in a location with this ID
  const shopNpc = npcs.find((n) => n.locationId === id && n.type === 'shop' && n.shopItems)
  if (shopNpc?.shopItems) {
    return {
      locationId: shopNpc.id,
      items: shopNpc.shopItems.map((si) => ({ cardId: si.cardId, price: si.buyPrice })),
    }
  }
  return undefined
}

/**
 * Find tournament data by NPC ID or location ID.
 */
export function getTournamentAtLocation(id: string): Tournament | undefined {
  const npcs = getNpcs()
  // Direct NPC ID match
  const npc = npcs.find((n) => n.id === id && n.type === 'tournament' && n.tournamentPrizePool)
  if (npc?.tournamentPrizePool && npc.tournamentEntryFee != null) {
    return {
      locationId: npc.id,
      entryFee: npc.tournamentEntryFee,
      prizePool: npc.tournamentPrizePool,
    }
  }
  // Fallback: find any tournament NPC in a location with this ID
  const tNpc = npcs.find((n) => n.locationId === id && n.type === 'tournament' && n.tournamentPrizePool)
  if (tNpc?.tournamentPrizePool && tNpc.tournamentEntryFee != null) {
    return {
      locationId: tNpc.id,
      entryFee: tNpc.tournamentEntryFee,
      prizePool: tNpc.tournamentPrizePool,
    }
  }
  return undefined
}
