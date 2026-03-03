interface HowToPlayProps {
  onBack: () => void
}

/** Mini card diagram showing rank positions. */
function CardDiagram() {
  return (
    <div className="htp-card-diagram" aria-label="Card anatomy: top rank at top, right rank on right, bottom rank at bottom, left rank on left">
      <div className="htp-card-body">
        <span className="htp-rank htp-rank-top">5</span>
        <span className="htp-rank htp-rank-right">3</span>
        <span className="htp-rank htp-rank-bottom">2</span>
        <span className="htp-rank htp-rank-left">7</span>
        <span className="htp-card-name">Card</span>
      </div>
      <div className="htp-card-labels">
        <span className="htp-label htp-label-top">Top</span>
        <span className="htp-label htp-label-right">Right</span>
        <span className="htp-label htp-label-bottom">Bottom</span>
        <span className="htp-label htp-label-left">Left</span>
      </div>
    </div>
  )
}

/** Step-by-step capture diagram. */
function CaptureDiagram() {
  return (
    <div className="htp-capture-steps" aria-label="Capture example: place a card with higher rank adjacent to opponent's card to capture it">
      <div className="htp-step">
        <div className="htp-step-number">1</div>
        <div className="htp-mini-board">
          <div className="htp-cell htp-cell-empty" />
          <div className="htp-cell htp-cell-empty" />
          <div className="htp-cell htp-cell-empty" />
          <div className="htp-cell htp-cell-empty" />
          <div className="htp-cell htp-cell-red">
            <span className="htp-mini-rank t">3</span>
            <span className="htp-mini-rank r">2</span>
            <span className="htp-mini-rank b">5</span>
            <span className="htp-mini-rank l">4</span>
          </div>
          <div className="htp-cell htp-cell-empty" />
          <div className="htp-cell htp-cell-empty" />
          <div className="htp-cell htp-cell-empty" />
          <div className="htp-cell htp-cell-empty" />
        </div>
        <p>Opponent plays a card</p>
      </div>
      <div className="htp-step-arrow" aria-hidden>&rarr;</div>
      <div className="htp-step">
        <div className="htp-step-number">2</div>
        <div className="htp-mini-board">
          <div className="htp-cell htp-cell-empty" />
          <div className="htp-cell htp-cell-empty" />
          <div className="htp-cell htp-cell-empty" />
          <div className="htp-cell htp-cell-blue htp-cell-new">
            <span className="htp-mini-rank t">4</span>
            <span className="htp-mini-rank r">7</span>
            <span className="htp-mini-rank b">2</span>
            <span className="htp-mini-rank l">3</span>
          </div>
          <div className="htp-cell htp-cell-red">
            <span className="htp-mini-rank t">3</span>
            <span className="htp-mini-rank r">2</span>
            <span className="htp-mini-rank b">5</span>
            <span className="htp-mini-rank l">4</span>
          </div>
          <div className="htp-cell htp-cell-empty" />
          <div className="htp-cell htp-cell-empty" />
          <div className="htp-cell htp-cell-empty" />
          <div className="htp-cell htp-cell-empty" />
        </div>
        <p>You place a card. Your right (<strong>7</strong>) vs their left (<strong>4</strong>)</p>
      </div>
      <div className="htp-step-arrow" aria-hidden>&rarr;</div>
      <div className="htp-step">
        <div className="htp-step-number">3</div>
        <div className="htp-mini-board">
          <div className="htp-cell htp-cell-empty" />
          <div className="htp-cell htp-cell-empty" />
          <div className="htp-cell htp-cell-empty" />
          <div className="htp-cell htp-cell-blue">
            <span className="htp-mini-rank t">4</span>
            <span className="htp-mini-rank r">7</span>
            <span className="htp-mini-rank b">2</span>
            <span className="htp-mini-rank l">3</span>
          </div>
          <div className="htp-cell htp-cell-blue htp-cell-captured">
            <span className="htp-mini-rank t">3</span>
            <span className="htp-mini-rank r">2</span>
            <span className="htp-mini-rank b">5</span>
            <span className="htp-mini-rank l">4</span>
          </div>
          <div className="htp-cell htp-cell-empty" />
          <div className="htp-cell htp-cell-empty" />
          <div className="htp-cell htp-cell-empty" />
          <div className="htp-cell htp-cell-empty" />
        </div>
        <p>7 &gt; 4 — <strong>Captured!</strong> Card flips to your color</p>
      </div>
    </div>
  )
}

