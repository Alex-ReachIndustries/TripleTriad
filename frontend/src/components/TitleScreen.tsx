import { useState, useEffect } from 'react'

interface TitleScreenProps {
  onNewGame: () => void
  onContinue: () => void
  onHowToPlay: () => void
  on2PDuel: () => void
  hasSaveData: boolean
}

export function TitleScreen({ onNewGame, onContinue, onHowToPlay, on2PDuel, hasSaveData }: TitleScreenProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(id)
  }, [])

  return (
    <div className={`title-screen-v3 ${visible ? 'visible' : ''}`}>
      {/* Background layers */}
      <div className="ts-bg-image" />
      <div className="ts-bg-overlay" />
      <div className="ts-particles" aria-hidden>
        {Array.from({ length: 20 }, (_, i) => (
          <span key={i} className="ts-particle" style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 8}s`,
            animationDuration: `${6 + Math.random() * 6}s`,
          }} />
        ))}
      </div>

      {/* Content */}
      <div className="ts-content">
        <div className="ts-logo-area">
          <h1 className="ts-title">
            <span className="ts-title-main">Triple Triad</span>
          </h1>
          <p className="ts-subtitle">Final Fantasy VIII</p>
          <div className="ts-divider" aria-hidden />
        </div>

        {/* Card fan decoration */}
        <div className="ts-card-fan" aria-hidden>
          {[0, 1, 2].map((i) => (
            <div key={i} className={`ts-fan-card ts-fan-card-${i}`} />
          ))}
        </div>

        <nav className="ts-menu" aria-label="Main menu">
          {hasSaveData && (
            <button type="button" className="ts-menu-btn ts-btn-primary" onClick={onContinue}>
              Continue
            </button>
          )}
          <button type="button" className={`ts-menu-btn ${hasSaveData ? '' : 'ts-btn-primary'}`} onClick={onNewGame}>
            New Game
          </button>
          <button type="button" className="ts-menu-btn" onClick={onHowToPlay}>
            How to Play
          </button>
          <button type="button" className="ts-menu-btn" onClick={on2PDuel}>
            2P Duel
          </button>
        </nav>

        <p className="ts-footer">A fan tribute to the classic card game</p>
      </div>
    </div>
  )
}
