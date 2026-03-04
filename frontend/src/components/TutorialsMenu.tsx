import { useState } from 'react'
import { TUTORIALS } from '../data/tutorials'
import { TutorialPopup } from './TutorialPopup'

interface TutorialsMenuProps {
  seenTutorials: string[]
  onBack: () => void
}

export function TutorialsMenu({ seenTutorials, onBack }: TutorialsMenuProps) {
  const [viewingId, setViewingId] = useState<string | null>(null)

  const viewingTutorial = viewingId ? TUTORIALS.find(t => t.id === viewingId) : null

  return (
    <div className="tutorials-menu">
      <div className="tutorials-menu-header">
        <button type="button" className="wm-back-btn" onClick={onBack}>
          {'\u2190'} Back
        </button>
        <h2 className="tutorials-menu-title">Tutorials</h2>
        <span className="tutorials-menu-count">
          {seenTutorials.length}/{TUTORIALS.length} unlocked
        </span>
      </div>

      <div className="tutorials-grid">
        {TUTORIALS.map(tut => {
          const seen = seenTutorials.includes(tut.id)
          return (
            <button
              key={tut.id}
              type="button"
              className={`tutorials-card ${seen ? 'unlocked' : 'locked'}`}
              onClick={() => seen && setViewingId(tut.id)}
              disabled={!seen}
              aria-label={seen ? tut.title : 'Locked tutorial'}
            >
              <span className="tutorials-card-icon">
                {seen ? tut.pages[0].icon : '\u{1F512}'}
              </span>
              <span className="tutorials-card-title">
                {seen ? tut.title : '???'}
              </span>
              {seen && (
                <span className="tutorials-card-pages">
                  {tut.pages.length} page{tut.pages.length !== 1 ? 's' : ''}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {viewingTutorial && (
        <TutorialPopup
          tutorial={viewingTutorial}
          onComplete={() => setViewingId(null)}
        />
      )}
    </div>
  )
}
