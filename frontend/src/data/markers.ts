/**
 * Notification marker system — derives marker types for locations and regions
 * from quest status and NPC visibility. Used by WorldMapView, RegionView, TownView.
 */

import type { WorldPlayerState } from './worldState'
import { getNpcsByLocation, getLocations } from './world'
import { getQuestsByNpc, getQuestStatus } from './quests'
import { isLocationUnlocked } from './unlock'

export type MarkerType = 'main_quest' | 'side_quest'

/** Get notification markers for a specific location. */
export function getLocationMarkers(
  locationId: string,
  worldState: WorldPlayerState
): MarkerType[] {
  const npcs = getNpcsByLocation(locationId)
  let hasMainQuest = false
  let hasSideQuest = false

  for (const npc of npcs) {
    // Skip NPCs not visible at current story chapter
    if (npc.minChapter != null && worldState.storyChapter < npc.minChapter) continue
    if (npc.maxChapter != null && worldState.storyChapter > npc.maxChapter) continue

    const quests = getQuestsByNpc(npc.id)
    for (const quest of quests) {
      const status = getQuestStatus(quest.id, worldState.activeQuests, worldState.completedQuests)
      if (status === 'available' || status === 'active') {
        if (quest.isMainQuest) hasMainQuest = true
        else hasSideQuest = true
      }
    }
  }

  const markers: MarkerType[] = []
  if (hasMainQuest) markers.push('main_quest')
  if (hasSideQuest) markers.push('side_quest')
  return markers
}

/** Get aggregated markers for a region (all unlocked locations including TDs). */
export function getRegionMarkers(
  regionId: string,
  worldState: WorldPlayerState
): MarkerType[] {
  const markers = new Set<MarkerType>()
  const locations = getLocations().filter(l => l.regionId === regionId)

  for (const loc of locations) {
    if (isLocationUnlocked(loc, worldState)) {
      for (const m of getLocationMarkers(loc.id, worldState)) {
        markers.add(m)
      }
    }
  }

  return Array.from(markers)
}

/** Check if a location has any markers. */
export function hasMarkers(locationId: string, worldState: WorldPlayerState): boolean {
  return getLocationMarkers(locationId, worldState).length > 0
}
