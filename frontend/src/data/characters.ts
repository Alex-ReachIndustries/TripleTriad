/**
 * FFVIII characters at world locations with in-character dialogue.
 * Location ids match frontend/src/data/world.ts getLocations().
 */

import type { Character } from '../types/character'

export const CHARACTERS: Character[] = [
  { id: 'zell', name: 'Zell', locationIds: ['balamb_town'], dialogue: "Hey! You here for Triple Triad? I'm always up for a game." },
  { id: 'cid', name: 'Headmaster Cid', locationIds: ['balamb_garden'], dialogue: "Balamb Garden supports the fine tradition of card gaming. Play with care." },
  { id: 'quistis', name: 'Quistis', locationIds: ['balamb_garden'], dialogue: "I'll challenge you if you're ready. Don't expect me to go easy." },
  { id: 'selphie', name: 'Selphie', locationIds: ['timber'], dialogue: "Triple Triad is so much fun! Want to play? I've been practicing!" },
  { id: 'irvine', name: 'Irvine', locationIds: ['dollet'], dialogue: "Cards and a good view. Can't complain. Care for a match?" },
  { id: 'fh_master', name: 'FH Master', locationIds: ['fh'], dialogue: "Fisherman's Horizon runs on skill and a bit of luck. Same as the cards." },
  { id: 'shumi_elder', name: 'Shumi Elder', locationIds: ['shumi_village'], dialogue: "We have played for many years. The cards remember the old ways." },
  { id: 'laguna', name: 'Laguna', locationIds: ['winhill'], dialogue: "Winhill's quiet. Good place to think—and to play a round or two." },
  { id: 'esthar_scientist', name: 'Esthar Scientist', locationIds: ['esthar_city'], dialogue: "Even in Esthar we appreciate the game. Shall we?" },
  { id: 'squall', name: 'Squall', locationIds: ['balamb_garden', 'lunar_gate'], dialogue: "… Whatever. Let's get this over with." },
  { id: 'rinoa', name: 'Rinoa', locationIds: ['balamb_garden', 'timber'], dialogue: "I love Triple Triad! Pick a card and let's see who wins." },
]

export function getCharactersAtLocation(locationId: string): Character[] {
  return CHARACTERS.filter((c) => c.locationIds.includes(locationId))
}
