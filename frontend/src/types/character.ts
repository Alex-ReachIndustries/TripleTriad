/**
 * Character type for world mode: FFVIII characters at locations with dialogue.
 */

export interface Character {
  id: string
  name: string
  /** Location ids where this character appears. */
  locationIds: string[]
  /** Dialogue line shown when viewing the location. */
  dialogue: string
  /** Optional image path (e.g. /characters/zell.png). If omitted, UI uses /characters/{id}.png. */
  imagePath?: string
}
