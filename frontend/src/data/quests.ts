import type { Quest, QuestStatus } from '../types/quest'

/**
 * Main story quests (13 chapters) + side quests (~15).
 * Main quests advance storyChapter on completion.
 * Quest givers are dialogue NPCs in town locations.
 */

// ─── Main Story Quests ──────────────────────────────────────────────────────

const MAIN_QUESTS: Quest[] = [
  {
    id: 'mq_seed_exam',
    name: 'The SeeD Exam',
    description: 'Clear the Radio Tower in Dollet to complete your SeeD field exam.',
    giverNpcId: 'cid',
    type: 'clear_dungeon',
    targetId: 'radio_tower',
    reward: { gil: 500 },
    isMainQuest: true,
    chapterTitle: 'Chapter 1: The SeeD Exam',
    storyText: 'You passed the SeeD field exam at the Dollet Communication Tower. As a newly minted SeeD, your first real mission takes you across the sea to the Galbadian continent...',
  },
  {
    id: 'mq_galbadian_offensive',
    name: 'The Galbadian Offensive',
    description: 'Infiltrate and shut down the Galbadia Missile Base before it launches.',
    giverNpcId: 'rinoa_timber',
    type: 'clear_dungeon',
    targetId: 'galbadia_missile_base',
    reward: { gil: 800 },
    isMainQuest: true,
    chapterTitle: 'Chapter 2: The Galbadian Offensive',
    storyText: 'The missile base is destroyed, but not before a launch was triggered. Balamb Garden is in danger — you must return immediately...',
  },
  {
    id: 'mq_gardens_secret',
    name: "Garden's Secret",
    description: 'Explore the hidden basement beneath Balamb Garden to activate its ancient mechanism.',
    giverNpcId: 'xu',
    type: 'clear_dungeon',
    targetId: 'balamb_garden_basement',
    reward: { gil: 600 },
    isMainQuest: true,
    chapterTitle: "Chapter 3: Garden's Secret",
    storyText: "Deep beneath Balamb Garden, you discovered an ancient Centra shelter. The Garden's true nature as a mobile fortress has been revealed. Now airborne, you drift toward Fisherman's Horizon...",
  },
  {
    id: 'mq_the_bridge',
    name: 'The Bridge',
    description: "Prove your worth to the people of Fisherman's Horizon by defeating their champion.",
    giverNpcId: 'mayor_dobe',
    type: 'beat_npc',
    targetId: 'fh_master',
    reward: { gil: 500 },
    isMainQuest: true,
    chapterTitle: 'Chapter 4: The Bridge',
    storyText: "The pacifists of Fisherman's Horizon accepted you after you proved your skill. But reports from Balamb are troubling — Galbadian soldiers have occupied the town...",
  },
  {
    id: 'mq_reclaiming_balamb',
    name: 'Reclaiming Balamb',
    description: 'Drive out the Galbadian occupiers from Balamb town!',
    giverNpcId: 'zell_balamb',
    type: 'clear_dungeon',
    targetId: 'balamb_under_siege',
    reward: { gil: 700 },
    isMainQuest: true,
    chapterTitle: 'Chapter 5: Reclaiming Balamb',
    storyText: 'Balamb is free again! But the war is far from over. Intelligence reports mention Trabia Garden was hit by the missiles. You must go north to help the survivors...',
  },
  {
    id: 'mq_memories',
    name: 'Memories of the Past',
    description: 'Help the survivors at Trabia Garden by defeating their strongest duelist.',
    giverNpcId: 'selphie_trabia',
    type: 'beat_npc',
    targetId: 'trabia_champion',
    reward: { gil: 600, cardId: 'hexadragon' },
    isMainQuest: true,
    chapterTitle: 'Chapter 6: Memories of the Past',
    storyText: 'At the ruins of Trabia Garden, childhood memories surfaced. You remember the orphanage... and Matron Edea. But first, Galbadia Garden approaches for battle...',
  },
  {
    id: 'mq_garden_clash',
    name: 'Garden Clash',
    description: 'Storm Galbadia Garden and defeat its defenders in the Battle of the Gardens!',
    giverNpcId: 'quistis_gg',
    type: 'clear_dungeon',
    targetId: 'galbadia_garden_revolution',
    reward: { gil: 1000 },
    isMainQuest: true,
    chapterTitle: 'Chapter 7: Garden Clash',
    storyText: 'The Battle of the Gardens is won. Edea has been freed from the Sorceress\'s control. She speaks of an orphanage on the Centra continent where it all began...',
  },
  {
    id: 'mq_the_orphanage',
    name: 'The Orphanage',
    description: 'Seek out the White SeeD Ship and defeat their captain to prove your resolve.',
    giverNpcId: 'edea_centra',
    type: 'beat_npc',
    targetId: 'white_seed_captain',
    reward: { gil: 800 },
    isMainQuest: true,
    chapterTitle: 'Chapter 8: The Orphanage',
    storyText: 'The White SeeDs revealed that the true Sorceress is in Esthar. To reach the technologically advanced nation, you must cross the Great Salt Lake...',
  },
  {
    id: 'mq_contact',
    name: 'Contact',
    description: 'Infiltrate the Lunar Base and stop the Sorceress from space.',
    giverNpcId: 'esthar_official',
    type: 'clear_dungeon',
    targetId: 'lunar_base',
    reward: { gil: 1200 },
    isMainQuest: true,
    chapterTitle: 'Chapter 9: Contact',
    storyText: 'The Lunar Cry has been triggered. Monsters rain from the moon as Lunatic Pandora rises. But first, intelligence reports of a hidden research facility in Centra...',
  },
  {
    id: 'mq_into_the_deep',
    name: 'Into the Deep',
    description: 'Descend to the bottom of the Deep Sea Research Centre and conquer its guardian.',
    giverNpcId: 'dr_odine',
    type: 'clear_dungeon',
    targetId: 'deep_sea_research_center',
    reward: { gil: 1500 },
    isMainQuest: true,
    chapterTitle: 'Chapter 10: Into the Deep',
    storyText: 'The Deep Sea Research Centre held ancient Centra technology — and fearsome guardians. With this knowledge, perhaps the Shumi people of Trabia can help...',
  },
  {
    id: 'mq_shumis_wisdom',
    name: "The Shumi's Wisdom",
    description: 'Seek the wisdom of the Shumi Elder.',
    giverNpcId: 'shumi_attendant',
    type: 'beat_npc',
    targetId: 'shumi_elder',
    reward: { gil: 800, cardId: 'pupu' },
    isMainQuest: true,
    chapterTitle: "Chapter 11: The Shumi's Wisdom",
    storyText: 'The Shumi Elder shared ancient knowledge of time and space. Lunatic Pandora has appeared above Esthar — you must confront it before Time Compression begins...',
  },
  {
    id: 'mq_pandoras_box',
    name: "Pandora's Box",
    description: 'Ascend Lunatic Pandora and defeat its commander.',
    giverNpcId: 'laguna_esthar',
    type: 'clear_dungeon',
    targetId: 'lunatic_pandora',
    reward: { gil: 2000 },
    isMainQuest: true,
    chapterTitle: "Chapter 12: Pandora's Box",
    storyText: 'Lunatic Pandora has fallen. But the Sorceress has fled to the Centra continent, seeking the ruins of an ancient civilisation. This is the final battle...',
  },
  {
    id: 'mq_time_compression',
    name: 'Time Compression',
    description: 'Enter the Centra Ruins and defeat the ultimate guardian to end the Sorceress threat.',
    giverNpcId: 'edea_final',
    type: 'clear_dungeon',
    targetId: 'centra_ruins',
    reward: { gil: 5000 },
    isMainQuest: true,
    chapterTitle: 'Chapter 13: Time Compression',
    storyText: 'You conquered the Centra Ruins and defeated the ultimate guardian. The world of Triple Triad is at peace. Your journey from five humble cards to world champion is complete.',
  },
]

// ─── Side Quests ────────────────────────────────────────────────────────────

const SIDE_QUESTS: Quest[] = [
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

/** All quests: main story + side quests combined. */
export const QUESTS: Quest[] = [...MAIN_QUESTS, ...SIDE_QUESTS]

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
