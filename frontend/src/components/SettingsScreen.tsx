import { useState, useEffect } from 'react'

const SETTINGS_KEY = 'tripletriad-settings'

export interface AppSettings {
  textScale: number       // 0.8 – 1.4, default 1.0
  cardOverlayScale: number // 0 – 1.5, default 1.0 (0 = hidden)
}

const DEFAULT_SETTINGS: AppSettings = {
  textScale: 1.0,
  cardOverlayScale: 1.0,
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw)
    return {
      textScale: typeof parsed.textScale === 'number' ? parsed.textScale : DEFAULT_SETTINGS.textScale,
      cardOverlayScale: typeof parsed.cardOverlayScale === 'number' ? parsed.cardOverlayScale : DEFAULT_SETTINGS.cardOverlayScale,
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: AppSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

/** Apply settings as CSS custom properties on :root */
export function applySettingsToDOM(settings: AppSettings) {
  const root = document.documentElement
  root.style.setProperty('--text-scale', String(settings.textScale))
  root.style.setProperty('--card-overlay-scale', String(settings.cardOverlayScale))
  root.style.setProperty('--card-overlay-display', settings.cardOverlayScale === 0 ? 'none' : 'block')
}

interface SettingsScreenProps {
  onBack: () => void
}

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  const [settings, setSettings] = useState<AppSettings>(loadSettings)

  useEffect(() => {
    saveSettings(settings)
    applySettingsToDOM(settings)
  }, [settings])

  const updateTextScale = (value: number) => {
    setSettings(prev => ({ ...prev, textScale: value }))
  }

  const updateCardOverlay = (value: number) => {
    setSettings(prev => ({ ...prev, cardOverlayScale: value }))
  }

  const textScalePercent = Math.round(settings.textScale * 100)
  const overlayPercent = Math.round(settings.cardOverlayScale * 100)

  return (
    <div className="settings-screen">
      <div className="settings-header">
        <button type="button" className="settings-back-btn" onClick={onBack}>
          Back
        </button>
        <h1 className="settings-title">Settings</h1>
      </div>

      <div className="settings-content">
        {/* Text Scale */}
        <section className="settings-section">
          <h2 className="settings-section-title">Text Scale — {textScalePercent}%</h2>
          <input
            type="range"
            min="0.7"
            max="1.5"
            step="0.05"
            value={settings.textScale}
            onChange={e => updateTextScale(parseFloat(e.target.value))}
            className="settings-slider"
            aria-label="Text scale"
          />
          <div className="settings-slider-labels">
            <span>70%</span>
            <span>100%</span>
            <span>150%</span>
          </div>

          <div className="settings-preview" style={{ fontSize: `calc(1rem * ${settings.textScale})` }}>
            <p className="settings-preview-heading" style={{ fontSize: `calc(1.75rem * ${settings.textScale})` }}>
              Chapter 1: Balamb Garden
            </p>
            <p className="settings-preview-body">
              Challenge NPCs to card duels and build your collection. Win rare cards to strengthen your deck.
            </p>
            <p className="settings-preview-ui" style={{ fontSize: `calc(0.85rem * ${settings.textScale})` }}>
              <span className="settings-preview-tag">Gil: 500</span>
              <span className="settings-preview-tag">Cards: 12</span>
              <span className="settings-preview-tag">Win streak: 3</span>
            </p>
          </div>
        </section>

        {/* Card Overlay Scale */}
        <section className="settings-section">
          <h2 className="settings-section-title">
            Card Number Overlay — {overlayPercent === 0 ? 'Off' : `${overlayPercent}%`}
          </h2>
          <input
            type="range"
            min="0"
            max="1.5"
            step="0.1"
            value={settings.cardOverlayScale}
            onChange={e => updateCardOverlay(parseFloat(e.target.value))}
            className="settings-slider"
            aria-label="Card overlay scale"
          />
          <div className="settings-slider-labels">
            <span>Off</span>
            <span>100%</span>
            <span>150%</span>
          </div>

          <div className="settings-card-preview">
            <div className="settings-card-sample">
              <div className="settings-card-art" />
              {settings.cardOverlayScale > 0 && (
                <div className="settings-card-ranks" style={{ fontSize: `calc(0.78rem * ${settings.cardOverlayScale})` }}>
                  <span className="rank top">7</span>
                  <span className="rank right">5</span>
                  <span className="rank bottom">A</span>
                  <span className="rank left">3</span>
                </div>
              )}
            </div>
            <p className="settings-preview-caption">
              {settings.cardOverlayScale === 0
                ? 'Card numbers hidden — art only'
                : 'Card numbers shown at current scale'
              }
            </p>
          </div>
        </section>

        <button type="button" className="settings-reset-btn" onClick={() => setSettings(DEFAULT_SETTINGS)}>
          Reset to Defaults
        </button>
      </div>
    </div>
  )
}
