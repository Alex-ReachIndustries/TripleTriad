/**
 * NPC character icons for profile customisation.
 * Unlocked by defeating (or meeting) the NPC in single player.
 * Uses existing NPC portrait paths from world data.
 */

import type { CharIconDef } from '../types/multiplayer'
import { NPCS } from './world'

let _cached: CharIconDef[] | null = null

export function getNpcCharIcons(): CharIconDef[] {
  if (_cached) return _cached

  // Only duel-type NPCs have portraits and make sense as profile icons
  _cached = NPCS
    .filter(npc => npc.type === 'duel' && npc.portrait)
    .map(npc => ({
      id: `npc_${npc.id}`,
      name: npc.name,
      src: npc.portrait!,
      category: 'npc' as const,
      npcId: npc.id,
      unlockCondition: { type: 'npc_beaten' as const, npcId: npc.id },
    }))

  return _cached
}
