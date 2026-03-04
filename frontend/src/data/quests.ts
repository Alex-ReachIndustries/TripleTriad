import type { Quest, QuestStatus } from '../types/quest'

/**
 * All 13 hand-crafted side quests.
 * Quest givers are dialogue NPCs in town locations.
 */
export const QUESTS: Quest[] = [
  {
    id: 'zells_request',
    name: "Zell's Request",
    description: 'Zell wants a Mesmerize card. Find one and bring it back.',
    giverNpcId: 'zell',
    type: 'find_card',
    targetId: 'mesmerize',
    reward: { gil: 200 },
  },
  {
    id: 'quistis_test',
    name: "Quistis's Test",
    description: 'Quistis challenges you to defeat CC Club Jack to prove your skills.',
    giverNpcId: 'quistis',
    type: 'beat_npc',
    targetId: 'cc_club_jack',
    reward: { gil: 0, cardId: 'thrustaevis' },
  },
  {
    id: 'queens_favour',
    name: "Queen's Favour",
    description: 'The Queen of Cards is searching for a Forbidden card.',
    giverNpcId: 'queen_of_cards',
    type: 'find_card',
    targetId: 'forbidden',
    reward: { gil: 0, cardId: 'armadodo', cardCount: 2 },
  },
  {
    id: 'resistance_supplies',
    name: 'Resistance Supplies',
    description: 'A resistance member needs a Grand Mantis card for trade goods.',
    giverNpcId: 'resistance_member',
    type: 'find_card',
    targetId: 'grand_mantis',
    reward: { gil: 300 },
  },
  {
    id: 'irvines_challenge',
    name: "Irvine's Challenge",
    description: 'Irvine dares you to beat the Galbadia Instructor in a duel.',
    giverNpcId: 'irvine',
    type: 'beat_npc',
    targetId: 'galbadia_instructor',
    reward: { gil: 0, cardId: 'cactuar' },
  },
  {
    id: 'fishers_catch',
    name: "Fisher's Catch",
    description: 'The FH fisherman wants a Fastitocalon card as a lucky charm.',
    giverNpcId: 'fh_fisherman',
    type: 'find_card',
    targetId: 'fastitocalon',
    reward: { gil: 400 },
  },
  {
    id: 'selphies_morale_boost',
    name: "Selphie's Morale Boost",
    description: 'Selphie wants you to beat the Trabia Scout to lift spirits.',
    giverNpcId: 'selphie',
    type: 'beat_npc',
    targetId: 'trabia_scout',
    reward: { gil: 300, cardId: 'hexadragon' },
  },
  {
    id: 'sculptors_muse',
    name: "The Sculptor's Muse",
    description: 'The Shumi Sculptor needs a PuPu card for artistic inspiration.',
    giverNpcId: 'shumi_sculptor',
    type: 'find_card',
    targetId: 'pupu',
    reward: { gil: 500, cardId: 'blue_dragon' },
  },
  {
    id: 'lagunas_memento',
    name: "Laguna's Memento",
    description: 'Laguna asks you to defeat the Winhill Flower Girl in a friendly duel.',
    giverNpcId: 'laguna',
    type: 'beat_npc',
    targetId: 'winhill_flower_girl',
    reward: { gil: 500, cardId: 'imp' },
  },
  {
    id: 'matrons_request',
    name: "Matron's Request",
    description: 'Edea asks you to brave the Centra Ruins and defeat the guardian within.',
    giverNpcId: 'edea',
    type: 'clear_dungeon',
    targetId: 'centra_ruins',
    reward: { gil: 600, cardId: 'elnoyle' },
  },
  {
    id: 'tonberrys_treasure',
    name: "Tonberry's Treasure",
    description: 'The Tonberry King wants a Tonberry King card — how fitting.',
    giverNpcId: 'tonberry_king_npc',
    type: 'find_card',
    targetId: 'tonberry_king',
    reward: { gil: 800, cardId: 'wedge_biggs' },
  },
  {
    id: 'rinoas_wish',
    name: "Rinoa's Wish",
    description: 'Rinoa wants you to defeat the Esthar Soldier to prove your strength.',
    giverNpcId: 'rinoa',
    type: 'beat_npc',
    targetId: 'esthar_soldier',
    reward: { gil: 1000, cardId: 'fujin_raijin' },
  },
  {
    id: 'final_frontier',
    name: 'Final Frontier',
    description: 'A space engineer challenges you to clear the Lunar Gate dungeon.',
    giverNpcId: 'space_engineer',
    type: 'clear_dungeon',
    targetId: 'lunar_base',
    reward: { gil: 2000, cardId: 'mobile_type_8' },
  },
]

/** Look up a quest by ID. */
export function getQuestById(id: string): Quest | undefined {
  return QUESTS.find((q) => q.id === id)
}

/** Get all quests offered by a specific NPC. */
export function getQuestsByNpc(npcId: string): Quest[] {
  return QUESTS.filter((q) => q.giverNpcId === npcId)
}

/**
 * Check if a quest's completion condition is met.
 * @param quest The quest to check.
 * @param inventory Player's card inventory.
 * @param npcWins Record of NPC IDs the player has beaten (npcId → win count).
 * @param clearedDungeons Set of dungeon location IDs the player has cleared.
 */
export function isQuestComplete(
  quest: Quest,
  inventory: Record<string, number>,
  npcWins: Record<string, number>,
  clearedDungeons: Set<string>
): boolean {
  switch (quest.type) {
    case 'find_card':
      return (inventory[quest.targetId] ?? 0) > 0
    case 'beat_npc':
      return (npcWins[quest.targetId] ?? 0) > 0
    case 'clear_dungeon':
      return clearedDungeons.has(quest.targetId)
    default:
      return false
  }
}

/** Get the status of a quest given the player's quest tracking state. */
export function getQuestStatus(
  questId: string,
  activeQuests: string[],
  completedQuests: string[]
): QuestStatus {
  if (completedQuests.includes(questId)) return 'completed'
  if (activeQuests.includes(questId)) return 'active'
  return 'available'
}
