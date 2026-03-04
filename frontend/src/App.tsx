import { useState, useCallback, useEffect } from 'react'
import { loadWorldState, saveWorldState, addToInventory, markDiscovered, isStarterCard, acceptQuest, claimQuestReward, removeCardAndCleanHand, spreadRuleToRegion, abolishRuleFromRegion } from './data/worldState'
import { getTournamentAtLocation } from './data/shops'
import { getNpcById } from './data/world'
import { DeckManager } from './components/DeckManager'
import { PlayPage } from './components/PlayPage'
import { BattleScreen, type BattleResult } from './components/BattleScreen'
import { WorldMode } from './components/world/WorldMode'
import { QuestLog } from './components/world/QuestLog'
import { TitleScreen } from './components/TitleScreen'
import { HowToPlay } from './components/HowToPlay'
import { HomePage } from './components/HomePage'
import { StoryCutscene, OPENING_PANELS } from './components/StoryCutscene'
import { TutorialsMenu } from './components/TutorialsMenu'
import { SettingsScreen, loadSettings, applySettingsToDOM } from './components/SettingsScreen'
import './App.css'

type AppView = 'title' | 'howto' | 'home' | 'game' | 'cutscene' | 'settings'
type GameTab = 'world' | 'deck' | 'quests' | 'duel' | 'battle' | 'guide'

const STORAGE_KEY = 'tripletriad-world'

function hasSaveData(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null
  } catch {
    return false
  }
}

interface BattleContext {
  npcId: string
  locationId: string
  tournamentPrize: string | null
}

