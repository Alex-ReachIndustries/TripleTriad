/**
 * V3 World data: 7 regions, 17 locations (12 towns + 5 dungeons), ~50 NPCs.
 * Source of truth: .cursor/projects/triple-triad-v3/world-design.md
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
      'A small peaceful island with the prestigious Balamb Garden SeeD academy.',
    mapBounds: '19,55 29,55 29,64 19,64 19,55',
    unlockCondition: null,
  },
  {
    id: 'dollet',
    name: 'Dollet',
    rules: ['Random', 'Elemental'],
    tradeRule: 'One',
    order: 1,
    description:
      'An independent dukedom known for its communication tower. Tricky rules make card games here unpredictable.',
    mapBounds: '17,30 30,30 32,47 17,47 17,30',
    unlockCondition: { type: 'beat_npc', targetId: 'ifrit_guardian' },
  },
  {
    id: 'galbadia',
    name: 'Galbadia',
    rules: ['Same'],
    tradeRule: 'One',
    order: 2,
    description:
      'The militaristic Galbadian continent. The Same rule makes positioning crucial — one wrong move and your cards get chain-captured.',
    mapBounds: '30,37 52,37 52,59 28,59 30,37',
    unlockCondition: {
      type: 'unique_wins_in_location',
      targetId: 'dollet_city',
      count: 2,
    },
  },
  {
    id: 'fh',
    name: "Fisherman's Horizon",
    rules: ['Elemental', 'Sudden Death'],
    tradeRule: 'One',
    order: 3,
    description:
      'A pacifist settlement on the transcontinental bridge. Sudden Death means draws never end — you keep playing until someone wins.',
    mapBounds: '49,46 57,46 57,54 49,54 49,46',
    unlockCondition: {
      type: 'unique_wins_in_location',
      targetId: 'winhill',
      count: 1,
    },
  },
  {
    id: 'trabia',
    name: 'Trabia',
    rules: ['Random', 'Plus'],
    tradeRule: 'One',
    order: 4,
    description:
      'The frozen northern continent. The Plus rule rewards mathematical thinking, but Random hands make it a gamble.',
    mapBounds: '44,14 72,14 74,36 46,36 44,14',
    unlockCondition: {
      type: 'unique_wins_in_location',
      targetId: 'fishermans_horizon',
      count: 2,
    },
  },
  {
    id: 'centra',
    name: 'Centra',
    rules: ['Same', 'Plus', 'Random'],
    tradeRule: 'One',
    order: 5,
    description:
      'The ruined southern continent, devastated by the Lunar Cry. The toughest rule combination — Same + Plus + Random together make every match brutal.',
    mapBounds: '30,67 60,67 62,88 32,88 30,67',
    unlockCondition: { type: 'beat_npc', targetId: 'shumi_elder' },
  },
  {
    id: 'esthar',
    name: 'Esthar',
    rules: ['Elemental', 'Same Wall'],
    tradeRule: 'One',
    order: 6,
    description:
      'The technologically advanced Esthar continent and the Lunar Gate. Same Wall makes board edges dangerous — every edge acts like a rank-10 card for the Same rule.',
    mapBounds: '60,30 90,30 92,65 62,65 60,30',
    unlockCondition: { type: 'beat_npc', targetId: 'centra_guardian' },
  },
]

// ─── Locations ──────────────────────────────────────────────────────────────

export const LOCATIONS: Location[] = [
  // ── Region 0: Balamb ──
  {
    id: 'balamb_town',
    name: 'Balamb Town',
    regionId: 'balamb',
    type: 'town',
    order: 0,
    mapX: 35,
    mapY: 75,
    unlockCondition: null,
  },
  {
    id: 'balamb_garden',
    name: 'Balamb Garden',
    regionId: 'balamb',
    type: 'town',
    order: 1,
    mapX: 55,
    mapY: 35,
    unlockCondition: {
      type: 'unique_wins_in_location',
      targetId: 'balamb_town',
      count: 1,
    },
  },
  {
    id: 'fire_cavern',
    name: 'Fire Cavern',
    regionId: 'balamb',
    type: 'dungeon',
    order: 2,
    mapX: 70,
    mapY: 55,
    unlockCondition: {
      type: 'unique_wins_in_location',
      targetId: 'balamb_garden',
      count: 2,
    },
    flavour:
      'A volcanic cave where fire spirits dwell. The heat rises as you descend...',
  },

  // ── Region 1: Dollet ──
  {
    id: 'dollet_city',
    name: 'Dollet City',
    regionId: 'dollet',
    type: 'town',
    order: 0,
    mapX: 50,
    mapY: 50,
    unlockCondition: null,
  },

  // ── Region 2: Galbadia ──
  {
    id: 'timber',
    name: 'Timber',
    regionId: 'galbadia',
    type: 'town',
    order: 0,
    mapX: 35,
    mapY: 40,
    unlockCondition: null,
  },
  {
    id: 'galbadia_garden',
    name: 'Galbadia Garden',
    regionId: 'galbadia',
    type: 'town',
    order: 1,
    mapX: 45,
    mapY: 55,
    unlockCondition: {
      type: 'unique_wins_in_location',
      targetId: 'timber',
      count: 2,
    },
  },
  {
    id: 'deling_city',
    name: 'Deling City',
    regionId: 'galbadia',
    type: 'town',
    order: 2,
    mapX: 25,
    mapY: 50,
    unlockCondition: {
      type: 'unique_wins_in_location',
      targetId: 'galbadia_garden',
      count: 1,
    },
  },
  {
    id: 'd_district_prison',
    name: 'D-District Prison',
    regionId: 'galbadia',
    type: 'dungeon',
    order: 3,
    mapX: 60,
    mapY: 45,
    unlockCondition: {
      type: 'unique_wins_in_location',
      targetId: 'deling_city',
      count: 1,
    },
    flavour:
      'A towering desert prison. Fight your way through the guards to escape...',
  },
  {
    id: 'winhill',
    name: 'Winhill',
    regionId: 'galbadia',
    type: 'town',
    order: 4,
    mapX: 15,
    mapY: 65,
    unlockCondition: {
      type: 'unique_wins_in_location',
      targetId: 'd_district_prison',
      count: 1,
    },
  },

  // ── Region 3: Fisherman's Horizon ──
  {
    id: 'fishermans_horizon',
    name: "Fisherman's Horizon",
    regionId: 'fh',
    type: 'town',
    order: 0,
    mapX: 50,
    mapY: 50,
    unlockCondition: null,
  },

  // ── Region 4: Trabia ──
  {
    id: 'trabia_garden',
    name: 'Trabia Garden',
    regionId: 'trabia',
    type: 'town',
    order: 0,
    mapX: 40,
    mapY: 60,
    unlockCondition: null,
  },
  {
    id: 'shumi_village',
    name: 'Shumi Village',
    regionId: 'trabia',
    type: 'town',
    order: 1,
    mapX: 70,
    mapY: 30,
    unlockCondition: {
      type: 'unique_wins_in_location',
      targetId: 'trabia_garden',
      count: 2,
    },
  },

  // ── Region 5: Centra ──
  {
    id: 'edeas_house',
    name: "Edea's House",
    regionId: 'centra',
    type: 'town',
    order: 0,
    mapX: 50,
    mapY: 85,
    unlockCondition: null,
  },
  {
    id: 'centra_ruins',
    name: 'Centra Ruins',
    regionId: 'centra',
    type: 'dungeon',
    order: 1,
    mapX: 40,
    mapY: 50,
    unlockCondition: {
      type: 'unique_wins_in_location',
      targetId: 'edeas_house',
      count: 2,
    },
    flavour:
      'Ancient ruins of a lost civilisation. Strange energies pulse through crumbling corridors...',
  },

  // ── Region 6: Esthar ──
  {
    id: 'esthar_city',
    name: 'Esthar City',
    regionId: 'esthar',
    type: 'town',
    order: 0,
    mapX: 30,
    mapY: 50,
    unlockCondition: null,
  },
  {
    id: 'lunar_gate',
    name: 'Lunar Gate',
    regionId: 'esthar',
    type: 'dungeon',
    order: 1,
    mapX: 70,
    mapY: 35,
    unlockCondition: {
      type: 'unique_wins_in_location',
      targetId: 'esthar_city',
      count: 2,
    },
    flavour:
      'The launch facility to space. Security clearance required — in the form of card battles.',
  },
  {
    id: 'deep_sea_research_center',
    name: 'Deep Sea Research Center',
    regionId: 'esthar',
    type: 'dungeon',
    order: 2,
    mapX: 15,
    mapY: 70,
    unlockCondition: {
      type: 'clear_dungeon',
      targetId: 'lunar_gate',
      // Also requires 5 completed quests — enforced via quest_count in worldState
    },
    flavour:
      'The deepest facility in the world. Four levels of increasingly dangerous opponents guard the ultimate prize...',
  },
]

// ─── NPCs ───────────────────────────────────────────────────────────────────

export const NPCS: NPC[] = [
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
    gilReward: 50,
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
    gilReward: 50,
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
      { cardId: 'cockatrice', buyPrice: 80 },
      { cardId: 'grat', buyPrice: 120 },
      { cardId: 'buel', buyPrice: 120 },
    ],
  },
  {
    id: 'zell',
    name: 'Zell',
    locationId: 'balamb_town',
    type: 'dialogue',
    dialogue: {
      text: "Yo! Triple Triad is the best game ever! You should check out the Garden — lots of players there.",
    },
    questId: 'zells_request',
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
    gilReward: 75,
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
    gilReward: 100,
  },
  {
    id: 'quistis',
    name: 'Quistis',
    locationId: 'balamb_garden',
    type: 'dialogue',
    dialogue: {
      text: "Triple Triad teaches you to think strategically. That's a SeeD quality.",
    },
    questId: 'quistis_test',
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
      { cardId: 'mesmerize', buyPrice: 150 },
      { cardId: 'glacial_eye', buyPrice: 180 },
      { cardId: 'belhelmel', buyPrice: 180 },
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
    tournamentEntryFee: 100,
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
    gilReward: 30,
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
    gilReward: 50,
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
    gilReward: 125,
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
    locationId: 'dollet_city',
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
    gilReward: 125,
  },
  {
    id: 'dollet_soldier',
    name: 'Dollet Soldier',
    locationId: 'dollet_city',
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
    gilReward: 125,
  },
  {
    id: 'dollet_pub_owner',
    name: 'Dollet Pub Owner',
    locationId: 'dollet_city',
    type: 'shop',
    dialogue: {
      text: 'Finest cards from across the sea.',
    },
    shopItems: [
      { cardId: 'thrustaevis', buyPrice: 200 },
      { cardId: 'anacondaur', buyPrice: 200 },
      { cardId: 'creeps', buyPrice: 220 },
      { cardId: 'grendel', buyPrice: 220 },
    ],
  },
  {
    id: 'queen_of_cards',
    name: 'Queen of Cards',
    locationId: 'dollet_city',
    type: 'dialogue',
    dialogue: {
      text: "I travel the world playing Triple Triad. Perhaps we'll meet again in your travels.",
    },
    questId: 'queens_favour',
  },
  {
    id: 'dollet_tournament',
    name: 'Dollet Tournament',
    locationId: 'dollet_city',
    type: 'tournament',
    dialogue: {
      text: 'The Dollet Tournament draws players from across the dukedom. Step up and test your mettle!',
    },
    tournamentEntryFee: 150,
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
    gilReward: 100,
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
    gilReward: 100,
  },
  {
    id: 'resistance_member',
    name: 'Resistance Member',
    locationId: 'timber',
    type: 'dialogue',
    dialogue: {
      text: "We fight for Timber's independence. A card game would lighten the mood.",
    },
    questId: 'resistance_supplies',
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
      { cardId: 'forbidden', buyPrice: 300 },
      { cardId: 'armadodo', buyPrice: 300 },
      { cardId: 'jelleye', buyPrice: 250 },
      { cardId: 'grand_mantis', buyPrice: 250 },
    ],
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
    gilReward: 150,
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
    gilReward: 150,
  },
  {
    id: 'irvine',
    name: 'Irvine',
    locationId: 'galbadia_garden',
    type: 'dialogue',
    dialogue: {
      text: "Hey there! I'm quite the card player myself. Beat the instructor here and I might have something for you.",
    },
    questId: 'irvines_challenge',
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
    gilReward: 175,
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
    gilReward: 175,
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
      { cardId: 'tri_face', buyPrice: 350 },
      { cardId: 'fastitocalon', buyPrice: 350 },
      { cardId: 'snow_lion', buyPrice: 350 },
      { cardId: 'ochu', buyPrice: 350 },
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
    tournamentEntryFee: 200,
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
    gilReward: 50,
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
    gilReward: 75,
    floorOrder: 1,
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
    gilReward: 200,
    floorOrder: 2,
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
    gilReward: 175,
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
    gilReward: 175,
  },
  {
    id: 'laguna',
    name: 'Laguna',
    locationId: 'winhill',
    type: 'dialogue',
    dialogue: {
      text: "Winhill... brings back memories. Beat the flower girl here and I'll share something special with you.",
    },
    questId: 'lagunas_memento',
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
    gilReward: 150,
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
    gilReward: 150,
  },
  {
    id: 'fh_fisherman',
    name: 'FH Fisherman',
    locationId: 'fishermans_horizon',
    type: 'dialogue',
    dialogue: {
      text: 'I once caught a card in my net. No, really!',
    },
    questId: 'fishers_catch',
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
      { cardId: 'sam08g', buyPrice: 400 },
      { cardId: 'death_claw', buyPrice: 400 },
      { cardId: 'cactuar', buyPrice: 450 },
      { cardId: 'tonberry', buyPrice: 450 },
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
    tournamentEntryFee: 200,
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
    id: 'mayor_dobe',
    name: 'Mayor Dobe',
    locationId: 'fishermans_horizon',
    type: 'dialogue',
    dialogue: {
      text: "Triple Triad? I suppose it's a peaceful pursuit...",
    },
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
    gilReward: 175,
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
    gilReward: 175,
  },
  {
    id: 'selphie',
    name: 'Selphie',
    locationId: 'trabia_garden',
    type: 'dialogue',
    dialogue: {
      text: "Booyaka! Let's play cards! It'll cheer everyone up! Beat the scout here and I'll give you something special!",
    },
    questId: 'selphies_morale_boost',
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
    gilReward: 250,
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
      { cardId: 'bomb', buyPrice: 500 },
      { cardId: 'blitz', buyPrice: 500 },
      { cardId: 'wendigo', buyPrice: 500 },
      { cardId: 'torama', buyPrice: 550 },
      { cardId: 'imp', buyPrice: 600 },
    ],
  },
  {
    id: 'shumi_sculptor',
    name: 'Shumi Sculptor',
    locationId: 'shumi_village',
    type: 'dialogue',
    dialogue: {
      text: 'I carve statues... but I also know card secrets.',
    },
    questId: 'sculptors_muse',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // REGION 5: CENTRA
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Edea's House ─────────────────────────────────────────────────────────
  {
    id: 'white_seed',
    name: 'White SeeD',
    locationId: 'edeas_house',
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
    gilReward: 225,
  },
  {
    id: 'white_seed_captain',
    name: 'White SeeD Captain',
    locationId: 'edeas_house',
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
    gilReward: 250,
  },
  {
    id: 'edea',
    name: 'Edea',
    locationId: 'edeas_house',
    type: 'dialogue',
    dialogue: {
      text: 'Children... this is where your journey began. And where it continues.',
    },
    questId: 'matrons_request',
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
      { cardId: 'blue_dragon', buyPrice: 650 },
      { cardId: 'adamantoise', buyPrice: 650 },
      { cardId: 'hexadragon', buyPrice: 700 },
      { cardId: 'iron_giant', buyPrice: 800 },
    ],
  },
  {
    id: 'tonberry_king_npc',
    name: 'Tonberry King',
    locationId: 'edeas_house',
    type: 'dialogue',
    dialogue: {
      text: '...',
    },
    questId: 'tonberrys_treasure',
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
    gilReward: 75,
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
    gilReward: 100,
    floorOrder: 1,
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
    gilReward: 275,
    floorOrder: 2,
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
    gilReward: 300,
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
    gilReward: 300,
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
      { cardId: 'behemoth', buyPrice: 900 },
      { cardId: 'malboro', buyPrice: 900 },
      { cardId: 'ruby_dragon', buyPrice: 950 },
      { cardId: 'elnoyle', buyPrice: 1000 },
      { cardId: 'iron_giant', buyPrice: 850 },
    ],
  },
  {
    id: 'rinoa',
    name: 'Rinoa',
    locationId: 'esthar_city',
    type: 'dialogue',
    dialogue: {
      text: "Squall never wants to play cards with me... Will you? Beat the soldier here and I'll give you something special.",
    },
    questId: 'rinoas_wish',
  },
  {
    id: 'space_engineer',
    name: 'Space Engineer',
    locationId: 'esthar_city',
    type: 'dialogue',
    dialogue: {
      text: "The view from up here changes your perspective on everything... even card games. Clear Lunar Gate and I'll have something for you.",
    },
    questId: 'final_frontier',
  },
  {
    id: 'esthar_tournament',
    name: 'Esthar Tournament',
    locationId: 'esthar_city',
    type: 'tournament',
    dialogue: {
      text: 'The prestigious Esthar City Tournament. Only the elite may enter.',
    },
    tournamentEntryFee: 300,
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
    locationId: 'lunar_gate',
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
    gilReward: 100,
    floorOrder: 0,
    isBoss: false,
  },
  {
    id: 'lunar_soldier',
    name: 'Lunar Soldier',
    locationId: 'lunar_gate',
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
    gilReward: 150,
    floorOrder: 1,
    isBoss: false,
  },
  {
    id: 'lunar_officer',
    name: 'Lunar Officer',
    locationId: 'lunar_gate',
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
    gilReward: 400,
    floorOrder: 2,
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
    gilReward: 100,
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
    gilReward: 150,
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
    gilReward: 200,
    floorOrder: 2,
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
    gilReward: 500,
    floorOrder: 3,
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
]

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
  return getLocations().filter((l) => l.regionId === regionId).sort(
    (a, b) => a.order - b.order
  )
}

/** Get TD (Town-Dungeon) locations whose parent is a given town. */
export function getLocationsByParentTown(townId: string): Location[] {
  return getLocations().filter((l) => l.parentTownId === townId)
}

/** Get NPCs visible at the current story chapter. Filters by minChapter/maxChapter. */
export function getVisibleNpcs(locationId: string, storyChapter: number): NPC[] {
  return NPCS.filter((n) => {
    if (n.locationId !== locationId) return false
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
