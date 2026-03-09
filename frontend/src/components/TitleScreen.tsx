import { useState, useEffect, useRef, useCallback } from 'react'

interface TitleScreenProps {
  onNewGame: () => void
  onContinue: () => void
  onHowToPlay: () => void
  on2PDuel: () => void
  onSettings: () => void
  hasSaveData: boolean
}

function SwipeConfirmDialog({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const startX = useRef(0)

  const THUMB_W = 56
  const THRESHOLD = 0.8

  const getTrackWidth = useCallback(() => {
    return trackRef.current ? trackRef.current.clientWidth - THUMB_W : 200
  }, [])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    startX.current = e.clientX - offset
    setDragging(true)
  }, [offset])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return
    const maxOffset = getTrackWidth()
    const raw = e.clientX - startX.current
    setOffset(Math.max(0, Math.min(raw, maxOffset)))
  }, [dragging, getTrackWidth])

  const handlePointerUp = useCallback(() => {
    if (!dragging) return
    setDragging(false)
    const maxOffset = getTrackWidth()
    if (offset >= maxOffset * THRESHOLD) {
      setOffset(maxOffset)
      setConfirmed(true)
      setTimeout(onConfirm, 300)
    } else {
      setOffset(0)
    }
  }, [dragging, offset, getTrackWidth, onConfirm])

  // Keyboard dismiss
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onCancel])

  const maxOffset = getTrackWidth()
  const progress = maxOffset > 0 ? offset / maxOffset : 0

  return (
    <div className="swipe-dialog-overlay" onClick={onCancel}>
      <div className="swipe-dialog" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="swipe-dialog-icon" aria-hidden>&#x26A0;</div>
        <p className="swipe-dialog-text">Starting a new game will erase all save data.</p>

        <div className="swipe-track" ref={trackRef}>
          <div
            className="swipe-track-fill"
            style={{ width: `${offset + THUMB_W}px` }}
          />
          <span
            className="swipe-track-label"
            style={{ opacity: 1 - progress * 1.5 }}
          >
            Slide to confirm
          </span>
          <div
            className={`swipe-thumb ${dragging ? 'dragging' : ''} ${confirmed ? 'confirmed' : ''}`}
            style={{ transform: `translateX(${offset}px)`, transition: dragging ? 'none' : 'transform 0.3s ease' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {confirmed ? '\u2713' : '\u00BB'}
          </div>
        </div>

        <button type="button" className="swipe-dialog-cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}

export function TitleScreen({ onNewGame, onContinue, onHowToPlay, on2PDuel, onSettings, hasSaveData }: TitleScreenProps) {
  const [visible, setVisible] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

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
          <button type="button" className={`ts-menu-btn ${hasSaveData ? '' : 'ts-btn-primary'}`} onClick={() => setShowConfirm(true)}>
            New Game
          </button>
          <button type="button" className="ts-menu-btn" onClick={onHowToPlay}>
            How to Play
          </button>
          <button type="button" className="ts-menu-btn" onClick={on2PDuel}>
            2P Duel
          </button>
          <button type="button" className="ts-menu-btn" onClick={onSettings}>
            Settings
          </button>
        </nav>

        <p className="ts-footer">A fan tribute to the classic card game</p>
      </div>

      {showConfirm && (
        <SwipeConfirmDialog
          onConfirm={() => { setShowConfirm(false); onNewGame() }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  )
}
