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
import { getTutorialsForRules } from '../../data/tutorials'
import type { TutorialDef } from '../../data/tutorials'
import { createLobby } from '../../api/client'
import { isNativePlatform } from '../../transport'
import { useLobby } from '../../hooks/useLobby'
import { ProfileCard } from './ProfileCard'
import { ProfileEditor } from './ProfileEditor'
import { WaitingRoom } from './WaitingRoom'
import { LobbyBrowser } from './LobbyBrowser'
import { TutorialPopup } from '../TutorialPopup'
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
  seenTutorials,
  onMarkTutorialSeen,
}: MultiplayerHomeProps) {
  const [screen, setScreen] = useState<Screen>('home')
  const [profile, setProfile] = useState<PlayerProfile>(getOrCreateProfile)
  const [error, setError] = useState<string | null>(null)
  const [isHost, setIsHost] = useState(false)
  const [tutorialQueue, setTutorialQueue] = useState<TutorialDef[]>([])
  const [showingTutorial, setShowingTutorial] = useState(false)

  const lobby = useLobby(profile)

  // Determine if we're a duellist in the active duel
  const myDuelRole = useMemo((): PlayerId | null => {
    if (!lobby.state.activeDuel) return null
    if (profile.id === lobby.state.activeDuel.player0Id) return 0
    if (profile.id === lobby.state.activeDuel.player1Id) return 1
    return null
  }, [lobby.state.activeDuel, profile.id])

  // Switch to duel screen when duel starts — check for tutorials first
  useEffect(() => {
    if (lobby.state.phase === 'duelling' && lobby.state.duelGameState) {
      // Check for unseen tutorials for the active rules
      const isFirstDuel = !seenTutorials.includes('tut_basic_gameplay')
      const tutorials = getTutorialsForRules(
        lobby.state.config.specialRules,
        lobby.state.config.tradeRule,
        seenTutorials,
        isFirstDuel,
      )
      if (tutorials.length > 0) {
        setTutorialQueue(tutorials)
        setShowingTutorial(true)
      }
      setScreen('duel')
    }
  }, [lobby.state.phase, lobby.state.duelGameState, seenTutorials, lobby.state.config])

  // Return to waiting room after duel ends and return_to_waiting received
  useEffect(() => {
    if (lobby.state.phase === 'waiting' && screen === 'duel') {
      setScreen('waiting-room')
    }
  }, [lobby.state.phase, screen])

  const handleHost = useCallback(async () => {
    setError(null)
    try {
      if (isNativePlatform()) {
        // Android: host via BLE (no backend needed)
        const { BleHostTransport } = await import('../../transport/BleHostTransport')
        const bleHost = new BleHostTransport(profile)
        setIsHost(true)
        await lobby.connectWithTransport(bleHost)
        setScreen('waiting-room')
      } else {
        // Web: host via backend WebSocket
        const result = await createLobby(profile)
        setIsHost(true)
        await lobby.connect(result.lobbyId)
        setScreen('waiting-room')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create lobby')
    }
  }, [profile, lobby])

  const handleJoinLobby = useCallback(async (selectedLobby: LobbyInfo) => {
    setError(null)
    try {
      setIsHost(false)
      if (selectedLobby.id.startsWith('ble:')) {
        // BLE join: use native BleTransport on Android, WebBleTransport on desktop
        const { isNativePlatform } = await import('../../transport')
        let bleClient
        if (isNativePlatform()) {
          const { BleTransport } = await import('../../transport/BleTransport')
          bleClient = new BleTransport()
          const deviceId = selectedLobby.id.replace('ble:', '')
          await bleClient.connect(deviceId)
        } else {
          const { WebBleTransport } = await import('../../transport/WebBleTransport')
          bleClient = new WebBleTransport()
          await bleClient.connect('') // triggers browser device picker
        }
        await lobby.connectWithTransport(bleClient)
      } else {
        // WebSocket join
        await lobby.connect(selectedLobby.id)
      }
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

    // Show tutorial overlay before duel
    if (showingTutorial && tutorialQueue.length > 0) {
      return (
        <div className="mp-duel-screen">
          <TutorialPopup
            tutorial={tutorialQueue[0]}
            onComplete={() => {
              onMarkTutorialSeen(tutorialQueue[0].id)
              const remaining = tutorialQueue.slice(1)
              setTutorialQueue(remaining)
              if (remaining.length === 0) setShowingTutorial(false)
            }}
          />
        </div>
      )
    }

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
