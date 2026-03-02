/**
 * World map data: 8 regions (continents), areas (towns/dungeons), and spots (duel/shop/tournament).
 * Source: docs/rules.md
 */

import type { Area, Region, Spot, SpecialRule, TradeRule } from '../types/world'
import type { Card } from '../types/card'

export const REGIONS: Region[] = [
  { id: 'balamb', name: 'Balamb', rules: ['Open'], tradeRule: 'One' },
  { id: 'galbadia', name: 'Galbadia', rules: ['Same'], tradeRule: 'One' },
  { id: 'dollet', name: 'Dollet', rules: ['Random', 'Elemental'], tradeRule: 'One' },
  { id: 'fh', name: "Fisherman's Horizon", rules: ['Elemental', 'Sudden Death'], tradeRule: 'One' },
  { id: 'trabia', name: 'Trabia', rules: ['Random', 'Plus'], tradeRule: 'One' },
  { id: 'centra', name: 'Centra', rules: ['Same', 'Plus', 'Random'], tradeRule: 'One' },
  { id: 'esthar', name: 'Esthar', rules: ['Elemental', 'Same Wall'], tradeRule: 'One' },
  { id: 'lunar', name: 'Lunar', rules: ['Open', 'Same', 'Plus', 'Elemental', 'Same Wall', 'Random', 'Sudden Death'], tradeRule: 'One' },
]

const AREAS: Area[] = [
  {
    id: 'balamb_town', name: 'Balamb Town', regionId: 'balamb', order: 0, mapX: 18, mapY: 58,
    opponentName: 'Balamb Student', opponentImagePath: '/npcs/balamb_student.png',
    opponentDeckPool: ['geezard', 'funguar', 'bite_bug', 'red_bat', 'blobra', 'gayla', 'gesper', 'fastitocalon_f'],
    gilReward: 50,
  },
  {
    id: 'balamb_garden', name: 'Balamb Garden', regionId: 'balamb', order: 1, mapX: 22, mapY: 52,
    opponentName: 'Garden Student', opponentImagePath: '/npcs/garden_student.png',
    opponentDeckPool: ['blood_soul', 'caterchipillar', 'cockatrice', 'grat', 'buel', 'mesmerize', 'glacial_eye', 'belhelmel'],
    gilReward: 75,
  },
  {
    id: 'timber', name: 'Timber', regionId: 'galbadia', order: 2, mapX: 32, mapY: 48,
    opponentName: 'Timber Maniac', opponentImagePath: '/npcs/timber_maniac.png',
    opponentDeckPool: ['thrustaevis', 'anacondaur', 'creeps', 'grendel', 'jelleye', 'grand_mantis', 'forbidden', 'armadodo'],
    gilReward: 100,
  },
  {
    id: 'dollet', name: 'Dollet', regionId: 'dollet', order: 3, mapX: 12, mapY: 62,
    opponentName: 'Dollet Citizen', opponentImagePath: '/npcs/dollet_citizen.png',
    opponentDeckPool: ['glacial_eye', 'belhelmel', 'thrustaevis', 'anacondaur', 'tri_face', 'fastitocalon', 'snow_lion', 'ochu'],
    gilReward: 125,
  },
  {
    id: 'fh', name: "Fisherman's Horizon", regionId: 'fh', order: 4, mapX: 48, mapY: 55,
    opponentName: 'FH Resident', opponentImagePath: '/npcs/fh_resident.png',
    opponentDeckPool: ['sam08g', 'death_claw', 'cactuar', 'tonberry', 'abyss_worm', 'turtapod', 'vysage', 't_rexsaur'],
    gilReward: 150,
  },
  {
    id: 'trabia_garden', name: 'Trabia Garden', regionId: 'trabia', order: 5, mapX: 42, mapY: 22,
    opponentName: 'Trabia Student', opponentImagePath: '/npcs/trabia_student.png',
    opponentDeckPool: ['snow_lion', 'ochu', 'abyss_worm', 'turtapod', 'bomb', 'blitz', 'wendigo', 'torama'],
    gilReward: 175,
  },
  {
    id: 'shumi_village', name: 'Shumi Village', regionId: 'trabia', order: 6, mapX: 52, mapY: 32,
    opponentName: 'Shumi Elder', opponentImagePath: '/npcs/shumi_elder.png',
    opponentDeckPool: ['imp', 'blue_dragon', 'adamantoise', 'hexadragon', 'iron_giant', 'behemoth', 'chimera', 'pupu'],
    gilReward: 200,
  },
  {
    id: 'winhill', name: 'Winhill', regionId: 'centra', order: 7, mapX: 55, mapY: 52,
    opponentName: 'Winhill Resident', opponentImagePath: '/npcs/winhill_resident.png',
    opponentDeckPool: ['blitz', 'torama', 'blue_dragon', 'adamantoise', 'behemoth', 'malboro', 'ruby_dragon', 'elnoyle'],
    gilReward: 225,
  },
  {
    id: 'esthar_city', name: 'Esthar City', regionId: 'esthar', order: 8, mapX: 82, mapY: 48,
    opponentName: 'Esthar Scientist', opponentImagePath: '/npcs/esthar_scientist.png',
    opponentDeckPool: ['iron_giant', 'behemoth', 'malboro', 'ruby_dragon', 'elnoyle', 'tonberry_king', 'wedge_biggs', 'fujin_raijin'],
    gilReward: 250,
  },
  {
    id: 'lunar_gate', name: 'Lunar Gate', regionId: 'lunar', order: 9, mapX: 50, mapY: 8,
    opponentName: 'Lunar Base Soldier', opponentImagePath: '/npcs/lunar_soldier.png',
    opponentDeckPool: ['elvoret', 'x_atm092', 'granaldo', 'gerogero', 'iguion', 'abadon', 'propagator', 'jumbo_cactuar'],
    gilReward: 300,
  },
]

