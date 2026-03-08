/**
 * Unlock evaluation for regions and locations.
 * Computes whether regions/locations are accessible based on player progress.
 *
 * npcWins is keyed by NPC ID (not location ID). Each entry tracks how many
 * times the player has beaten that specific NPC.
 */
import type { WorldPlayerState } from './worldState'
import type { Region, Location, UnlockCondition } from '../types/world'
import { getNpcsByLocation, getLocationsByRegion, getRegionById } from './world'

/** Check if a specific NPC has been beaten at least once. */
export function hasBeatenNpc(npcWins: Record<string, number>, npcId: string): boolean {
  return (npcWins[npcId] ?? 0) > 0
}

/** Count unique duel NPCs beaten at a given location. */
export function getUniqueNpcWinsInLocation(npcWins: Record<string, number>, locationId: string): number {
  const npcs = getNpcsByLocation(locationId)
  return npcs.filter(npc => npc.type === 'duel' && (npcWins[npc.id] ?? 0) > 0).length
}

/** Count unique duel NPCs beaten across all locations in a region. */
export function getUniqueNpcWinsInRegion(npcWins: Record<string, number>, regionId: string): number {
  const locations = getLocationsByRegion(regionId)
  let count = 0
  for (const loc of locations) {
    count += getUniqueNpcWinsInLocation(npcWins, loc.id)
  }
  return count
}

/** Evaluate whether an unlock condition is met. */
export function isUnlockConditionMet(
  condition: UnlockCondition | null,
  state: WorldPlayerState
): boolean {
  if (!condition) return true
  switch (condition.type) {
    case 'default':
      return true
    case 'beat_npc':
      return hasBeatenNpc(state.npcWins, condition.targetId!)
    case 'clear_dungeon':
      return state.clearedDungeons.includes(condition.targetId!)
    case 'unique_wins_in_location':
      return getUniqueNpcWinsInLocation(state.npcWins, condition.targetId!) >= (condition.count ?? 1)
    case 'unique_wins_in_region':
      return getUniqueNpcWinsInRegion(state.npcWins, condition.targetId!) >= (condition.count ?? 1)
    case 'quest_count':
      return state.completedQuests.length >= (condition.count ?? 1)
    case 'story_chapter':
      return state.storyChapter >= (condition.count ?? 0)
    case 'quest_accepted':
      return state.activeQuests.includes(condition.targetId!)
        || state.completedQuests.includes(condition.targetId!)
    case 'quest_completed':
      return state.completedQuests.includes(condition.targetId!)
    case 'npc_spoken':
      return Object.values(state.seenContent).some(
        npcs => npcs.includes(condition.targetId!)
      )
    default:
      return false
  }
}

/** Check if a region is unlocked for the player. */
export function isRegionUnlocked(region: Region, state: WorldPlayerState): boolean {
  return isUnlockConditionMet(region.unlockCondition, state)
}

/** Check if a location is unlocked for the player. */
export function isLocationUnlocked(location: Location, state: WorldPlayerState): boolean {
  const region = getRegionById(location.regionId)
  if (region && !isRegionUnlocked(region, state)) return false
  return isUnlockConditionMet(location.unlockCondition, state)
}
