import { useState } from 'react'

export interface CutscenePanel {
  text: string
  /** Optional sub-heading or speaker name. */
  speaker?: string
  /** Optional background image path (location art). */
  bg?: string
  /** Optional speaker portrait path. */
  portrait?: string
}

interface StoryCutsceneProps {
  panels: CutscenePanel[]
  onComplete: () => void
}

const OPENING_PANELS: CutscenePanel[] = [
  { speaker: 'Balamb Garden', text: "In the world of Final Fantasy VIII, Balamb Garden stands as a beacon of hope — a military academy that trains SeeD, the elite mercenary force.", bg: '/locations/balamb_garden.png' },
  { text: "You are a cadet at Balamb Garden. Your weapon isn't a gunblade — it's a deck of cards. In this world, Triple Triad isn't just a game. It's how conflicts are settled, alliances are formed, and legends are made.", bg: '/locations/balamb_garden.png' },
  { speaker: 'Quistis', text: "Before you can become SeeD, you must pass the Fire Cavern prerequisite. Instructor Quistis is waiting to guide you.", bg: '/locations/balamb_garden.png', portrait: '/portraits/quistis_garden_ch1.png' },
  { text: "Armed with five basic cards and 500 gil, your journey begins. From Balamb to Esthar, from the depths of the ocean to the far reaches of space — your cards will carry you through it all.", bg: '/locations/balamb_garden.png' },
  { text: "Good luck, cadet. The Sorceress War is coming, and the world needs its greatest card player.", bg: '/locations/balamb_garden.png' },
]

const FIRE_CAVERN_ENTER_PANELS: CutscenePanel[] = [
  { speaker: 'Fire Cavern — Entrance', text: "The volcanic heat hits you like a wall. Instructor Quistis walks beside you toward the cavern mouth.", bg: '/locations/fire_cavern.png', portrait: '/portraits/quistis_garden_ch1.png' },
  { speaker: 'Quistis', text: "'This is the Fire Cavern prerequisite. Defeat the guardian within, and you'll qualify for the SeeD field exam. I'll be timing you.'", bg: '/locations/fire_cavern.png', portrait: '/portraits/quistis_garden_ch1.png' },
  { text: "Lava rivers illuminate the cavern walls in shades of orange and crimson. Steam hisses from cracks in the stone. Somewhere deep inside, something ancient waits.", bg: '/locations/fire_cavern.png' },
]

const FIRE_CAVERN_PANELS: CutscenePanel[] = [
  { speaker: 'Fire Cavern — Depths', text: "The flames recede. Ifrit, the fire guardian, lowers his head in acknowledgement.", bg: '/locations/fire_cavern.png', portrait: '/portraits/ifrit_guardian.png' },
  { speaker: 'Ifrit', text: "'You have proven your strength, mortal. Take this power — and face what lies ahead.'", bg: '/locations/fire_cavern.png', portrait: '/portraits/ifrit_guardian.png' },
  { text: "With the Fire Cavern conquered, you return to Balamb Garden. Quistis nods approvingly. The SeeD field exam awaits.", bg: '/locations/balamb_garden.png' },
]

const SEED_BALL_PANELS: CutscenePanel[] = [
  { speaker: 'Balamb Garden — Graduation Ball', text: "The ballroom glows with light. You've passed the SeeD exam. Tonight, you celebrate.", bg: '/locations/balamb_garden.png' },
  { text: "A girl in a white dress crosses the floor toward you. 'You're the best-looking guy here,' she says with a smile. 'Dance with me.'", bg: '/locations/balamb_garden.png', portrait: '/portraits/rinoa_ball.png' },
  { speaker: 'Rinoa', text: "The music swells — a waltz. She takes your hand. For a moment, the war, the Sorceress, the missions — none of it matters.", bg: '/locations/balamb_garden.png', portrait: '/portraits/rinoa_ball.png' },
  { text: "When the dance ends, she disappears into the crowd. But her name stays with you: Rinoa.", bg: '/locations/balamb_garden.png' },
]

