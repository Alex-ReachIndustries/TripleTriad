import { useState } from 'react'

export interface CutscenePanel {
  text: string
  /** Optional sub-heading or speaker name. */
  speaker?: string
}

interface StoryCutsceneProps {
  panels: CutscenePanel[]
  onComplete: () => void
}

const OPENING_PANELS: CutscenePanel[] = [
  { speaker: 'Balamb Garden', text: "In the world of Final Fantasy VIII, Balamb Garden stands as a beacon of hope — a military academy that trains SeeD, the elite mercenary force." },
  { text: "You are a cadet at Balamb Garden. Your weapon isn't a gunblade — it's a deck of cards. In this world, Triple Triad isn't just a game. It's how conflicts are settled, alliances are formed, and legends are made." },
  { text: "Before you can become SeeD, you must pass the Fire Cavern prerequisite. Instructor Quistis is waiting to guide you." },
  { text: "Armed with five basic cards and 500 gil, your journey begins. From Balamb to Esthar, from the depths of the ocean to the far reaches of space — your cards will carry you through it all." },
  { text: "Good luck, cadet. The Sorceress War is coming, and the world needs its greatest card player." },
]

const FIRE_CAVERN_PANELS: CutscenePanel[] = [
  { speaker: 'Fire Cavern', text: "The volcanic heat is overwhelming. Lava rivers illuminate the cavern walls in shades of orange and crimson." },
  { text: "At the cavern's heart, a fire spirit challenges you — not with flames, but with cards. Ifrit himself deals the hand." },
  { text: "With Ifrit defeated, the flames recede. You've proven yourself worthy. The SeeD field exam awaits." },
]

const SEED_BALL_PANELS: CutscenePanel[] = [
  { speaker: 'Balamb Garden — Graduation Ball', text: "The ballroom glows with light. You've passed the SeeD exam. Tonight, you celebrate." },
  { text: "A girl in a white dress crosses the floor toward you. 'You're the best-looking guy here,' she says with a smile. 'Dance with me.'" },
  { speaker: 'Rinoa', text: "The music swells — a waltz. She takes your hand. For a moment, the war, the Sorceress, the missions — none of it matters." },
  { text: "When the dance ends, she disappears into the crowd. But her name stays with you: Rinoa." },
]

const LAGUNA_DREAM_PANELS: CutscenePanel[] = [
  { speaker: 'Dream Sequence', text: "On the train to Timber, exhaustion overtakes you. You dream of someone else's life..." },
  { text: "You are Laguna Loire — a Galbadian soldier with a terrible sense of direction and a worse leg cramp. Tonight, you're visiting a pianist named Julia at the Deling City hotel." },
  { speaker: 'Julia', text: "She plays 'Eyes On Me' just for you. The melody is hauntingly beautiful. Laguna's heart is pounding — and somehow, so is yours." },
]

const SORCERESS_PARADE_PANELS: CutscenePanel[] = [
  { speaker: 'Deling City — The Parade', text: "The Sorceress's float glides through the streets of Deling City. The crowd cheers, unaware of the danger." },
  { text: "Irvine steadies his rifle on the rooftop. One shot. One chance. His finger hovers over the trigger..." },
  { text: "He hesitates. Something in his eyes — recognition, horror. The moment passes. The shot is blocked by a magical barrier." },
  { speaker: 'Squall', text: "You charge in alone. Seifer stands in your way — the Sorceress's knight. You fight past him, but Edea is waiting." },
  { text: "An ice lance materializes in the air. It pierces through you. The world goes dark. Disc 1 ends." },
]

const PRISON_ESCAPE_PANELS: CutscenePanel[] = [
  { speaker: 'D-District Prison', text: "You awaken in chains. Seifer stands over you, demanding answers. 'Why does SeeD oppose the Sorceress?'" },
  { text: "Small lion-like creatures — Moombas — recognize you. 'Laguna!' they cry, tasting your blood. The connection to the dreams deepens." },
  { text: "With help from your friends, you break free. But the news is devastating: missiles have been launched at Trabia Garden and Balamb Garden." },
]

const GARDEN_FLIGHT_PANELS: CutscenePanel[] = [
  { speaker: 'Balamb Garden — Basement', text: "Garden Master NORG has betrayed Headmaster Cid. In the chaos of the civil war, you descend into the basement." },
  { text: "Deep below, you discover an ancient mechanism — Centra technology. Balamb Garden was built on a mobile shelter." },
  { text: "With NORG defeated, you activate the flight system. The ground trembles. The Garden lifts off just as missiles streak across the sky." },
  { text: "Balamb Garden soars into the clouds. A mobile fortress — and now you're its commander." },
]

const TRABIA_TRUTH_PANELS: CutscenePanel[] = [
  { speaker: 'Trabia Garden — Ruins', text: "Trabia Garden lies in ruins. Selphie walks through the rubble of her home, searching for survivors." },
  { text: "In the remains of the basketball court, everyone sits in a circle. Irvine takes a deep breath." },
  { speaker: 'Irvine', text: "'I have to tell you something. I remember... We all grew up together. At the same orphanage. And our Matron — the woman who raised us — was Edea.'" },
  { text: "GF junctioning erased your memories. Your enemy is the woman who tucked you in at night. The Sorceress you tried to assassinate... was your mother figure." },
  { text: "Silence falls. Everything you thought you knew has shattered. But somehow, you must press on." },
]

