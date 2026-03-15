/**
 * Maps game screens/states to music track IDs.
 * Track files live at /music/{trackId}.mp3
 */

// Battle track selection based on story chapter progression
export function getBattleTrack(storyChapter: number, isBoss: boolean): string {
  if (isBoss) {
    if (storyChapter >= 10) return 'boss_tier3'
    if (storyChapter >= 5) return 'boss_tier2'
    return 'boss_tier1'
  }
  if (storyChapter >= 10) return 'battle_late'
  if (storyChapter >= 5) return 'battle_mid'
  return 'battle_early'
}

// Location-based tracks: town and dungeon themes
const LOCATION_TRACKS: Record<string, string> = {
  // Towns
  balamb_garden: 'town_balamb_garden',
  balamb_town: 'town_balamb_town',
  dollet: 'town_dollet',
  timber: 'town_timber',
  galbadia_garden: 'town_galbadia_garden',
  deling_city: 'town_deling_city',
  winhill: 'town_winhill',
  fishermans_horizon: 'town_fishermans_horizon',
  trabia_garden: 'town_trabia_garden',
  edeas_house: 'town_edeas_house',
  white_seed_ship: 'town_white_seed_ship',
  esthar_city: 'town_esthar_city',
  sorceress_memorial: 'town_sorceress_memorial',
  shumi_village: 'town_shumi_village',
  // Dungeons
  fire_cavern: 'dungeon_fire_cavern',
  radio_tower: 'dungeon_radio_tower',
  tomb_of_unknown_king: 'dungeon_tomb_of_unknown_king',
  deling_sewers: 'dungeon_deling_sewers',
  d_district_prison: 'dungeon_d_district_prison',
  galbadia_missile_base: 'dungeon_galbadia_missile_base',
  balamb_garden_basement: 'dungeon_balamb_garden_basement',
  balamb_under_siege: 'dungeon_balamb_under_siege',
  roaming_forest: 'dungeon_roaming_forest',
  galbadia_garden_revolution: 'dungeon_galbadia_garden_revolution',
  great_salt_lake: 'dungeon_great_salt_lake',
  lunar_base: 'dungeon_lunar_base',
  deep_sea_research_center: 'dungeon_deep_sea_research_center',
  lunatic_pandora: 'dungeon_lunatic_pandora',
  centra_excavation_site: 'dungeon_centra_excavation_site',
  centra_ruins: 'dungeon_centra_ruins',
}

export function getLocationTrack(locationId: string): string | null {
  return LOCATION_TRACKS[locationId] ?? null
}

// Cutscene tracks
const CUTSCENE_TRACKS: Record<string, string> = {
  opening: 'cutscene_opening',
  fire_cavern: 'cutscene_fire_cavern',
  seed_ball: 'cutscene_seed_ball',
  laguna_dream: 'cutscene_laguna_dream',
  sorceress_parade: 'cutscene_sorceress_parade',
  prison_escape: 'cutscene_prison_escape',
  missile_base: 'cutscene_missile_base',
  garden_flight: 'cutscene_garden_flight',
  fh_arrival: 'cutscene_fh_arrival',
  balamb_liberation: 'cutscene_balamb_liberation',
  trabia_truth: 'cutscene_trabia_truth',
  garden_battle: 'cutscene_garden_battle',
  orphanage: 'cutscene_orphanage',
  esthar_arrival: 'cutscene_esthar_arrival',
  space_rescue: 'cutscene_space_rescue',
  deep_sea: 'cutscene_deep_sea',
  fujin_plea: 'cutscene_fujin_plea',
  time_compression: 'cutscene_time_compression',
  ending: 'cutscene_ending',
}

export function getCutsceneTrack(cutsceneId: string): string | null {
  return CUTSCENE_TRACKS[cutsceneId] ?? null
}

// UI screen tracks
export const TRACK_TITLE = 'title'
export const TRACK_WORLD_MAP = 'world_map'
export const TRACK_SHOP = 'shop'
export const TRACK_VICTORY = 'victory'
export const TRACK_DEFEAT = 'defeat'