const LAGUNA_DREAM_PANELS: CutscenePanel[] = [
  { speaker: 'Dream Sequence', text: "On the train to Timber, exhaustion overtakes you. You dream of someone else's life...", bg: '/locations/deling_city.png' },
  { text: "You are Laguna Loire — a Galbadian soldier with a terrible sense of direction and a worse leg cramp. Tonight, you're visiting a pianist named Julia at the Deling City hotel.", bg: '/locations/deling_city.png', portrait: '/portraits/laguna_dream_1.png' },
  { speaker: 'Julia', text: "She plays 'Eyes On Me' just for you. The melody is hauntingly beautiful. Laguna's heart is pounding — and somehow, so is yours.", bg: '/locations/deling_city.png', portrait: '/characters/julia.png' },
]

const SORCERESS_PARADE_PANELS: CutscenePanel[] = [
  { speaker: 'Deling City — The Parade', text: "The Sorceress's float glides through the streets of Deling City. The crowd cheers, unaware of the danger.", bg: '/locations/deling_city.png', portrait: '/portraits/edea_sorceress.png' },
  { text: "Irvine steadies his rifle on the rooftop. One shot. One chance. His finger hovers over the trigger...", bg: '/locations/deling_city.png', portrait: '/portraits/irvine.png' },
  { text: "He hesitates. Something in his eyes — recognition, horror. The moment passes. The shot is blocked by a magical barrier.", bg: '/locations/deling_city.png' },
  { speaker: 'Squall', text: "You charge in alone. Seifer stands in your way — the Sorceress's knight. You fight past him, but Edea is waiting.", bg: '/locations/deling_city.png', portrait: '/portraits/seifer_deling.png' },
  { text: "An ice lance materializes in the air. It pierces through you. The world goes dark. Disc 1 ends.", bg: '/locations/deling_city.png' },
]

const PRISON_ESCAPE_PANELS: CutscenePanel[] = [
  { speaker: 'D-District Prison', text: "You awaken in chains. Seifer stands over you, demanding answers. 'Why does SeeD oppose the Sorceress?'", bg: '/locations/d_district_prison.png', portrait: '/portraits/seifer_prison.png' },
  { text: "Small lion-like creatures — Moombas — recognize you. 'Laguna!' they cry, tasting your blood. The connection to the dreams deepens.", bg: '/locations/d_district_prison.png' },
  { text: "With help from your friends, you break free. But the news is devastating: missiles have been launched at Trabia Garden and Balamb Garden.", bg: '/locations/d_district_prison.png' },
]

const GARDEN_FLIGHT_PANELS: CutscenePanel[] = [
  { speaker: 'Balamb Garden — Basement', text: "Garden Master NORG has betrayed Headmaster Cid. In the chaos of the civil war, you descend into the basement.", bg: '/locations/balamb_garden_basement.png', portrait: '/portraits/norg.png' },
  { text: "Deep below, you discover an ancient mechanism — Centra technology. Balamb Garden was built on a mobile shelter.", bg: '/locations/balamb_garden_basement.png' },
  { text: "With NORG defeated, you activate the flight system. The ground trembles. The Garden lifts off just as missiles streak across the sky.", bg: '/locations/balamb_garden.png' },
  { text: "Balamb Garden soars into the clouds. A mobile fortress — and now you're its commander.", bg: '/locations/balamb_garden.png', portrait: '/portraits/cid_commander.png' },
]

const TRABIA_TRUTH_PANELS: CutscenePanel[] = [
  { speaker: 'Trabia Garden — Ruins', text: "Trabia Garden lies in ruins. Selphie walks through the rubble of her home, searching for survivors.", bg: '/locations/trabia_garden.png', portrait: '/portraits/selphie_trabia.png' },
  { text: "In the remains of the basketball court, everyone sits in a circle. Irvine takes a deep breath.", bg: '/locations/trabia_garden.png', portrait: '/portraits/irvine_trabia.png' },
  { speaker: 'Irvine', text: "'I have to tell you something. I remember... We all grew up together. At the same orphanage. And our Matron — the woman who raised us — was Edea.'", bg: '/locations/trabia_garden.png', portrait: '/portraits/irvine_trabia.png' },
  { text: "GF junctioning erased your memories. Your enemy is the woman who tucked you in at night. The Sorceress you tried to assassinate... was your mother figure.", bg: '/locations/trabia_garden.png' },
  { text: "Silence falls. Everything you thought you knew has shattered. But somehow, you must press on.", bg: '/locations/trabia_garden.png' },
]

