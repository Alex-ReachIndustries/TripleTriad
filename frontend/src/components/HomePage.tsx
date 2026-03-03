type GameTab = 'world' | 'deck' | 'duel'

interface HomePageProps {
  onSelectMode: (tab: GameTab) => void
}

export function HomePage({ onSelectMode }: HomePageProps) {
  return (
    <div className="home-page">
      <h1 className="home-page-heading">Triple Triad</h1>
      <p className="home-page-sub">Choose a mode</p>
      <div className="home-mode-grid">
        <button
          type="button"
          className="home-mode-card"
          onClick={() => onSelectMode('world')}
          aria-label="World – explore the map, challenge NPCs, shops and tournaments"
        >
          <span className="home-mode-icon" aria-hidden>🗺</span>
          <span className="home-mode-name">World</span>
          <span className="home-mode-desc">Explore the map, challenge NPCs, shops & tournaments</span>
        </button>
        <button
          type="button"
          className="home-mode-card"
          onClick={() => onSelectMode('deck')}
          aria-label="Deck Builder – choose 5 cards from your collection"
        >
          <span className="home-mode-icon" aria-hidden>🃏</span>
          <span className="home-mode-name">Deck Builder</span>
          <span className="home-mode-desc">Choose 5 cards from your collection</span>
        </button>
        <button
          type="button"
          className="home-mode-card"
          onClick={() => onSelectMode('duel')}
          aria-label="Duel – play vs AI or 2P online"
        >
          <span className="home-mode-icon" aria-hidden>⚔</span>
          <span className="home-mode-name">Duel</span>
          <span className="home-mode-desc">Play vs AI or 2P online</span>
        </button>
      </div>
    </div>
  )
}