/** Special rules quick reference. */
function SpecialRulesGrid() {
  const rules = [
    { name: 'Same', desc: 'When placed card has same rank as 2+ adjacent cards on touching sides, all matching cards are captured.', icon: '=' },
    { name: 'Plus', desc: 'When sums of touching ranks on 2+ sides are equal, those adjacent cards are captured.', icon: '+' },
    { name: 'Combo', desc: 'Cards captured by Same or Plus then trigger normal capture checks against their neighbors.', icon: '\u26A1' },
    { name: 'Same Wall', desc: 'Board edges count as rank A (10) for Same rule. Placing next to a wall counts as matching A.', icon: '\u258A' },
    { name: 'Elemental', desc: 'Board spaces have elements. Matching element: +1 to all ranks. Mismatching: -1 to all ranks.', icon: '\uD83D\uDD25' },
    { name: 'Random', desc: 'Your hand is randomly selected from your deck instead of you choosing.', icon: '\uD83C\uDFB2' },
    { name: 'Open', desc: "Both players can see each other's hands throughout the game.", icon: '\uD83D\uDC41' },
    { name: 'Sudden Death', desc: 'If the game is a draw, play again. Each player keeps the cards they currently own.', icon: '\uD83D\uDC80' },
  ]

  return (
    <div className="htp-rules-grid">
      {rules.map((rule) => (
        <div key={rule.name} className="htp-rule-card">
          <div className="htp-rule-icon" aria-hidden>{rule.icon}</div>
          <h3>{rule.name}</h3>
          <p>{rule.desc}</p>
        </div>
      ))}
    </div>
  )
}

export function HowToPlay({ onBack }: HowToPlayProps) {
  return (
    <div className="how-to-play-v3">
      <header className="htp-header">
        <button type="button" className="htp-back-btn" onClick={onBack}>
          &larr; Back
        </button>
        <h1>How to Play</h1>
      </header>

      <section aria-labelledby="htp-overview">
        <h2 id="htp-overview">Overview</h2>
        <p>
          Triple Triad is a two-player card game on a <strong>3x3 grid</strong>. Each player has <strong>5 cards</strong>.
          Place one card per turn. The goal: end with <strong>more cards than your opponent</strong> by capturing theirs.
        </p>
      </section>

      <section aria-labelledby="htp-anatomy">
        <h2 id="htp-anatomy">Card Anatomy</h2>
        <p>Each card has four ranks (1-A) on each side. When two cards are adjacent, the touching ranks are compared.</p>
        <CardDiagram />
      </section>

      <section aria-labelledby="htp-capture">
        <h2 id="htp-capture">How Capturing Works</h2>
        <p>Place your card next to an opponent's. If your touching rank is <strong>higher</strong>, you capture their card.</p>
        <CaptureDiagram />
      </section>

      <section aria-labelledby="htp-special">
        <h2 id="htp-special">Special Rules</h2>
        <p>Different regions have different rules that modify gameplay:</p>
        <SpecialRulesGrid />
      </section>

      <section aria-labelledby="htp-world">
        <h2 id="htp-world">World Mode</h2>
        <ul>
          <li><strong>Explore:</strong> Travel across 7 regions with unique rules and trade rules.</li>
          <li><strong>Challenge NPCs:</strong> Duel opponents to win cards and gil.</li>
          <li><strong>Shops:</strong> Buy and sell cards to build your collection.</li>
          <li><strong>Tournaments:</strong> Pay an entry fee for a chance to win rare cards.</li>
          <li><strong>Side Quests:</strong> NPCs may ask you to find cards or defeat other NPCs for rewards.</li>
          <li><strong>Dungeons:</strong> Battle through sequential floors to reach a boss for big rewards.</li>
        </ul>
      </section>

      <button type="button" className="htp-back-btn htp-back-bottom" onClick={onBack}>
        &larr; Back to Title
      </button>
    </div>
  )
}
