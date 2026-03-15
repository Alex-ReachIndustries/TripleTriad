/**
 * LobbyBrowser: browse and join public lobbies.
 */

import { useState, useEffect, useCallback } from 'react'
import type { LobbyInfo } from '../../types/multiplayer'
import { listLobbies } from '../../api/client'
import './LobbyBrowser.css'

interface LobbyBrowserProps {
  onJoin: (lobby: LobbyInfo) => void
  onBack: () => void
}

export function LobbyBrowser({ onJoin, onBack }: LobbyBrowserProps) {
  const [lobbies, setLobbies] = useState<LobbyInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await listLobbies()
      setLobbies(list)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load lobbies')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 5000)
    return () => clearInterval(interval)
  }, [refresh])

  const formatRules = (lobby: LobbyInfo) => {
    const rules = lobby.config.specialRules
    if (rules.length === 0) return 'No special rules'
    return rules.join(', ')
  }

  return (
    <div className="lobby-browser">
      <div className="lobby-browser__header">
        <button type="button" className="lobby-browser__back" onClick={onBack}>Back</button>
        <h1 className="lobby-browser__title">Join a Lobby</h1>
        <button type="button" className="lobby-browser__refresh" onClick={refresh} disabled={loading}>
          Refresh
        </button>
      </div>

      {error && <div className="lobby-browser__error">{error}</div>}

      <div className="lobby-browser__list">
        {loading && lobbies.length === 0 && (
          <div className="lobby-browser__empty">Loading...</div>
        )}
        {!loading && lobbies.length === 0 && (
          <div className="lobby-browser__empty">No lobbies available. Create one!</div>
        )}
        {lobbies.map(lobby => (
          <button
            key={lobby.id}
            type="button"
            className="lobby-browser__card"
            onClick={() => onJoin(lobby)}
          >
            <div className="lobby-browser__card-header">
              <span className="lobby-browser__host-name">{lobby.hostName}'s Room</span>
              <span className="lobby-browser__player-count">
                {lobby.playerCount}/{lobby.maxPlayers}
              </span>
            </div>
            <div className="lobby-browser__card-details">
              <span className="lobby-browser__rules">Rules: {formatRules(lobby)}</span>
              <span className="lobby-browser__trade">Trade: {lobby.config.tradeRule}</span>
            </div>
            <div className={`lobby-browser__status lobby-browser__status--${lobby.phase}`}>
              {lobby.phase === 'waiting' ? 'Waiting' : lobby.phase === 'duelling' ? 'In Duel' : lobby.phase}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