/** All spots per area: duel (default opponent), then shop/tournament if present. */
function buildSpots(): Spot[] {
  const spots: Spot[] = []
  for (const area of AREAS) {
    spots.push({
      id: area.id,
      name: area.opponentName ?? 'Card duel',
      areaId: area.id,
      type: 'duel',
      opponentName: area.opponentName,
      opponentImagePath: area.opponentImagePath,
      order: 0,
    })
  }
  const shopAreaIds = ['balamb_town', 'balamb_garden', 'timber', 'dollet', 'fh', 'shumi_village', 'esthar_city']
  for (const areaId of shopAreaIds) {
    spots.push({ id: `${areaId}_shop`, name: 'Card shop', areaId, type: 'shop', order: 1 })
  }
  const tournamentAreaIds = ['balamb_garden', 'dollet', 'fh', 'esthar_city']
  for (const areaId of tournamentAreaIds) {
    spots.push({ id: `${areaId}_tournament`, name: 'Tournament', areaId, type: 'tournament', order: 2 })
  }
  return spots
}

const SPOTS = buildSpots()

export function getRegionById(id: string): Region | undefined {
  return REGIONS.find((r) => r.id === id)
}

export function getAreas(): Area[] {
  return AREAS
}

export function getAreaById(id: string): Area | undefined {
  return AREAS.find((a) => a.id === id)
}

export function getSpots(areaId: string): Spot[] {
  return SPOTS.filter((s) => s.areaId === areaId).sort((a, b) => a.order - b.order)
}

export function getSpotById(spotId: string): Spot | undefined {
  return SPOTS.find((s) => s.id === spotId)
}

export function getAreaDeckPool(areaId: string, allCards: Card[]): Card[] {
  const area = getAreaById(areaId)
  if (!area?.opponentDeckPool || area.opponentDeckPool.length === 0) return allCards
  return allCards.filter((c) => area.opponentDeckPool!.includes(c.id))
}

export function formatRules(rules: SpecialRule[]): string {
  return rules.length > 0 ? rules.join(', ') : 'None'
}

/** @deprecated Use getAreas() for map markers; challenge/shop/tournament use spots. */
export function getLocations(): Area[] {
  return getAreas()
}

export { type Area, type Region, type Spot, type SpecialRule, type TradeRule }
