/**
 * Profile Editor: customise border, background, character icon, tagline, and name.
 * Live preview via ProfileCard.
 */

import { useState, useMemo } from 'react'
import type { PlayerProfile } from '../../types/multiplayer'
import type { WorldPlayerState } from '../../data/worldState'
import {
  TAGLINE_PART1, TAGLINE_PART2,
  ALL_BORDERS, ALL_BACKGROUNDS,
  DEFAULT_HUMAN_ICONS, DEFAULT_BEAST_ICONS,
  isProfileUnlockMet, getUnlockHint,
  saveProfile,
} from '../../data/profile'
import { getNpcCharIcons } from '../../data/profileNpcIcons'
import { ProfileCard } from './ProfileCard'
import './ProfileEditor.css'

interface ProfileEditorProps {
  profile: PlayerProfile
  worldState: WorldPlayerState
  onSave: (profile: PlayerProfile) => void
  onBack: () => void
}

type IconTab = 'human' | 'beast' | 'npc'

export function ProfileEditor({ profile, worldState, onSave, onBack }: ProfileEditorProps) {
  const [draft, setDraft] = useState<PlayerProfile>({ ...profile })
  const [iconTab, setIconTab] = useState<IconTab>('human')

  const npcIcons = useMemo(() => getNpcCharIcons(), [])

  const update = (patch: Partial<PlayerProfile>) => {
    setDraft(prev => ({ ...prev, ...patch }))
  }

  const handleSave = () => {
    const saved = { ...draft, name: draft.name.slice(0, 16).trim() || 'Player' }
    saveProfile(saved)
    onSave(saved)
  }

  const iconSets = {
    human: DEFAULT_HUMAN_ICONS,
    beast: DEFAULT_BEAST_ICONS,
    npc: npcIcons,
  }

  const currentIcons = iconSets[iconTab]

  return (
    <div className="profile-editor">
      <div className="profile-editor__header">
        <button type="button" className="profile-editor__back" onClick={onBack}>Back</button>
        <h1 className="profile-editor__title">Edit Profile</h1>
      </div>

      <div className="profile-editor__content">
        {/* Live Preview */}
        <div className="profile-editor__preview">
          <ProfileCard profile={draft} size="large" />
        </div>

        {/* Name */}
        <section className="profile-editor__section">
          <h2 className="profile-editor__section-title">Name</h2>
          <input
            type="text"
            className="profile-editor__name-input"
            value={draft.name}
            onChange={e => update({ name: e.target.value.slice(0, 16) })}
            maxLength={16}
            placeholder="Player"
          />
          <span className="profile-editor__char-count">{draft.name.length}/16</span>
        </section>

        {/* Tagline */}
        <section className="profile-editor__section">
          <h2 className="profile-editor__section-title">Tagline</h2>
          <div className="profile-editor__tagline-row">
            <select
              className="profile-editor__select"
              value={draft.taglinePart1}
              onChange={e => update({ taglinePart1: Number(e.target.value) })}
            >
              {TAGLINE_PART1.map((t, i) => (
                <option key={i} value={i}>{t}</option>
              ))}
            </select>
            <span className="profile-editor__tagline-sep">|</span>
            <select
              className="profile-editor__select"
              value={draft.taglinePart2}
              onChange={e => update({ taglinePart2: Number(e.target.value) })}
            >
              {TAGLINE_PART2.map((t, i) => (
                <option key={i} value={i}>{t}</option>
              ))}
            </select>
          </div>
        </section>

        {/* Character Icon */}
        <section className="profile-editor__section">
          <h2 className="profile-editor__section-title">Character Icon</h2>
          <div className="profile-editor__tabs">
            <button
              type="button"
              className={`profile-editor__tab ${iconTab === 'human' ? 'active' : ''}`}
              onClick={() => setIconTab('human')}
            >Humans</button>
            <button
              type="button"
              className={`profile-editor__tab ${iconTab === 'beast' ? 'active' : ''}`}
              onClick={() => setIconTab('beast')}
            >Beasts</button>
            <button
              type="button"
              className={`profile-editor__tab ${iconTab === 'npc' ? 'active' : ''}`}
              onClick={() => setIconTab('npc')}
            >NPCs ({npcIcons.filter(ic => isProfileUnlockMet(ic.unlockCondition, worldState)).length})</button>
          </div>
          <div className="profile-editor__icon-grid">
            {currentIcons.map(icon => {
              const unlocked = isProfileUnlockMet(icon.unlockCondition, worldState)
              const isSelected = draft.charIconId === icon.id
              return (
                <button
                  key={icon.id}
                  type="button"
                  className={`profile-editor__icon-btn ${isSelected ? 'selected' : ''} ${!unlocked ? 'locked' : ''}`}
                  onClick={() => unlocked && update({ charIconId: icon.id })}
                  disabled={!unlocked}
                  title={unlocked ? icon.name : getUnlockHint(icon.unlockCondition)}
                >
                  {unlocked ? (
                    <img
                      src={icon.src}
                      alt={icon.name}
                      className="profile-editor__icon-img"
                      onError={(e) => {
                        const target = e.currentTarget
                        target.style.display = 'none'
                        const fallback = document.createElement('div')
                        fallback.className = 'profile-editor__icon-initial'
                        fallback.textContent = icon.name.charAt(0)
                        target.parentElement?.appendChild(fallback)
                      }}
                    />
                  ) : (
                    <div className="profile-editor__icon-locked">
                      <span className="profile-editor__lock-icon">&#128274;</span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </section>

        {/* Border */}
        <section className="profile-editor__section">
          <h2 className="profile-editor__section-title">Border</h2>
          <div className="profile-editor__swatch-grid">
            {ALL_BORDERS.map(border => {
              const unlocked = isProfileUnlockMet(border.unlockCondition, worldState)
              const isSelected = draft.borderId === border.id
              return (
                <button
                  key={border.id}
                  type="button"
                  className={`profile-editor__swatch ${isSelected ? 'selected' : ''} ${!unlocked ? 'locked' : ''}`}
                  onClick={() => unlocked && update({ borderId: border.id })}
                  disabled={!unlocked}
                  title={unlocked ? border.name : getUnlockHint(border.unlockCondition)}
                  style={{ border: unlocked ? border.css : '3px solid #333' }}
                >
                  {!unlocked && <span className="profile-editor__lock-icon">&#128274;</span>}
                </button>
              )
            })}
          </div>
        </section>

        {/* Background */}
        <section className="profile-editor__section">
          <h2 className="profile-editor__section-title">Background</h2>
          <div className="profile-editor__swatch-grid">
            {ALL_BACKGROUNDS.map(bg => {
              const unlocked = isProfileUnlockMet(bg.unlockCondition, worldState)
              const isSelected = draft.backgroundId === bg.id
              return (
                <button
                  key={bg.id}
                  type="button"
                  className={`profile-editor__swatch ${isSelected ? 'selected' : ''} ${!unlocked ? 'locked' : ''}`}
                  onClick={() => unlocked && update({ backgroundId: bg.id })}
                  disabled={!unlocked}
                  title={unlocked ? bg.name : getUnlockHint(bg.unlockCondition)}
                  style={{ background: unlocked ? bg.css : '#222' }}
                >
                  {!unlocked && <span className="profile-editor__lock-icon">&#128274;</span>}
                </button>
              )
            })}
          </div>
        </section>

        {/* Save */}
        <button type="button" className="profile-editor__save-btn" onClick={handleSave}>
          Save Profile
        </button>
      </div>
    </div>
  )
}
