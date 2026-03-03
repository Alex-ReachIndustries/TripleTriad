/**
 * Side quest system types.
 * Quests are offered by dialogue NPCs and track find_card, beat_npc, or clear_dungeon objectives.
 */

export type QuestType = 'find_card' | 'beat_npc' | 'clear_dungeon'

export interface QuestReward {
  /** Gil amount awarded. 0 if no gil reward. */
  gil: number
  /** Card ID awarded. Undefined if no card reward. */
  cardId?: string
  /** Number of copies of the card to award (default 1). */
  cardCount?: number
}

export interface Quest {
  id: string
  name: string
  description: string
  /** NPC who gives this quest. */
  giverNpcId: string
  type: QuestType
  /** Card ID (find_card), NPC ID (beat_npc), or dungeon location ID (clear_dungeon). */
  targetId: string
  reward: QuestReward
}

export type QuestStatus = 'available' | 'active' | 'completed'
