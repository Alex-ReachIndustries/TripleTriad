import type { Quest, QuestStatus } from '../types/quest'
import type { WorldPlayerState } from './worldState'
import { getNpcById, getLocationById } from './world'
import { isLocationUnlocked } from './unlock'

/**
 * Main story quests (18 chapters following FFVIII storyline) + side quests.
 * Main quests advance storyChapter on completion.
 * Quest givers are dialogue NPCs in town locations.
 */

// ─── Main Story Quests ──────────────────────────────────────────────────────

const MAIN_QUESTS: Quest[] = [
  {
    id: 'mq_fire_cavern',
    name: 'The Fire Cavern',
    description: 'Clear the Fire Cavern to qualify for the SeeD field exam.',
    giverNpcId: 'quistis_garden_ch1',
    type: 'clear_dungeon',
    targetId: 'fire_cavern',
    reward: { gil: 200 },
    isMainQuest: true,
    chapterTitle: 'Chapter 2: Fire Cavern',
    storyText: 'You conquered the Fire Cavern, defeating the fire spirits within. Ifrit himself acknowledged your strength. You are now qualified for the SeeD field exam.',
  },
  {
    id: 'mq_seed_exam',
    name: 'SeeD Field Exam',
    description: 'Infiltrate the Dollet Radio Tower and complete the SeeD field exam.',
    giverNpcId: 'cid',
    type: 'clear_dungeon',
    targetId: 'radio_tower',
    reward: { gil: 300 },
    isMainQuest: true,
    chapterTitle: 'Chapter 3: The SeeD Exam',
    storyText: 'The Radio Tower has been secured and the Dollet mission is complete. You passed the SeeD field exam with flying colours. At the graduation ball, you danced with a mysterious girl named Rinoa.',
  },
  {
    id: 'mq_timber_mission',
    name: 'The Forest Owls',
    description: 'Help Rinoa and the Forest Owls with their mission in Timber.',
    giverNpcId: 'rinoa_timber',
    type: 'beat_npc',
    targetId: 'fake_president',
    reward: { gil: 300 },
    isMainQuest: true,
    chapterTitle: 'Chapter 4: Timber',
    storyText: "The Forest Owls' train operation was a partial success — the fake president was exposed. But the real President Deling appeared on TV with the Sorceress, announcing her as Galbadia's new ambassador.",
  },
  {
    id: 'mq_assassination',
    name: 'The Sorceress',
    description: 'Execute the assassination plan at Deling City.',
    giverNpcId: 'general_caraway',
    type: 'clear_dungeon',
    targetId: 'deling_sewers',
    reward: { gil: 400 },
    isMainQuest: true,
    chapterTitle: 'Chapter 5: The Assassination',
    storyText: 'The assassination attempt failed. Irvine hesitated at the critical moment. You charged the Sorceress alone — and she struck you down with an ice lance. Darkness consumed you.',
  },
  {
    id: 'mq_prison_break',
    name: 'Prison Break',
    description: 'Escape from D-District Prison.',
    giverNpcId: 'seifer_prison',
    type: 'clear_dungeon',
    targetId: 'd_district_prison',
    reward: { gil: 400 },
    isMainQuest: true,
    chapterTitle: 'Chapter 6: D-District Prison',
    storyText: 'You escaped D-District Prison with the help of Moombas who recognized you as "Laguna." But the news is dire: missiles have been launched at both Trabia and Balamb Gardens.',
  },
  {
    id: 'mq_missile_base',
    name: 'Missile Crisis',
    description: "Infiltrate the Galbadia Missile Base and sabotage the launch targeting Balamb Garden.",
    giverNpcId: 'selphie_missile',
    type: 'clear_dungeon',
    targetId: 'galbadia_missile_base',
    reward: { gil: 500 },
    isMainQuest: true,
    chapterTitle: 'Chapter 7: Missile Base',
    storyText: "Selphie's team infiltrated the missile base and activated the self-destruct sequence. The base erupted in flames — but not before missiles were partially redirected.",
  },
  {
    id: 'mq_garden_crisis',
    name: 'Garden in Revolt',
    description: 'Defeat Garden Master NORG in the basement and activate the Garden flight mechanism.',
    giverNpcId: 'xu',
    type: 'clear_dungeon',
    targetId: 'balamb_garden_basement',
    reward: { gil: 500 },
    isMainQuest: true,
    chapterTitle: 'Chapter 7: Garden Crisis',
    storyText: 'NORG has been defeated. In the depths of the basement, you discovered the ancient mechanism — Balamb Garden can fly. The Garden lifted off just as the missiles struck, escaping destruction.',
  },
  {
    id: 'mq_the_bridge',
    name: "Fisherman's Bridge",
    description: "Prove your worth at Fisherman's Horizon.",
    giverNpcId: 'mayor_dobe',
    type: 'beat_npc',
    targetId: 'fh_master',
    reward: { gil: 500 },
    isMainQuest: true,
    chapterTitle: "Chapter 8: Fisherman's Horizon",
    storyText: "The mobile Garden crash-landed at Fisherman's Horizon. Despite Mayor Dobe's protests, you proved your skills are more than just warfare. Cid named you commander of Balamb Garden.",
  },
  {
    id: 'mq_reclaim_balamb',
    name: 'Balamb Liberation',
    description: 'Drive the Galbadian occupiers out of Balamb Town.',
    giverNpcId: 'zell_balamb',
    type: 'clear_dungeon',
    targetId: 'balamb_under_siege',
    reward: { gil: 500 },
    isMainQuest: true,
    chapterTitle: 'Chapter 9: Balamb Liberation',
    storyText: "Fujin and Raijin's occupation of Balamb has ended. Zell's hometown is free once more. The search for Ellone continues.",
  },
  {
    id: 'mq_memories',
    name: 'Shattered Memories',
    description: 'Visit the ruins of Trabia Garden and uncover the truth about your past.',
    giverNpcId: 'selphie_trabia',
    type: 'beat_npc',
    targetId: 'trabia_champion',
    reward: { gil: 600, cardId: 'hexadragon' },
    isMainQuest: true,
    chapterTitle: 'Chapter 10: The Truth',
    storyText: "At Trabia Garden's ruins, Irvine revealed the devastating truth: you all grew up at the same orphanage. Edea — the Sorceress — was your Matron. GF junctioning erased your memories.",
  },
  {
    id: 'mq_garden_clash',
    name: 'Battle of the Gardens',
    description: 'Storm Galbadia Garden and end the Sorceress threat.',
    giverNpcId: 'quistis_gg',
    type: 'clear_dungeon',
    targetId: 'galbadia_garden_revolution',
    reward: { gil: 700 },
    isMainQuest: true,
    chapterTitle: 'Chapter 11: Battle of the Gardens',
    storyText: "The two Gardens clashed in the skies. You fought through Galbadia Garden, defeated Seifer again, and faced Edea. This time, Ultimecia's hold broke — Edea was freed. But Rinoa fell into a mysterious coma.",
  },
  {
    id: 'mq_orphanage',
    name: 'The Orphanage',
    description: 'Visit Edea at the orphanage and find the White SeeD Ship.',
    giverNpcId: 'edea_centra',
    type: 'beat_npc',
    targetId: 'white_seed_captain',
    reward: { gil: 700 },
    isMainQuest: true,
    chapterTitle: 'Chapter 12: The Orphanage',
    storyText: "At the orphanage, Edea — free from possession — told you about Ultimecia, a sorceress from the far future. The White SeeD Ship held the key to reaching Esthar, where Ellone was taken.",
  },
  {
    id: 'mq_esthar',
    name: 'The Hidden Nation',
    description: 'Cross the Great Salt Lake and reach the hidden nation of Esthar.',
    giverNpcId: 'esthar_official',
    type: 'clear_dungeon',
    targetId: 'great_salt_lake',
    reward: { gil: 800 },
    isMainQuest: true,
    chapterTitle: 'Chapter 13: Esthar',
    storyText: "Beyond the Great Salt Lake, you discovered Esthar — a technological marvel hidden from the world. President Laguna Loire, the man from your dreams, revealed the truth about Adel, Ellone, and the Lunar Cry.",
  },
  {
    id: 'mq_lunar_cry',
    name: 'Tears of the Moon',
    description: 'Reach the Lunar Base and prevent the Lunar Cry.',
    giverNpcId: 'esthar_official',
    type: 'clear_dungeon',
    targetId: 'lunar_base',
    reward: { gil: 800 },
    isMainQuest: true,
    chapterTitle: 'Chapter 14: Space',
    storyText: "On the Lunar Base, Ultimecia possessed Rinoa and released Sorceress Adel from her orbital prison. The Lunar Cry poured monsters onto the planet. In the chaos, you drifted through space to save Rinoa — and found her.",
  },
  {
    id: 'mq_deep_sea',
    name: 'Into the Abyss',
    description: 'Explore the Deep Sea Research Centre and retrieve the ancient technology.',
    giverNpcId: 'dr_odine',
    type: 'clear_dungeon',
    targetId: 'deep_sea_research_center',
    reward: { gil: 1000 },
    isMainQuest: true,
    chapterTitle: 'Chapter 15: The Deep',
    storyText: "In the deepest facility in the world, you faced the most dangerous opponents yet. The ancient Centra technology within may hold the key to defeating Ultimecia.",
  },
  {
    id: 'mq_lunatic_pandora',
    name: "Pandora's Box",
    description: 'Storm the Lunatic Pandora and confront Seifer one last time.',
    giverNpcId: 'laguna_esthar',
    type: 'clear_dungeon',
    targetId: 'lunatic_pandora',
    reward: { gil: 1000 },
    isMainQuest: true,
    chapterTitle: 'Chapter 16: Lunatic Pandora',
    storyText: "In the Lunatic Pandora, Fujin begged Seifer to stop — speaking softly for the first time. He refused. You defeated Seifer, then Sorceress Adel. Ultimecia possessed Rinoa, and Ellone triggered time compression.",
  },
  {
    id: 'mq_time_compression',
    name: 'Through Time',
    description: 'Navigate the warped corridors of time compression.',
    giverNpcId: 'edea_final',
    type: 'clear_dungeon',
    targetId: 'centra_excavation_site',
    reward: { gil: 1500 },
    isMainQuest: true,
    chapterTitle: 'Chapter 17: Time Compression',
    storyText: "Reality warped around you. Past and future collapsed into a single distorted present. You walked through the chaos, holding on to the bonds that anchored you — and found the path to Ultimecia's Castle.",
  },
  {
    id: 'mq_ultimecia',
    name: 'The Final Hand',
    description: "Storm Ultimecia's Castle and defeat the Sorceress from the future.",
    giverNpcId: 'edea_final',
    type: 'clear_dungeon',
    targetId: 'centra_ruins',
    reward: { gil: 5000 },
    isMainQuest: true,
    chapterTitle: 'Chapter 18: The Final Hand',
    storyText: "In Ultimecia's Castle, you faced her four forms — sorceress, Griever, the fused abomination, and finally her cosmic true self. With one final hand of cards, you ended her reign across all of time.",
  },
]

