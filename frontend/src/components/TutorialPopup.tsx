import { useState } from 'react'
import type { Tutorial } from '../data/tutorials'

interface TutorialPopupProps {
  tutorial: Tutorial
  onComplete: () => void
}

export function TutorialPopup({ tutorial, onComplete }: TutorialPopupProps) {
  const [page, setPage] = useState(0)
  const current = tutorial.pages[page]
  const isLast = page === tutorial.pages.length - 1
  const isFirst = page === 0

  return (
    <div className="tutorial-overlay" onClick={onComplete} role="presentation">
      <div className="tutorial-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={tutorial.title}>
        <div className="tutorial-header">
          <span className="tutorial-header-title">{tutorial.title}</span>
        </div>

        <div className="tutorial-page">
          <div className="tutorial-icon-area">
            <span className="tutorial-icon">{current.icon}</span>
          </div>
          <h3 className="tutorial-heading">{current.heading}</h3>
          <p className="tutorial-body">{current.body}</p>
        </div>

        {tutorial.pages.length > 1 && (
          <div className="tutorial-dots">
            {tutorial.pages.map((_, i) => (
              <span
                key={i}
                className={`tutorial-dot ${i === page ? 'active' : ''}`}
              />
            ))}
          </div>
        )}

        <div className="tutorial-nav">
          {!isFirst && (
            <button type="button" className="tutorial-btn prev" onClick={() => setPage(p => p - 1)}>
              Back
            </button>
          )}
          <button
            type="button"
            className="tutorial-btn next"
            onClick={() => isLast ? onComplete() : setPage(p => p + 1)}
          >
            {isLast ? 'Got it!' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
