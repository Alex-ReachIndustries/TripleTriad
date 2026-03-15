/**
 * MultiplayerHome: 2P hub with Host, Join, Profile buttons + profile card display.
 * Replaces PlayPage for the multiplayer flow.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { PlayerProfile, LobbyInfo } from '../../types/multiplayer'
import type { PlayerId } from '../../game/types'
import type { WorldPlayerState } from '../../data/worldState'
import type { SavedDeck } from '../../data/deckManager'
import { getOrCreateProfile, saveProfile, recordMatch } from '../../data/profile'
import { createLobby } from '../../api/client'
import { useLobby } from '../../hooks/useLobby'
import { ProfileCard } from './ProfileCard'
import { ProfileEditor } from './ProfileEditor'
import { WaitingRoom } from './WaitingRoom'
import { LobbyBrowser } from './LobbyBrowser'
import { GameBoard } from '../GameBoard'
import './MultiplayerHome.css'

type Screen = 'home' | 'profile' | 'waiting-room' | 'lobby-browser' | 'duel'

interface MultiplayerHomeProps {
  worldState: WorldPlayerState
  onInventoryChange: (deltas: { gained: string[]; lost: string[] }) => void
  onBack: () => void
  savedDecks: SavedDeck[]
  onUpdateDecks: (decks: SavedDeck[]) => void
  seenTutorials: string[]
  onMarkTutorialSeen: (id: string) => void
}

export function MultiplayerHome({
  worldState,
  onInventoryChange,
  onBack,
  savedDecks,
  onUpdateDecks,
}: MultiplayerHomeProps) {
  const [screen, setScreen] = useState<Screen>('home')
  const [profile, setProfile] = useState<PlayerProfile>(getOrCreateProfile)
  const [error, setError] = useState<string | null>(null)
  const [isHost, setIsHost] = useState(false)

  const lobby = useLobby(profile)

  // Determine if we're a duellist in the active duel
  const myDuelRole = useMemo((): PlayerId | null => {
    if (!lobby.state.activeDuel) return null
    if (profile.id === lobby.state.activeDuel.player0Id) return 0
    if (profile.id === lobby.state.activeDuel.player1Id) return 1
    return null
  }, [lobby.state.activeDuel, profile.id])

  // Switch to duel screen when duel starts
  useEffect(() => {
    if (lobby.state.phase === 'duelling' && lobby.state.duelGameState) {
      setScreen('duel')
    }
  }, [lobby.state.phase, lobby.state.duelGameState])

  // Return to waiting room after duel ends and return_to_waiting received
  useEffect(() => {
    if (lobby.state.phase === 'waiting' && screen === 'duel') {
      setScreen('waiting-room')
    }
  }, [lobby.state.phase, screen])

  const handleHost = useCallback(async () => {
    setError(null)
    try {
      const result = await createLobby(profile)

      setIsHost(true)
      await lobby.connect(result.lobbyId)
      setScreen('waiting-room')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create lobby')
    }
  }, [profile, lobby])

  const handleJoinLobby = useCallback(async (selectedLobby: LobbyInfo) => {
    setError(null)
    try {

      setIsHost(false)
      await lobby.connect(selectedLobby.id)
      setScreen('waiting-room')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to join lobby')
    }
  }, [lobby])

  const handleProfileSave = useCallback((updated: PlayerProfile) => {
    setProfile(updated)
    saveProfile(updated)
    setScreen('home')
  }, [])

  const handleLeaveLobby = useCallback(() => {
    lobby.disconnect()
    setIsHost(false)
    setScreen('home')
  }, [lobby])

  const handlePlaceCard = useCallback((cardIndex: number, row: number, col: number) => {
    lobby.placeCard(cardIndex, row, col)
  }, [lobby])

  const handleReturnToLobby = useCallback(() => {
    // Apply trade results to inventory
    if (lobby.state.tradeResult) {
      const tr = lobby.state.tradeResult
      const deltas = {
        gained: myDuelRole === 0 ? tr.player0Gained : myDuelRole === 1 ? tr.player1Gained : [],
        lost: myDuelRole === 0 ? tr.player0Lost : myDuelRole === 1 ? tr.player1Lost : [],
      }
      if (deltas.gained.length > 0 || deltas.lost.length > 0) {
        onInventoryChange(deltas)
      }

      // Update profile stats
      if (myDuelRole !== null && lobby.state.duelWinner !== null) {
        const winner = lobby.state.duelWinner
        let result: 'win' | 'loss' | 'draw' = 'draw'
        if (winner === myDuelRole) result = 'win'
        else if (winner !== 'draw') result = 'loss'

        const opponentId = myDuelRole === 0
          ? lobby.state.activeDuel?.player1Id
          : lobby.state.activeDuel?.player0Id
        const opponent = lobby.state.players.find(p => p.id === opponentId)
        const updated = recordMatch(profile, opponent?.profile.name || 'Unknown', result)
        setProfile(updated)
      }
    }

    lobby.returnToLobby()
  }, [lobby, myDuelRole, onInventoryChange, profile])

  // ─── Screens ───

  if (screen === 'profile') {
    return (
      <ProfileEditor
        profile={profile}
        worldState={worldState}
        onSave={handleProfileSave}
        onBack={() => setScreen('home')}
      />
    )
  }

  if (screen === 'lobby-browser') {
    return (
      <LobbyBrowser
        onJoin={handleJoinLobby}
        onBack={() => setScreen('home')}
      />
    )
  }

  if (screen === 'waiting-room') {
    return (
      <WaitingRoom
        lobbyState={lobby.state}
        isHost={isHost}
        worldInventory={worldState.inventory}
        savedDecks={savedDecks}
        onSetConfig={lobby.setConfig}
        onSelectHand={lobby.selectHand}
        onSelectDuellists={lobby.selectDuellists}
        onStartDuel={lobby.startDuel}
        onLeave={handleLeaveLobby}
        onUpdateDecks={onUpdateDecks}
      />
    )
  }

  if (screen === 'duel' && lobby.state.duelGameState) {
    const isDuellist = myDuelRole !== null
    return (
      <div className="mp-duel-screen">
        {!isDuellist && (
          <div className="mp-spectator-banner">Spectating</div>
        )}
        <GameBoard
          state={lobby.state.duelGameState}
          myPlayer={myDuelRole ?? 0}
          onPlace={isDuellist ? handlePlaceCard : () => {}}
          onPlayAgain={lobby.state.phase === 'rewards' ? handleReturnToLobby : undefined}
          hideEndOverlay={!isDuellist && lobby.state.phase !== 'rewards'}
        />
        {lobby.state.phase === 'rewards' && !isDuellist && (
          <div className="mp-spectator-result">
            {lobby.state.duelWinner === 'draw'
              ? 'Draw!'
              : `${lobby.state.players.find(p => p.id === (lobby.state.duelWinner === 0
                  ? lobby.state.activeDuel?.player0Id
                  : lobby.state.activeDuel?.player1Id
                ))?.profile.name || 'Player'} wins!`
            }
          </div>
        )}
        {lobby.state.phase === 'rewards' && (
          <button
            type="button"
            className="mp-return-btn"
            onClick={handleReturnToLobby}
          >
            Return to Lobby
          </button>
        )}
      </div>
    )
  }

  // ─── Home Screen ───
  return (
    <div className="mp-home">
      <div className="mp-home__header">
        <button type="button" className="mp-home__back" onClick={onBack}>Back</button>
        <h1 className="mp-home__title">2P Duel</h1>
      </div>

      <div className="mp-home__profile-display">
        <ProfileCard profile={profile} size="large" />
      </div>

      {error && <div className="mp-home__error">{error}</div>}

      <div className="mp-home__actions">
        <button type="button" className="mp-home__btn mp-home__btn--primary" onClick={handleHost}>
          Host
        </button>
        <button type="button" className="mp-home__btn mp-home__btn--primary" onClick={() => setScreen('lobby-browser')}>
          Join
        </button>
        <button type="button" className="mp-home__btn mp-home__btn--secondary" onClick={() => setScreen('profile')}>
          Profile
        </button>
      </div>
    </div>
  )
}
