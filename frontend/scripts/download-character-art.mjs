/**
 * Download FFVIII character and NPC portrait images from Fandom wiki.
 * Saves to frontend/public/characters/ and frontend/public/npcs/.
 * Run from repo root: node frontend/scripts/download-character-art.mjs
 *
 * Character ids match frontend/src/data/characters.ts.
 * NPC filenames match opponentImagePath in frontend/src/data/world.ts (e.g. balamb_student.png).
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CHAR_DIR = path.join(__dirname, '../public/characters')
const NPC_DIR = path.join(__dirname, '../public/npcs')

/** Character id -> Fandom wiki image URL (portrait/menu style when available). */
const CHARACTER_URLS = [
  { id: 'zell', url: 'https://static.wikia.nocookie.net/finalfantasy/images/4/4b/Zellmenu.PNG/revision/latest?cb=20080125172620' },
  { id: 'squall', url: 'https://static.wikia.nocookie.net/finalfantasy/images/2/2e/Squallmenu.PNG/revision/latest?cb=20080125172456' },
  { id: 'rinoa', url: 'https://static.wikia.nocookie.net/finalfantasy/images/5/5d/Rinoamenu.PNG/revision/latest?cb=20080125172525' },
  { id: 'quistis', url: 'https://static.wikia.nocookie.net/finalfantasy/images/0/0a/Quistismenu.PNG/revision/latest?cb=20080125172500' },
  { id: 'selphie', url: 'https://static.wikia.nocookie.net/finalfantasy/images/3/3d/Selphiemenu.PNG/revision/latest?cb=20080125172513' },
  { id: 'irvine', url: 'https://static.wikia.nocookie.net/finalfantasy/images/8/8f/Irvinemenu.PNG/revision/latest?cb=20080125172444' },
  { id: 'laguna', url: 'https://static.wikia.nocookie.net/finalfantasy/images/1/1b/Lagunamenu.PNG/revision/latest?cb=20080125172450' },
  { id: 'cid', url: 'https://static.wikia.nocookie.net/finalfantasy/images/6/6e/Cid_Kramer_FFVIII.png/revision/latest?cb=20180721181132' },
]

async function download(url, outPath) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  fs.writeFileSync(outPath, buf)
  console.log('Saved', outPath)
}

async function main() {
  ;[CHAR_DIR, NPC_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  })

  for (const { id, url } of CHARACTER_URLS) {
    const outPath = path.join(CHAR_DIR, `${id}.png`)
    try {
      await download(url, outPath)
    } catch (e) {
      console.warn('Skip', id, e.message)
    }
  }

  console.log('Character art done. Add NPC images manually to public/npcs/ (e.g. balamb_student.png) or extend this script.')
}

main().catch((e) => { console.error(e); process.exit(1) })
