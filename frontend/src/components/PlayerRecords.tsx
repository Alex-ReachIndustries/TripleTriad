/**
 * PlayerRecords: stats overview screen accessible from the title screen.
 * Shows 1P/2P stats, card collection, world progress, and profile card.
 */

import { useMemo } from 'react'
import type { WorldPlayerState } from '../data/worldState'
import type { PlayerProfile } from '../types/multiplayer'
import { getOrCreateProfile } from '../data/profile'
import { ProfileCard } from './multiplayer/ProfileCard'
import { LOCATIONS, NPCS } from '../data/world'
import './PlayerRecords.css'

interface PlayerRecordsProps {
  worldState: WorldPlayerState
  onBack: () => void
}

export function PlayerRecords({ worldState, onBack }: PlayerRecordsProps) {
  const profile: PlayerProfile = useMemo(() => getOrCreateProfile(), [])

  const totalNpcWins = useMemo(
    () => Object.values(worldState.npcWins).reduce((a, b) => a + b, 0),
    [worldState.npcWins],
  )

  const uniqueNpcsDefeated = useMemo(
    () => Object.keys(worldState.npcWins).filter(k => worldState.npcWins[k] > 0).length,
    [worldState.npcWins],
  )

  const totalNpcs = NPCS.filter(n => n.type === 'duel').length
  const totalLocations = LOCATIONS.length
  const locationsVisited = Object.keys(worldState.seenContent).filter(
    k => worldState.seenContent[k]?.length > 0,
  ).length

  const totalCards = 110
  const cardsDiscovered = worldState.discoveredCards.length
  const cardsOwned = Object.keys(worldState.inventory).filter(k => worldState.inventory[k] > 0).length

  return (
    <div className="records-screen">
      <div className="records-header">
        <button type="button" className="records-back" onClick={onBack}>Back</button>
        <h1 className="records-title">Player Records</h1>
      </div>

      <div className="records-content">
        {/* Profile Card */}
        <div className="records-profile">
          <ProfileCard profile={profile} size="large" />
        </div>

        {/* 1P Stats */}
        <section className="records-section">
          <h2 className="records-section-title">Single Player</h2>
          <div className="records-grid">
            <div className="records-stat">
              <span className="records-stat-value">{worldState.storyChapter}</span>
              <span className="records-stat-label">Story Chapter</span>
            </div>
            <div className="records-stat">
              <span className="records-stat-value">{totalNpcWins}</span>
              <span className="records-stat-label">Total Wins</span>
            </div>
            <div className="records-stat">
              <span className="records-stat-value">{uniqueNpcsDefeated}/{totalNpcs}</span>
              <span className="records-stat-label">NPCs Defeated</span>
            </div>
            <div className="records-stat">
              <span className="records-stat-value">{worldState.gil.toLocaleString()}</span>
              <span className="records-stat-label">Gil</span>
            </div>
            <div className="records-stat">
              <span className="records-stat-value">{worldState.clearedDungeons.length}</span>
              <span className="records-stat-label">Dungeons Cleared</span>
            </div>
            <div className="records-stat">
              <span className="records-stat-value">{worldState.completedQuests.length}</span>
              <span className="records-stat-label">Quests Completed</span>
            </div>
          </div>
        </section>

        {/* 2P Stats */}
        <section className="records-section">
          <h2 className="records-section-title">2P Multiplayer</h2>
          <div className="records-grid">
            <div className="records-stat records-stat--win">
              <span className="records-stat-value">{profile.stats.wins}</span>
              <span className="records-stat-label">Wins</span>
            </div>
            <div className="records-stat records-stat--loss">
              <span className="records-stat-value">{profile.stats.losses}</span>
              <span className="records-stat-label">Losses</span>
            </div>
            <div className="records-stat">
              <span className="records-stat-value">{profile.stats.draws}</span>
              <span className="records-stat-label">Draws</span>
            </div>
            <div className="records-stat">
              <span className="records-stat-value">
                {profile.stats.wins + profile.stats.losses + profile.stats.draws}
              </span>
              <span className="records-stat-label">Total Matches</span>
            </div>
          </div>
        </section>

        {/* Card Collection */}
        <section className="records-section">
          <h2 className="records-section-title">Card Collection</h2>
          <div className="records-grid">
            <div className="records-stat">
              <span className="records-stat-value">{cardsOwned}</span>
              <span className="records-stat-label">Cards Owned</span>
            </div>
            <div className="records-stat">
              <span className="records-stat-value">{cardsDiscovered}/{totalCards}</span>
              <span className="records-stat-label">Cards Discovered</span>
            </div>
            <div className="records-stat">
              <span className="records-stat-value">
                {Object.values(worldState.inventory).reduce((a, b) => a + b, 0)}
              </span>
              <span className="records-stat-label">Total Cards</span>
            </div>
          </div>
          {/* Collection progress bar */}
          <div className="records-progress">
            <div
              className="records-progress-fill"
              style={{ width: `${(cardsDiscovered / totalCards) * 100}%` }}
            />
            <span className="records-progress-label">
              {Math.round((cardsDiscovered / totalCards) * 100)}% Complete
            </span>
          </div>
        </section>

        {/* World Progress */}
        <section className="records-section">
          <h2 className="records-section-title">World Progress</h2>
          <div className="records-grid">
            <div className="records-stat">
              <span className="records-stat-value">{locationsVisited}/{totalLocations}</span>
              <span className="records-stat-label">Locations Visited</span>
            </div>
            <div className="records-stat">
              <span className="records-stat-value">{worldState.seenCutscenes.length}</span>
              <span className="records-stat-label">Cutscenes Seen</span>
            </div>
            <div className="records-stat">
              <span className="records-stat-value">{worldState.storyLog.length}</span>
              <span className="records-stat-label">Story Log Entries</span>
            </div>
          </div>
        </section>

        {/* Recent 2P Match History */}
        {profile.matchHistory.length > 0 && (
          <section className="records-section">
            <h2 className="records-section-title">Recent 2P Matches</h2>
            <div className="records-history">
              {profile.matchHistory.slice(0, 10).map((match, i) => (
                <div key={i} className={`records-match records-match--${match.result}`}>
                  <span className="records-match-result">
                    {match.result === 'win' ? 'W' : match.result === 'loss' ? 'L' : 'D'}
                  </span>
                  <span className="records-match-opponent">vs {match.opponentName}</span>
                  <span className="records-match-date">
                    {new Date(match.date).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
