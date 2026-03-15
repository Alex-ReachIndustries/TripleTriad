import { useState, useEffect } from 'react'
import { AudioManager } from '../audio/AudioManager'
import { isNativePlatform } from '../transport'

const SETTINGS_KEY = 'tripletriad-settings'

export interface AppSettings {
  textScale: number       // 0.8 – 1.4, default 1.0
  cardOverlayScale: number // 0 – 1.5, default 1.0 (0 = hidden)
  musicVolume: number     // 0 – 1, default 0.5
  musicEnabled: boolean   // default true
}

const DEFAULT_SETTINGS: AppSettings = {
  textScale: 1.0,
  cardOverlayScale: 1.0,
  musicVolume: 0.5,
  musicEnabled: true,
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw)
    return {
      textScale: typeof parsed.textScale === 'number' ? parsed.textScale : DEFAULT_SETTINGS.textScale,
      cardOverlayScale: typeof parsed.cardOverlayScale === 'number' ? parsed.cardOverlayScale : DEFAULT_SETTINGS.cardOverlayScale,
      musicVolume: typeof parsed.musicVolume === 'number' ? parsed.musicVolume : DEFAULT_SETTINGS.musicVolume,
      musicEnabled: typeof parsed.musicEnabled === 'boolean' ? parsed.musicEnabled : DEFAULT_SETTINGS.musicEnabled,
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: AppSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

/** Apply settings as CSS custom properties on :root + AudioManager config */
export function applySettingsToDOM(settings: AppSettings) {
  const root = document.documentElement
  root.style.setProperty('--text-scale', String(settings.textScale))
  root.style.setProperty('--card-overlay-scale', String(settings.cardOverlayScale))
  root.style.setProperty('--card-overlay-display', settings.cardOverlayScale === 0 ? 'none' : 'block')
  // Sync audio settings
  const audio = AudioManager.getInstance()
  audio.setVolume(settings.musicVolume)
  audio.setMuted(!settings.musicEnabled)
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

  const updateMusicVolume = (value: number) => {
    setSettings(prev => ({ ...prev, musicVolume: value }))
  }

  const toggleMusic = () => {
    setSettings(prev => ({ ...prev, musicEnabled: !prev.musicEnabled }))
  }

  const textScalePercent = Math.round(settings.textScale * 100)
  const overlayPercent = Math.round(settings.cardOverlayScale * 100)
  const volumePercent = Math.round(settings.musicVolume * 100)

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

        {/* Music */}
        <section className="settings-section">
          <h2 className="settings-section-title">Music</h2>
          <div className="settings-toggle-row">
            <span>Background Music</span>
            <button
              type="button"
              className={`settings-toggle-btn ${settings.musicEnabled ? 'active' : ''}`}
              onClick={toggleMusic}
              aria-label="Toggle music"
            >
              {settings.musicEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
          {settings.musicEnabled && (
            <>
              <h2 className="settings-section-title" style={{ marginTop: '0.5rem' }}>Volume — {volumePercent}%</h2>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.musicVolume}
                onChange={e => updateMusicVolume(parseFloat(e.target.value))}
                className="settings-slider"
                aria-label="Music volume"
              />
              <div className="settings-slider-labels">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </>
          )}
        </section>

        {/* Server URL (Android only — needed for 2P lobbies) */}
        {isNativePlatform() && (
          <section className="settings-section">
            <h2 className="settings-section-title">Game Server</h2>
            <p style={{ fontSize: '0.8rem', color: '#888', margin: '0 0 8px' }}>
              Enter the URL of the game server for 2P lobbies (e.g. http://192.168.1.100:3000)
            </p>
            <input
              type="text"
              className="settings-server-input"
              placeholder="http://192.168.1.x:3000"
              defaultValue={localStorage.getItem('tripletriad-server-url') || ''}
              onChange={e => {
                const val = e.target.value.trim()
                if (val) {
                  localStorage.setItem('tripletriad-server-url', val)
                } else {
                  localStorage.removeItem('tripletriad-server-url')
                }
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '6px',
                color: '#e8e0d8',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </section>
        )}

        <button type="button" className="settings-reset-btn" onClick={() => setSettings(DEFAULT_SETTINGS)}>
          Reset to Defaults
        </button>
      </div>
    </div>
  )
}
