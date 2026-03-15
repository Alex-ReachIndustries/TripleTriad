/**
 * Player profile: persistence, defaults, unlock checks, tagline word lists.
 */

import type {
  PlayerProfile,
  BorderDef, BackgroundDef, CharIconDef,
  ProfileUnlockCondition,
} from '../types/multiplayer'
import type { WorldPlayerState } from './worldState'

// ─── Storage ───

const PROFILE_KEY = 'tripletriad-profile'

export function loadProfile(): PlayerProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PlayerProfile
  } catch { return null }
}

export function saveProfile(profile: PlayerProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
}

export function createDefaultProfile(): PlayerProfile {
  return {
    id: crypto.randomUUID(),
    name: 'Player',
    taglinePart1: 0,
    taglinePart2: 0,
    borderId: 'default_solid',
    backgroundId: 'default_slate',
    charIconId: 'human_01',
    stats: { wins: 0, losses: 0, draws: 0 },
    matchHistory: [],
  }
}

export function getOrCreateProfile(): PlayerProfile {
  const existing = loadProfile()
  if (existing) return existing
  const profile = createDefaultProfile()
  saveProfile(profile)
  return profile
}

export function recordMatch(
  profile: PlayerProfile,
  opponentName: string,
  result: 'win' | 'loss' | 'draw',
): PlayerProfile {
  const updated: PlayerProfile = {
    ...profile,
    stats: {
      wins: profile.stats.wins + (result === 'win' ? 1 : 0),
      losses: profile.stats.losses + (result === 'loss' ? 1 : 0),
      draws: profile.stats.draws + (result === 'draw' ? 1 : 0),
    },
    matchHistory: [
      { opponentName, result, date: new Date().toISOString() },
      ...profile.matchHistory,
    ].slice(0, 20),
  }
  saveProfile(updated)
  return updated
}

// ─── Unlock Checks ───

export function isProfileUnlockMet(
  condition: ProfileUnlockCondition | null,
  worldState: WorldPlayerState,
): boolean {
  if (!condition) return true
  switch (condition.type) {
    case 'chapter':
      return worldState.storyChapter >= condition.chapter
    case 'quest':
      return worldState.completedQuests.includes(condition.questId)
    case 'wins': {
      const totalWins = Object.values(worldState.npcWins).reduce((a, b) => a + b, 0)
      return totalWins >= condition.count
    }
    case 'dungeons_cleared':
      return worldState.clearedDungeons.length >= condition.count
    case 'location_visited': {
      // A location is visited if any NPC content has been seen there
      const seen = worldState.seenContent[condition.locationId]
      return !!seen && seen.length > 0
    }
    case 'npc_beaten':
      return (worldState.npcWins[condition.npcId] ?? 0) > 0
  }
}

export function getUnlockHint(condition: ProfileUnlockCondition | null): string {
  if (!condition) return ''
  switch (condition.type) {
    case 'chapter': return `Reach Chapter ${condition.chapter}`
    case 'quest': return 'Complete a specific quest'
    case 'wins': return `Win ${condition.count} total duels`
    case 'dungeons_cleared': return `Clear ${condition.count} dungeons`
    case 'location_visited': return 'Visit this location'
    case 'npc_beaten': return 'Defeat this NPC'
  }
}

// ─── Tagline Word Lists (100 × 2-word phrases each) ───

