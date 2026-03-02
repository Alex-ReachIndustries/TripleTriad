import { useState, useCallback, useEffect } from 'react'
import type { Area, Spot } from './types/world'
import { loadWorldState, saveWorldState, applyTradeRuleOne } from './data/worldState'
import { getTournamentAtLocation } from './data/shops'
import { getAreaById } from './data/world'
import cardsData from './data/cards.json'
import { DeckBuilder } from './components/DeckBuilder'
import { PlayPage } from './components/PlayPage'
import { WorldPage } from './components/WorldPage'
import { TitleScreen } from './components/TitleScreen'
import { HowToPlay } from './components/HowToPlay'
import { HomePage } from './components/HomePage'
import './App.css'

type AppView = 'title' | 'howto' | 'home' | 'game'
type GameTab = 'world' | 'deck' | 'duel'

function App() {
  const [view, setView] = useState<AppView>('title')
  const [tab, setTab] = useState<GameTab>('world')
  const [worldState, setWorldState] = useState(loadWorldState)
  const [worldChallengeLocation, setWorldChallengeLocation] = useState<Area | null>(null)
  const [tournamentPrize, setTournamentPrize] = useState<string | null>(null)

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
      const area = worldChallengeLocation  // capture before clearing
      setTournamentPrize(null)
      setWorldChallengeLocation(null)
      setWorldState((prev) => {
        let next = prev
        if (prize && winner === 0) {
          next = { ...next, collection: [...next.collection, prize] }
        }
        const afterTrade = prize
          ? next
          : winner === 'draw'
            ? next
            : applyTradeRuleOne(next, winner === 0, allCardIds)
        const unlockedOrder =
          !prize && winner === 0 ? Math.min(afterTrade.unlockedOrder + 1, 9) : afterTrade.unlockedOrder
        const gilReward = !prize && winner === 0 && area
          ? (getAreaById(area.id)?.gilReward ?? 0)
          : 0
        const npcWins = !prize && winner === 0 && area
          ? { ...afterTrade.npcWins, [area.id]: (afterTrade.npcWins[area.id] ?? 0) + 1 }
          : afterTrade.npcWins
        return { ...afterTrade, unlockedOrder, gil: afterTrade.gil + gilReward, npcWins }
      })
    },
    [allCardIds, tournamentPrize, worldChallengeLocation]
  )

  const handleLeaveWorldChallenge = useCallback(() => {
    setWorldChallengeLocation(null)
    setTournamentPrize(null)
  }, [])

  const handleBuyCard = useCallback((cardId: string, price: number) => {
    setWorldState((prev) => {
      if (prev.gil < price) return prev
      if (prev.collection.includes(cardId)) return prev  // already owned
      return { ...prev, gil: prev.gil - price, collection: [...prev.collection, cardId] }
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

  const handleSelectMode = useCallback((selectedTab: GameTab) => {
    setTab(selectedTab)
    setView('game')
  }, [])

  const handleBackToHome = useCallback(() => {
    setView('home')
  }, [])

  if (view === 'title') {
    return (
      <div className="app">
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <main id="main-content">
          <TitleScreen onStart={() => setView('home')} onHowToPlay={() => setView('howto')} />
        </main>
      </div>
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
          onClick={handleBackToHome}
          aria-label="Back to mode selection"
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
          Deck Builder
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
          <WorldPage
            unlockedOrder={worldState.unlockedOrder}
            gil={worldState.gil}
            collection={worldState.collection}
            npcWins={worldState.npcWins}
            onChallenge={handleWorldChallenge}
            onBuyCard={handleBuyCard}
            onEnterTournament={handleEnterTournament}
          />
        )}
        {tab === 'deck' && <DeckBuilder collection={worldState.collection} />}
        {tab === 'duel' && (
          <PlayPage
            worldChallengeLocation={worldChallengeLocation}
            tournamentPrize={tournamentPrize}
            onWorldMatchEnd={handleWorldMatchEnd}
            onLeaveWorldChallenge={handleLeaveWorldChallenge}
            worldPlayerCollection={worldState.collection}
          />
        )}
      </main>
    </div>
  )
}

export default App