function App() {
  const [view, setView] = useState<AppView>('title')
  const [tab, setTab] = useState<GameTab>('world')
  const [worldState, setWorldState] = useState(loadWorldState)
  const [battleContext, setBattleContext] = useState<BattleContext | null>(null)
  const [saveExists, setSaveExists] = useState(hasSaveData)

  // Apply saved settings on mount
  useEffect(() => {
    applySettingsToDOM(loadSettings())
  }, [])

  useEffect(() => {
    saveWorldState(worldState)
  }, [worldState])

  const handleBuyCard = useCallback((cardId: string, price: number) => {
    setWorldState((prev) => {
      if (prev.gil < price) return prev
      return { ...prev, gil: prev.gil - price, inventory: addToInventory(prev.inventory, cardId), discoveredCards: markDiscovered(prev.discoveredCards, cardId) }
    })
  }, [])

  const handleSellCard = useCallback((cardId: string, sellPrice: number) => {
    setWorldState((prev) => {
      const count = prev.inventory[cardId] ?? 0
      const minCount = isStarterCard(cardId) ? 1 : 0
      if (count <= minCount) return prev
      const next = removeCardAndCleanHand(prev, cardId)
      return { ...next, gil: next.gil + sellPrice }
    })
  }, [])

  // V3: NPC-based duel initiation from world mode → route to BattleScreen
  const handleWorldInitiateDuel = useCallback((npcId: string, locationId: string) => {
    const npc = getNpcById(npcId)
    if (!npc) return
    setBattleContext({ npcId, locationId, tournamentPrize: null })
    setTab('battle')
  }, [])

  // V3: NPC-based tournament entry from world mode → route to BattleScreen
  const handleWorldEnterTournament = useCallback((npcId: string, _locationId: string) => {
    const tournament = getTournamentAtLocation(npcId)
    if (!tournament || worldState.gil < tournament.entryFee) return
    setWorldState((prev) => ({ ...prev, gil: prev.gil - tournament.entryFee }))
    const prize = tournament.prizePool[Math.floor(Math.random() * tournament.prizePool.length)]
    setBattleContext({ npcId, locationId: npcId, tournamentPrize: prize })
    setTab('battle')
  }, [worldState.gil])

  // Battle complete: apply rewards and return to world
  const handleBattleComplete = useCallback((result: BattleResult) => {
    setBattleContext(null)
    setWorldState((prev) => {
      let next = prev

      // Gil reward
      if (result.gilReward > 0) {
        next = { ...next, gil: next.gil + result.gilReward }
      }

      // Tournament prize
      if (result.isTournament && result.tournamentPrize && result.winner === 0) {
        next = { ...next, inventory: addToInventory(next.inventory, result.tournamentPrize), discoveredCards: markDiscovered(next.discoveredCards, result.tournamentPrize) }
      }

      // Trade rule: apply all gained/lost cards
      if (!result.isTournament) {
        for (const cardId of result.cardsGained) {
          next = { ...next, inventory: addToInventory(next.inventory, cardId), discoveredCards: markDiscovered(next.discoveredCards, cardId) }
        }
        for (const cardId of result.cardsLost) {
          next = removeCardAndCleanHand(next, cardId)
        }
      }

      // Track NPC wins
      if (result.winner === 0 && result.npcId) {
        const key = result.npcId
        next = { ...next, npcWins: { ...next.npcWins, [key]: (next.npcWins[key] ?? 0) + 1 } }
      }

      // Unlock progression
      if (!result.isTournament && result.winner === 0) {
        next = { ...next, unlockedOrder: Math.min(next.unlockedOrder + 1, 9) }
      }

      return next
    })
    setTab('world')
  }, [])

  const handleBattleCancel = useCallback(() => {
    setBattleContext(null)
    setTab('world')
    // Don't clear worldReturnScreen — user cancelled, return to where they were
  }, [])

  // V3: Quest accept/claim
  const handleAcceptQuest = useCallback((questId: string) => {
    setWorldState((prev) => acceptQuest(prev, questId))
  }, [])

  const handleClaimQuest = useCallback((questId: string) => {
    setWorldState((prev) => claimQuestReward(prev, questId))
  }, [])

  // Queen of Cards: spread/abolish rules for a gil cost
  const handleSpreadRule = useCallback((rule: import('./types/world').SpecialRule, regionId: string) => {
    setWorldState((prev) => {
      if (prev.gil < 1000) return prev
      return { ...spreadRuleToRegion(prev, rule, regionId), gil: prev.gil - 1000 }
    })
  }, [])

  const handleAbolishRule = useCallback((rule: import('./types/world').SpecialRule, regionId: string) => {
    setWorldState((prev) => {
      if (prev.gil < 500) return prev
      return { ...abolishRuleFromRegion(prev, rule, regionId), gil: prev.gil - 500 }
    })
  }, [])

  const handleSelectMode = useCallback((selectedTab: GameTab) => {
    setTab(selectedTab)
    setView('game')
  }, [])

  const handleNewGame = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setWorldState(loadWorldState())
    setSaveExists(true)
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
            onSettings={() => setView('settings')}
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

  if (view === 'settings') {
    return (
      <div className="app">
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <main id="main-content">
          <SettingsScreen onBack={() => setView('title')} />
        </main>
      </div>
    )
  }

  return (
    <div className="app app-game">
      <a href="#main-content" className="skip-link">Skip to main content</a>
        <nav className="app-nav" aria-label="Main navigation" style={{ display: tab === 'battle' || tab === 'duel' ? 'none' : undefined }}>
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
            Collection
          </button>
          <button
            type="button"
            className={tab === 'quests' ? 'active' : ''}
            onClick={() => setTab('quests')}
            aria-current={tab === 'quests' ? 'page' : undefined}
          >
            Quests
          </button>
          <button
            type="button"
            className={tab === 'guide' ? 'active' : ''}
            onClick={() => setTab('guide')}
            aria-current={tab === 'guide' ? 'page' : undefined}
          >
            Guide
          </button>
        </nav>
      <main id="main-content">
        <div style={{ display: tab === 'world' ? undefined : 'none' }}>
          <WorldMode
            worldState={worldState}
            onInitiateDuel={handleWorldInitiateDuel}
            onBuyCard={handleBuyCard}
            onSellCard={handleSellCard}
            onEnterTournament={handleWorldEnterTournament}
            onAcceptQuest={handleAcceptQuest}
            onClaimQuest={handleClaimQuest}
            onSpreadRule={handleSpreadRule}
            onAbolishRule={handleAbolishRule}
          />
        </div>
        {tab === 'deck' && (
          <DeckManager
            savedDecks={worldState.savedDecks}
            inventory={worldState.inventory}
            discoveredCards={worldState.discoveredCards}
            onUpdateDecks={(decks) => setWorldState(prev => ({ ...prev, savedDecks: decks }))}
            onBack={() => setTab('world')}
          />
        )}
        {tab === 'quests' && (
          <QuestLog
            worldState={worldState}
            onBack={() => setTab('world')}
          />
        )}
        {tab === 'duel' && (
          <PlayPage
            worldPlayerInventory={worldState.inventory}
            discoveredCards={worldState.discoveredCards}
            savedDecks={worldState.savedDecks}
            lastDeckId={worldState.lastDeckId}
            onSetLastDeckId={(deckId) => setWorldState(prev => ({ ...prev, lastDeckId: deckId }))}
            onUpdateDecks={(decks) => setWorldState(prev => ({ ...prev, savedDecks: decks }))}
          />
        )}
        {tab === 'guide' && (
          <TutorialsMenu
            seenTutorials={worldState.seenTutorials}
            onBack={() => setTab('world')}
          />
        )}
        {tab === 'battle' && battleContext && (
          <BattleScreen
            npcId={battleContext.npcId}
            npc={getNpcById(battleContext.npcId) ?? null}
            locationId={battleContext.locationId}
            tournamentPrize={battleContext.tournamentPrize}
            worldPlayerInventory={worldState.inventory}
            lastHand={worldState.lastHand}
            storyChapter={worldState.storyChapter}
            lastPlayedRegionId={worldState.lastPlayedRegionId}
            regionRuleMods={worldState.regionRuleMods}
            onSetLastHand={(hand) => setWorldState(prev => ({ ...prev, lastHand: hand }))}
            onRuleSpread={(newMods) => setWorldState(prev => ({ ...prev, regionRuleMods: newMods }))}
            onDuelRegionUpdate={(regionId) => setWorldState(prev => ({ ...prev, lastPlayedRegionId: regionId }))}
            onMatchComplete={handleBattleComplete}
            onCancel={handleBattleCancel}
            seenTutorials={worldState.seenTutorials}
            onMarkTutorialSeen={(tutorialId) => setWorldState(prev => ({
              ...prev,
              seenTutorials: prev.seenTutorials.includes(tutorialId) ? prev.seenTutorials : [...prev.seenTutorials, tutorialId],
            }))}
          />
        )}
      </main>
    </div>
  )
}

export default App
