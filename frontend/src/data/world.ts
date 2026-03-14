/**
 * V3 Campaign world data: 6 regions, ~30 locations, ~100+ NPCs.
 * 18-chapter FF8 storyline with backtracking and TD (Town-Dungeon) locations.
 * Source of truth: .cursor/projects/triple-triad-v3-campaign.md
 */

import type {
  Region,
  Location,
  NPC,
  SpecialRule,
  TradeRule,
  Area,
  Spot,
  UnlockCondition,
} from '../types/world'
import type { Card } from '../types/card'

// ─── Regions ────────────────────────────────────────────────────────────────

export const REGIONS: Region[] = [
  {
    id: 'balamb',
    name: 'Balamb',
    rules: ['Open'],
    tradeRule: 'One',
    order: 0,
    description:
      'Home to Balamb Garden and the coastal town of Dollet. Open rules let you see your opponent\'s hand — a fair start for new players.',
    mapBounds: '57,42.2 61.3,42.6 62.7,47 55.7,49 53.1,49 42.2,43.6 42,39.9 42.9,37.4 53.4,43.3 57,42.2',
    unlockCondition: null,
  },
  {
    id: 'galbadia',
    name: 'Galbadia',
    rules: ['Same'],
    tradeRule: 'One',
    order: 1,
    description:
      'The militaristic Galbadian continent. The Same rule makes positioning crucial — one wrong move and your cards get chain-captured.',
    mapBounds: '16.3,29.8 38.6,32.5 48.4,61.4 28,70.1 16.3,29.8',
    unlockCondition: { type: 'story_chapter', count: 3 },
  },
  {
    id: 'fh',
    name: "Fisherman's Horizon",
    rules: ['Elemental', 'Sudden Death'],
    tradeRule: 'Diff',
    order: 2,
    description:
      'A pacifist settlement on the transcontinental bridge. Sudden Death means draws never end, and the Diff trade rule means you win or lose cards proportional to your score.',
    mapBounds: '52.9,53.3 60.8,54 60.9,61.5 53.5,60.9 52.9,53.3',
    unlockCondition: { type: 'story_chapter', count: 7 },
  },
  {
    id: 'trabia',
    name: 'Trabia',
    rules: ['Random', 'Plus'],
    tradeRule: 'Diff',
    order: 3,
    description:
      'The frozen northern continent. The Plus rule rewards mathematical thinking, but Random hands make it a gamble. Diff trading means bigger wins — and bigger losses.',
    mapBounds: '45.6,12.7 78.4,26.4 76.4,41.5 46.5,39 45.6,12.7',
    unlockCondition: { type: 'story_chapter', count: 9 },
  },
  {
    id: 'centra',
    name: 'Centra',
    rules: ['Same', 'Plus', 'Combo'],
    tradeRule: 'Direct',
    order: 4,
    description:
      'The ruined southern continent, devastated by the Lunar Cry. Combo chains captures from Same and Plus, and Direct trade means you swap every card you captured.',
    mapBounds: '40.9,64.9 61.1,65.4 66.1,94.9 32.2,93.2 40.9,64.9',
    unlockCondition: { type: 'story_chapter', count: 11 },
  },
  {
    id: 'esthar',
    name: 'Esthar',
    rules: ['Elemental', 'Same Wall', 'Random'],
    tradeRule: 'All',
    order: 5,
    description:
      'The technologically advanced Esthar continent. Same Wall makes edges deadly, Random shuffles your hand, and the All trade rule means the winner takes everything.',
    mapBounds: '65.7,44.6 89.3,46.5 81.6,84.4 63.2,75 65.7,44.6',
    unlockCondition: { type: 'story_chapter', count: 12 },
  },
]

// ─── Locations ──────────────────────────────────────────────────────────────

export const LOCATIONS: Location[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // CHAPTERS 1-3 — BALAMB REGION (Garden Intro → Fire Cavern → SeeD Exam)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'balamb_garden',
    name: 'Balamb Garden',
    regionId: 'balamb',
    type: 'town',
    order: 0,
    mapX: 73.4,
    mapY: 68.1,
    unlockCondition: null,
  },
  {
    id: 'balamb_town',
    name: 'Balamb',
    regionId: 'balamb',
    type: 'town',
    order: 1,
    mapX: 60.4,
    mapY: 81.9,
    unlockCondition: { type: 'unique_wins_in_location', targetId: 'balamb_garden', count: 1 },
  },
  {
    id: 'fire_cavern',
    name: 'Fire Cavern',
    regionId: 'balamb',
    type: 'dungeon',
    order: 2,
    mapX: 83.6,
    mapY: 60.3,
    unlockCondition: { type: 'unique_wins_in_location', targetId: 'balamb_town', count: 1 },
    flavour: 'A volcanic cave where fire spirits dwell. The heat rises as you descend...',
  },
  {
    id: 'dollet',
    name: 'Dollet',
    regionId: 'balamb',
    type: 'town',
    order: 3,
    mapX: 10.6,
    mapY: 29.3,
    unlockCondition: { type: 'clear_dungeon', targetId: 'fire_cavern' },
  },
  {
    id: 'radio_tower',
    name: 'Radio Tower',
    regionId: 'balamb',
    type: 'dungeon',
    order: 4,
    mapX: 3.4,
    mapY: 31,
    unlockCondition: { type: 'unique_wins_in_location', targetId: 'dollet', count: 1 },
    flavour: 'The Dollet Communication Tower looms above. Galbadian soldiers guard every floor...',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CHAPTERS 4-6 — GALBADIA REGION (Timber → Assassination → Prison)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'timber',
    name: 'Timber',
    regionId: 'galbadia',
    type: 'town',
    order: 0,
    mapX: 79.1,
    mapY: 62.8,
    unlockCondition: null,
  },
  {
    id: 'galbadia_garden',
    name: 'Galbadia Garden',
    regionId: 'galbadia',
    type: 'town',
    order: 1,
    mapX: 61.4,
    mapY: 42.9,
    unlockCondition: { type: 'unique_wins_in_location', targetId: 'timber', count: 1 },
  },
  {
    id: 'deling_city',
    name: 'Deling City',
    regionId: 'galbadia',
    type: 'town',
    order: 2,
    mapX: 47.7,
    mapY: 31.3,
    unlockCondition: { type: 'unique_wins_in_location', targetId: 'galbadia_garden', count: 1 },
  },
  {
    id: 'tomb_of_unknown_king',
    name: 'Tomb of the Unknown King',
    regionId: 'galbadia',
    type: 'dungeon',
    order: 3,
    mapX: 62,
    mapY: 30.5,
    unlockCondition: { type: 'unique_wins_in_location', targetId: 'deling_city', count: 1 },
    flavour: 'An ancient tomb where a forgotten king rests. The corridors shift and change...',
  },
  {
    id: 'deling_sewers',
    name: 'Deling City Sewers',
    regionId: 'galbadia',
    type: 'dungeon',
    order: 5,
    mapX: 48.3,
    mapY: 31,
    unlockCondition: { type: 'unique_wins_in_location', targetId: 'tomb_of_unknown_king', count: 1 },
    parentTownId: 'deling_city',
    flavour: 'The sewers beneath Deling City. Dark, damp, and full of desperate card players...',
  },
  {
    id: 'winhill',
    name: 'Winhill',
    regionId: 'galbadia',
    type: 'town',
    order: 6,
    mapX: 49.5,
    mapY: 75.2,
    unlockCondition: { type: 'unique_wins_in_location', targetId: 'deling_sewers', count: 1 },
  },
  {
    id: 'd_district_prison',
    name: 'D-District Prison',
    regionId: 'galbadia',
    type: 'dungeon',
    order: 7,
    mapX: 42.1,
    mapY: 62.8,
    unlockCondition: { type: 'unique_wins_in_location', targetId: 'winhill', count: 1 },
    flavour: 'A towering desert prison. Fight your way through the guards to escape...',
  },
  {
    id: 'galbadia_missile_base',
    name: 'Galbadia Missile Base',
    regionId: 'galbadia',
    type: 'dungeon',
    order: 8,
    mapX: 27.7,
    mapY: 53.3,
    unlockCondition: { type: 'unique_wins_in_location', targetId: 'd_district_prison', count: 1 },
    flavour: 'A top-secret military installation. The self-destruct countdown has begun...',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CHAPTER 7 — BALAMB REGION (Missile Base & Garden Crisis)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'balamb_garden_basement',
    name: 'Balamb Garden Basement',
    regionId: 'balamb',
    type: 'dungeon',
    order: 10,
    mapX: 73.4,
    mapY: 69,
    unlockCondition: { type: 'quest_completed', targetId: 'mq_missile_base' },
    parentTownId: 'balamb_garden',
    flavour: 'Hidden passages beneath the Garden. The MD Level holds secrets the faculty tried to bury...',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CHAPTER 8 — FISHERMAN'S HORIZON REGION
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'fishermans_horizon',
    name: "Fisherman's Horizon",
    regionId: 'fh',
    type: 'town',
    order: 0,
    mapX: 52.5,
    mapY: 46.3,
    unlockCondition: null,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CHAPTER 9 — BALAMB REGION (Balamb Liberation)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'balamb_under_siege',
    name: 'Balamb Under Siege!',
    regionId: 'balamb',
    type: 'dungeon',
    order: 11,
    mapX: 60.4,
    mapY: 81.9,
    unlockCondition: { type: 'quest_completed', targetId: 'mq_the_bridge' },
    parentTownId: 'balamb_town',
    flavour: 'Galbadian soldiers have occupied Balamb! Card battles are the only way to reclaim the town...',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CHAPTER 10 — TRABIA REGION (Trabia & Memories)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'roaming_forest',
    name: 'Roaming Forest',
    regionId: 'trabia',
    type: 'dungeon',
    order: 0,
    mapX: 67.1,
    mapY: 55.9,
    unlockCondition: null,
    flavour: 'A mysterious forest that seems to move on its own. Strange creatures lurk within...',
  },
  {
    id: 'trabia_garden',
    name: 'Trabia Garden',
    regionId: 'trabia',
    type: 'town',
    order: 1,
    mapX: 62.8,
    mapY: 66,
    unlockCondition: { type: 'unique_wins_in_location', targetId: 'roaming_forest', count: 1 },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CHAPTER 11 — GALBADIA REGION (Battle of the Gardens)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'galbadia_garden_revolution',
    name: 'Galbadia Garden Revolution!',
    regionId: 'galbadia',
    type: 'dungeon',
    order: 9,
    mapX: 61.4,
    mapY: 42.2,
    unlockCondition: { type: 'quest_completed', targetId: 'mq_memories' },
    parentTownId: 'galbadia_garden',
    flavour: 'The Gardens clash! Fight through Galbadia Garden\'s defenders in a hostile takeover...',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CHAPTER 12 — CENTRA REGION (The Orphanage)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'edeas_house',
    name: "Edea's House",
    regionId: 'centra',
    type: 'town',
    order: 0,
    mapX: 24.5,
    mapY: 69,
    unlockCondition: null,
  },
  {
    id: 'white_seed_ship',
    name: 'White SeeD Ship',
    regionId: 'centra',
    type: 'town',
    order: 1,
    mapX: 33.9,
    mapY: 44,
    unlockCondition: { type: 'unique_wins_in_location', targetId: 'edeas_house', count: 1 },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CHAPTERS 13-14 — ESTHAR REGION (Esthar → Space & Lunar Cry)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'great_salt_lake',
    name: 'Great Salt Lake',
    regionId: 'esthar',
    type: 'dungeon',
    order: 0,
    mapX: 13,
    mapY: 27.1,
    unlockCondition: null,
    flavour: 'A vast dried-out salt flat at the edge of Esthar. The blinding white landscape hides dangers...',
  },
  {
    id: 'esthar_city',
    name: 'Esthar City',
    regionId: 'esthar',
    type: 'town',
    order: 1,
    mapX: 23,
    mapY: 36.4,
    unlockCondition: { type: 'unique_wins_in_location', targetId: 'great_salt_lake', count: 1 },
  },
  {
    id: 'lunar_base',
    name: 'Lunar Base',
    regionId: 'esthar',
    type: 'dungeon',
    order: 2,
    mapX: 72.8,
    mapY: 45,
    unlockCondition: { type: 'unique_wins_in_location', targetId: 'esthar_city', count: 2 },
    flavour: 'An orbital station above Esthar. The final launch sequence requires card clearance...',
  },
  {
    id: 'sorceress_memorial',
    name: 'Sorceress Memorial',
    regionId: 'esthar',
    type: 'town',
    order: 3,
    mapX: 48.7,
    mapY: 47,
    unlockCondition: { type: 'unique_wins_in_location', targetId: 'lunar_base', count: 1 },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CHAPTER 15 — CENTRA REGION (Deep Sea & Shumi)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'deep_sea_research_center',
    name: 'Deep Sea Research Centre',
    regionId: 'centra',
    type: 'dungeon',
    order: 2,
    mapX: 7.4,
    mapY: 85,
    unlockCondition: { type: 'quest_completed', targetId: 'mq_lunar_cry' },
    flavour: 'The deepest facility in the world. Four levels of increasingly dangerous opponents guard the ultimate prize...',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CHAPTER 15 — TRABIA REGION (Shumi Village)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'shumi_village',
    name: 'Shumi Village',
    regionId: 'trabia',
    type: 'town',
    order: 2,
    mapX: 24.1,
    mapY: 34,
    unlockCondition: { type: 'quest_completed', targetId: 'mq_deep_sea' },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CHAPTER 16 — ESTHAR REGION (Lunatic Pandora)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'lunatic_pandora',
    name: 'Lunatic Pandora',
    regionId: 'esthar',
    type: 'dungeon',
    order: 4,
    mapX: 33,
    mapY: 56,
    unlockCondition: { type: 'quest_completed', targetId: 'mq_deep_sea' },
    flavour: 'A massive crystalline structure floating above Esthar. The final Galbadian weapon...',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CHAPTERS 17-18 — CENTRA REGION (Time Compression → Ultimecia's Castle)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'centra_excavation_site',
    name: 'Centra Excavation Site',
    regionId: 'centra',
    type: 'dungeon',
    order: 3,
    mapX: 45.4,
    mapY: 24,
    unlockCondition: { type: 'quest_completed', targetId: 'mq_lunatic_pandora' },
    flavour: 'Ancient ruins deep beneath the Centra continent. Archaeologists discovered something terrible here...',
  },
  {
    id: 'centra_ruins',
    name: 'Centra Ruins',
    regionId: 'centra',
    type: 'dungeon',
    order: 4,
    mapX: 53.4,
    mapY: 55.3,
    unlockCondition: { type: 'unique_wins_in_location', targetId: 'centra_excavation_site', count: 1 },
    flavour: 'The final dungeon. Ancient ruins of a lost civilisation. Strange energies pulse through crumbling corridors...',
  },
]