const GARDEN_BATTLE_PANELS: CutscenePanel[] = [
  { speaker: 'The Sky Above', text: "Two Gardens fill the sky — Balamb and Galbadia, flying fortresses on a collision course.", bg: '/locations/galbadia_garden_revolution.png' },
  { text: "SeeD forces board Galbadia Garden. You fight through cadets and soldiers to reach the heart of the enemy.", bg: '/locations/galbadia_garden_revolution.png' },
  { text: "Seifer falls again. Then Edea — and this time, Ultimecia's possession breaks. Edea returns to herself, confused and horrified by what she's done.", bg: '/locations/galbadia_garden_revolution.png', portrait: '/portraits/edea.png' },
  { speaker: 'Rinoa', text: "But in the moment of victory, Rinoa collapses. She won't wake up. Something has gone terribly wrong.", bg: '/locations/galbadia_garden_revolution.png', portrait: '/portraits/rinoa.png' },
]

const SPACE_RESCUE_PANELS: CutscenePanel[] = [
  { speaker: 'Lunar Base — Orbit', text: "On the Lunar Base, possessed Rinoa releases Sorceress Adel from her orbital prison. The Lunar Cry begins — monsters pour from the moon to the planet below.", bg: '/locations/lunar_base.png', portrait: '/portraits/rinoa_esthar.png' },
  { text: "The station breaks apart. Everyone evacuates. But Rinoa is floating in space, alone and unconscious.", bg: '/locations/lunar_base.png' },
  { text: "You refuse to leave. You drift into the void after her — reaching, reaching...", bg: '/locations/lunar_base.png' },
  { speaker: 'Space', text: "Against all odds, you catch her. Drifting together through the stars with dwindling oxygen. 'Eyes On Me' plays in your heart.", bg: '/locations/lunar_base.png', portrait: '/portraits/rinoa_esthar.png' },
  { text: "The abandoned ship Ragnarok drifts into view. A miracle. You're going home.", bg: '/locations/lunar_base.png' },
]

const FUJIN_PLEA_PANELS: CutscenePanel[] = [
  { speaker: 'Lunatic Pandora', text: "Inside the crystalline structure, Fujin and Raijin stand before you — Seifer's loyal friends since childhood.", bg: '/locations/lunatic_pandora.png', portrait: '/portraits/fujin_pandora.png' },
  { speaker: 'Fujin', text: "'...Seifer. We've been with you through everything. The disciplinary committee. The dream of becoming a knight. All of it.'", bg: '/locations/lunatic_pandora.png', portrait: '/portraits/fujin_pandora.png' },
  { text: "For the first time ever, Fujin drops her one-word shouts and speaks from the heart.", bg: '/locations/lunatic_pandora.png' },
  { speaker: 'Fujin', text: "'But this has gone too far. Please... just stop. Come back to us.'", bg: '/locations/lunatic_pandora.png', portrait: '/portraits/fujin_pandora.png' },
  { text: "Seifer looks away. He can't stop. Not now. Not ever. The final battle with him begins.", bg: '/locations/lunatic_pandora.png', portrait: '/portraits/seifer_final.png' },
]

const TIME_COMPRESSION_PANELS: CutscenePanel[] = [
  { speaker: 'Time Compression', text: "Reality fractures. The world you know dissolves into a kaleidoscope of moments — past, present, future, all merging into one.", bg: '/locations/centra_excavation_site.png' },
  { text: "You walk through distorted landscapes — Edea's House melts into a desert, which folds into a city that hasn't been built yet.", bg: '/locations/edeas_house.png' },
  { text: "Hold on to what matters. Your friends. Your memories. The promise to find each other again.", bg: '/locations/centra_ruins.png' },
  { text: "Chains materialize in the void, leading upward to a castle floating in compressed time. Ultimecia's Castle awaits.", bg: '/locations/centra_ruins.png' },
]

const SEED_EXAM_ENTER_PANELS: CutscenePanel[] = [
  { speaker: 'Dollet — Beach Landing', text: "Landing craft cut through the surf. The SeeD field exam has begun — Dollet's communication tower must be secured.", bg: '/locations/dollet.png' },
  { speaker: 'Seifer', text: "'Follow my lead, chickenwuss. I'll show you how a real knight fights.' Seifer charges ahead without waiting for orders.", bg: '/locations/dollet.png', portrait: '/portraits/seifer_garden.png' },
  { text: "Galbadian soldiers patrol every street. You fight your way through the coastal town toward the tower looming above.", bg: '/locations/radio_tower.png' },
]