export const TAGLINE_PART1: string[] = [
  'Mighty Dragon', 'Silent Knight', 'Crimson Flame', 'Iron Fist', 'Shadow Walker',
  'Golden Eagle', 'Frost Giant', 'Thunder Lord', 'Crystal Sage', 'Dark Phoenix',
  'Brave Heart', 'Wild Card', 'Steel Nerves', 'Silver Tongue', 'Rogue Scholar',
  'Noble Fool', 'Gentle Storm', 'Blazing Comet', 'Lunar Wolf', 'Cosmic Jester',
  'Rusty Blade', 'Fancy Pants', 'Sleepy Dragon', 'Clumsy Knight', 'Angry Potato',
  'Grumpy Moogle', 'Dancing Cactuar', 'Sneaky Tonberry', 'Confused Chocobo', 'Lazy Behemoth',
  'Supreme Leader', 'Card Shark', 'Lucky Novice', 'Eternal Rival', 'Doom Bringer',
  'Star Gazer', 'Wind Chaser', 'Flame Dancer', 'Ice Breaker', 'Earth Shaker',
  'Soul Reaper', 'Light Bender', 'Void Walker', 'Dream Weaver', 'Fate Spinner',
  'Time Keeper', 'Storm Caller', 'Beast Tamer', 'Rune Master', 'Spell Slinker',
  'Cunning Fox', 'Soaring Hawk', 'Prowling Tiger', 'Laughing Hyena', 'Stubborn Mule',
  'Prancing Pony', 'Howling Wolf', 'Snarling Bear', 'Swimming Duck', 'Flying Penguin',
  'Ancient One', 'Young Blood', 'Old Rival', 'New Recruit', 'Last Stand',
  'First Strike', 'Double Down', 'Final Form', 'Opening Move', 'Closing Act',
  'Balamb Fish', 'Garden Cadet', 'SeeD Elite', 'Sorceress Pal', 'Moombas Best',
  'Choco Rider', 'Card Queen', 'Triple Threat', 'Plus Ultra', 'Same Difference',
  'Combo Breaker', 'Wall Builder', 'Random Factor', 'Open Book', 'Sudden Victor',
  'Friendly Ghost', 'Chatty Parrot', 'Dizzy Bat', 'Wobbly Jelly', 'Bouncy Bomb',
  'Turbo Nerd', 'Mega Dork', 'Ultra Geek', 'Super Noob', 'Hyper Chad',
  'Pixel Wizard', 'Retro Gamer', 'Button Masher', 'Save Scummer', 'Boss Rusher',
]

export const TAGLINE_PART2: string[] = [
  'Gentle Soul', 'Iron Will', 'Dark Secret', 'Pure Heart', 'Sharp Mind',
  'Quick Hands', 'Keen Eyes', 'Loud Mouth', 'Soft Touch', 'Cold Stare',
  'Hot Temper', 'Cool Head', 'Thick Skin', 'Thin Ice', 'Deep Thought',
  'High Hopes', 'Low Standards', 'Big Dreams', 'Small Talk', 'Fast Learner',
  'Slow Burner', 'Hard Worker', 'Easy Target', 'Free Spirit', 'Lost Cause',
  'Found Object', 'Broken Record', 'Golden Touch', 'Silver Lining', 'Bronze Medal',
  'Card Master', 'Flip Expert', 'Rule Breaker', 'Deck Builder', 'Hand Reader',
  'Board Clearer', 'Edge Lord', 'Corner King', 'Center Star', 'Side Hustler',
  'True Believer', 'Fake News', 'Real Deal', 'Raw Talent', 'Zero Chill',
  'Full Send', 'No Mercy', 'All Heart', 'Half Asleep', 'Barely Awake',
  'Somewhat Okay', 'Totally Lost', 'Slightly Damp', 'Mostly Harmless', 'Highly Suspect',
  'Mildly Spicy', 'Overly Dramatic', 'Oddly Specific', 'Vaguely Threatening', 'Strangely Calm',
  'Victory Lap', 'Defeat Dance', 'Draw Specialist', 'Comeback Kid', 'Underdog Story',
  'Plot Armour', 'Main Character', 'Side Quest', 'Hidden Boss', 'Secret Ending',
  'Critical Hit', 'Lucky Roll', 'Failed Save', 'Botched Plan', 'Perfect Game',
  'Power Napper', 'Snack Break', 'Bathroom Run', 'Phone Check', 'Tab Closer',
  'Mog Hugger', 'GF Collector', 'Card Hoarder', 'Gil Pincher', 'Item Saver',
  'Magic Drawer', 'Junction Pro', 'Limit Breaker', 'Scan Spammer', 'Draw Pointer',
  'Night Owl', 'Early Bird', 'Couch Potato', 'Gym Skipper', 'Coffee Addict',
  'Tea Sipper', 'Snack Fiend', 'Nap Champion', 'Yawn Machine', 'Blink Master',
]

export function getTaglineText(part1: number, part2: number): string {
  const p1 = TAGLINE_PART1[part1] ?? TAGLINE_PART1[0]
  const p2 = TAGLINE_PART2[part2] ?? TAGLINE_PART2[0]
  return `${p1} | ${p2}`
}

// ─── Default Borders (10) ───