// ─── NPCs ───────────────────────────────────────────────────────────────────

export const NPCS: NPC[] = ([
  // ═══════════════════════════════════════════════════════════════════════════
  // REGION 0: BALAMB
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Balamb Town ──────────────────────────────────────────────────────────
  {
    id: 'balamb_townsperson',
    name: 'Balamb Townsperson',
    locationId: 'balamb_town',
    type: 'duel',
    dialogue: {
      challenge: "Care for a friendly game? I'll go easy on you!",
      defeated:
        'Heh, you got me. Not bad for a beginner! I need to rethink my strategy...',
      rematch:
        "I've been practising since our last game. Ready for round two?",
    },
    difficultyTier: 1,
    deckPool: [
      'geezard',
      'funguar',
      'bite_bug',
      'red_bat',
      'blobra',
      'gayla',
      'gesper',
      'fastitocalon_f',
    ],
    gilReward: 75,
  },
  {
    id: 'balamb_fisher',
    name: 'Balamb Fisher',
    locationId: 'balamb_town',
    type: 'duel',
    dialogue: {
      challenge:
        "Nothing like a card game while waiting for a bite. You in?",
      defeated:
        "You play cards better than I catch fish... I need to go think about my life choices.",
      rematch:
        "The fish aren't biting today. Fancy another round of cards?",
    },
    difficultyTier: 1,
    deckPool: [
      'geezard',
      'funguar',
      'red_bat',
      'blobra',
      'gayla',
      'gesper',
      'fastitocalon_f',
      'blood_soul',
    ],
    gilReward: 75,
  },
  {
    id: 'card_shop_owner',
    name: 'Card Shop Owner',
    locationId: 'balamb_town',
    type: 'shop',
    dialogue: {
      text: "Welcome! I've got cards for every budget.",
    },
    shopItems: [
      { cardId: 'cockatrice' },
      { cardId: 'grat' },
      { cardId: 'buel' },
    ],
  },
  // ── Balamb Garden ────────────────────────────────────────────────────────
  {
    id: 'garden_student',
    name: 'Garden Student',
    locationId: 'balamb_garden',
    type: 'duel',
    dialogue: {
      challenge:
        "Think you can beat a SeeD candidate? Let's find out!",
      defeated:
        "I... I lost?! I need to study more. Card theory is part of the SeeD exam, you know.",
      rematch:
        "I've studied every card combination in the library. This time will be different!",
    },
    difficultyTier: 1,
    deckPool: [
      'blood_soul',
      'caterchipillar',
      'cockatrice',
      'grat',
      'buel',
      'mesmerize',
      'glacial_eye',
      'belhelmel',
    ],
    gilReward: 100,
  },
  {
    id: 'cc_club_jack',
    name: 'CC Club Jack',
    locationId: 'balamb_garden',
    type: 'duel',
    dialogue: {
      challenge:
        "I'm Jack of the CC Group. Let's see what you've got!",
      defeated:
        "Not bad... You might be CC Group material yourself. But don't get cocky.",
      rematch:
        "The CC Group demands I reclaim my honour. Let's go!",
    },
    difficultyTier: 2,
    deckPool: [
      'grat',
      'buel',
      'mesmerize',
      'glacial_eye',
      'belhelmel',
      'thrustaevis',
      'anacondaur',
      'creeps',
    ],
    gilReward: 150,
  },
  {
    id: 'library_girl',
    name: 'Library Girl',
    locationId: 'balamb_garden',
    type: 'shop',
    dialogue: {
      text: 'We have some cards the students donated.',
    },
    shopItems: [
      { cardId: 'mesmerize' },
      { cardId: 'glacial_eye' },
      { cardId: 'belhelmel' },
    ],
  },
  {
    id: 'garden_tournament',
    name: 'Garden Tournament',
    locationId: 'balamb_garden',
    type: 'tournament',
    dialogue: {
      text: 'Welcome to the Balamb Garden Tournament! Test your skills against the best students.',
    },
    tournamentEntryFee: 200,
    tournamentPrizePool: [
      'mesmerize',
      'glacial_eye',
      'belhelmel',
      'thrustaevis',
      'anacondaur',
      'creeps',
    ],
  },

  // ── Fire Cavern (Dungeon) ────────────────────────────────────────────────
  {
    id: 'cave_bat',
    name: 'Cave Bat',
    locationId: 'fire_cavern',
    type: 'duel',
    dialogue: {
      floorIntro:
        'A creature stirs in the darkness... it challenges you to a duel!',
      floorDefeated: '*squeak*',
    },
    difficultyTier: 1,
    deckPool: [
      'geezard',
      'funguar',
      'bite_bug',
      'red_bat',
      'blobra',
      'gayla',
      'gesper',
      'fastitocalon_f',
    ],
    gilReward: 50,
    floorOrder: 0,
    isBoss: false,
  },
  {
    id: 'fire_spirit',
    name: 'Fire Spirit',
    locationId: 'fire_cavern',
    type: 'duel',
    dialogue: {
      floorIntro:
        'Flames coalesce into a burning figure. It beckons you forward.',
      floorDefeated: 'The flames flicker and fade...',
    },
    difficultyTier: 1,
    deckPool: [
      'red_bat',
      'gayla',
      'blobra',
      'cockatrice',
      'grat',
      'buel',
      'blood_soul',
      'caterchipillar',
    ],
    gilReward: 75,
    floorOrder: 1,
    isBoss: false,
  },
  {
    id: 'ifrit_guardian',
    name: 'Ifrit Guardian',
    locationId: 'fire_cavern',
    type: 'duel',
    dialogue: {
      challenge:
        'You dare challenge me within my cavern? So be it, mortal!',
      defeated:
        'Hmph. You have earned my respect. Perhaps the world beyond this island will test you further.',
      rematch:
        'Back for more? The flames of competition never die!',
    },
    difficultyTier: 2,
    deckPool: [
      'red_bat',
      'gayla',
      'blobra',
      'cockatrice',
      'grat',
      'buel',
      'mesmerize',
      'glacial_eye',
      'belhelmel',
      'thrustaevis',
    ],
    gilReward: 150,
    floorOrder: 2,
    isBoss: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // REGION 1: DOLLET
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Dollet City ──────────────────────────────────────────────────────────
  {
    id: 'dollet_citizen',
    name: 'Dollet Citizen',
    locationId: 'dollet',
    type: 'duel',
    dialogue: {
      challenge:
        'In Dollet, we play with Elemental cards on the board. Watch out!',
      defeated:
        'Those Random hands... I swear the cards conspire against me. Well played.',
      rematch:
        "I've figured out how to read the Elemental board. Try me again!",
    },
    difficultyTier: 2,
    deckPool: [
      'glacial_eye',
      'belhelmel',
      'thrustaevis',
      'anacondaur',
      'tri_face',
      'fastitocalon',
      'snow_lion',
      'ochu',
    ],
    gilReward: 175,
  },
  {
    id: 'dollet_soldier',
    name: 'Dollet Soldier',
    locationId: 'dollet',
    type: 'duel',
    dialogue: {
      challenge:
        "A soldier's got to have a hobby. Mine's Triple Triad. Yours?",
      defeated:
        "At ease, soldier... I mean me. I'm at ease. You win.",
      rematch:
        "I've been drilling card strategies in my downtime. Ready for inspection?",
    },
    difficultyTier: 2,
    deckPool: [
      'belhelmel',
      'thrustaevis',
      'anacondaur',
      'creeps',
      'grendel',
      'jelleye',
      'grand_mantis',
      'forbidden',
    ],
    gilReward: 175,
  },
  {
    id: 'dollet_pub_owner',
    name: 'Dollet Pub Owner',
    locationId: 'dollet',
    type: 'shop',
    dialogue: {
      text: 'Finest cards from across the sea.',
    },
    shopItems: [
      { cardId: 'thrustaevis' },
      { cardId: 'anacondaur' },
      { cardId: 'creeps' },
      { cardId: 'grendel' },
    ],
  },
  {
    id: 'dollet_tournament',
    name: 'Dollet Tournament',
    locationId: 'dollet',
    type: 'tournament',
    dialogue: {
      text: 'The Dollet Tournament draws players from across the dukedom. Step up and test your mettle!',
    },
    tournamentEntryFee: 400,
    tournamentPrizePool: [
      'thrustaevis',
      'anacondaur',
      'creeps',
      'grendel',
      'jelleye',
      'grand_mantis',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // REGION 2: GALBADIA
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Timber ───────────────────────────────────────────────────────────────
  {
    id: 'timber_maniac',
    name: 'Timber Maniac',
    locationId: 'timber',
    type: 'duel',
    dialogue: {
      challenge:
        "I write for the Timber Maniacs magazine. Let's play — I need material for my column!",
      defeated:
        "What a story! 'Local reporter trounced at cards.' ...please don't tell my editor.",
      rematch:
        "I wrote an article analysing your play style. Now let's see if my research pays off!",
    },
    difficultyTier: 2,
    deckPool: [
      'thrustaevis',
      'anacondaur',
      'creeps',
      'grendel',
      'jelleye',
      'grand_mantis',
      'forbidden',
      'armadodo',
    ],
    gilReward: 200,
  },
  {
    id: 'forest_fox',
    name: 'Forest Fox',
    locationId: 'timber',
    type: 'duel',
    dialogue: {
      challenge:
        "I'm part of the Forest Owls resistance. We play cards to pass the time between operations.",
      defeated:
        'The resistance will rise again... at cards, I mean.',
      rematch:
        "The Owls have been training me. This time, vive la r\u00e9sistance!",
    },
    difficultyTier: 2,
    deckPool: [
      'grendel',
      'jelleye',
      'grand_mantis',
      'forbidden',
      'armadodo',
      'tri_face',
      'fastitocalon',
      'snow_lion',
    ],
    gilReward: 150,
  },
  {
    id: 'timber_card_dealer',
    name: 'Timber Card Dealer',
    locationId: 'timber',
    type: 'shop',
    dialogue: {
      text: 'Got some rare finds from the forest.',
    },
    shopItems: [
      { cardId: 'forbidden' },
      { cardId: 'armadodo' },
      { cardId: 'jelleye' },
      { cardId: 'grand_mantis' },
    ],
  },

  {
    id: 'fake_president',
    name: 'Fake President',
    locationId: 'timber',
    type: 'duel',
    dialogue: {
      challenge:
        "I am President Deling! You dare challenge me? Very well — I'll crush you at cards, just as I've crushed the resistance.",
      defeated:
        "What?! Impossible! This face... it's melting?! I'm not the real president — I'm just a body double!",
      rematch:
        "They gave me another disguise. This time I won't be exposed so easily!",
    },
    difficultyTier: 2,
    deckPool: [
      'forbidden',
      'armadodo',
      'tri_face',
      'grand_mantis',
      'jelleye',
      'gayla',
      'gesper',
      'fastitocalon',
    ],
    gilReward: 200,
    minChapter: 3,
    maxChapter: 5,
  },

  // ── Galbadia Garden ──────────────────────────────────────────────────────
  {
    id: 'galbadia_student',
    name: 'Galbadia Student',
    locationId: 'galbadia_garden',
    type: 'duel',
    dialogue: {
      challenge:
        'Galbadia Garden students are the best duelists! Prove me wrong!',
      defeated:
        "Impossible... Galbadia's finest, beaten? I'll report this to the headmaster.",
      rematch:
        "The headmaster says I need to redeem Galbadia's honour. Let's settle this!",
    },
    difficultyTier: 3,
    deckPool: [
      'forbidden',
      'armadodo',
      'tri_face',
      'fastitocalon',
      'snow_lion',
      'ochu',
      'sam08g',
      'death_claw',
    ],
    gilReward: 200,
  },
  {
    id: 'galbadia_instructor',
    name: 'Galbadia Instructor',
    locationId: 'galbadia_garden',
    type: 'duel',
    dialogue: {
      challenge:
        'I teach combat tactics here. Card strategy is just another form of warfare.',
      defeated:
        'Well. It seems I have something to learn after all. Dismissed.',
      rematch:
        "I've revised my curriculum based on our last match. Class is in session!",
    },
    difficultyTier: 3,
    deckPool: [
      'tri_face',
      'fastitocalon',
      'snow_lion',
      'ochu',
      'sam08g',
      'death_claw',
      'cactuar',
      'abyss_worm',
    ],
    gilReward: 250,
  },
  // ── Deling City ──────────────────────────────────────────────────────────
  {
    id: 'deling_city_guard',
    name: 'Deling City Guard',
    locationId: 'deling_city',
    type: 'duel',
    dialogue: {
      challenge:
        'General Caraway permits recreational card games. En garde!',
      defeated:
        "I'll be filing a report about this... a report on how to improve my game.",
      rematch:
        'My shift partner taught me some new moves. Official rematch time!',
    },
    difficultyTier: 3,
    deckPool: [
      'tri_face',
      'fastitocalon',
      'snow_lion',
      'ochu',
      'sam08g',
      'death_claw',
      'cactuar',
      'tonberry',
    ],
    gilReward: 250,
  },
  {
    id: 'generals_aide',
    name: "General's Aide",
    locationId: 'deling_city',
    type: 'duel',
    dialogue: {
      challenge:
        'The General himself plays Triple Triad. I learned from the best.',
      defeated:
        "The General won't be pleased... but he'd respect a good game. Well played.",
      rematch:
        "I've been studying the General's personal card strategies. Ready?",
    },
    difficultyTier: 3,
    deckPool: [
      'sam08g',
      'death_claw',
      'cactuar',
      'tonberry',
      'abyss_worm',
      'turtapod',
      'bomb',
      'blitz',
    ],
    gilReward: 300,
  },
  {
    id: 'deling_card_emporium',
    name: 'Deling Card Emporium',
    locationId: 'deling_city',
    type: 'shop',
    dialogue: {
      text: 'The finest cards in Galbadia.',
    },
    shopItems: [
      { cardId: 'tri_face' },
      { cardId: 'fastitocalon' },
      { cardId: 'snow_lion' },
      { cardId: 'ochu' },
    ],
  },
  {
    id: 'deling_tournament',
    name: 'Deling Tournament',
    locationId: 'deling_city',
    type: 'tournament',
    dialogue: {
      text: 'The Deling City Grand Tournament! Only the finest card players in Galbadia may enter.',
    },
    tournamentEntryFee: 600,
    tournamentPrizePool: [
      'tri_face',
      'fastitocalon',
      'snow_lion',
      'ochu',
      'sam08g',
      'death_claw',
      'cactuar',
      'tonberry',
    ],
  },

  // ── D-District Prison (Dungeon) ──────────────────────────────────────────
  {
    id: 'prison_inmate',
    name: 'Prison Inmate',
    locationId: 'd_district_prison',
    type: 'duel',
    dialogue: {
      floorIntro:
        "A fellow prisoner challenges you. 'Win and I'll tell you how to get past the next guard.'",
      floorDefeated: "Good luck up there... you'll need it.",
    },
    difficultyTier: 2,
    deckPool: [
      'thrustaevis',
      'anacondaur',
      'creeps',
      'grendel',
      'jelleye',
      'grand_mantis',
      'forbidden',
      'armadodo',
    ],
    gilReward: 75,
    floorOrder: 0,
    isBoss: false,
  },
  {
    id: 'prison_enforcer',
    name: 'Prison Enforcer',
    locationId: 'd_district_prison',
    type: 'duel',
    dialogue: {
      floorIntro:
        "A hulking enforcer blocks the stairwell. 'Nobody gets past me without a game.'",
      floorDefeated: 'Tch. Fine. Go on through.',
    },
    difficultyTier: 3,
    deckPool: [
      'forbidden',
      'armadodo',
      'tri_face',
      'fastitocalon',
      'snow_lion',
      'ochu',
      'sam08g',
      'death_claw',
    ],
    gilReward: 125,
    floorOrder: 1,
    isBoss: false,
  },
  {
    id: 'cell_block_boss',
    name: 'Cell Block Boss',
    locationId: 'd_district_prison',
    type: 'duel',
    dialogue: {
      floorIntro: 'A notorious prisoner runs the cell block. "New fish wants to climb higher? Cards first."',
      floorDefeated: '"You\'re tougher than you look. The upper levels won\'t be so easy."',
    },
    difficultyTier: 3,
    deckPool: [
      'armadodo', 'tri_face', 'fastitocalon', 'snow_lion', 'ochu', 'sam08g', 'death_claw', 'cactuar',
    ],
    gilReward: 175,
    floorOrder: 2,
    isBoss: false,
  },
  {
    id: 'solitary_guard',
    name: 'Solitary Guard',
    locationId: 'd_district_prison',
    type: 'duel',
    dialogue: {
      floorIntro: 'The guard outside solitary confinement grins. "Entertainment\'s rare down here. Play me."',
      floorDefeated: '"Bah. Go on then. The Warden\'s office is just above."',
    },
    difficultyTier: 3,
    deckPool: [
      'tri_face', 'snow_lion', 'ochu', 'sam08g', 'death_claw', 'cactuar', 'tonberry', 'abyss_worm',
    ],
    gilReward: 225,
    floorOrder: 3,
    isBoss: false,
  },
  {
    id: 'warden',
    name: 'Warden',
    locationId: 'd_district_prison',
    type: 'duel',
    dialogue: {
      challenge:
        'Leaving so soon? Not without beating the Warden first!',
      defeated:
        "Don't tell the General I lost to a prisoner... Get out of here.",
      rematch:
        "Back in my prison? You must really enjoy losing. Let's go!",
    },
    difficultyTier: 3,
    deckPool: [
      'sam08g',
      'death_claw',
      'cactuar',
      'tonberry',
      'abyss_worm',
      'turtapod',
      'vysage',
      't_rexaur',
    ],
    gilReward: 300,
    floorOrder: 4,
    isBoss: true,
  },

  // ── Winhill ──────────────────────────────────────────────────────────────
  {
    id: 'winhill_villager',
    name: 'Winhill Villager',
    locationId: 'winhill',
    type: 'duel',
    dialogue: {
      challenge:
        'This quiet village has surprisingly strong card players. Try me.',
      defeated:
        'The flowers here bring good luck... just not to me today, it seems.',
      rematch:
        "I've been tending my garden and my deck. Both are blooming!",
    },
    difficultyTier: 3,
    deckPool: [
      'ochu',
      'abyss_worm',
      'turtapod',
      'bomb',
      'blitz',
      'wendigo',
      'torama',
      'blue_dragon',
    ],
    gilReward: 275,
  },
  {
    id: 'winhill_flower_girl',
    name: 'Winhill Flower Girl',
    locationId: 'winhill',
    type: 'duel',
    dialogue: {
      challenge:
        'I sell flowers, but my real passion is cards. Want to play?',
      defeated:
        "Oh my! You're really good. I'll need to rearrange my whole deck.",
      rematch:
        "I arranged my cards like a bouquet — each one in the perfect spot!",
    },
    difficultyTier: 3,
    deckPool: [
      'turtapod',
      'bomb',
      'blitz',
      'wendigo',
      'torama',
      'imp',
      'blue_dragon',
      'adamantoise',
    ],
    gilReward: 275,
  },
  // ═══════════════════════════════════════════════════════════════════════════
  // REGION 3: FISHERMAN'S HORIZON
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Fisherman's Horizon ──────────────────────────────────────────────────
  {
    id: 'fh_resident',
    name: 'FH Resident',
    locationId: 'fishermans_horizon',
    type: 'duel',
    dialogue: {
      challenge:
        "We're peaceful folk, but we take our card games seriously.",
      defeated:
        "No hard feelings. Peace and cards — that's the FH way.",
      rematch:
        "The bridge gives you time to think. I've thought up a new strategy!",
    },
    difficultyTier: 3,
    deckPool: [
      'sam08g',
      'death_claw',
      'cactuar',
      'tonberry',
      'abyss_worm',
      'turtapod',
      'vysage',
      't_rexaur',
    ],
    gilReward: 300,
  },
  {
    id: 'bridge_mechanic',
    name: 'Bridge Mechanic',
    locationId: 'fishermans_horizon',
    type: 'duel',
    dialogue: {
      challenge:
        'I fix the bridge by day, play cards by night. Fancy a game?',
      defeated:
        "Guess I should stick to fixing bridges... nah, I'll get you next time.",
      rematch:
        "I've calibrated my deck like I calibrate my tools — precision engineering!",
    },
    difficultyTier: 3,
    deckPool: [
      'death_claw',
      'cactuar',
      'tonberry',
      'abyss_worm',
      'turtapod',
      'vysage',
      't_rexaur',
      'bomb',
    ],
    gilReward: 300,
  },
  {
    id: 'fh_card_trader',
    name: 'FH Card Trader',
    locationId: 'fishermans_horizon',
    type: 'shop',
    dialogue: {
      text: 'Found these washed up on the bridge.',
    },
    shopItems: [
      { cardId: 'sam08g' },
      { cardId: 'death_claw' },
      { cardId: 'cactuar' },
      { cardId: 'tonberry' },
    ],
  },
  {
    id: 'fh_tournament',
    name: 'FH Tournament',
    locationId: 'fishermans_horizon',
    type: 'tournament',
    dialogue: {
      text: "The Fisherman's Horizon friendly tournament. All are welcome — no fighting, just cards!",
    },
    tournamentEntryFee: 800,
    tournamentPrizePool: [
      'sam08g',
      'death_claw',
      'cactuar',
      'tonberry',
      'abyss_worm',
      'turtapod',
      'vysage',
      't_rexaur',
    ],
  },
  {
    id: 'fh_master',
    name: 'FH Master',
    locationId: 'fishermans_horizon',
    type: 'duel',
    dialogue: {
      challenge: "I'm the best card player in FH. Pacifist by nature, competitor by cards.",
      defeated: "You've earned the respect of FH. The Mayor will want to meet you.",
      rematch: "The tides shift, and so do my strategies. Another round?",
    },
    difficultyTier: 3,
    deckPool: [
      'sam08g', 'death_claw', 'cactuar', 'tonberry', 'abyss_worm', 'turtapod', 'vysage', 't_rexaur', 'bomb', 'blitz',
    ],
    gilReward: 500,
  },

  {
    id: 'fh_fisherman',
    name: 'Old Fisherman',
    locationId: 'fishermans_horizon',
    type: 'dialogue',
    dialogue: { text: "I've been fishing off this bridge for forty years. Never caught a Fastitocalon, though. If you find one of those cards, I'd pay good money for it." },
    questId: 'fishers_catch',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // REGION 4: TRABIA
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Trabia Garden ────────────────────────────────────────────────────────
  {
    id: 'trabia_student',
    name: 'Trabia Student',
    locationId: 'trabia_garden',
    type: 'duel',
    dialogue: {
      challenge:
        'Our Garden was destroyed, but our card skills survived!',
      defeated:
        "We've lost our Garden but not our spirit. Good game though.",
      rematch:
        'We rebuilt our decks from the rubble. Time for revenge!',
    },
    difficultyTier: 3,
    deckPool: [
      'snow_lion',
      'ochu',
      'abyss_worm',
      'turtapod',
      'bomb',
      'blitz',
      'wendigo',
      'torama',
    ],
    gilReward: 350,
  },
  {
    id: 'trabia_scout',
    name: 'Trabia Scout',
    locationId: 'trabia_garden',
    type: 'duel',
    dialogue: {
      challenge:
        'I scout the frozen wastes. A card game warms the soul!',
      defeated:
        'The cold must have frozen my brain... well played.',
      rematch:
        "The tundra taught me patience. I'm ready for another go!",
    },
    difficultyTier: 3,
    deckPool: [
      'abyss_worm',
      'turtapod',
      'bomb',
      'blitz',
      'wendigo',
      'torama',
      'imp',
      'blue_dragon',
    ],
    gilReward: 350,
  },
  // ── Shumi Village ────────────────────────────────────────────────────────
  {
    id: 'shumi_elder',
    name: 'Shumi Elder',
    locationId: 'shumi_village',
    type: 'duel',
    dialogue: {
      challenge:
        'The Shumi have played card games for centuries. You honour us with your challenge.',
      defeated:
        'Centuries of card wisdom... and you surpassed it. Remarkable.',
      rematch:
        'I have meditated upon our last game. I believe I understand now.',
    },
    difficultyTier: 4,
    deckPool: [
      'imp',
      'blue_dragon',
      'adamantoise',
      'hexadragon',
      'iron_giant',
      'behemoth',
      'chimera',
      'pupu',
    ],
    gilReward: 500,
  },
  {
    id: 'shumi_artisan',
    name: 'Shumi Artisan',
    locationId: 'shumi_village',
    type: 'shop',
    dialogue: {
      text: 'We craft the finest cards. Each one is a work of art.',
    },
    shopItems: [
      { cardId: 'bomb' },
      { cardId: 'blitz' },
      { cardId: 'wendigo' },
      { cardId: 'torama' },
      { cardId: 'imp' },
    ],
  },
  // ═══════════════════════════════════════════════════════════════════════════
  // REGION 5: CENTRA
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Edea's House ─────────────────────────────────────────────────────────
  {
    id: 'white_seed',
    name: 'White SeeD',
    locationId: 'white_seed_ship',
    type: 'duel',
    dialogue: {
      challenge:
        'We protect the Sorceress. Show us your strength at cards.',
      defeated:
        'A worthy opponent. The Sorceress would be impressed.',
      rematch:
        'The sea has given me new perspective. Face me again!',
    },
    difficultyTier: 4,
    deckPool: [
      'torama',
      'imp',
      'blue_dragon',
      'adamantoise',
      'hexadragon',
      'iron_giant',
      'behemoth',
      'chimera',
    ],
    gilReward: 400,
  },
  {
    id: 'white_seed_captain',
    name: 'White SeeD Captain',
    locationId: 'white_seed_ship',
    type: 'duel',
    dialogue: {
      challenge:
        'I command the White SeeD ship. My card strategy is equally disciplined.',
      defeated:
        "You've outmanoeuvred me. That takes real skill in Centra's brutal ruleset.",
      rematch:
        "I've charted new tactical waters. Prepare to be boarded!",
    },
    difficultyTier: 4,
    deckPool: [
      'blue_dragon',
      'adamantoise',
      'hexadragon',
      'iron_giant',
      'behemoth',
      'chimera',
      'malboro',
      'ruby_dragon',
    ],
    gilReward: 500,
  },
  {
    id: 'ruin_explorer',
    name: 'Ruin Explorer',
    locationId: 'edeas_house',
    type: 'shop',
    dialogue: {
      text: "I've excavated some rare cards from the ruins. I sell them here where it's safe.",
    },
    shopItems: [
      { cardId: 'blue_dragon' },
      { cardId: 'adamantoise' },
      { cardId: 'hexadragon' },
      { cardId: 'iron_giant' },
    ],
  },
  // ── Centra Ruins (Dungeon) ───────────────────────────────────────────────
  {
    id: 'ruin_spirit',
    name: 'Ruin Spirit',
    locationId: 'centra_ruins',
    type: 'duel',
    dialogue: {
      floorIntro:
        'A spectral figure materialises from the ancient stonework. It gestures toward its cards.',
      floorDefeated:
        'The spirit fades into the walls, opening the path forward...',
    },
    difficultyTier: 3,
    deckPool: [
      'torama',
      'imp',
      'blue_dragon',
      'adamantoise',
      'hexadragon',
      'iron_giant',
      'behemoth',
      'chimera',
    ],
    gilReward: 200,
    floorOrder: 0,
    isBoss: false,
  },
  {
    id: 'ancient_sentinel',
    name: 'Ancient Sentinel',
    locationId: 'centra_ruins',
    type: 'duel',
    dialogue: {
      floorIntro:
        'A towering stone guardian blocks the inner chamber. Its eyes glow with challenge.',
      floorDefeated:
        'The sentinel crumbles. The final chamber lies ahead...',
    },
    difficultyTier: 4,
    deckPool: [
      'blue_dragon',
      'adamantoise',
      'hexadragon',
      'iron_giant',
      'behemoth',
      'chimera',
      'malboro',
      'ruby_dragon',
    ],
    gilReward: 300,
    floorOrder: 1,
    isBoss: false,
  },
  {
    id: 'ruin_revenant',
    name: 'Ruin Revenant',
    locationId: 'centra_ruins',
    type: 'duel',
    dialogue: {
      floorIntro: 'An ancient warrior rises from a stone sarcophagus, ghostly cards floating around it.',
      floorDefeated: 'The revenant bows and returns to its eternal rest...',
    },
    difficultyTier: 4,
    deckPool: [
      'adamantoise', 'hexadragon', 'iron_giant', 'behemoth', 'chimera', 'malboro', 'ruby_dragon', 'elnoyle',
    ],
    gilReward: 400,
    floorOrder: 2,
    isBoss: false,
  },
  {
    id: 'centra_obelisk',
    name: 'Centra Obelisk',
    locationId: 'centra_ruins',
    type: 'duel',
    dialogue: {
      floorIntro: 'A massive obsidian obelisk hums with power. Cards materialise in the air around it.',
      floorDefeated: 'The obelisk dims. The inner sanctum opens...',
    },
    difficultyTier: 4,
    deckPool: [
      'iron_giant', 'behemoth', 'chimera', 'malboro', 'ruby_dragon', 'elnoyle', 'tonberry_king', 'wedge_biggs',
    ],
    gilReward: 500,
    floorOrder: 3,
    isBoss: false,
  },
  {
    id: 'centra_guardian',
    name: 'Centra Guardian',
    locationId: 'centra_ruins',
    type: 'duel',
    dialogue: {
      challenge:
        'These ruins hold ancient power... and ancient cards. Prove you are worthy!',
      defeated:
        'The ancients would be proud of your skill. You have earned passage beyond.',
      rematch:
        'The ruins have whispered new secrets to me. Shall we test them?',
    },
    difficultyTier: 4,
    deckPool: [
      'blitz',
      'wendigo',
      'torama',
      'blue_dragon',
      'adamantoise',
      'hexadragon',
      'iron_giant',
      'behemoth',
      'malboro',
      'ruby_dragon',
    ],
    gilReward: 600,
    floorOrder: 4,
    isBoss: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // REGION 6: ESTHAR
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Esthar City ──────────────────────────────────────────────────────────
  {
    id: 'esthar_scientist',
    name: 'Esthar Scientist',
    locationId: 'esthar_city',
    type: 'duel',
    dialogue: {
      challenge:
        "Our calculations show a 47.3% chance you'll lose. Shall we test it?",
      defeated:
        'Recalculating... Error: opponent skill exceeded parameters. Fascinating.',
      rematch:
        "I've updated my probability model. The new calculations favour me. Shall we?",
    },
    difficultyTier: 4,
    deckPool: [
      'iron_giant',
      'behemoth',
      'malboro',
      'ruby_dragon',
      'elnoyle',
      'tonberry_king',
      'wedge_biggs',
      'fujin_raijin',
    ],
    gilReward: 750,
  },
  {
    id: 'esthar_soldier',
    name: 'Esthar Soldier',
    locationId: 'esthar_city',
    type: 'duel',
    dialogue: {
      challenge:
        "Esthar's military doesn't just fight with weapons. Cards are training too.",
      defeated:
        "Stand down... I mean, I stand down. You've earned this victory.",
      rematch:
        "New orders from command: defeat you at cards. Let's go!",
    },
    difficultyTier: 4,
    deckPool: [
      'behemoth',
      'malboro',
      'ruby_dragon',
      'elnoyle',
      'tonberry_king',
      'wedge_biggs',
      'fujin_raijin',
      'elvoret',
    ],
    gilReward: 750,
  },
  {
    id: 'esthar_card_lab',
    name: 'Esthar Card Lab',
    locationId: 'esthar_city',
    type: 'shop',
    dialogue: {
      text: 'State-of-the-art cards, engineered for victory.',
    },
    shopItems: [
      { cardId: 'behemoth' },
      { cardId: 'malboro' },
      { cardId: 'ruby_dragon' },
      { cardId: 'elnoyle' },
      { cardId: 'iron_giant' },
    ],
  },
  {
    id: 'esthar_tournament',
    name: 'Esthar Tournament',
    locationId: 'esthar_city',
    type: 'tournament',
    dialogue: {
      text: 'The prestigious Esthar City Tournament. Only the elite may enter.',
    },
    tournamentEntryFee: 2000,
    tournamentPrizePool: [
      'iron_giant',
      'behemoth',
      'malboro',
      'ruby_dragon',
      'elnoyle',
      'tonberry_king',
      'wedge_biggs',
      'fujin_raijin',
    ],
  },

  // ── Lunar Gate (Dungeon) ─────────────────────────────────────────────────
  {
    id: 'gate_sentry',
    name: 'Gate Sentry',
    locationId: 'lunar_base',
    type: 'duel',
    dialogue: {
      floorIntro:
        "A sentry blocks the first checkpoint. 'Security clearance? Show me your cards.'",
      floorDefeated: 'Clearance granted for sector 2...',
    },
    difficultyTier: 4,
    deckPool: [
      'iron_giant',
      'behemoth',
      'malboro',
      'ruby_dragon',
      'elnoyle',
      'tonberry_king',
      'wedge_biggs',
      'fujin_raijin',
    ],
    gilReward: 300,
    floorOrder: 0,
    isBoss: false,
  },
  {
    id: 'lunar_soldier',
    name: 'Lunar Soldier',
    locationId: 'lunar_base',
    type: 'duel',
    dialogue: {
      floorIntro:
        "A hardened soldier stands at the launch pad entrance. 'Last chance to turn back.'",
      floorDefeated:
        "You'd survive in space. That takes guts... and good cards.",
    },
    difficultyTier: 5,
    deckPool: [
      'elvoret',
      'x_atm092',
      'granaldo',
      'gerogero',
      'iguion',
      'abadon',
      'propagator',
      'jumbo_cactuar',
      'tri_point',
      'gargantua',
    ],
    gilReward: 500,
    floorOrder: 1,
    isBoss: false,
  },
  {
    id: 'zero_g_phantom',
    name: 'Zero-G Phantom',
    locationId: 'lunar_base',
    type: 'duel',
    dialogue: {
      floorIntro: 'Cards float in zero gravity. A spectral figure materialises among them, beckoning.',
      floorDefeated: 'The phantom dissipates into the vacuum. The command centre is just ahead...',
    },
    difficultyTier: 5,
    deckPool: [
      'granaldo', 'gerogero', 'iguion', 'abadon', 'propagator', 'jumbo_cactuar', 'tri_point', 'gargantua', 'mobile_type_8',
    ],
    gilReward: 700,
    floorOrder: 2,
    isBoss: false,
  },
  {
    id: 'lunar_officer',
    name: 'Lunar Officer',
    locationId: 'lunar_base',
    type: 'duel',
    dialogue: {
      challenge:
        'I oversee all operations at Lunar Gate. Including the card table. Final clearance — defeat me.',
      defeated:
        'Mission status: failed. But I respect a good opponent. You have full clearance.',
      rematch:
        "I've requisitioned new cards from the space station. Engage!",
    },
    difficultyTier: 5,
    deckPool: [
      'x_atm092',
      'granaldo',
      'gerogero',
      'iguion',
      'abadon',
      'propagator',
      'jumbo_cactuar',
      'tri_point',
      'gargantua',
      'mobile_type_8',
    ],
    gilReward: 1000,
    floorOrder: 3,
    isBoss: true,
  },

  // ── Deep Sea Research Center (Dungeon — Final) ───────────────────────────
  {
    id: 'deep_sea_drone',
    name: 'Deep Sea Drone',
    locationId: 'deep_sea_research_center',
    type: 'duel',
    dialogue: {
      floorIntro:
        'An automated security drone activates. Its screen displays a Triple Triad board.',
      floorDefeated:
        'SECURITY BREACH ACCEPTED. DESCENDING TO LEVEL 2...',
    },
    difficultyTier: 4,
    deckPool: [
      'iron_giant',
      'behemoth',
      'malboro',
      'ruby_dragon',
      'elnoyle',
      'tonberry_king',
      'wedge_biggs',
      'fujin_raijin',
    ],
    gilReward: 300,
    floorOrder: 0,
    isBoss: false,
  },
  {
    id: 'abyssal_creature',
    name: 'Abyssal Creature',
    locationId: 'deep_sea_research_center',
    type: 'duel',
    dialogue: {
      floorIntro:
        'Something stirs in the dark water below. A creature emerges, cards in hand.',
      floorDefeated:
        'The creature sinks back into the depths, clearing the way forward...',
    },
    difficultyTier: 5,
    deckPool: [
      'elvoret',
      'x_atm092',
      'granaldo',
      'gerogero',
      'iguion',
      'abadon',
      'propagator',
      'jumbo_cactuar',
    ],
    gilReward: 400,
    floorOrder: 1,
    isBoss: false,
  },
  {
    id: 'research_subject',
    name: 'Research Subject',
    locationId: 'deep_sea_research_center',
    type: 'duel',
    dialogue: {
      floorIntro:
        'A containment pod opens. The escaped research subject knows only one thing — Triple Triad.',
      floorDefeated:
        'The subject returns to stasis. The final chamber awaits...',
    },
    difficultyTier: 5,
    deckPool: [
      'propagator',
      'jumbo_cactuar',
      'tri_point',
      'gargantua',
      'mobile_type_8',
      'sphinxara',
      'tiamat',
      'bgh251f2',
    ],
    gilReward: 500,
    floorOrder: 2,
    isBoss: false,
  },
  {
    id: 'pressure_phantom',
    name: 'Pressure Phantom',
    locationId: 'deep_sea_research_center',
    type: 'duel',
    dialogue: {
      floorIntro: 'A spectral figure materialises from the crushing pressure. It extends a hand of cards.',
      floorDefeated: 'The phantom dissolves into the blackness. The water grows colder...',
    },
    difficultyTier: 5,
    deckPool: [
      'tri_point', 'gargantua', 'mobile_type_8', 'sphinxara', 'tiamat', 'bgh251f2', 'red_giant', 'catoblepas',
    ],
    gilReward: 600,
    floorOrder: 3,
    isBoss: false,
  },
  {
    id: 'ultima_sentinel',
    name: 'Ultima Sentinel',
    locationId: 'deep_sea_research_center',
    type: 'duel',
    dialogue: {
      floorIntro: 'A massive mechanical guardian blocks the final corridor. "AUTHORIZATION: DEFEAT ME."',
      floorDefeated: 'AUTHORIZATION GRANTED. The sentinel powers down. Only one challenge remains...',
    },
    difficultyTier: 5,
    deckPool: [
      'tiamat', 'bgh251f2', 'red_giant', 'catoblepas', 'ultima_weapon', 'propagator', 'jumbo_cactuar', 'tri_point',
    ],
    gilReward: 800,
    floorOrder: 4,
    isBoss: false,
  },
  {
    id: 'deep_sea_researcher',
    name: 'Deep Sea Researcher',
    locationId: 'deep_sea_research_center',
    type: 'duel',
    dialogue: {
      challenge:
        "The deepest secrets... and the strongest cards. You've made it this far. Are you ready for the end?",
      defeated:
        "In the deep, pressure creates diamonds. You are one such diamond. You've conquered the world of Triple Triad.",
      rematch:
        'The abyss has revealed new card formations. Dive back in?',
    },
    difficultyTier: 5,
    deckPool: [
      'propagator',
      'jumbo_cactuar',
      'tri_point',
      'gargantua',
      'mobile_type_8',
      'sphinxara',
      'tiamat',
      'bgh251f2',
      'red_giant',
      'catoblepas',
      'ultima_weapon',
    ],
    gilReward: 1500,
    floorOrder: 5,
    isBoss: true,
  },

  // Bahamut — post-boss dialogue NPC (no quest, flavour only)
  {
    id: 'bahamut',
    name: 'Bahamut',
    locationId: 'deep_sea_research_center',
    type: 'dialogue',
    dialogue: {
      text: 'You have proven yourself worthy. The ultimate card master.',
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // STORY CHARACTER NPCs — Main FFVIII cast across 18 chapters
  // ═══════════════════════════════════════════════════════════════════════════

  // --- QUISTIS TREPE ---
  {
    id: 'quistis_garden_ch1',
    name: 'Instructor Quistis',
    locationId: 'balamb_garden',
    type: 'dialogue',
    dialogue: { text: "Welcome to Balamb Garden. I'm Instructor Trepe — I'll be guiding you through your training. Before the SeeD exam, you must pass the Fire Cavern prerequisite." },
    storyLogText: 'Instructor Quistis Trepe welcomes you to Balamb Garden. She explains that before attempting the SeeD field exam, you must first clear the Fire Cavern.',
    questId: 'mq_fire_cavern',
    minChapter: 1,
    maxChapter: 3,
  },
  {
    id: 'quistis_garden_ch5',
    name: 'Quistis',
    locationId: 'balamb_garden',
    type: 'dialogue',
    dialogue: { text: "I've been demoted from instructor... but I'm still a SeeD. The assassination mission in Deling City needs all hands. I'll lead the gateway team." },
    storyLogText: 'Quistis reveals she has been demoted from instructor. She volunteers to lead the gateway team for the assassination mission in Deling City.',
    minChapter: 5,
    maxChapter: 5,
  },
  {
    id: 'quistis_gg',
    name: 'Quistis',
    locationId: 'galbadia_garden',
    type: 'dialogue',
    dialogue: { text: "Galbadia Garden has been taken over by the Sorceress. We need to storm it and end this. Are you ready for the Battle of the Gardens?" },
    storyLogText: 'Quistis reports that Galbadia Garden has been seized by the Sorceress. The Battle of the Gardens is about to begin.',
    questId: 'mq_garden_clash',
    minChapter: 10,
    maxChapter: 11,
  },

  // --- HEADMASTER CID ---
  {
    id: 'cid',
    name: 'Headmaster Cid',
    locationId: 'balamb_garden',
    type: 'dialogue',
    dialogue: { text: 'Your SeeD field exam awaits. Clear the Radio Tower in Dollet and return to me. Good luck, cadet.' },
    storyLogText: 'Headmaster Cid assigns you the SeeD field exam — infiltrate the Dollet Radio Tower and prove yourself worthy of becoming a SeeD.',
    questId: 'mq_seed_exam',
    minChapter: 2,
    maxChapter: 3,
  },
  {
    id: 'cid_commander',
    name: 'Headmaster Cid',
    locationId: 'balamb_garden',
    type: 'dialogue',
    dialogue: { text: "You've grown so much since that first day at the Garden. I'm naming you commander of Balamb Garden. Lead us well." },
    storyLogText: "Headmaster Cid names you commander of Balamb Garden. 'Lead us well,' he says, placing the fate of Garden in your hands.",
    minChapter: 8,
    maxChapter: 8,
  },
  {
    id: 'cid_orphanage',
    name: 'Cid',
    locationId: 'edeas_house',
    type: 'dialogue',
    dialogue: { text: "This is where it all began... Edea and I started SeeD here, at this orphanage. Everything was to protect you children." },
    storyLogText: 'Cid stands at the orphanage where he and Edea founded SeeD. He reveals it was all to protect the children they raised — including you.',
    minChapter: 12,
    maxChapter: 18,
  },

  // --- ZELL DINCHT ---
  {
    id: 'zell_garden',
    name: 'Zell',
    locationId: 'balamb_garden',
    type: 'dialogue',
    dialogue: { text: "Yo! I'm Zell. Just transferred here. I punch things mostly, but I'm pretty good at Triple Triad too. Let's get through the SeeD exam together!" },
    storyLogText: 'You meet Zell Dincht, an energetic martial artist and fellow SeeD candidate. He is eager to prove himself at the field exam.',
    minChapter: 1,
    maxChapter: 3,
  },
  {
    id: 'zell_balamb',
    name: 'Zell',
    locationId: 'balamb_town',
    type: 'dialogue',
    dialogue: { text: "Dude! Galbadian soldiers took over my hometown! We gotta drive 'em out! Fujin and Raijin are running the show here. Are you with me?!" },
    storyLogText: "Zell is furious — Galbadian soldiers have occupied his hometown of Balamb. Fujin and Raijin are leading the occupation.",
    questId: 'mq_reclaim_balamb',
    minChapter: 8,
    maxChapter: 9,
  },
  {
    id: 'zell_trabia',
    name: 'Zell',
    locationId: 'trabia_garden',
    type: 'dialogue',
    dialogue: { text: "This is crazy... We all grew up at the same orphanage? GFs made us forget everything? I don't even know what's real anymore." },
    storyLogText: "Zell struggles to process the orphanage revelation. 'I don't even know what's real anymore,' he says quietly.",
    minChapter: 10,
    maxChapter: 10,
  },

  // --- SELPHIE TILMITT ---
  {
    id: 'selphie_dollet',
    name: 'Selphie',
    locationId: 'dollet',
    type: 'dialogue',
    dialogue: { text: "Hi! I just transferred from Trabia Garden. I'm here for the SeeD exam too! Let's do our best!" },
    storyLogText: 'You meet Selphie Tilmitt, a cheerful transfer student from Trabia Garden who has joined the SeeD exam squad.',
    minChapter: 3,
    maxChapter: 3,
  },
  {
    id: 'selphie_missile',
    name: 'Selphie',
    locationId: 'galbadia_missile_base',
    type: 'dialogue',
    dialogue: { text: "They've already launched missiles at Trabia Garden... We can't let them hit Balamb too! I'll lead the infiltration team. Let's blow this place sky-high!" },
    storyLogText: 'Selphie learns missiles have already struck Trabia Garden. Burning with determination, she leads the team to sabotage the missile base before Balamb Garden is next.',
    questId: 'mq_missile_base',
    minChapter: 6,
    maxChapter: 7,
  },
  {
    id: 'selphie_trabia',
    name: 'Selphie',
    locationId: 'trabia_garden',
    type: 'dialogue',
    dialogue: { text: "Our Garden was hit... but we're not giving up! My friends, my home... Beat our champion and show everyone we can still fight!" },
    storyLogText: "Selphie stands amid the ruins of Trabia Garden, destroyed by Galbadian missiles. Despite the devastation, she refuses to give up.",
    questId: 'mq_memories',
    minChapter: 9,
    maxChapter: 10,
  },
  {
    id: 'selphie_fh',
    name: 'Selphie',
    locationId: 'fishermans_horizon',
    type: 'dialogue',
    dialogue: { text: "Hey! I'm organizing a concert in the Garden quad to cheer everyone up. We could all use some music right about now, don't you think?" },
    storyLogText: "Selphie organizes a concert at Fisherman's Horizon to boost morale after the Garden's crash landing.",
    minChapter: 8,
    maxChapter: 8,
  },

  // --- RINOA HEARTILLY ---
  {
    id: 'rinoa_ball',
    name: 'Rinoa',
    locationId: 'balamb_garden',
    type: 'dialogue',
    dialogue: { text: "You're the best-looking guy here. Dance with me? ...I'm just kidding. But seriously, come on! One dance won't kill you." },
    storyLogText: 'At the SeeD graduation ball, a mysterious girl named Rinoa drags you onto the dance floor. Something about her is unforgettable.',
    minChapter: 3,
    maxChapter: 3,
  },
  {
    id: 'rinoa_timber',
    name: 'Rinoa',
    locationId: 'timber',
    type: 'dialogue',
    dialogue: { text: "Welcome to Timber! I'm the leader of the Forest Owls resistance. We're going to kidnap President Deling from his private train. Are you in?" },
    storyLogText: "Rinoa leads the Forest Owls, a resistance faction in occupied Timber. She has a bold plan: kidnap President Deling from his private train.",
    questId: 'mq_timber_mission',
    minChapter: 3,
    maxChapter: 5,
  },
  {
    id: 'rinoa_deling',
    name: 'Rinoa',
    locationId: 'deling_city',
    type: 'dialogue',
    dialogue: { text: "That woman — the Sorceress — she's terrifying. But I have this Odine Bangle that might suppress her powers. I have to try, even if it's dangerous." },
    storyLogText: "Rinoa reveals she has an Odine Bangle that could suppress the Sorceress's powers. She's determined to confront Edea herself.",
    minChapter: 5,
    maxChapter: 5,
  },
  {
    id: 'rinoa_esthar',
    name: 'Rinoa',
    locationId: 'esthar_city',
    type: 'dialogue',
    dialogue: { text: "I'm a sorceress now... I can feel the power inside me. What if they seal me away like they did Adel? ...Would you let them?" },
    storyLogText: "Rinoa confides her fear — as a sorceress, she may be sealed away like Adel. Her eyes search yours for an answer.",
    minChapter: 14,
    maxChapter: 15,
  },
  {
    id: 'rinoa_final',
    name: 'Rinoa',
    locationId: 'centra_excavation_site',
    type: 'dialogue',
    dialogue: { text: "Whatever happens in time compression... just think of me. Think of where you want to be. We'll find each other. I promise." },
    storyLogText: "Rinoa makes you promise: no matter what happens during time compression, you'll find your way back to each other.",
    minChapter: 17,
    maxChapter: 18,
  },

  // --- IRVINE KINNEAS ---
  {
    id: 'irvine_gg',
    name: 'Irvine',
    locationId: 'galbadia_garden',
    type: 'dialogue',
    dialogue: { text: "Name's Irvine Kinneas, sharpshooter extraordinaire. They've assigned me to your team for the assassination mission. Don't worry — I never miss." },
    storyLogText: "Irvine Kinneas, a sharpshooter from Galbadia Garden, joins the team for the Deling City assassination mission. He seems confident — perhaps too confident.",
    minChapter: 5,
    maxChapter: 5,
  },
  {
    id: 'irvine_trabia',
    name: 'Irvine',
    locationId: 'trabia_garden',
    type: 'dialogue',
    dialogue: { text: "I have to tell you all something. I remember. We all grew up together at the same orphanage. Edea — the Sorceress — she was our Matron. She raised us." },
    storyLogText: "Irvine reveals the devastating truth: all of you grew up together at Edea's orphanage. GF junctioning erased your memories. The Sorceress you've been fighting is your Matron.",
    minChapter: 10,
    maxChapter: 10,
  },

  // --- SEIFER ALMASY ---
  {
    id: 'seifer_garden',
    name: 'Seifer',
    locationId: 'balamb_garden',
    type: 'dialogue',
    dialogue: { text: "Well, well. Another cadet trying to become SeeD. Don't get in my way at Dollet. I don't need dead weight on my squad." },
    storyLogText: 'Seifer Almasy, your arrogant rival, makes it clear he considers you dead weight. He leads Squad B for the Dollet exam.',
    minChapter: 1,
    maxChapter: 3,
  },
  {
    id: 'seifer_deling',
    name: 'Seifer',
    locationId: 'deling_city',
    type: 'dialogue',
    dialogue: { text: "I've found my purpose. The Sorceress chose me as her knight. You SeeDs are nothing but tools — I'm the one with a romantic dream!" },
    storyLogText: "Seifer has become Edea's knight. He stands at the Sorceress's side in Deling City, having abandoned everything for his 'romantic dream.'",
    minChapter: 5,
    maxChapter: 6,
  },
  {
    id: 'seifer_prison',
    name: 'Seifer',
    locationId: 'd_district_prison',
    type: 'dialogue',
    dialogue: { text: "Tell me, SeeD. Why do you fight the Sorceress? She's going to bring a new order to this world. And I'll be at her side." },
    storyLogText: 'Seifer interrogates you in D-District Prison. As the Sorceress\'s knight, he demands to know why SeeD opposes her.',
    minChapter: 5,
    maxChapter: 6,
  },

  // --- EDEA KRAMER ---
  {
    id: 'edea_sorceress',
    name: 'Sorceress Edea',
    locationId: 'deling_city',
    type: 'dialogue',
    dialogue: { text: "Foolish SeeDs... You dare challenge a Sorceress? Your precious Gardens will burn, and your pathetic resistance will crumble." },
    storyLogText: 'Sorceress Edea addresses the crowd during the Deling City parade. Her words are chilling — she promises to destroy SeeD and the Gardens.',
    minChapter: 5,
    maxChapter: 5,
  },
  {
    id: 'edea_centra',
    name: 'Edea',
    locationId: 'edeas_house',
    type: 'dialogue',
    dialogue: { text: "Children... I'm so sorry for what Ultimecia made me do. The real enemy is a sorceress from the future. Seek the White SeeD Ship — they can help you reach Esthar." },
    storyLogText: "Edea, freed from Ultimecia's possession, apologizes for everything. She reveals the true enemy is a sorceress from the far future.",
    questId: 'mq_orphanage',
    minChapter: 11,
    maxChapter: 15,
  },
  {
    id: 'edea_final',
    name: 'Edea',
    locationId: 'centra_excavation_site',
    type: 'dialogue',
    dialogue: { text: "Ultimecia has fled into time compression. You must follow her — through the distortion of time itself — and end this once and for all." },
    storyLogText: 'Edea reveals that Ultimecia has fled into time compression. To stop her, you must ride the compression itself into the far future.',
    questId: 'mq_time_compression',
    minChapter: 16,
    maxChapter: 18,
  },

  // --- LAGUNA LOIRE ---
  {
    id: 'laguna_dream_1',
    name: 'Laguna (Dream)',
    locationId: 'deling_city',
    type: 'dialogue',
    dialogue: { text: "Man, I get so nervous around Julia... She's a pianist at the hotel here. Every time I try to talk to her, my leg cramps up!" },
    storyLogText: "In a strange dream, you inhabit the body of Laguna Loire, a Galbadian soldier. He's hopelessly smitten with Julia, a pianist at the Deling City hotel.",
    minChapter: 4,
    maxChapter: 4,
  },
  {
    id: 'laguna_dream_2',
    name: 'Laguna (Dream)',
    locationId: 'winhill',
    type: 'dialogue',
    dialogue: { text: "Raine's been taking care of me since I washed up here. And little Ellone... she's like a daughter to me. Winhill is peaceful. I wish it could last." },
    storyLogText: 'Another dream of Laguna — he has settled in Winhill, nursed back to health by Raine. He patrols the village and watches over young Ellone.',
    minChapter: 6,
    maxChapter: 6,
  },
  {
    id: 'laguna_esthar',
    name: 'President Laguna',
    locationId: 'esthar_city',
    type: 'dialogue',
    dialogue: { text: "So you're the one from the dreams, huh? I'm Laguna — President of Esthar. Long story. Lunatic Pandora has appeared. I'm too old for this... but you're not." },
    storyLogText: "You finally meet Laguna Loire in person — he's the President of Esthar. He explains his past and the threat of Lunatic Pandora.",
    questId: 'mq_lunatic_pandora',
    minChapter: 15,
    maxChapter: 16,
  },

  // --- ELLONE ---
  {
    id: 'ellone_ship',
    name: 'Ellone',
    locationId: 'white_seed_ship',
    type: 'dialogue',
    dialogue: { text: "I'm sorry for the dreams... that was me, sending your consciousness into the past. I was trying to change things, to save Raine. But you can't change the past." },
    storyLogText: "Ellone apologizes for the dream sequences — she has the power to send consciousness into the past. She was trying to change history, but learned it's impossible.",
    minChapter: 12,
    maxChapter: 12,
  },
  {
    id: 'ellone_lunar',
    name: 'Ellone',
    locationId: 'lunar_base',
    type: 'dialogue',
    dialogue: { text: "The Sorceress — Ultimecia — she wants to compress all of time. If she succeeds, past, present, and future will merge into one. We have to stop her." },
    storyLogText: "Ellone explains Ultimecia's ultimate goal from the Lunar Base: to compress all of time into a single moment where she can rule everything.",
    minChapter: 14,
    maxChapter: 14,
  },

  // --- FUJIN & RAIJIN ---
  {
    id: 'fujin_garden',
    name: 'Fujin',
    locationId: 'balamb_garden',
    type: 'dialogue',
    dialogue: { text: "SEIFER. DISCIPLINARY COMMITTEE. STAY OUT OF TROUBLE." },
    storyLogText: "You encounter Fujin, a member of Seifer's disciplinary committee. She speaks exclusively in single-word shouts.",
    minChapter: 1,
    maxChapter: 3,
  },
  {
    id: 'raijin_garden',
    name: 'Raijin',
    locationId: 'balamb_garden',
    type: 'dialogue',
    dialogue: { text: "Hey, ya know? Seifer's our leader, ya know? We're the disciplinary committee, ya know?" },
    storyLogText: "Raijin, another member of Seifer's posse, nervously explains the disciplinary committee's role.",
    minChapter: 1,
    maxChapter: 3,
  },
  {
    id: 'fujin_balamb',
    name: 'Fujin',
    locationId: 'balamb_town',
    type: 'dialogue',
    dialogue: { text: "OCCUPATION. ORDERS. SEARCHING FOR ELLONE." },
    storyLogText: "Fujin and Raijin have occupied Balamb Town under Seifer's orders, searching for someone named Ellone.",
    minChapter: 9,
    maxChapter: 9,
  },
  {
    id: 'raijin_balamb',
    name: 'Raijin',
    locationId: 'balamb_town',
    type: 'dialogue',
    dialogue: { text: "Look, we're just following orders, ya know? Seifer told us to lock down Balamb, ya know? Nothing personal, ya know?" },
    storyLogText: 'Raijin apologetically explains that the occupation is just orders from Seifer.',
    minChapter: 9,
    maxChapter: 9,
  },
  {
    id: 'fujin_pandora',
    name: 'Fujin',
    locationId: 'lunatic_pandora',
    type: 'dialogue',
    dialogue: { text: "...Seifer. We've been with you through everything. But this has gone too far. Please... just stop. Come back to us." },
    storyLogText: "In a shocking moment, Fujin drops her usual shouting and speaks softly, begging Seifer to stop. 'Come back to us,' she pleads.",
    minChapter: 16,
    maxChapter: 16,
  },

  // --- MAYOR DOBE ---
  {
    id: 'mayor_dobe',
    name: 'Mayor Dobe',
    locationId: 'fishermans_horizon',
    type: 'dialogue',
    dialogue: { text: "We don't want soldiers here. FH is a pacifist settlement. But... if you must stay while your Garden is repaired, at least prove your skills are more than warfare." },
    storyLogText: "Mayor Dobe reluctantly allows you to stay at Fisherman's Horizon while the Garden is repaired. He challenges you to prove card skills aren't just about fighting.",
    questId: 'mq_the_bridge',
    minChapter: 7,
    maxChapter: 9,
  },

  // --- XU ---
  {
    id: 'xu',
    name: 'Xu',
    locationId: 'balamb_garden',
    type: 'dialogue',
    dialogue: { text: "Garden Master NORG has turned against Cid. There's civil war in the basement — NORG wants to hand us over to the Sorceress. You need to stop him." },
    storyLogText: "Xu warns that Garden Master NORG has betrayed Headmaster Cid. A civil war rages in the Garden basement.",
    questId: 'mq_garden_crisis',
    minChapter: 6,
    maxChapter: 8,
  },

  // --- DR. ODINE ---
  {
    id: 'dr_odine',
    name: 'Dr. Odine',
    locationId: 'esthar_city',
    type: 'dialogue',
    dialogue: { text: "Ze Deep Sea Research Centre! Zere iz ancient Centra technology hidden below. You must retrieve it — for science, of course!" },
    storyLogText: 'Dr. Odine rambles excitedly about ancient Centra technology hidden in the Deep Sea Research Centre.',
    questId: 'mq_deep_sea',
    minChapter: 14,
    maxChapter: 16,
  },

  // --- ESTHAR OFFICIAL ---
  {
    id: 'esthar_official',
    name: 'Esthar Official',
    locationId: 'esthar_city',
    type: 'dialogue',
    dialogue: { text: "The Sorceress has been taken to the Lunar Base. You must go to space and stop her before the Lunar Cry is triggered." },
    storyLogText: 'An Esthar Official delivers urgent news — the Sorceress has been taken to the Lunar Base. You must reach space before the Lunar Cry is triggered.',
    questId: 'mq_lunar_cry',
    minChapter: 12,
    maxChapter: 14,
  },

  // --- SHUMI ATTENDANT ---
  {
    id: 'shumi_attendant',
    name: 'Shumi Attendant',
    locationId: 'shumi_village',
    type: 'dialogue',
    dialogue: { text: "The Elder has been expecting you. He holds wisdom about time and space that may prove vital for your journey ahead." },
    storyLogText: 'The Shumi Attendant welcomes you — the Elder has been expecting your arrival with ancient wisdom about time and space.',
    minChapter: 15,
    maxChapter: 18,
  },

  // --- ZONE & WATTS ---
  {
    id: 'zone_timber',
    name: 'Zone',
    locationId: 'timber',
    type: 'dialogue',
    dialogue: { text: "I'm Zone, second-in-command of the Forest Owls! We've been waiting for SeeD reinforcements. The princess — er, Rinoa — has a plan." },
    storyLogText: 'Zone, second-in-command of the Forest Owls resistance, eagerly awaits your arrival in Timber.',
    minChapter: 4,
    maxChapter: 5,
  },
  {
    id: 'watts_timber',
    name: 'Watts',
    locationId: 'timber',
    type: 'dialogue',
    dialogue: { text: "Sir! I've been gathering intelligence on President Deling's train schedule, sir! Everything is ready for the operation, sir!" },
    storyLogText: "Watts, the Forest Owls' intelligence officer, has detailed information on President Deling's movements.",
    minChapter: 4,
    maxChapter: 5,
  },

  // --- GENERAL CARAWAY ---
  {
    id: 'general_caraway',
    name: 'General Caraway',
    locationId: 'deling_city',
    type: 'dialogue',
    dialogue: { text: "I am General Caraway. The assassination plan is mine. During the parade, we'll trap the Sorceress's float at the city gate. Your sniper will have one shot." },
    storyLogText: "General Caraway — Rinoa's estranged father — briefs you on the assassination plan. One shot during the parade is all you'll get.",
    questId: 'mq_assassination',
    minChapter: 4,
    maxChapter: 5,
  },

  // --- QUEEN OF CARDS ---
  {
    id: 'queen_of_cards_esthar',
    name: 'Queen of Cards',
    locationId: 'esthar_city',
    type: 'dialogue',
    dialogue: { text: "I am the Queen of Cards. I travel the world, shaping the rules of card games in every region. For a price, I can spread a rule... or abolish one." },
    minChapter: 13,
  },

  // --- TRABIA CHAMPION (duel NPC linked to Selphie's quest) ---
  {
    id: 'trabia_champion',
    name: 'Trabia Champion',
    locationId: 'trabia_garden',
    type: 'duel',
    dialogue: {
      challenge: "I'm the strongest player left at Trabia Garden. Don't underestimate us!",
      defeated: "You're strong... stronger than the missiles that hit us. Selphie was right about you.",
      rematch: "We rebuilt our decks from the rubble. Trabia doesn't stay down!",
    },
    difficultyTier: 3,
    deckPool: [
      'sam08g', 'death_claw', 'cactuar', 'tonberry', 'abyss_worm', 'turtapod', 'vysage', 't_rexaur', 'bomb', 'blitz',
    ],
    gilReward: 500,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW DUNGEON NPCs — Radio Tower (Ch1)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'galbadian_soldier',
    name: 'Galbadian Soldier',
    locationId: 'radio_tower',
    type: 'duel',
    dialogue: {
      floorIntro: 'A Galbadian soldier blocks the entrance. "No one gets past without a fight!"',
      floorDefeated: 'The soldier steps aside, muttering about transfer requests...',
    },
    difficultyTier: 1,
    deckPool: [
      'geezard', 'funguar', 'bite_bug', 'red_bat', 'blobra', 'gayla', 'gesper', 'fastitocalon_f',
    ],
    gilReward: 75,
    floorOrder: 0,
    isBoss: false,
  },
  {
    id: 'elite_soldier',
    name: 'Elite Soldier',
    locationId: 'radio_tower',
    type: 'duel',
    dialogue: {
      floorIntro: 'An officer in polished armour appears on the upper level. "You made it this far? Impressive."',
      floorDefeated: '"Stand down..." The officer retreats upstairs.',
    },
    difficultyTier: 1,
    deckPool: [
      'red_bat', 'blobra', 'gayla', 'cockatrice', 'grat', 'buel', 'blood_soul', 'caterchipillar',
    ],
    gilReward: 100,
    floorOrder: 1,
    isBoss: false,
  },
  {
    id: 'comm_officer',
    name: 'Comm Officer',
    locationId: 'radio_tower',
    type: 'duel',
    dialogue: {
      floorIntro: 'A communications officer intercepts you at the relay room. "Unauthorised frequency detected — engage!"',
      floorDefeated: '"Signal lost... you\'re clear to the antenna."',
    },
    difficultyTier: 2,
    deckPool: [
      'cockatrice', 'grat', 'buel', 'mesmerize', 'glacial_eye', 'belhelmel', 'thrustaevis', 'anacondaur',
    ],
    gilReward: 150,
    floorOrder: 2,
    isBoss: false,
  },
  {
    id: 'biggs_wedge',
    name: 'Biggs & Wedge',
    locationId: 'radio_tower',
    type: 'duel',
    dialogue: {
      challenge: '"You again?! Wedge, get the cards!" "Sir, yes sir!"',
      defeated: '"Retreat! RETREAT!" The duo scrambles down the tower.',
      rematch: '"We\'ve been reassigned to card combat duty. This time we\'re ready!"',
    },
    difficultyTier: 2,
    deckPool: [
      'gayla', 'cockatrice', 'grat', 'buel', 'mesmerize', 'glacial_eye', 'belhelmel', 'thrustaevis',
    ],
    gilReward: 200,
    floorOrder: 3,
    isBoss: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW DUNGEON NPCs — Tomb of the Unknown King (Ch2)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'tomb_wraith',
    name: 'Tomb Wraith',
    locationId: 'tomb_of_unknown_king',
    type: 'duel',
    dialogue: {
      floorIntro: 'A ghostly figure drifts through the tomb walls, cards floating around it.',
      floorDefeated: 'The wraith dissolves, leaving a path deeper into the tomb...',
    },
    difficultyTier: 2,
    deckPool: [
      'blood_soul', 'caterchipillar', 'cockatrice', 'grat', 'buel', 'mesmerize', 'glacial_eye', 'belhelmel',
    ],
    gilReward: 100,
    floorOrder: 0,
    isBoss: false,
  },
  {
    id: 'tomb_knight',
    name: 'Tomb Knight',
    locationId: 'tomb_of_unknown_king',
    type: 'duel',
    dialogue: {
      floorIntro: 'An armoured knight materialises, sword replaced by a hand of cards.',
      floorDefeated: 'The knight kneels in defeat, armour clattering as it fades...',
    },
    difficultyTier: 2,
    deckPool: [
      'mesmerize', 'glacial_eye', 'belhelmel', 'thrustaevis', 'anacondaur', 'creeps', 'grendel', 'jelleye',
    ],
    gilReward: 150,
    floorOrder: 1,
    isBoss: false,
  },
  {
    id: 'tomb_phantom',
    name: 'Tomb Phantom',
    locationId: 'tomb_of_unknown_king',
    type: 'duel',
    dialogue: {
      floorIntro: 'A phantom drifts through the labyrinth walls. It holds cards that glow with spectral light.',
      floorDefeated: 'The phantom wails and dissipates. The brothers\' chamber lies ahead...',
    },
    difficultyTier: 2,
    deckPool: [
      'belhelmel', 'thrustaevis', 'anacondaur', 'creeps', 'grendel', 'jelleye', 'grand_mantis', 'forbidden',
    ],
    gilReward: 200,
    floorOrder: 2,
    isBoss: false,
  },
  {
    id: 'sacred_minotaur',
    name: 'Sacred & Minotaur',
    locationId: 'tomb_of_unknown_king',
    type: 'duel',
    dialogue: {
      challenge: '"WE GUARD THIS TOMB!" "Brother, let\'s crush them at cards!"',
      defeated: '"Impossible!" "Brother, we lost..." The brothers fade into stone.',
      rematch: '"WE HAVE RETURNED!" "This time, brother, we win!"',
    },
    difficultyTier: 2,
    deckPool: [
      'glacial_eye', 'belhelmel', 'thrustaevis', 'anacondaur', 'creeps', 'grendel', 'jelleye', 'grand_mantis', 'forbidden',
    ],
    gilReward: 300,
    floorOrder: 3,
    isBoss: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW DUNGEON NPCs — Deling City Sewers (TD, Ch2)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'sewer_rat',
    name: 'Sewer Rat',
    locationId: 'deling_sewers',
    type: 'duel',
    dialogue: {
      floorIntro: 'Something scurries in the darkness. A giant rat clutches a deck of soggy cards.',
      floorDefeated: 'The rat squeaks and dashes further into the tunnels...',
    },
    difficultyTier: 2,
    deckPool: [
      'blood_soul', 'caterchipillar', 'cockatrice', 'grat', 'buel', 'mesmerize', 'glacial_eye', 'belhelmel',
    ],
    gilReward: 75,
    floorOrder: 0,
    isBoss: false,
  },
  {
    id: 'sewer_creep',
    name: 'Sewer Creep',
    locationId: 'deling_sewers',
    type: 'duel',
    dialogue: {
      floorIntro: 'A mass of tentacles emerges from the murky water, holding cards aloft.',
      floorDefeated: 'The creature sinks back into the water with a gurgle...',
    },
    difficultyTier: 2,
    deckPool: [
      'mesmerize', 'glacial_eye', 'belhelmel', 'thrustaevis', 'anacondaur', 'creeps', 'grendel', 'jelleye',
    ],
    gilReward: 125,
    floorOrder: 1,
    isBoss: false,
  },
  {
    id: 'sewer_guardian',
    name: 'Sewer Guardian',
    locationId: 'deling_sewers',
    type: 'duel',
    dialogue: {
      challenge: 'The sewers are my domain. None pass without defeating me!',
      defeated: "You've earned passage through my tunnels. The exit is ahead.",
      rematch: 'The sewers shift and change. My deck has evolved with them!',
    },
    difficultyTier: 2,
    deckPool: [
      'thrustaevis', 'anacondaur', 'creeps', 'grendel', 'jelleye', 'grand_mantis', 'forbidden', 'armadodo',
    ],
    gilReward: 250,
    floorOrder: 2,
    isBoss: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW DUNGEON NPCs — Galbadia Missile Base (Ch2)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'base_guard',
    name: 'Base Guard',
    locationId: 'galbadia_missile_base',
    type: 'duel',
    dialogue: {
      floorIntro: '"Halt! Authorised personnel only!" The guard reaches for his cards instead of his weapon.',
      floorDefeated: '"I... I\'ll pretend I didn\'t see you. Move along!"',
    },
    difficultyTier: 2,
    deckPool: [
      'mesmerize', 'glacial_eye', 'belhelmel', 'thrustaevis', 'anacondaur', 'creeps', 'grendel', 'jelleye',
    ],
    gilReward: 125,
    floorOrder: 0,
    isBoss: false,
  },
  {
    id: 'base_technician',
    name: 'Base Technician',
    locationId: 'galbadia_missile_base',
    type: 'duel',
    dialogue: {
      floorIntro: 'A technician blocks the control room door. "I can\'t let you sabotage the launch... unless you beat me."',
      floorDefeated: '"Fine, the codes are yours. I never liked this job anyway."',
    },
    difficultyTier: 2,
    deckPool: [
      'thrustaevis', 'anacondaur', 'creeps', 'grendel', 'jelleye', 'grand_mantis', 'forbidden', 'armadodo',
    ],
    gilReward: 175,
    floorOrder: 1,
    isBoss: false,
  },
  {
    id: 'launch_engineer',
    name: 'Launch Engineer',
    locationId: 'galbadia_missile_base',
    type: 'duel',
    dialogue: {
      floorIntro: 'An engineer stands at the missile silo controls. "The countdown has begun. Beat me to stop it!"',
      floorDefeated: '"Abort sequence initiated... You\'re mad, but you\'re good."',
    },
    difficultyTier: 3,
    deckPool: [
      'creeps', 'grendel', 'jelleye', 'grand_mantis', 'forbidden', 'armadodo', 'tri_face', 'sam08g',
    ],
    gilReward: 225,
    floorOrder: 2,
    isBoss: false,
  },
  {
    id: 'silo_guardian',
    name: 'Silo Guardian',
    locationId: 'galbadia_missile_base',
    type: 'duel',
    dialogue: {
      floorIntro: 'A heavily armoured robot activates in the missile silo. "INTRUDER. ENGAGE PROTOCOL."',
      floorDefeated: 'PROTOCOL FAILED. POWERING DOWN. The commander\'s office is just ahead...',
    },
    difficultyTier: 3,
    deckPool: [
      'grand_mantis', 'forbidden', 'armadodo', 'tri_face', 'sam08g', 'death_claw', 'cactuar', 'tonberry',
    ],
    gilReward: 275,
    floorOrder: 3,
    isBoss: false,
  },
  {
    id: 'base_commander',
    name: 'Base Commander',
    locationId: 'galbadia_missile_base',
    type: 'duel',
    dialogue: {
      challenge: "You think you can stop the launch? The missiles are Galbadia's pride! Defeat me first!",
      defeated: 'The missiles... the base... it was all for nothing. You win.',
      rematch: "I've rebuilt my deck from the wreckage. Galbadia will have its revenge!",
    },
    difficultyTier: 3,
    deckPool: [
      'anacondaur', 'creeps', 'grendel', 'jelleye', 'grand_mantis', 'forbidden', 'armadodo', 'tri_face', 'sam08g',
    ],
    gilReward: 350,
    floorOrder: 4,
    isBoss: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW DUNGEON NPCs — Balamb Garden Basement (TD, Ch3)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'basement_creature',
    name: 'Basement Creature',
    locationId: 'balamb_garden_basement',
    type: 'duel',
    dialogue: {
      floorIntro: 'Something lurks in the rusted corridors beneath the Garden. It challenges you!',
      floorDefeated: 'The creature retreats deeper into the ancient shelter...',
    },
    difficultyTier: 2,
    deckPool: [
      'mesmerize', 'glacial_eye', 'belhelmel', 'thrustaevis', 'anacondaur', 'creeps', 'grendel', 'jelleye',
    ],
    gilReward: 125,
    floorOrder: 0,
    isBoss: false,
  },
  {
    id: 'basement_guardian',
    name: 'Basement Guardian',
    locationId: 'balamb_garden_basement',
    type: 'duel',
    dialogue: {
      floorIntro: 'An ancient defence mechanism activates! A holographic card board appears.',
      floorDefeated: 'The mechanism powers down, revealing a passage to the control room...',
    },
    difficultyTier: 2,
    deckPool: [
      'thrustaevis', 'anacondaur', 'creeps', 'grendel', 'jelleye', 'grand_mantis', 'forbidden', 'armadodo',
    ],
    gilReward: 175,
    floorOrder: 1,
    isBoss: false,
  },
  {
    id: 'norg',
    name: 'NORG',
    locationId: 'balamb_garden_basement',
    type: 'duel',
    dialogue: {
      challenge: 'MONEY! PROFIT! My Garden, MY rules! You want to fly? Beat me first, you UNGRATEFUL SeeDs!',
      defeated: 'NOOOOO! My beautiful investment... ruined by a card game!',
      rematch: "I've been scheming in the dark. My new deck will bankrupt you!",
    },
    difficultyTier: 3,
    deckPool: [
      'grendel', 'jelleye', 'grand_mantis', 'forbidden', 'armadodo', 'tri_face', 'sam08g', 'death_claw',
    ],
    gilReward: 400,
    floorOrder: 2,
    isBoss: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW DUNGEON NPCs — Balamb Under Siege (TD, Ch5)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'galbadian_invader',
    name: 'Galbadian Invader',
    locationId: 'balamb_under_siege',
    type: 'duel',
    dialogue: {
      floorIntro: 'A Galbadian soldier patrols the occupied streets. "This town belongs to Galbadia now!"',
      floorDefeated: '"Maybe occupying a town of card players was a bad idea..."',
    },
    difficultyTier: 2,
    deckPool: [
      'thrustaevis', 'anacondaur', 'creeps', 'grendel', 'jelleye', 'grand_mantis', 'forbidden', 'armadodo',
    ],
    gilReward: 150,
    floorOrder: 0,
    isBoss: false,
  },
  {
    id: 'raijin_boss',
    name: 'Raijin',
    locationId: 'balamb_under_siege',
    type: 'duel',
    dialogue: {
      floorIntro: '"Yo, you think you can just walk in here, ya know?! Raijin don\'t back down from a card game!"',
      floorDefeated: '"Aw man... Fujin\'s gonna be mad at me, ya know?"',
    },
    difficultyTier: 3,
    deckPool: [
      'grand_mantis', 'forbidden', 'armadodo', 'tri_face', 'sam08g', 'death_claw', 'cactuar', 'tonberry',
    ],
    gilReward: 225,
    floorOrder: 1,
    isBoss: false,
  },
  {
    id: 'occupation_captain',
    name: 'Occupation Captain',
    locationId: 'balamb_under_siege',
    type: 'duel',
    dialogue: {
      floorIntro: 'The captain of the occupation force stands at the town square. "You SeeDs just don\'t quit!"',
      floorDefeated: '"Pull back to the harbour! These card players are insane!"',
    },
    difficultyTier: 3,
    deckPool: [
      'armadodo', 'tri_face', 'sam08g', 'death_claw', 'cactuar', 'tonberry', 'abyss_worm', 'turtapod',
    ],
    gilReward: 300,
    floorOrder: 2,
    isBoss: false,
  },
  {
    id: 'fujin_boss',
    name: 'Fujin',
    locationId: 'balamb_under_siege',
    type: 'duel',
    dialogue: {
      challenge: 'CARDS. NOW.',
      defeated: 'RAGE... RETREAT.',
      rematch: 'REMATCH. PREPARE.',
    },
    difficultyTier: 3,
    deckPool: [
      'forbidden', 'armadodo', 'tri_face', 'sam08g', 'death_claw', 'cactuar', 'tonberry', 'abyss_worm', 'turtapod',
    ],
    gilReward: 400,
    floorOrder: 3,
    isBoss: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW DUNGEON NPCs — Roaming Forest (Ch6)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'forest_sprite',
    name: 'Forest Sprite',
    locationId: 'roaming_forest',
    type: 'duel',
    dialogue: {
      floorIntro: 'A tiny glowing creature flits through the trees and lays down cards on a mossy stump.',
      floorDefeated: 'The sprite giggles and vanishes into the canopy...',
    },
    difficultyTier: 3,
    deckPool: [
      'sam08g', 'death_claw', 'cactuar', 'tonberry', 'abyss_worm', 'turtapod', 'vysage', 't_rexaur',
    ],
    gilReward: 175,
    floorOrder: 0,
    isBoss: false,
  },
  {
    id: 'forest_wolf',
    name: 'Forest Wolf',
    locationId: 'roaming_forest',
    type: 'duel',
    dialogue: {
      floorIntro: 'A massive wolf blocks the forest path. It drops a deck of cards from its jaws.',
      floorDefeated: 'The wolf howls and bounds deeper into the forest...',
    },
    difficultyTier: 3,
    deckPool: [
      'death_claw', 'cactuar', 'tonberry', 'abyss_worm', 'turtapod', 'vysage', 't_rexaur', 'bomb', 'blitz',
    ],
    gilReward: 225,
    floorOrder: 1,
    isBoss: false,
  },
  {
    id: 'forest_guardian',
    name: 'Forest Guardian',
    locationId: 'roaming_forest',
    type: 'duel',
    dialogue: {
      challenge: 'This forest has wandered for centuries. I have guarded it just as long. Prove your worth!',
      defeated: 'The forest accepts you. Its wisdom is yours.',
      rematch: 'The forest has grown new strategies since you last visited.',
    },
    difficultyTier: 3,
    deckPool: [
      'cactuar', 'tonberry', 'abyss_worm', 'turtapod', 'vysage', 't_rexaur', 'bomb', 'blitz', 'wendigo', 'torama',
    ],
    gilReward: 400,
    floorOrder: 2,
    isBoss: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW DUNGEON NPCs — Galbadia Garden Revolution (TD, Ch7)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'gg_loyalist',
    name: 'GG Loyalist',
    locationId: 'galbadia_garden_revolution',
    type: 'duel',
    dialogue: {
      floorIntro: '"For Galbadia Garden! For the Sorceress!" A fanatical student raises her cards.',
      floorDefeated: '"This... this isn\'t how it was supposed to go..." She flees down the corridor.',
    },
    difficultyTier: 3,
    deckPool: [
      'sam08g', 'death_claw', 'cactuar', 'tonberry', 'abyss_worm', 'turtapod', 'vysage', 't_rexaur', 'bomb',
    ],
    gilReward: 200,
    floorOrder: 0,
    isBoss: false,
  },
  {
    id: 'gg_elite',
    name: 'GG Elite Guard',
    locationId: 'galbadia_garden_revolution',
    type: 'duel',
    dialogue: {
      floorIntro: 'The Garden\'s elite guard stands before the Headmaster\'s office. "No one gets through!"',
      floorDefeated: '"The Sorceress\'s power wanes... I can feel it." He lowers his cards.',
    },
    difficultyTier: 3,
    deckPool: [
      'tonberry', 'abyss_worm', 'turtapod', 'vysage', 't_rexaur', 'bomb', 'blitz', 'wendigo', 'torama', 'imp',
    ],
    gilReward: 300,
    floorOrder: 1,
    isBoss: false,
  },
  {
    id: 'gg_berserker',
    name: 'GG Berserker',
    locationId: 'galbadia_garden_revolution',
    type: 'duel',
    dialogue: {
      floorIntro: 'A crazed student charges through the wreckage. "The Sorceress demands victory! FIGHT ME!"',
      floorDefeated: '"The Sorceress... she lied to us..." He collapses against the wall.',
    },
    difficultyTier: 3,
    deckPool: [
      'turtapod', 'vysage', 't_rexaur', 'bomb', 'blitz', 'wendigo', 'torama', 'imp', 'blue_dragon',
    ],
    gilReward: 400,
    floorOrder: 2,
    isBoss: false,
  },
  {
    id: 'gg_commander',
    name: 'GG Commander',
    locationId: 'galbadia_garden_revolution',
    type: 'duel',
    dialogue: {
      floorIntro: 'The Garden\'s military commander blocks the bridge. "Seifer will hear about this!"',
      floorDefeated: '"Fine... Seifer can deal with you himself."',
    },
    difficultyTier: 4,
    deckPool: [
      'bomb', 'blitz', 'wendigo', 'torama', 'imp', 'blue_dragon', 'adamantoise', 'hexadragon', 'iron_giant',
    ],
    gilReward: 500,
    floorOrder: 3,
    isBoss: false,
  },
  {
    id: 'seifer',
    name: 'Seifer',
    locationId: 'galbadia_garden_revolution',
    type: 'duel',
    dialogue: {
      challenge: "This is MY Garden now. You want it back? You'll have to take it from me, one card at a time!",
      defeated: "Tch... this isn't over. The Sorceress will have the last word.",
      rematch: "I've been training with the Sorceress's own cards. This time, you lose!",
    },
    difficultyTier: 4,
    deckPool: [
      'torama', 'imp', 'blue_dragon', 'adamantoise', 'hexadragon', 'iron_giant', 'behemoth', 'chimera',
    ],
    gilReward: 600,
    floorOrder: 4,
    isBoss: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW TOWN NPCs — White SeeD Ship (Ch8)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'white_seed_merchant',
    name: 'White SeeD Merchant',
    locationId: 'white_seed_ship',
    type: 'shop',
    dialogue: { text: "We've collected cards from every port. Take a look." },
    shopItems: [
      { cardId: 'torama' },
      { cardId: 'imp' },
      { cardId: 'blue_dragon' },
      { cardId: 'adamantoise' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW DUNGEON NPCs — Great Salt Lake (Ch9)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'salt_creature',
    name: 'Salt Creature',
    locationId: 'great_salt_lake',
    type: 'duel',
    dialogue: {
      floorIntro: 'A crystalline creature rises from the salt flats. Cards gleam between its translucent fingers.',
      floorDefeated: 'The creature crumbles back into salt, clearing the path ahead...',
    },
    difficultyTier: 4,
    deckPool: [
      'torama', 'imp', 'blue_dragon', 'adamantoise', 'hexadragon', 'iron_giant', 'behemoth', 'chimera',
    ],
    gilReward: 250,
    floorOrder: 0,
    isBoss: false,
  },
  {
    id: 'salt_behemoth',
    name: 'Salt Behemoth',
    locationId: 'great_salt_lake',
    type: 'duel',
    dialogue: {
      floorIntro: 'The ground trembles. A massive beast encrusted with salt crystals emerges, bellowing a challenge.',
      floorDefeated: 'The behemoth collapses, its salt shell shattering. The way to Esthar opens...',
    },
    difficultyTier: 4,
    deckPool: [
      'blue_dragon', 'adamantoise', 'hexadragon', 'iron_giant', 'behemoth', 'chimera', 'malboro', 'ruby_dragon',
    ],
    gilReward: 375,
    floorOrder: 1,
    isBoss: false,
  },
  {
    id: 'salt_golem',
    name: 'Salt Golem',
    locationId: 'great_salt_lake',
    type: 'duel',
    dialogue: {
      floorIntro: 'A massive crystalline golem blocks the path to Esthar. Its body hums with energy.',
      floorDefeated: 'The golem fractures and the salt wind carries its dust away...',
    },
    difficultyTier: 4,
    deckPool: [
      'adamantoise', 'hexadragon', 'iron_giant', 'behemoth', 'chimera', 'malboro', 'ruby_dragon', 'elnoyle',
    ],
    gilReward: 475,
    floorOrder: 2,
    isBoss: false,
  },
  {
    id: 'abadon_boss',
    name: 'Abadon',
    locationId: 'great_salt_lake',
    type: 'duel',
    dialogue: {
      challenge: 'The undying guardian of the Salt Lake. None have passed beyond this point.',
      defeated: 'Even the undying can be defeated... Esthar lies beyond.',
      rematch: 'Death has no hold on me. Neither does defeat. Come!',
    },
    difficultyTier: 4,
    deckPool: [
      'hexadragon', 'iron_giant', 'behemoth', 'chimera', 'malboro', 'ruby_dragon', 'elnoyle', 'tonberry_king',
    ],
    gilReward: 600,
    floorOrder: 3,
    isBoss: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW TOWN NPCs — Sorceress Memorial (Ch9)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'memorial_guard',
    name: 'Memorial Guard',
    locationId: 'sorceress_memorial',
    type: 'duel',
    dialogue: {
      challenge: "I guard the Sorceress Memorial. No one enters without proving themselves.",
      defeated: "Your resolve is clear. The memorial's secrets are open to you.",
      rematch: "Standing guard all day gives me time to perfect my strategy.",
    },
    difficultyTier: 4,
    deckPool: [
      'iron_giant', 'behemoth', 'malboro', 'ruby_dragon', 'elnoyle', 'tonberry_king', 'wedge_biggs', 'fujin_raijin',
    ],
    gilReward: 600,
  },
  {
    id: 'memorial_scholar',
    name: 'Memorial Scholar',
    locationId: 'sorceress_memorial',
    type: 'duel',
    dialogue: {
      challenge: "I study the history of Sorceresses. Care to test your knowledge... in cards?",
      defeated: "Fascinating. Your card skills are worthy of the archives.",
      rematch: "I've uncovered new card techniques in the ancient texts!",
    },
    difficultyTier: 4,
    deckPool: [
      'behemoth', 'malboro', 'ruby_dragon', 'elnoyle', 'tonberry_king', 'wedge_biggs', 'fujin_raijin', 'chimera',
    ],
    gilReward: 600,
  },
  {
    id: 'memorial_curator',
    name: 'Memorial Curator',
    locationId: 'sorceress_memorial',
    type: 'shop',
    dialogue: { text: 'These cards were recovered from the memorial vaults. Handle them with care.' },
    shopItems: [
      { cardId: 'elnoyle' },
      { cardId: 'tonberry_king' },
      { cardId: 'wedge_biggs' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW DUNGEON NPCs — Lunatic Pandora (Ch12)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'pandora_soldier',
    name: 'Pandora Soldier',
    locationId: 'lunatic_pandora',
    type: 'duel',
    dialogue: {
      floorIntro: 'A Galbadian soldier stands amidst the crystal pillars. "The Sorceress commands this place!"',
      floorDefeated: '"The Pandora... it\'s breaking apart!" The soldier flees.',
    },
    difficultyTier: 5,
    deckPool: [
      'elvoret', 'x_atm092', 'granaldo', 'gerogero', 'iguion', 'abadon', 'propagator', 'jumbo_cactuar',
    ],
    gilReward: 400,
    floorOrder: 0,
    isBoss: false,
  },
  {
    id: 'pandora_guardian',
    name: 'Pandora Guardian',
    locationId: 'lunatic_pandora',
    type: 'duel',
    dialogue: {
      floorIntro: 'A massive crystalline entity pulses with energy. It manifests a card board from pure light.',
      floorDefeated: 'The guardian shatters. The path to the summit is clear...',
    },
    difficultyTier: 5,
    deckPool: [
      'x_atm092', 'granaldo', 'gerogero', 'iguion', 'abadon', 'propagator', 'jumbo_cactuar', 'tri_point', 'gargantua',
    ],
    gilReward: 600,
    floorOrder: 1,
    isBoss: false,
  },
  {
    id: 'pandora_shade',
    name: 'Pandora Shade',
    locationId: 'lunatic_pandora',
    type: 'duel',
    dialogue: {
      floorIntro: 'A shadow detaches from the crystal walls. It speaks in the Sorceress\'s voice: "You will go no further."',
      floorDefeated: 'The shade dissolves, the Sorceress\'s laughter fading...',
    },
    difficultyTier: 5,
    deckPool: [
      'iguion', 'abadon', 'propagator', 'jumbo_cactuar', 'tri_point', 'gargantua', 'mobile_type_8', 'sphinxara',
    ],
    gilReward: 700,
    floorOrder: 2,
    isBoss: false,
  },
  {
    id: 'pandora_core',
    name: 'Pandora Core',
    locationId: 'lunatic_pandora',
    type: 'duel',
    dialogue: {
      floorIntro: 'The Pandora\'s crystalline core pulsates violently. Energy coalesces into cards.',
      floorDefeated: 'The core cracks. Beyond it stands Seifer, waiting...',
    },
    difficultyTier: 5,
    deckPool: [
      'propagator', 'jumbo_cactuar', 'tri_point', 'gargantua', 'mobile_type_8', 'sphinxara', 'tiamat', 'bgh251f2',
    ],
    gilReward: 850,
    floorOrder: 3,
    isBoss: false,
  },
  {
    id: 'seifer_final',
    name: 'Seifer',
    locationId: 'lunatic_pandora',
    type: 'duel',
    dialogue: {
      challenge: "This is it. The Sorceress gave me everything. I won't let you take it away!",
      defeated: "I... I was wrong. About all of it. Go. Stop her.",
      rematch: 'Even after everything... I still have my pride. And my cards.',
    },
    difficultyTier: 5,
    deckPool: [
      'propagator', 'jumbo_cactuar', 'tri_point', 'gargantua', 'mobile_type_8', 'sphinxara', 'tiamat', 'bgh251f2',
    ],
    gilReward: 1000,
    floorOrder: 4,
    isBoss: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW DUNGEON NPCs — Centra Excavation Site (Ch13)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'excavation_drone',
    name: 'Excavation Drone',
    locationId: 'centra_excavation_site',
    type: 'duel',
    dialogue: {
      floorIntro: 'An ancient Centra drone reactivates, projecting a holographic card board.',
      floorDefeated: 'SYSTEM ERROR. ALLOWING PASSAGE TO LEVEL 2...',
    },
    difficultyTier: 5,
    deckPool: [
      'elvoret', 'x_atm092', 'granaldo', 'gerogero', 'iguion', 'abadon', 'propagator', 'jumbo_cactuar',
    ],
    gilReward: 400,
    floorOrder: 0,
    isBoss: false,
  },
  {
    id: 'excavation_golem',
    name: 'Excavation Golem',
    locationId: 'centra_excavation_site',
    type: 'duel',
    dialogue: {
      floorIntro: 'A colossal stone golem awakens from millennia of slumber. It raises cards made of ancient crystal.',
      floorDefeated: 'The golem crumbles. The deepest chamber awaits...',
    },
    difficultyTier: 5,
    deckPool: [
      'x_atm092', 'granaldo', 'gerogero', 'iguion', 'abadon', 'propagator', 'jumbo_cactuar', 'tri_point', 'gargantua',
    ],
    gilReward: 600,
    floorOrder: 1,
    isBoss: false,
  },
  {
    id: 'omega_weapon',
    name: 'Omega Weapon',
    locationId: 'centra_excavation_site',
    type: 'duel',
    dialogue: {
      challenge: 'THE ULTIMATE WEAPON AWAKENS. YOUR CARDS... WILL BE JUDGED.',
      defeated: 'SYSTEM... SHUTDOWN... YOU HAVE PROVEN... WORTHY...',
      rematch: 'REACTIVATING. ULTIMATE PROTOCOL ENGAGED.',
    },
    difficultyTier: 5,
    deckPool: [
      'propagator', 'jumbo_cactuar', 'tri_point', 'gargantua', 'mobile_type_8', 'sphinxara', 'tiamat', 'bgh251f2', 'red_giant', 'catoblepas', 'ultima_weapon',
    ],
    gilReward: 1500,
    floorOrder: 2,
    isBoss: true,
  },
] as NPC[]).map(npc => ({ ...npc, portrait: npc.portrait ?? `/portraits/${npc.id}.png` }))

// ─── Map Override Persistence ────────────────────────────────────────────────

const MAP_OVERRIDES_KEY = 'tripletriad-map-overrides'

export interface MapOverrides {
  regions?: Record<string, string>           // regionId → mapBounds
  locations?: Record<string, { mapX: number; mapY: number }>  // locationId → { mapX, mapY }
}

export function loadMapOverrides(): MapOverrides | null {
  try {
    const raw = localStorage.getItem(MAP_OVERRIDES_KEY)
    if (!raw) return null
    return JSON.parse(raw) as MapOverrides
  } catch {
    return null
  }
}

export function saveMapOverrides(overrides: MapOverrides): void {
  try {
    localStorage.setItem(MAP_OVERRIDES_KEY, JSON.stringify(overrides))
  } catch {
    // ignore quota errors
  }
}

export function clearMapOverrides(): void {
  try {
    localStorage.removeItem(MAP_OVERRIDES_KEY)
  } catch {
    // ignore
  }
}

function applyRegionOverrides(regions: Region[]): Region[] {
  const overrides = loadMapOverrides()
  if (!overrides?.regions) return regions
  return regions.map(r => {
    const bounds = overrides.regions![r.id]
    return bounds ? { ...r, mapBounds: bounds } : r
  })
}

function applyLocationOverrides(locations: Location[]): Location[] {
  const overrides = loadMapOverrides()
  if (!overrides?.locations) return locations
  return locations.map(l => {
    const pos = overrides.locations![l.id]
    return pos ? { ...l, mapX: pos.mapX, mapY: pos.mapY } : l
  })
}

// ─── V3 Accessor Functions ──────────────────────────────────────────────────

export function getRegions(): Region[] {
  return applyRegionOverrides(REGIONS)
}

export function getRegionById(id: string): Region | undefined {
  return getRegions().find((r) => r.id === id)
}

export function getLocations(): Location[] {
  return applyLocationOverrides(LOCATIONS)
}

export function getLocationById(id: string): Location | undefined {
  return getLocations().find((l) => l.id === id)
}

export function getLocationsByRegion(regionId: string): Location[] {
  return getLocations()
    .filter((l) => l.regionId === regionId && !l.parentTownId)
    .sort((a, b) => a.order - b.order)
}

/** Get TD (Town-Dungeon) locations whose parent is a given town. */
export function getLocationsByParentTown(townId: string): Location[] {
  return getLocations().filter((l) => l.parentTownId === townId)
}

/** Get NPCs visible at the current story chapter. Filters by minChapter/maxChapter.
 *  NPCs whose IDs are in `pinnedNpcIds` remain visible even if their chapter window has passed
 *  (used to keep quest givers visible while the player has an active quest from them). */
export function getVisibleNpcs(locationId: string, storyChapter: number, pinnedNpcIds?: Set<string>): NPC[] {
  return NPCS.filter((n) => {
    if (n.locationId !== locationId) return false
    // Always show pinned NPCs (active quest givers)
    if (pinnedNpcIds?.has(n.id)) return true
    if (n.minChapter !== undefined && storyChapter < n.minChapter) return false
    if (n.maxChapter !== undefined && storyChapter > n.maxChapter) return false
    return true
  })
}

export function getNpcs(): NPC[] {
  return NPCS
}

export function getNpcById(id: string): NPC | undefined {
  return NPCS.find((n) => n.id === id)
}

export function getNpcsByLocation(locationId: string): NPC[] {
  return NPCS.filter((n) => n.locationId === locationId)
}

export function getDuelNpcsByLocation(locationId: string): NPC[] {
  return NPCS.filter(
    (n) => n.locationId === locationId && n.type === 'duel'
  )
}

export function getDungeonFloors(locationId: string): NPC[] {
  return NPCS.filter(
    (n) => n.locationId === locationId && n.floorOrder !== undefined
  ).sort((a, b) => (a.floorOrder ?? 0) - (b.floorOrder ?? 0))
}

export function formatRules(rules: SpecialRule[]): string {
  return rules.length > 0 ? rules.join(', ') : 'None'
}

// ─── Legacy Backward-Compat Functions ───────────────────────────────────────

/**
 * @deprecated Map V3 locations to old Area format for existing UI.
 */
export function getAreas(): Area[] {
  return LOCATIONS.map((loc) => {
    const firstDuel = NPCS.find(
      (n) => n.locationId === loc.id && n.type === 'duel'
    )
    return {
      ...loc,
      opponentName: firstDuel?.name,
      opponentImagePath: firstDuel?.portrait,
      opponentDeckPool: firstDuel?.deckPool,
      gilReward: firstDuel?.gilReward,
      difficultyTier: firstDuel?.difficultyTier,
    }
  })
}

/**
 * @deprecated Map V3 location to old Area format for existing UI.
 */
export function getAreaById(id: string): Area | undefined {
  return getAreas().find((a) => a.id === id)
}

/**
 * @deprecated Map V3 NPCs to old Spot format for existing UI.
 */
export function getSpots(areaId: string): Spot[] {
  return NPCS.filter((n) => n.locationId === areaId)
    .filter(
      (n) =>
        n.type === 'duel' || n.type === 'shop' || n.type === 'tournament'
    )
    .map((n, i) => ({
      id: n.id,
      name: n.name,
      areaId,
      type: n.type as 'duel' | 'shop' | 'tournament',
      opponentName: n.type === 'duel' ? n.name : undefined,
      opponentImagePath: n.portrait,
      order: n.floorOrder ?? i,
    }))
    .sort((a, b) => a.order - b.order)
}

/**
 * @deprecated Get the first duel NPC's deck pool for an area (old UI compat).
 */
export function getAreaDeckPool(areaId: string, allCards: Card[]): Card[] {
  const firstDuel = NPCS.find(
    (n) => n.locationId === areaId && n.type === 'duel'
  )
  if (!firstDuel?.deckPool || firstDuel.deckPool.length === 0) return allCards
  return allCards.filter((c) => firstDuel.deckPool!.includes(c.id))
}

// ─── Re-exports for convenience ─────────────────────────────────────────────

export type {
  Area,
  Region,
  Location,
  NPC,
  Spot,
  SpecialRule,
  TradeRule,
  UnlockCondition,
}
