import { useState, useCallback, useEffect } from 'react'
import type { Area, Spot } from './types/world'
import { loadWorldState, saveWorldState, applyTradeRuleOne, addToInventory, removeFromInventory, getOwnedCardIds, isStarterCard, acceptQuest, claimQuestReward } from './data/worldState'
import { getTournamentAtLocation } from './data/shops'
import { getAreaById, getNpcById } from './data/world'
import cardsData from './data/cards.json'
import { DeckManager } from './components/DeckManager'
import { PlayPage } from './components/PlayPage'
import { WorldMode } from './components/world/WorldMode'
import { TitleScreen } from './components/TitleScreen'
import { HowToPlay } from './components/HowToPlay'
import { HomePage } from './components/HomePage'
import { StoryCutscene, OPENING_PANELS } from './components/StoryCutscene'
import './App.css'

type AppView = 'title' | 'howto' | 'home' | 'game' | 'cutscene'
type GameTab = 'world' | 'deck' | 'duel'

const STORAGE_KEY = 'tripletriad-world'

function hasSaveData(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null
  } catch {
    return false
  }
}

function App() {
  const [view, setView] = useState<AppView>('title')
  const [tab, setTab] = useState<GameTab>('world')
  const [worldState, setWorldState] = useState(loadWorldState)
  const [worldChallengeLocation, setWorldChallengeLocation] = useState<Area | null>(null)
  const [tournamentPrize, setTournamentPrize] = useState<string | null>(null)
  const [duelNpcId, setDuelNpcId] = useState<string | null>(null)
  const [saveExists, setSaveExists] = useState(hasSaveData)

  useEffect(() => {
    saveWorldState(worldState)
  }, [worldState])

  const handleWorldChallenge = useCallback((area: Area) => {
    setWorldChallengeLocation(area)
    setTab('duel')
  }, [])

  const allCardIds = (cardsData as { cards: { id: string }[] }).cards.map((c) => c.id)

  const handleWorldMatchEnd = useCallback(
    (winner: 0 | 1 | 'draw') => {
      const prize = tournamentPrize
      const area = worldChallengeLocation
      const npcId = duelNpcId
      setTournamentPrize(null)
      setWorldChallengeLocation(null)
      setDuelNpcId(null)
      setWorldState((prev) => {
        let next = prev
        if (prize && winner === 0) {
          next = { ...next, inventory: addToInventory(next.inventory, prize) }
        }
        const afterTrade = prize
          ? next
          : winner === 'draw'
            ? next
            : applyTradeRuleOne(next, winner === 0, allCardIds)
        const unlockedOrder =
          !prize && winner === 0 ? Math.min(afterTrade.unlockedOrder + 1, 9) : afterTrade.unlockedOrder
        // Gil reward from the NPC data
        const npc = npcId ? getNpcById(npcId) : null
        const gilReward = !prize && winner === 0
          ? (npc?.gilReward ?? (area ? (getAreaById(area.id)?.gilReward ?? 0) : 0))
          : 0
        // Track wins by NPC ID (V3) with fallback to area ID (legacy)
        const winKey = npcId ?? area?.id
        const npcWins = !prize && winner === 0 && winKey
          ? { ...afterTrade.npcWins, [winKey]: (afterTrade.npcWins[winKey] ?? 0) + 1 }
          : afterTrade.npcWins
        return { ...afterTrade, unlockedOrder, gil: afterTrade.gil + gilReward, npcWins }
      })
    },
    [allCardIds, tournamentPrize, worldChallengeLocation, duelNpcId]
  )

  const handleLeaveWorldChallenge = useCallback(() => {
    setWorldChallengeLocation(null)
    setTournamentPrize(null)
    setDuelNpcId(null)
  }, [])

  const handleBuyCard = useCallback((cardId: string, price: number) => {
    setWorldState((prev) => {
      if (prev.gil < price) return prev
      return { ...prev, gil: prev.gil - price, inventory: addToInventory(prev.inventory, cardId) }
    })
  }, [])

  const handleSellCard = useCallback((cardId: string, sellPrice: number) => {
    setWorldState((prev) => {
      const count = prev.inventory[cardId] ?? 0
      const minCount = isStarterCard(cardId) ? 1 : 0
      if (count <= minCount) return prev // Can't sell
      return { ...prev, gil: prev.gil + sellPrice, inventory: removeFromInventory(prev.inventory, cardId) }
    })
  }, [])

  const handleEnterTournament = useCallback((spot: Spot) => {
    const tournament = getTournamentAtLocation(spot.id)
    if (!tournament || worldState.gil < tournament.entryFee) return
    setWorldState((prev) => ({ ...prev, gil: prev.gil - tournament.entryFee }))
    const prize = tournament.prizePool[Math.floor(Math.random() * tournament.prizePool.length)]
    setTournamentPrize(prize)
    setTab('duel')
  }, [worldState.gil])

  // V3: NPC-based duel initiation from world mode
  const handleWorldInitiateDuel = useCallback((npcId: string, locationId: string) => {
    const npc = getNpcById(npcId)
    if (!npc) return
    // Build a pseudo-Area for PlayPage compatibility
    const area: Area = {
      id: locationId,
      name: npc.name,
      regionId: '',
      type: 'town',
      order: 0,
      mapX: 0,
      mapY: 0,
      unlockCondition: null,
      opponentName: npc.name,
      opponentDeckPool: npc.deckPool,
      gilReward: npc.gilReward,
      difficultyTier: npc.difficultyTier,
    }
    // Store NPC id for proper npcWins tracking
    setDuelNpcId(npcId)
    setWorldChallengeLocation(area)
    setTab('duel')
  }, [])

  // V3: NPC-based tournament entry from world mode
  const handleWorldEnterTournament = useCallback((npcId: string, _locationId: string) => {
    const tournament = getTournamentAtLocation(npcId)
    if (!tournament || worldState.gil < tournament.entryFee) return
    setWorldState((prev) => ({ ...prev, gil: prev.gil - tournament.entryFee }))
    const prize = tournament.prizePool[Math.floor(Math.random() * tournament.prizePool.length)]
    setTournamentPrize(prize)
    setTab('duel')
  }, [worldState.gil])

  // V3: Quest accept/claim
  const handleAcceptQuest = useCallback((questId: string) => {
    setWorldState((prev) => acceptQuest(prev, questId))
  }, [])

  const handleClaimQuest = useCallback((questId: string) => {
    setWorldState((prev) => claimQuestReward(prev, questId))
  }, [])

  const handleSelectMode = useCallback((selectedTab: GameTab) => {
    setTab(selectedTab)
    setView('game')
  }, [])

  const handleBackToHome = useCallback(() => {
    setView('home')
  }, [])

  const handleNewGame = useCallback(() => {
    // Reset world state for a fresh start, then show cutscene
    localStorage.removeItem(STORAGE_KEY)
    setWorldState(loadWorldState())
    setSaveExists(true) // Will exist after cutscene completes and state saves
    setView('cutscene')
  }, [])

  const handleContinue = useCallback(() => {
    setTab('world')
    setView('game')
  }, [])

  const handleCutsceneComplete = useCallback(() => {
    setTab('world')
    setView('game')
  }, [])

  const handle2PDuel = useCallback(() => {
    setTab('duel')
    setView('game')
  }, [])

  // Derive owned card IDs from inventory for components that need string[]
  const ownedCardIds = getOwnedCardIds(worldState.inventory)

  if (view === 'title') {
    return (
      <div className="app">
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <main id="main-content">
          <TitleScreen
            onNewGame={handleNewGame}
            onContinue={handleContinue}
            onHowToPlay={() => setView('howto')}
            on2PDuel={handle2PDuel}
            hasSaveData={saveExists}
          />
        </main>
      </div>
    )
  }

  if (view === 'cutscene') {
    return (
      <StoryCutscene panels={OPENING_PANELS} onComplete={handleCutsceneComplete} />
    )
  }

  if (view === 'home') {
    return (
      <div className="app">
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <main id="main-content">
          <HomePage onSelectMode={handleSelectMode} />
        </main>
      </div>
    )
  }

  if (view === 'howto') {
    return (
      <div className="app">
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <main id="main-content">
          <HowToPlay onBack={() => setView('title')} />
        </main>
      </div>
    )
  }

  return (
    <div className="app">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <nav className="app-nav" aria-label="Main navigation">
        <button
          type="button"
          className="app-nav-home"
          onClick={() => setView('title')}
          aria-label="Back to title screen"
        >
          Home
        </button>
        <button
          type="button"
          className={tab === 'world' ? 'active' : ''}
          onClick={() => setTab('world')}
          aria-current={tab === 'world' ? 'page' : undefined}
        >
          World
        </button>
        <button
          type="button"
          className={tab === 'deck' ? 'active' : ''}
          onClick={() => setTab('deck')}
          aria-current={tab === 'deck' ? 'page' : undefined}
        >
          Decks
        </button>
        <button
          type="button"
          className={tab === 'duel' ? 'active' : ''}
          onClick={() => setTab('duel')}
          aria-current={tab === 'duel' ? 'page' : undefined}
        >
          Duel
        </button>
      </nav>
      <main id="main-content">
        {tab === 'world' && (
          <WorldMode
            worldState={worldState}
            onInitiateDuel={handleWorldInitiateDuel}
            onBuyCard={handleBuyCard}
            onSellCard={handleSellCard}
            onEnterTournament={handleWorldEnterTournament}
            onAcceptQuest={handleAcceptQuest}
            onClaimQuest={handleClaimQuest}
          />
        )}
        {tab === 'deck' && (
          <DeckManager
            savedDecks={worldState.savedDecks}
            inventory={worldState.inventory}
            onUpdateDecks={(decks) => setWorldState(prev => ({ ...prev, savedDecks: decks }))}
            onBack={() => setTab('world')}
          />
        )}
        {tab === 'duel' && (
          <PlayPage
            worldChallengeLocation={worldChallengeLocation}
            tournamentPrize={tournamentPrize}
            onWorldMatchEnd={handleWorldMatchEnd}
            onLeaveWorldChallenge={handleLeaveWorldChallenge}
            worldPlayerInventory={worldState.inventory}
            savedDecks={worldState.savedDecks}
            lastDeckId={worldState.lastDeckId}
            onSetLastDeckId={(deckId) => setWorldState(prev => ({ ...prev, lastDeckId: deckId }))}
            onUpdateDecks={(decks) => setWorldState(prev => ({ ...prev, savedDecks: decks }))}
          />
        )}
      </main>
    </div>
  )
}

export default App
