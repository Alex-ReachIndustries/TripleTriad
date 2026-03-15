/**
 * ProfileCard: visual card representing a player.
 * Used in 2P home, waiting room, lobby browser.
 */

import { useMemo } from 'react'
import type { PlayerProfile } from '../../types/multiplayer'
import {
  getTaglineText,
  getBorderById,
  getBackgroundById,
  getCharIconById,
} from '../../data/profile'
import { getNpcCharIcons } from '../../data/profileNpcIcons'
import './ProfileCard.css'

interface ProfileCardProps {
  profile: PlayerProfile
  size?: 'normal' | 'large'
  selected?: boolean
  onClick?: () => void
  className?: string
}

export function ProfileCard({
  profile,
  size = 'normal',
  selected = false,
  onClick,
  className = '',
}: ProfileCardProps) {
  const border = getBorderById(profile.borderId)
  const background = getBackgroundById(profile.backgroundId)
  const tagline = getTaglineText(profile.taglinePart1, profile.taglinePart2)

  // Check default icons first, then NPC icons
  const charIcon = useMemo(() => {
    const defaultIcon = getCharIconById(profile.charIconId)
    if (defaultIcon) return defaultIcon
    const npcIcons = getNpcCharIcons()
    return npcIcons.find(c => c.id === profile.charIconId)
  }, [profile.charIconId])

  const sizeClass = size === 'large' ? 'profile-card--large' : ''
  const selectedClass = selected ? 'profile-card--selected' : ''
  const clickableClass = onClick ? 'profile-card--clickable' : ''

  return (
    <div
      className={`profile-card ${sizeClass} ${selectedClass} ${clickableClass} ${className}`}
      style={{
        border: border?.css ?? '3px solid #8b8682',
        background: background?.css ?? 'linear-gradient(135deg, #2c3e50, #3d566e)',
      }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick() } : undefined}
    >
      <div className="profile-card__icon">
        {charIcon ? (
          <img
            src={charIcon.src}
            alt={charIcon.name}
            className="profile-card__icon-img"
            onError={(e) => {
              // Fallback to initial-based avatar if image fails to load
              const target = e.currentTarget
              target.style.display = 'none'
              const fallback = target.parentElement?.querySelector('.profile-card__icon-fallback') as HTMLElement | null
              if (fallback) fallback.style.display = 'flex'
            }}
          />
        ) : null}
        <div
          className="profile-card__icon-fallback"
          style={{ display: charIcon ? 'none' : 'flex' }}
        >
          {profile.name.charAt(0).toUpperCase()}
        </div>
      </div>
      <div className="profile-card__info">
        <div className="profile-card__name">{profile.name}</div>
        <div className="profile-card__tagline">{tagline}</div>
        <div className="profile-card__stats">
          <span className="profile-card__stat profile-card__stat--win">
            W: {profile.stats.wins}
          </span>
          <span className="profile-card__stat profile-card__stat--loss">
            L: {profile.stats.losses}
          </span>
          <span className="profile-card__stat profile-card__stat--draw">
            D: {profile.stats.draws}
          </span>
        </div>
      </div>
    </div>
  )
}
