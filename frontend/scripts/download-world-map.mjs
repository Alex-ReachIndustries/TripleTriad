/**
 * Download FFVIII world map image from Fandom wiki into frontend/public/map/.
 * Source: https://finalfantasy.fandom.com/wiki/Final_Fantasy_VIII_world
 * Run from repo root: node frontend/scripts/download-world-map.mjs
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.join(__dirname, '../public/map')
const MAP_URL = 'https://static.wikia.nocookie.net/finalfantasy/images/0/08/FFVIIImap.jpg/revision/latest?cb=20080206113651'

async function main() {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true })
  }
  const outPath = path.join(OUT_DIR, 'world.jpg')
  const res = await fetch(MAP_URL)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  fs.writeFileSync(outPath, buf)
  console.log('Saved', outPath)
}

main().catch((e) => { console.error(e); process.exit(1) })