const MISSILE_BASE_PANELS: CutscenePanel[] = [
  { speaker: 'Galbadia Missile Base', text: "Selphie's team infiltrates the base in stolen Galbadian uniforms. The clock is ticking.", bg: '/locations/galbadia_missile_base.png', portrait: '/portraits/selphie_missile.png' },
  { text: "Deep inside, the targeting data confirms the worst: missiles are locked onto both Trabia and Balamb Gardens.", bg: '/locations/galbadia_missile_base.png' },
  { text: "Selphie slams the self-destruct button. Alarms blare. The base erupts in flames as you barely escape.", bg: '/locations/galbadia_missile_base.png', portrait: '/portraits/selphie_missile.png' },
]

const FH_ARRIVAL_PANELS: CutscenePanel[] = [
  { speaker: "Fisherman's Horizon", text: "The mobile Garden crash-lands on the transcontinental bridge, skidding to a halt at Fisherman's Horizon.", bg: '/locations/fishermans_horizon.png' },
  { speaker: 'Mayor Dobe', text: "'We are pacifists here! We don't want soldiers bringing war to our doorstep.'", bg: '/locations/fishermans_horizon.png', portrait: '/portraits/mayor_dobe.png' },
  { text: "To earn the trust of FH and prove your worth, you must demonstrate skill beyond warfare — through the art of cards.", bg: '/locations/fishermans_horizon.png' },
]

const BALAMB_LIBERATION_PANELS: CutscenePanel[] = [
  { speaker: 'Balamb Town', text: "Galbadian soldiers patrol the streets. Shops are shuttered. Zell's mother waves frantically from her window.", bg: '/locations/balamb_under_siege.png' },
  { speaker: 'Zell', text: "'This is MY hometown! Nobody messes with Balamb and gets away with it!'", bg: '/locations/balamb_under_siege.png', portrait: '/portraits/zell_balamb.png' },
  { text: "Fujin and Raijin's occupation must end. You challenge the invaders one by one through the streets of Balamb.", bg: '/locations/balamb_under_siege.png' },
]

const ORPHANAGE_PANELS: CutscenePanel[] = [
  { speaker: "Edea's House — Centra", text: "The orphanage on the cape looks smaller than you remember. The sea breeze carries fragments of a half-forgotten lullaby.", bg: '/locations/edeas_house.png' },
  { speaker: 'Edea', text: "'Children... I'm so sorry. Ultimecia used me as her vessel. The real enemy is a sorceress from the far future — she seeks to compress all of time.'", bg: '/locations/edeas_house.png', portrait: '/portraits/edea_centra.png' },
  { text: "Edea points toward the horizon. The White SeeD Ship waits — your path to Esthar and the truth about Ellone.", bg: '/locations/white_seed_ship.png' },
]

const ESTHAR_ARRIVAL_PANELS: CutscenePanel[] = [
  { speaker: 'Great Salt Lake', text: "The blinding white expanse stretches endlessly. Beyond the salt flats, a shimmering barrier conceals the most advanced nation on the planet.", bg: '/locations/great_salt_lake.png' },
  { text: "When you cross the threshold, the illusion shatters. Esthar City materializes — a vast metropolis of hovering platforms and crystalline towers.", bg: '/locations/esthar_city.png' },
  { speaker: 'Laguna', text: "'Welcome to Esthar! ...Yeah, I'm the president. It's a long story. Pull up a chair... after we deal with the moon situation.'", bg: '/locations/esthar_city.png', portrait: '/portraits/laguna_esthar.png' },
]

const DEEP_SEA_PANELS: CutscenePanel[] = [
  { speaker: 'Deep Sea Research Centre', text: "The research facility sits on the ocean floor, abandoned and dark. Ancient Centra technology pulses faintly in its depths.", bg: '/locations/deep_sea_research_center.png' },
  { text: "Each level deeper brings stronger opponents and more questions. What were the Centra researching down here?", bg: '/locations/deep_sea_research_center.png' },
  { text: "In the deepest chamber, you find what you came for — ancient technology that could be the key to defeating Ultimecia.", bg: '/locations/deep_sea_research_center.png' },
]

