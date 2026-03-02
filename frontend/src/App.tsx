import { useState } from 'react'
import { DeckBuilder } from './components/DeckBuilder'
import { PlayPage } from './components/PlayPage'
import './App.css'

function App() {
  const [tab, setTab] = useState<'deck' | 'play'>('deck')
  return (
    <div className="app">
      <nav className="app-nav">
        <button type="button" className={tab === 'deck' ? 'active' : ''} onClick={() => setTab('deck')}>
          Deck Builder
        </button>
        <button type="button" className={tab === 'play' ? 'active' : ''} onClick={() => setTab('play')}>
          Play
        </button>
      </nav>
      {tab === 'deck' && <DeckBuilder />}
      {tab === 'play' && <PlayPage />}
    </div>
  )
}

export default App