const GARDEN_BATTLE_PANELS: CutscenePanel[] = [
  { speaker: 'The Sky Above', text: "Two Gardens fill the sky — Balamb and Galbadia, flying fortresses on a collision course." },
  { text: "SeeD forces board Galbadia Garden. You fight through cadets and soldiers to reach the heart of the enemy." },
  { text: "Seifer falls again. Then Edea — and this time, Ultimecia's possession breaks. Edea returns to herself, confused and horrified by what she's done." },
  { speaker: 'Rinoa', text: "But in the moment of victory, Rinoa collapses. She won't wake up. Something has gone terribly wrong." },
]

const SPACE_RESCUE_PANELS: CutscenePanel[] = [
  { speaker: 'Lunar Base — Orbit', text: "On the Lunar Base, possessed Rinoa releases Sorceress Adel from her orbital prison. The Lunar Cry begins — monsters pour from the moon to the planet below." },
  { text: "The station breaks apart. Everyone evacuates. But Rinoa is floating in space, alone and unconscious." },
  { text: "You refuse to leave. You drift into the void after her — reaching, reaching..." },
  { speaker: 'Space', text: "Against all odds, you catch her. Drifting together through the stars with dwindling oxygen. 'Eyes On Me' plays in your heart." },
  { text: "The abandoned ship Ragnarok drifts into view. A miracle. You're going home." },
]

const FUJIN_PLEA_PANELS: CutscenePanel[] = [
  { speaker: 'Lunatic Pandora', text: "Inside the crystalline structure, Fujin and Raijin stand before you — Seifer's loyal friends since childhood." },
  { speaker: 'Fujin', text: "'...Seifer. We've been with you through everything. The disciplinary committee. The dream of becoming a knight. All of it.'" },
  { text: "For the first time ever, Fujin drops her one-word shouts and speaks from the heart." },
  { speaker: 'Fujin', text: "'But this has gone too far. Please... just stop. Come back to us.'" },
  { text: "Seifer looks away. He can't stop. Not now. Not ever. The final battle with him begins." },
]

const TIME_COMPRESSION_PANELS: CutscenePanel[] = [
  { speaker: 'Time Compression', text: "Reality fractures. The world you know dissolves into a kaleidoscope of moments — past, present, future, all merging into one." },
  { text: "You walk through distorted landscapes — Edea's House melts into a desert, which folds into a city that hasn't been built yet." },
  { text: "Hold on to what matters. Your friends. Your memories. The promise to find each other again." },
  { text: "Chains materialize in the void, leading upward to a castle floating in compressed time. Ultimecia's Castle awaits." },
]

const ENDING_PANELS: CutscenePanel[] = [
  { speaker: "Ultimecia's Castle", text: "The Sorceress from the future falls. Her four forms — human, Griever, the fusion, and the cosmic horror — all defeated by the power of a well-played hand." },
  { text: "Time begins to decompress. But you're lost in the flow — memories fragmenting, Rinoa's face flickering in and out of focus." },
  { text: "A dying Ultimecia stumbles to the past — to Edea's House, to the orphanage. She transfers her powers to young Edea. The time loop closes." },
  { speaker: 'The Flower Field', text: "You collapse. Time swirls. Then — flowers. A field of them, stretching to the horizon. And footsteps approaching." },
  { speaker: 'Rinoa', text: "'I found you.' She smiles. The world snaps back into focus. You're home." },
  { text: "At Balamb Garden, everyone celebrates. Laguna visits Raine's grave in Winhill. Seifer fishes peacefully in Balamb with Fujin and Raijin. And under the stars, the greatest card player in the world finally has everything." },
]

// Cutscene ID -> panels mapping
export const CUTSCENE_MAP: Record<string, CutscenePanel[]> = {
  'opening': OPENING_PANELS,
  'fire_cavern': FIRE_CAVERN_PANELS,
  'seed_ball': SEED_BALL_PANELS,
  'laguna_dream': LAGUNA_DREAM_PANELS,
  'sorceress_parade': SORCERESS_PARADE_PANELS,
  'prison_escape': PRISON_ESCAPE_PANELS,
  'garden_flight': GARDEN_FLIGHT_PANELS,
  'trabia_truth': TRABIA_TRUTH_PANELS,
  'garden_battle': GARDEN_BATTLE_PANELS,
  'space_rescue': SPACE_RESCUE_PANELS,
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
  'mq_garden_crisis': 'garden_flight',
  'mq_memories': 'trabia_truth',
  'mq_garden_clash': 'garden_battle',
  'mq_lunar_cry': 'space_rescue',
  'mq_lunatic_pandora': 'fujin_plea',
  'mq_time_compression': 'time_compression',
  'mq_ultimecia': 'ending',
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
      <div className="cutscene-bg" />
      <div className="cutscene-overlay" />

      <div className="cutscene-content">
        {panel.speaker && (
          <p className="cutscene-speaker">{panel.speaker}</p>
        )}
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

export { OPENING_PANELS }