const ENDING_PANELS: CutscenePanel[] = [
  { speaker: "Ultimecia's Castle", text: "The Sorceress from the future falls. Her four forms — human, Griever, the fusion, and the cosmic horror — all defeated by the power of a well-played hand.", bg: '/locations/centra_ruins.png' },
  { text: "Time begins to decompress. But you're lost in the flow — memories fragmenting, Rinoa's face flickering in and out of focus.", bg: '/locations/centra_ruins.png' },
  { text: "A dying Ultimecia stumbles to the past — to Edea's House, to the orphanage. She transfers her powers to young Edea. The time loop closes.", bg: '/locations/edeas_house.png', portrait: '/portraits/edea.png' },
  { speaker: 'The Flower Field', text: "You collapse. Time swirls. Then — flowers. A field of them, stretching to the horizon. And footsteps approaching.", bg: '/locations/winhill.png' },
  { speaker: 'Rinoa', text: "'I found you.' She smiles. The world snaps back into focus. You're home.", bg: '/locations/winhill.png', portrait: '/portraits/rinoa_final.png' },
  { text: "At Balamb Garden, everyone celebrates. Laguna visits Raine's grave in Winhill. Seifer fishes peacefully in Balamb with Fujin and Raijin. And under the stars, the greatest card player in the world finally has everything.", bg: '/locations/balamb_garden.png' },
]

// Cutscene ID -> panels mapping
export const CUTSCENE_MAP: Record<string, CutscenePanel[]> = {
  'opening': OPENING_PANELS,
  'fire_cavern_enter': FIRE_CAVERN_ENTER_PANELS,
  'fire_cavern': FIRE_CAVERN_PANELS,
  'seed_exam_enter': SEED_EXAM_ENTER_PANELS,
  'seed_ball': SEED_BALL_PANELS,
  'laguna_dream': LAGUNA_DREAM_PANELS,
  'sorceress_parade': SORCERESS_PARADE_PANELS,
  'prison_escape': PRISON_ESCAPE_PANELS,
  'missile_base': MISSILE_BASE_PANELS,
  'garden_flight': GARDEN_FLIGHT_PANELS,
  'fh_arrival': FH_ARRIVAL_PANELS,
  'balamb_liberation': BALAMB_LIBERATION_PANELS,
  'trabia_truth': TRABIA_TRUTH_PANELS,
  'garden_battle': GARDEN_BATTLE_PANELS,
  'orphanage': ORPHANAGE_PANELS,
  'esthar_arrival': ESTHAR_ARRIVAL_PANELS,
  'space_rescue': SPACE_RESCUE_PANELS,
  'deep_sea': DEEP_SEA_PANELS,
  'fujin_plea': FUJIN_PLEA_PANELS,
  'time_compression': TIME_COMPRESSION_PANELS,
  'ending': ENDING_PANELS,
}

// Quest completion -> cutscene ID mapping
export const QUEST_CUTSCENE_MAP: Record<string, string> = {
  'mq_fire_cavern': 'fire_cavern',
  'mq_seed_exam': 'seed_ball',
  'mq_timber_mission': 'laguna_dream',
  'mq_assassination': 'sorceress_parade',
  'mq_prison_break': 'prison_escape',
  'mq_missile_base': 'missile_base',
  'mq_garden_crisis': 'garden_flight',
  'mq_the_bridge': 'fh_arrival',
  'mq_reclaim_balamb': 'balamb_liberation',
  'mq_memories': 'trabia_truth',
  'mq_garden_clash': 'garden_battle',
  'mq_orphanage': 'orphanage',
  'mq_esthar': 'esthar_arrival',
  'mq_lunar_cry': 'space_rescue',
  'mq_deep_sea': 'deep_sea',
  'mq_lunatic_pandora': 'fujin_plea',
  'mq_time_compression': 'time_compression',
  'mq_ultimecia': 'ending',
}

// Dungeon entrance -> cutscene ID mapping (plays when first entering a dungeon)
export const DUNGEON_ENTER_CUTSCENE_MAP: Record<string, string> = {
  'fire_cavern': 'fire_cavern_enter',
  'radio_tower': 'seed_exam_enter',
}