export const DEFAULT_BORDERS: BorderDef[] = [
  { id: 'default_solid', name: 'Solid', css: '3px solid #8b8682', unlockCondition: null },
  { id: 'default_dark', name: 'Dark Steel', css: '3px solid #3a3a3a', unlockCondition: null },
  { id: 'default_gold', name: 'Gold Trim', css: '3px solid #c9a84c', unlockCondition: null },
  { id: 'default_silver', name: 'Silver Edge', css: '3px solid #a8b0b8', unlockCondition: null },
  { id: 'default_blue', name: 'Ocean Blue', css: '3px solid #3a6ea5', unlockCondition: null },
  { id: 'default_red', name: 'Crimson', css: '3px solid #8b2500', unlockCondition: null },
  { id: 'default_green', name: 'Forest', css: '3px solid #2e5a3a', unlockCondition: null },
  { id: 'default_purple', name: 'Royal Purple', css: '3px solid #5c3a7e', unlockCondition: null },
  { id: 'default_double', name: 'Double Line', css: '4px double #8b8682', unlockCondition: null },
  { id: 'default_ridge', name: 'Embossed', css: '4px ridge #6a6460', unlockCondition: null },
]

// ─── Unlockable Borders (from progression) ───

export const UNLOCK_BORDERS: BorderDef[] = [
  { id: 'unlock_crystal', name: 'Crystal', css: '3px solid #7fdbff', unlockCondition: { type: 'chapter', chapter: 3 } },
  { id: 'unlock_fire', name: 'Inferno', css: '3px solid #ff4136', unlockCondition: { type: 'chapter', chapter: 5 } },
  { id: 'unlock_ice', name: 'Glacial', css: '3px solid #b0e0e6', unlockCondition: { type: 'chapter', chapter: 7 } },
  { id: 'unlock_thunder', name: 'Thunder', css: '3px solid #ffdc00', unlockCondition: { type: 'chapter', chapter: 9 } },
  { id: 'unlock_holy', name: 'Holy', css: '4px double #fffacd', unlockCondition: { type: 'chapter', chapter: 12 } },
  { id: 'unlock_void', name: 'Void', css: '4px double #2d1b69', unlockCondition: { type: 'chapter', chapter: 15 } },
  { id: 'unlock_champion', name: 'Champion', css: '4px ridge #ffd700', unlockCondition: { type: 'wins', count: 50 } },
  { id: 'unlock_legend', name: 'Legendary', css: '4px ridge #ff6347', unlockCondition: { type: 'wins', count: 100 } },
  { id: 'unlock_dungeon', name: 'Dungeon Master', css: '4px groove #4a2a0a', unlockCondition: { type: 'dungeons_cleared', count: 5 } },
  { id: 'unlock_conqueror', name: 'Conqueror', css: '4px groove #8b0000', unlockCondition: { type: 'dungeons_cleared', count: 10 } },
]

export const ALL_BORDERS: BorderDef[] = [...DEFAULT_BORDERS, ...UNLOCK_BORDERS]

// ─── Default Backgrounds (10) ───

export const DEFAULT_BACKGROUNDS: BackgroundDef[] = [
  { id: 'default_slate', name: 'Slate', css: 'linear-gradient(135deg, #2c3e50, #3d566e)', unlockCondition: null },
  { id: 'default_charcoal', name: 'Charcoal', css: 'linear-gradient(135deg, #1a1a2e, #16213e)', unlockCondition: null },
  { id: 'default_ocean', name: 'Deep Ocean', css: 'linear-gradient(135deg, #0a3d62, #1e5f8a)', unlockCondition: null },
  { id: 'default_forest', name: 'Deep Forest', css: 'linear-gradient(135deg, #1a3c2a, #2d5a3e)', unlockCondition: null },
  { id: 'default_ember', name: 'Ember', css: 'linear-gradient(135deg, #4a1a0a, #6a2a1a)', unlockCondition: null },
  { id: 'default_plum', name: 'Plum', css: 'linear-gradient(135deg, #2e1a3a, #4a2a5e)', unlockCondition: null },
  { id: 'default_bronze', name: 'Bronze', css: 'linear-gradient(135deg, #3a2a1a, #5a4a3a)', unlockCondition: null },
  { id: 'default_steel', name: 'Steel', css: 'linear-gradient(135deg, #2a2a2e, #4a4a4e)', unlockCondition: null },
  { id: 'default_midnight', name: 'Midnight', css: 'linear-gradient(135deg, #0a0a1e, #1a1a3e)', unlockCondition: null },
  { id: 'default_sand', name: 'Desert Sand', css: 'linear-gradient(135deg, #3a3020, #5a5040)', unlockCondition: null },
]

// ─── Location Backgrounds (unlocked by visiting) ───

