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
  {
    text: 'In the world of Final Fantasy VIII, a card game has taken hold of every town, garden, and outpost...',
  },
  {
    text: 'Triple Triad — a game of strategy played on a 3x3 grid where cards clash by comparing their ranks on each side.',
  },
  {
    speaker: 'Balamb Garden',
    text: 'You begin your journey at Balamb Garden, the prestigious military academy. Here, cadets and instructors alike pass the time between missions with friendly card matches.',
  },
  {
    text: 'Armed with just five basic cards and a handful of gil, you set out to become the greatest Triple Triad player in the world.',
  },
  {
    text: 'Challenge NPCs, win their cards, explore shops, complete quests, and conquer dungeons across seven regions — from the peaceful shores of Balamb to the mysterious depths of the Deep Sea Research Center.',
  },
  {
    text: 'Your adventure begins now. Good luck, card player.',
  },
]

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