export function StoryCutscene({ panels, onComplete }: StoryCutsceneProps) {
  const [currentPanel, setCurrentPanel] = useState(0)

  const isLast = currentPanel >= panels.length - 1

  const handleNext = () => {
    if (isLast) {
      onComplete()
    } else {
      setCurrentPanel((p) => p + 1)
    }
  }

  const handleSkip = () => {
    onComplete()
  }

  const panel = panels[currentPanel]

  return (
    <div className="cutscene" onClick={handleNext} role="presentation">
      <div
        className="cutscene-bg"
        key={`bg-${currentPanel}`}
        style={panel.bg ? { backgroundImage: `url(${panel.bg})` } : undefined}
      />
      <div className="cutscene-overlay" />

      <div className="cutscene-content">
        <div className="cutscene-speaker-row">
          {panel.portrait && (
            <div className="cutscene-portrait" key={`portrait-${currentPanel}`}>
              <img src={panel.portrait} alt={panel.speaker ?? ''} />
            </div>
          )}
          {panel.speaker && (
            <p className="cutscene-speaker">{panel.speaker}</p>
          )}
        </div>
        <p className="cutscene-text" key={currentPanel}>
          {panel.text}
        </p>

        <div className="cutscene-controls">
          <span className="cutscene-progress">
            {currentPanel + 1} / {panels.length}
          </span>
          <div className="cutscene-buttons">
            <button type="button" className="cutscene-skip" onClick={(e) => { e.stopPropagation(); handleSkip() }}>
              Skip
            </button>
            <button type="button" className="cutscene-next" onClick={(e) => { e.stopPropagation(); handleNext() }}>
              {isLast ? 'Begin' : 'Next'}
            </button>
          </div>
        </div>
      </div>

      <p className="cutscene-hint" aria-hidden>Click anywhere to continue</p>
    </div>
  )
}

// Cutscene ID -> story log entry text mapping
export const CUTSCENE_STORY_LOG: Record<string, string> = {
  'fire_cavern_enter': 'Entered the Fire Cavern with Instructor Quistis. The SeeD prerequisite exam begins.',
  'fire_cavern': 'Defeated Ifrit in the Fire Cavern. The SeeD field exam awaits.',
  'seed_exam_enter': 'Landed at Dollet for the SeeD field exam. Seifer leads the charge toward the communication tower.',
  'seed_ball': 'Passed the SeeD exam and danced with a mysterious girl named Rinoa at the graduation ball.',
  'laguna_dream': 'Experienced a strange dream on the train to Timber — living the life of a Galbadian soldier named Laguna Loire.',
  'sorceress_parade': "Attempted to assassinate the Sorceress during Deling City's parade. The mission failed. Struck down by Edea's ice lance.",
  'prison_escape': 'Escaped D-District Prison. Learned that missiles have been launched at both Trabia and Balamb Gardens.',
  'missile_base': "Selphie's team destroyed the Galbadia Missile Base, but not before the missiles were launched.",
  'garden_flight': 'Defeated Garden Master NORG and activated Balamb Garden\'s ancient flight system. The Garden takes to the skies.',
  'fh_arrival': "Garden crash-landed at Fisherman's Horizon. Must earn the pacifist town's trust through cards.",
  'balamb_liberation': 'Returned to Balamb Town to find it under Galbadian occupation. Time to liberate the hometown.',
  'trabia_truth': 'At the ruins of Trabia Garden, Irvine revealed the truth: everyone grew up together at the same orphanage, raised by Edea.',
  'garden_battle': 'Balamb and Galbadia Gardens clashed in the sky. Edea was freed from possession, but Rinoa fell into a mysterious coma.',
  'orphanage': 'Returned to the orphanage at Centra. Edea revealed the true enemy: Ultimecia, a sorceress from the far future.',
  'esthar_arrival': 'Crossed the Great Salt Lake and entered Esthar. Laguna — now president — welcomed the party.',
  'space_rescue': 'Rinoa released Adel on the Lunar Base, triggering the Lunar Cry. Rescued Rinoa in space aboard the Ragnarok.',
  'deep_sea': 'Explored the Deep Sea Research Centre. Found ancient Centra technology that may help defeat Ultimecia.',
  'fujin_plea': "Inside Lunatic Pandora, Fujin pleaded with Seifer to stop. He refused. The final confrontation began.",
  'time_compression': 'Time Compression began. Reality fractured as past, present, and future merged. Ultimecia\'s Castle appeared.',
  'ending': 'Ultimecia fell. Time decompressed. Found Rinoa in the flower field. The greatest card player saved the world.',
}

export { OPENING_PANELS }