export const LOCATION_BACKGROUNDS: BackgroundDef[] = [
  { id: 'loc_balamb_garden', name: 'Balamb Garden', css: 'linear-gradient(135deg, #1a3a5a, #2a5a3a)', locationId: 'balamb_garden', unlockCondition: { type: 'location_visited', locationId: 'balamb_garden' } },
  { id: 'loc_balamb', name: 'Balamb Town', css: 'linear-gradient(135deg, #2a4a6a, #4a6a8a)', locationId: 'balamb_town', unlockCondition: { type: 'location_visited', locationId: 'balamb_town' } },
  { id: 'loc_fire_cavern', name: 'Fire Cavern', css: 'linear-gradient(135deg, #5a1a0a, #8a3a1a)', locationId: 'fire_cavern', unlockCondition: { type: 'location_visited', locationId: 'fire_cavern' } },
  { id: 'loc_dollet', name: 'Dollet', css: 'linear-gradient(135deg, #3a3a5a, #5a5a7a)', locationId: 'dollet', unlockCondition: { type: 'location_visited', locationId: 'dollet' } },
  { id: 'loc_radio_tower', name: 'Radio Tower', css: 'linear-gradient(135deg, #2a2a3a, #4a4a5a)', locationId: 'radio_tower', unlockCondition: { type: 'location_visited', locationId: 'radio_tower' } },
  { id: 'loc_timber', name: 'Timber', css: 'linear-gradient(135deg, #2a3a2a, #4a5a4a)', locationId: 'timber', unlockCondition: { type: 'location_visited', locationId: 'timber' } },
  { id: 'loc_galbadia_garden', name: 'Galbadia Garden', css: 'linear-gradient(135deg, #3a2a1a, #6a4a2a)', locationId: 'galbadia_garden', unlockCondition: { type: 'location_visited', locationId: 'galbadia_garden' } },
  { id: 'loc_deling_city', name: 'Deling City', css: 'linear-gradient(135deg, #1a1a3a, #3a3a5a)', locationId: 'deling_city', unlockCondition: { type: 'location_visited', locationId: 'deling_city' } },
  { id: 'loc_tomb', name: 'Tomb of Unknown King', css: 'linear-gradient(135deg, #1a2a1a, #2a3a2a)', locationId: 'tomb_unknown_king', unlockCondition: { type: 'location_visited', locationId: 'tomb_unknown_king' } },
  { id: 'loc_deling_sewers', name: 'Deling Sewers', css: 'linear-gradient(135deg, #1a2a2a, #2a3a3a)', locationId: 'deling_sewers', unlockCondition: { type: 'location_visited', locationId: 'deling_sewers' } },
  { id: 'loc_winhill', name: 'Winhill', css: 'linear-gradient(135deg, #3a4a2a, #5a6a4a)', locationId: 'winhill', unlockCondition: { type: 'location_visited', locationId: 'winhill' } },
  { id: 'loc_d_district', name: 'D-District Prison', css: 'linear-gradient(135deg, #2a1a1a, #4a2a2a)', locationId: 'd_district_prison', unlockCondition: { type: 'location_visited', locationId: 'd_district_prison' } },
  { id: 'loc_missile_base', name: 'Missile Base', css: 'linear-gradient(135deg, #3a2a2a, #5a3a3a)', locationId: 'galbadia_missile_base', unlockCondition: { type: 'location_visited', locationId: 'galbadia_missile_base' } },
  { id: 'loc_bg_basement', name: 'Garden Basement', css: 'linear-gradient(135deg, #1a1a2a, #2a2a4a)', locationId: 'balamb_garden_basement', unlockCondition: { type: 'location_visited', locationId: 'balamb_garden_basement' } },
  { id: 'loc_balamb_siege', name: 'Balamb Under Siege', css: 'linear-gradient(135deg, #4a2a1a, #6a3a2a)', locationId: 'balamb_under_siege', unlockCondition: { type: 'location_visited', locationId: 'balamb_under_siege' } },
  { id: 'loc_roaming_forest', name: 'Roaming Forest', css: 'linear-gradient(135deg, #0a2a0a, #1a4a1a)', locationId: 'roaming_forest', unlockCondition: { type: 'location_visited', locationId: 'roaming_forest' } },
  { id: 'loc_trabia_garden', name: 'Trabia Garden', css: 'linear-gradient(135deg, #3a4a5a, #5a6a7a)', locationId: 'trabia_garden', unlockCondition: { type: 'location_visited', locationId: 'trabia_garden' } },
  { id: 'loc_galbadia_rev', name: 'Galbadia Revolution', css: 'linear-gradient(135deg, #4a1a1a, #6a2a2a)', locationId: 'galbadia_garden_revolution', unlockCondition: { type: 'location_visited', locationId: 'galbadia_garden_revolution' } },
  { id: 'loc_white_seed', name: 'White SeeD Ship', css: 'linear-gradient(135deg, #2a3a5a, #4a5a7a)', locationId: 'white_seed_ship', unlockCondition: { type: 'location_visited', locationId: 'white_seed_ship' } },
  { id: 'loc_salt_lake', name: 'Great Salt Lake', css: 'linear-gradient(135deg, #4a4a3a, #6a6a5a)', locationId: 'great_salt_lake', unlockCondition: { type: 'location_visited', locationId: 'great_salt_lake' } },
  { id: 'loc_esthar', name: 'Esthar City', css: 'linear-gradient(135deg, #1a2a4a, #2a4a6a)', locationId: 'esthar_city', unlockCondition: { type: 'location_visited', locationId: 'esthar_city' } },
  { id: 'loc_lunar_base', name: 'Lunar Base', css: 'linear-gradient(135deg, #0a0a1a, #1a1a2a)', locationId: 'lunar_base', unlockCondition: { type: 'location_visited', locationId: 'lunar_base' } },
  { id: 'loc_sorceress_memorial', name: 'Sorceress Memorial', css: 'linear-gradient(135deg, #2a1a3a, #4a2a5a)', locationId: 'sorceress_memorial', unlockCondition: { type: 'location_visited', locationId: 'sorceress_memorial' } },
  { id: 'loc_deep_sea', name: 'Deep Sea Research', css: 'linear-gradient(135deg, #0a1a2a, #1a2a3a)', locationId: 'deep_sea_research_centre', unlockCondition: { type: 'location_visited', locationId: 'deep_sea_research_centre' } },
  { id: 'loc_shumi', name: 'Shumi Village', css: 'linear-gradient(135deg, #2a3a1a, #4a5a2a)', locationId: 'shumi_village', unlockCondition: { type: 'location_visited', locationId: 'shumi_village' } },
  { id: 'loc_lunatic_pandora', name: 'Lunatic Pandora', css: 'linear-gradient(135deg, #1a0a2a, #2a1a3a)', locationId: 'lunatic_pandora', unlockCondition: { type: 'location_visited', locationId: 'lunatic_pandora' } },
  { id: 'loc_centra_excavation', name: 'Centra Excavation', css: 'linear-gradient(135deg, #3a2a1a, #5a4a2a)', locationId: 'centra_excavation_site', unlockCondition: { type: 'location_visited', locationId: 'centra_excavation_site' } },
  { id: 'loc_centra_ruins', name: 'Centra Ruins', css: 'linear-gradient(135deg, #2a2a1a, #4a4a2a)', locationId: 'centra_ruins', unlockCondition: { type: 'location_visited', locationId: 'centra_ruins' } },
]