// ─── Side Quests ────────────────────────────────────────────────────────────

const SIDE_QUESTS: Quest[] = [
  {
    id: 'zells_request',
    name: "Zell's Request",
    description: 'Zell wants a Mesmerize card. Find one and bring it back.',
    giverNpcId: 'zell_garden',
    type: 'find_card',
    targetId: 'mesmerize',
    reward: { gil: 200 },
  },
  {
    id: 'quistis_test',
    name: "Quistis's Test",
    description: 'Quistis challenges you to defeat CC Club Jack to prove your skills.',
    giverNpcId: 'quistis_garden_ch1',
    type: 'beat_npc',
    targetId: 'cc_club_jack',
    reward: { gil: 0, cardId: 'thrustaevis' },
  },
  {
    id: 'queens_favour',
    name: "Queen's Favour",
    description: 'The Queen of Cards is searching for a Forbidden card.',
    giverNpcId: 'queen_of_cards_esthar',
    type: 'find_card',
    targetId: 'forbidden',
    reward: { gil: 0, cardId: 'armadodo', cardCount: 2 },
  },
  {
    id: 'resistance_supplies',
    name: 'Resistance Supplies',
    description: 'Zone of the Forest Owls needs a Grand Mantis card for trade goods.',
    giverNpcId: 'zone_timber',
    type: 'find_card',
    targetId: 'grand_mantis',
    reward: { gil: 300 },
  },
  {
    id: 'irvines_challenge',
    name: "Irvine's Challenge",
    description: 'Irvine dares you to beat the Galbadia Instructor in a duel.',
    giverNpcId: 'irvine_gg',
    type: 'beat_npc',
    targetId: 'galbadia_instructor',
    reward: { gil: 0, cardId: 'cactuar' },
  },
  {
    id: 'fishers_catch',
    name: "Fisher's Catch",
    description: 'An old fisherman at FH wants a Fastitocalon card as a lucky charm.',
    giverNpcId: 'fh_fisherman',
    type: 'find_card',
    targetId: 'fastitocalon',
    reward: { gil: 400 },
  },
  {
    id: 'selphies_morale_boost',
    name: "Selphie's Morale Boost",
    description: 'Selphie wants you to beat the Trabia Scout to lift spirits.',
    giverNpcId: 'selphie_trabia',
    type: 'beat_npc',
    targetId: 'trabia_scout',
    reward: { gil: 300, cardId: 'hexadragon' },
  },
  {
    id: 'sculptors_muse',
    name: "The Sculptor's Muse",
    description: 'The Shumi attendant says the sculptor needs a PuPu card for inspiration.',
    giverNpcId: 'shumi_attendant',
    type: 'find_card',
    targetId: 'pupu',
    reward: { gil: 500, cardId: 'blue_dragon' },
  },
  {
    id: 'lagunas_memento',
    name: "Laguna's Memento",
    description: 'Laguna asks you to defeat the Winhill Flower Girl in a friendly duel.',
    giverNpcId: 'laguna_esthar',
    type: 'beat_npc',
    targetId: 'winhill_flower_girl',
    reward: { gil: 500, cardId: 'imp' },
  },
  {
    id: 'matrons_request',
    name: "Matron's Request",
    description: 'Edea asks you to brave the Centra Ruins and defeat the guardian within.',
    giverNpcId: 'edea_centra',
    type: 'clear_dungeon',
    targetId: 'centra_ruins',
    reward: { gil: 600, cardId: 'elnoyle' },
  },
  {
    id: 'tonberrys_treasure',
    name: "Tonberry's Treasure",
    description: 'A mysterious researcher in the deep sea needs a Tonberry King card.',
    giverNpcId: 'deep_sea_researcher',
    type: 'find_card',
    targetId: 'tonberry_king',
    reward: { gil: 800, cardId: 'wedge_biggs' },
  },
  {
    id: 'rinoas_wish',
    name: "Rinoa's Wish",
    description: 'Rinoa wants you to defeat the Esthar Soldier to prove your strength.',
    giverNpcId: 'rinoa_esthar',
    type: 'beat_npc',
    targetId: 'esthar_soldier',
    reward: { gil: 1000, cardId: 'fujin_raijin' },
  },
  {
    id: 'final_frontier',
    name: 'Final Frontier',
    description: 'Ellone challenges you to clear the Lunar Base to prove yourself.',
    giverNpcId: 'ellone_lunar',
    type: 'clear_dungeon',
    targetId: 'lunar_base',
    reward: { gil: 2000, cardId: 'mobile_type_8' },
  },
  // CC Group quest chain
  {
    id: 'sq_cc_jack',
    name: 'CC Group: Jack',
    description: 'Defeat CC Jack in Balamb Garden.',
    giverNpcId: 'cc_club_jack',
    type: 'beat_npc',
    targetId: 'cc_club_jack',
    reward: { gil: 100 },
    storyText: 'You defeated CC Jack, the lowest-ranked member of the Card Club. He hinted at stronger members hiding in the Garden.',
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

/**
 * Check if a quest is accessible to the player right now.
 * A quest is accessible when:
 * 1. Its giver NPC exists and is visible (within minChapter/maxChapter range)
 * 2. The giver NPC's location is unlocked
 */
export function isQuestAccessible(quest: Quest, worldState: WorldPlayerState): boolean {
  const npc = getNpcById(quest.giverNpcId)
  if (!npc) return false

  // Check NPC chapter visibility
  if (npc.minChapter != null && worldState.storyChapter < npc.minChapter) return false
  if (npc.maxChapter != null && worldState.storyChapter > npc.maxChapter) return false

  // Check location unlock
  const location = getLocationById(npc.locationId)
  if (!location) return false
  if (!isLocationUnlocked(location, worldState)) return false

  return true
}
