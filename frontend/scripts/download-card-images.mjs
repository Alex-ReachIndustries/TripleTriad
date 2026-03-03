/**
 * Download 110 Triple Triad card images from Fandom wiki into frontend/public/cards/.
 * URLs from https://finalfantasy.fandom.com/wiki/Final_Fantasy_VIII_Triple_Triad_cards
 * Run from repo root: node frontend/scripts/download-card-images.mjs
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CARDS_JSON = path.join(__dirname, '../src/data/cards.json')
const OUT_DIR = path.join(__dirname, '../public/cards')

const WIKI_IMAGE_URLS = [
  'https://static.wikia.nocookie.net/finalfantasy/images/f/f8/TTGeezard.png/revision/latest?cb=20071014153754',
  'https://static.wikia.nocookie.net/finalfantasy/images/6/66/TTFunguar.png/revision/latest?cb=20071014163106',
  'https://static.wikia.nocookie.net/finalfantasy/images/f/f4/TTBiteBug.png/revision/latest?cb=20071014160822',
  'https://static.wikia.nocookie.net/finalfantasy/images/7/75/TTRedBat.png/revision/latest?cb=20071014164013',
  'https://static.wikia.nocookie.net/finalfantasy/images/e/e2/TTBlobra.png/revision/latest?cb=20071014161018',
  'https://static.wikia.nocookie.net/finalfantasy/images/a/a6/TTGayla.png/revision/latest?cb=20071014163259',
  'https://static.wikia.nocookie.net/finalfantasy/images/0/08/TTGesper.png/revision/latest?cb=20071014163355',
  'https://static.wikia.nocookie.net/finalfantasy/images/2/21/TTFastitocalonF.png/revision/latest?cb=20071014163018',
  'https://static.wikia.nocookie.net/finalfantasy/images/b/be/TTBloudSoul.png/revision/latest?cb=20071014161037',
  'https://static.wikia.nocookie.net/finalfantasy/images/8/8e/TTCaterchipillar.png/revision/latest?cb=20071014162342',
  'https://static.wikia.nocookie.net/finalfantasy/images/2/2d/TTCockatrice.png/revision/latest?cb=20071014162702',
  'https://static.wikia.nocookie.net/finalfantasy/images/1/16/TTGrat.png/revision/latest?cb=20071014163533',
  'https://static.wikia.nocookie.net/finalfantasy/images/4/4d/TTBuel.png/revision/latest?cb=20071014161139',
  'https://static.wikia.nocookie.net/finalfantasy/images/8/8c/TTMesmerize.png/revision/latest?cb=20071014163859',
  'https://static.wikia.nocookie.net/finalfantasy/images/4/4b/TTGlacialEye.png/revision/latest?cb=20071014163424',
  'https://static.wikia.nocookie.net/finalfantasy/images/b/be/TTBelhelmel.png/revision/latest?cb=20071014160212',
  'https://static.wikia.nocookie.net/finalfantasy/images/a/a3/TTThrustaevis.png/revision/latest?cb=20071014164313',
  'https://static.wikia.nocookie.net/finalfantasy/images/2/2f/TTAnacondaur.png/revision/latest?cb=20071014154051',
  'https://static.wikia.nocookie.net/finalfantasy/images/a/a5/TTCreeps.png/revision/latest?cb=20071014162744',
  'https://static.wikia.nocookie.net/finalfantasy/images/9/99/TTGrendel.png/revision/latest?cb=20071014163555',
  'https://static.wikia.nocookie.net/finalfantasy/images/d/df/TTJelleye.png/revision/latest?cb=20071014163723',
  'https://static.wikia.nocookie.net/finalfantasy/images/f/fa/TTGrandMantis.png/revision/latest?cb=20071014163507',
  'https://static.wikia.nocookie.net/finalfantasy/images/c/c2/TTForbidden.png/revision/latest?cb=20071014163052',
  'https://static.wikia.nocookie.net/finalfantasy/images/2/27/TTArmadodo.png/revision/latest?cb=20071014154427',
  'https://static.wikia.nocookie.net/finalfantasy/images/a/ad/TTTriFace.png/revision/latest?cb=20071014164427',
  'https://static.wikia.nocookie.net/finalfantasy/images/e/e4/TTFastitocalon.png/revision/latest?cb=20071014163003',
  'https://static.wikia.nocookie.net/finalfantasy/images/9/92/TTSnowLion.png/revision/latest?cb=20071014164218',
  'https://static.wikia.nocookie.net/finalfantasy/images/4/47/TTOchu.png/revision/latest?cb=20071014163922',
  'https://static.wikia.nocookie.net/finalfantasy/images/0/03/TTSAM08G.png/revision/latest?cb=20071014164150',
  'https://static.wikia.nocookie.net/finalfantasy/images/7/78/TTDeathClaw.png/revision/latest?cb=20071014162822',
  'https://static.wikia.nocookie.net/finalfantasy/images/a/ac/TTCactuar.png/revision/latest?cb=20071014161411',
  'https://static.wikia.nocookie.net/finalfantasy/images/a/a5/TTTonberry.png/revision/latest?cb=20071014164330',
  'https://static.wikia.nocookie.net/finalfantasy/images/b/bc/TTAbyssWorm.png/revision/latest?cb=20071014153428',
  'https://static.wikia.nocookie.net/finalfantasy/images/6/61/TTTurtapod.png/revision/latest?cb=20071014164446',
  'https://static.wikia.nocookie.net/finalfantasy/images/8/80/TTVysage.png/revision/latest?cb=20071014163805',
  'https://static.wikia.nocookie.net/finalfantasy/images/d/d6/TTTRexaur.png/revision/latest?cb=20071014164254',
  'https://static.wikia.nocookie.net/finalfantasy/images/6/66/TTBomb.png/revision/latest?cb=20071014161120',
  'https://static.wikia.nocookie.net/finalfantasy/images/7/77/TTBlitz.png/revision/latest?cb=20071014160953',
  'https://static.wikia.nocookie.net/finalfantasy/images/f/f2/TTWendigo.png/revision/latest?cb=20071014164510',
  'https://static.wikia.nocookie.net/finalfantasy/images/4/41/TTTorama.png/revision/latest?cb=20071014164405',
  'https://static.wikia.nocookie.net/finalfantasy/images/d/d2/TTImp.png/revision/latest?cb=20071014163631',
  'https://static.wikia.nocookie.net/finalfantasy/images/2/25/TTBlueDragon.png/revision/latest?cb=20071014161103',
  'https://static.wikia.nocookie.net/finalfantasy/images/6/61/TTAdamantoise.png/revision/latest?cb=20071014154011',
  'https://static.wikia.nocookie.net/finalfantasy/images/9/91/TTHexadragon.png/revision/latest?cb=20071014163612',
  'https://static.wikia.nocookie.net/finalfantasy/images/8/86/TTIronGiant.png/revision/latest?cb=20071014163656',
  'https://static.wikia.nocookie.net/finalfantasy/images/c/c1/TTBehemoth.png/revision/latest?cb=20071014155216',
  'https://static.wikia.nocookie.net/finalfantasy/images/c/c7/TTChimera.png/revision/latest?cb=20071014161441',
  'https://static.wikia.nocookie.net/finalfantasy/images/6/67/TTPuPu.png/revision/latest?cb=20071014163952',
  'https://static.wikia.nocookie.net/finalfantasy/images/1/16/TTElastoid.png/revision/latest?cb=20071014162857',
  'https://static.wikia.nocookie.net/finalfantasy/images/5/5f/TTGIM47N.png/revision/latest?cb=20071014163223',
  'https://static.wikia.nocookie.net/finalfantasy/images/0/02/TTMalboro.png/revision/latest?cb=20071014163832',
  'https://static.wikia.nocookie.net/finalfantasy/images/d/de/TTRubyDragon.png/revision/latest?cb=20071014164044',
  'https://static.wikia.nocookie.net/finalfantasy/images/4/42/TTElnoyle.png/revision/latest?cb=20071014162925',
  'https://static.wikia.nocookie.net/finalfantasy/images/4/46/TTTonberryKing.png/revision/latest?cb=20071014170250',
  'https://static.wikia.nocookie.net/finalfantasy/images/5/5c/TTBiggsWedge.png/revision/latest?cb=20071014164833',
  'https://static.wikia.nocookie.net/finalfantasy/images/3/38/TTFujinRaijin.png/revision/latest?cb=20071014165135',
  'https://static.wikia.nocookie.net/finalfantasy/images/9/92/TTElvoret.png/revision/latest?cb=20071014165113',
  'https://static.wikia.nocookie.net/finalfantasy/images/6/6c/TTX-ATM092.png/revision/latest?cb=20071014170455',
  'https://static.wikia.nocookie.net/finalfantasy/images/7/78/TTGranaldo.png/revision/latest?cb=20071014165514',
  'https://static.wikia.nocookie.net/finalfantasy/images/3/35/TTGerogero.png/revision/latest?cb=20071014165454',
  'https://static.wikia.nocookie.net/finalfantasy/images/f/f5/TTIguion.png/revision/latest?cb=20071014165559',
  'https://static.wikia.nocookie.net/finalfantasy/images/5/52/TTAbaddon.png/revision/latest?cb=20071014164642',
  'https://static.wikia.nocookie.net/finalfantasy/images/c/c2/TTTrauma.png/revision/latest?cb=20071014170307',
  'https://static.wikia.nocookie.net/finalfantasy/images/1/10/TTOilboyle.png/revision/latest?cb=20071014170019',
  'https://static.wikia.nocookie.net/finalfantasy/images/c/c0/TTNORG.png/revision/latest?cb=20071014165933',
  'https://static.wikia.nocookie.net/finalfantasy/images/5/55/TTKrysta.png/revision/latest?cb=20071014165833',
  'https://static.wikia.nocookie.net/finalfantasy/images/8/8b/TTPropagator.png/revision/latest?cb=20071014170054',
  'https://static.wikia.nocookie.net/finalfantasy/images/e/ef/TTJumboCactuar.png/revision/latest?cb=20071014165805',
  'https://static.wikia.nocookie.net/finalfantasy/images/a/ac/TTTriPoint.png/revision/latest?cb=20071014170326',
  'https://static.wikia.nocookie.net/finalfantasy/images/9/91/TTGargantua.png/revision/latest?cb=20071014165429',
  'https://static.wikia.nocookie.net/finalfantasy/images/4/41/TTMobileType8.png/revision/latest?cb=20071014165915',
  'https://static.wikia.nocookie.net/finalfantasy/images/f/f3/TTSphinxaur.png/revision/latest?cb=20071014170213',
  'https://static.wikia.nocookie.net/finalfantasy/images/1/14/TTTiamat.png/revision/latest?cb=20071014170231',
  'https://static.wikia.nocookie.net/finalfantasy/images/4/4e/TTBGH251F2.png/revision/latest?cb=20071014164717',
  'https://static.wikia.nocookie.net/finalfantasy/images/c/ce/TTRedGiant.png/revision/latest?cb=20071014170116',
  'https://static.wikia.nocookie.net/finalfantasy/images/1/13/TTCatoblepas.png/revision/latest?cb=20071014164942',
  'https://static.wikia.nocookie.net/finalfantasy/images/2/2f/TTUltimaWeapon.png/revision/latest?cb=20071014170349',
  'https://static.wikia.nocookie.net/finalfantasy/images/a/a8/TTChubbyChocobo.png/revision/latest?cb=20071014170527',
  'https://static.wikia.nocookie.net/finalfantasy/images/8/8b/TTAngelo.png/revision/latest?cb=20071014170557',
  'https://static.wikia.nocookie.net/finalfantasy/images/b/bd/TTGilgamesh.png/revision/latest?cb=20071014170624',
  'https://static.wikia.nocookie.net/finalfantasy/images/3/3f/TTMiniMog.png/revision/latest?cb=20071014170642',
  'https://static.wikia.nocookie.net/finalfantasy/images/2/24/TTChocobo.png/revision/latest?cb=20071014170656',
  'https://static.wikia.nocookie.net/finalfantasy/images/9/9a/TTQuezacotl.png/revision/latest?cb=20071014170732',
  'https://static.wikia.nocookie.net/finalfantasy/images/0/09/TTShiva.png/revision/latest?cb=20071014170749',
  'https://static.wikia.nocookie.net/finalfantasy/images/3/32/TTIfrit.png/revision/latest?cb=20071014165542',
  'https://static.wikia.nocookie.net/finalfantasy/images/1/1e/TTSiren.png/revision/latest?cb=20071014170824',
  'https://static.wikia.nocookie.net/finalfantasy/images/0/0e/TTSacred.png/revision/latest?cb=20071014170138',
  'https://static.wikia.nocookie.net/finalfantasy/images/6/67/TTMinotaur.png/revision/latest?cb=20071014165859',
  'https://static.wikia.nocookie.net/finalfantasy/images/9/95/TTCarbuncle.png/revision/latest?cb=20071014170838',
  'https://static.wikia.nocookie.net/finalfantasy/images/0/03/TTDiablos.png/revision/latest?cb=20071014165020',
  'https://static.wikia.nocookie.net/finalfantasy/images/a/ae/TTLeviathan.png/revision/latest?cb=20071014170853',
  'https://static.wikia.nocookie.net/finalfantasy/images/c/cb/TTOdin.png/revision/latest?cb=20071014165958',
  'https://static.wikia.nocookie.net/finalfantasy/images/f/f7/TTPandemona.png/revision/latest?cb=20071014170908',
  'https://static.wikia.nocookie.net/finalfantasy/images/0/09/TTCerberus.png/revision/latest?cb=20071014165001',
  'https://static.wikia.nocookie.net/finalfantasy/images/1/17/TTAlexander.png/revision/latest?cb=20071014170924',
  'https://static.wikia.nocookie.net/finalfantasy/images/1/18/TTPhoenix.png/revision/latest?cb=20071014170941',
  'https://static.wikia.nocookie.net/finalfantasy/images/b/bc/TTBahamut.png/revision/latest?cb=20071014164737',
  'https://static.wikia.nocookie.net/finalfantasy/images/2/2e/TTDoomtrain.png/revision/latest?cb=20071014170954',
  'https://static.wikia.nocookie.net/finalfantasy/images/6/67/TTEden.png/revision/latest?cb=20071014171010',
  'https://static.wikia.nocookie.net/finalfantasy/images/a/a4/TTWard.png/revision/latest?cb=20071014171022',
  'https://static.wikia.nocookie.net/finalfantasy/images/e/e1/TTKiros.png/revision/latest?cb=20071014171039',
  'https://static.wikia.nocookie.net/finalfantasy/images/0/0f/TTLaguna.png/revision/latest?cb=20071014171055',
  'https://static.wikia.nocookie.net/finalfantasy/images/b/b7/TTSelphie.png/revision/latest?cb=20071014171115',
  'https://static.wikia.nocookie.net/finalfantasy/images/0/07/TTQuistis.png/revision/latest?cb=20071014171132',
  'https://static.wikia.nocookie.net/finalfantasy/images/5/55/TTIrvine.png/revision/latest?cb=20071014171148',
  'https://static.wikia.nocookie.net/finalfantasy/images/e/e5/TTZell.png/revision/latest?cb=20071014171206',
  'https://static.wikia.nocookie.net/finalfantasy/images/0/03/TTRinoa.png/revision/latest?cb=20071014171222',
  'https://static.wikia.nocookie.net/finalfantasy/images/0/0c/TTEdea.png/revision/latest?cb=20071014165052',
  'https://static.wikia.nocookie.net/finalfantasy/images/7/79/TTSeifer.png/revision/latest?cb=20071014170155',
  'https://static.wikia.nocookie.net/finalfantasy/images/2/21/TTSquall.png/revision/latest?cb=20071014171241',
]

async function main () {
  const cards = JSON.parse(fs.readFileSync(CARDS_JSON, 'utf8')).cards
  if (cards.length !== WIKI_IMAGE_URLS.length) {
    throw new Error(`Cards count ${cards.length} !== URL count ${WIKI_IMAGE_URLS.length}`)
  }
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true })
  }
  let ok = 0
  let fail = 0
  for (let i = 0; i < cards.length; i++) {
    const id = cards[i].id
    const url = WIKI_IMAGE_URLS[i]
    const outPath = path.join(OUT_DIR, `${id}.png`)
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const buf = Buffer.from(await res.arrayBuffer())
      fs.writeFileSync(outPath, buf)
      ok++
      console.log(`OK ${id}`)
    } catch (e) {
      fail++
      console.error(`FAIL ${id}: ${e.message}`)
    }
  }
  console.log(`Done: ${ok} ok, ${fail} fail`)
}

main().catch((e) => { console.error(e); process.exit(1) })