export const ALL_BACKGROUNDS: BackgroundDef[] = [...DEFAULT_BACKGROUNDS, ...LOCATION_BACKGROUNDS]

// ─── Default Character Icons (20) ───

export const DEFAULT_HUMAN_ICONS: CharIconDef[] = Array.from({ length: 10 }, (_, i) => ({
  id: `human_${String(i + 1).padStart(2, '0')}`,
  name: `Human ${i + 1}`,
  src: `/profiles/human_${String(i + 1).padStart(2, '0')}.png`,
  category: 'human' as const,
  unlockCondition: null,
}))

export const DEFAULT_BEAST_ICONS: CharIconDef[] = Array.from({ length: 10 }, (_, i) => ({
  id: `beast_${String(i + 1).padStart(2, '0')}`,
  name: `Beast ${i + 1}`,
  src: `/profiles/beast_${String(i + 1).padStart(2, '0')}.png`,
  category: 'beast' as const,
  unlockCondition: null,
}))

// NPC icons will be populated dynamically from world data
// They're unlocked by beating the NPC (npcWins[npcId] > 0)
export function getNpcIcons(): CharIconDef[] {
  // Lazy import to avoid circular dependency
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  try {
    // Dynamic import not needed — we'll populate from world.ts NPCS export
    return []  // Populated in getNpcIconsFromWorld()
  } catch { return [] }
}

export const ALL_CHAR_ICONS: CharIconDef[] = [...DEFAULT_HUMAN_ICONS, ...DEFAULT_BEAST_ICONS]

// ─── Helpers ───

export function getBorderById(id: string): BorderDef | undefined {
  return ALL_BORDERS.find(b => b.id === id)
}

export function getBackgroundById(id: string): BackgroundDef | undefined {
  return ALL_BACKGROUNDS.find(b => b.id === id)
}

export function getCharIconById(id: string): CharIconDef | undefined {
  return ALL_CHAR_ICONS.find(c => c.id === id)
}
