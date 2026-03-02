/**
 * World mode types: regions, areas, spots, and rules.
 * Hierarchy: 8 regions (continents) → areas (towns/dungeons) → spots (duel/shop/tournament).
 * See docs/rules.md for regional defaults.
 */

export type SpecialRule =
  | 'Open'
  | 'Same'
  | 'Same Wall'
  | 'Sudden Death'
  | 'Random'
  | 'Plus'
  | 'Combo'
  | 'Elemental'

export type TradeRule = 'One' | 'Diff' | 'Direct' | 'All'

export type SpotType = 'duel' | 'shop' | 'tournament'

export interface Region {
  id: string
  name: string
  /** Default special rules for this region. */
  rules: SpecialRule[]
  /** Default trade rule for this region. */
  tradeRule: TradeRule
}

/** Area = town or dungeon on the map; has map position and story order. */
export interface Area {
  id: string
  name: string
  regionId: string
  /** Story order (0 = first unlockable). Lower = earlier in story. */
  order: number
  /** X position on world map image, 0–100 (percent from left). */
  mapX: number
  /** Y position on world map image, 0–100 (percent from top). */
  mapY: number
  /** Default duel opponent name for this area (e.g. "Balamb Student"). */
  opponentName?: string
  /** Optional opponent/NPC image path (e.g. /npcs/balamb_student.png). */
  opponentImagePath?: string
  /** Card ids that the AI opponent draws from (8–10 cards). 5 selected at game start. */
  opponentDeckPool?: string[]
  /** Gil awarded to player on winning a duel at this area. */
  gilReward?: number
}

/** Spot = NPC/location within an area: card duel, shop, or tournament. */
export interface Spot {
  id: string
  name: string
  areaId: string
  type: SpotType
  /** For duel spots: opponent display name. */
  opponentName?: string
  /** For duel spots: opponent image path. */
  opponentImagePath?: string
  /** Order within area for display. */
  order: number
}

/** @deprecated Use Area for map markers and Spot for duels/shops/tournaments. */
export interface Location {
  id: string
  name: string
  regionId: string
  order: number
  opponentName?: string
  opponentImagePath?: string
  mapX: number
  mapY: number
}
