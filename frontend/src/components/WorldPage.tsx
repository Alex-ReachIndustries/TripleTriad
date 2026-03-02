import { useState } from 'react'
import type { Area, Spot } from '../types/world'
import { getAreas, getRegionById, getSpots, formatRules } from '../data/world'
import { getCharactersAtLocation } from '../data/characters'
import { getShopAtLocation, getTournamentAtLocation } from '../data/shops'
import { isStarterCard } from '../data/worldState'
import cardsData from '../data/cards.json'

const cardNameById = (cardsData as { cards: { id: string; name: string }[] }).cards.reduce(
  (acc, c) => { acc[c.id] = c.name; return acc },
  {} as Record<string, string>
)

interface WorldPageProps {
  unlockedOrder: number
  gil: number
  inventory: Record<string, number>
  npcWins: Record<string, number>
  onChallenge: (area: Area) => void
  onBuyCard: (cardId: string, price: number) => void
  onSellCard: (cardId: string, sellPrice: number) => void
  onEnterTournament: (spot: Spot) => void
}

export function WorldPage({ unlockedOrder, gil, inventory, npcWins, onChallenge, onBuyCard, onSellCard, onEnterTournament }: WorldPageProps) {
  const areas = getAreas()
  const totalAreas = areas.length
  const [selected, setSelected] = useState<Area | null>(null)
  const [hoveredAreaId, setHoveredAreaId] = useState<string | null>(null)

  const progressPct = Math.round(((unlockedOrder + 1) / totalAreas) * 100)

  return (
    <div className="world-page">
      <div className="world-header">
        <h1>World Map</h1>
        <p className="world-gil" aria-live="polite">Gil: <strong>{gil}</strong></p>
      </div>

      {/* Progress indicator */}
      <div className="world-progress" aria-label={`Progress: ${unlockedOrder + 1} of ${totalAreas} areas unlocked`}>
        <span className="world-progress-label">Areas: {unlockedOrder + 1} / {totalAreas}</span>
        <div className="world-progress-track" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100} aria-label="World progression">
          <div className="world-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <p className="world-intro">Click a marker on the map to view an area. Win matches to unlock new areas.</p>
      <section className="world-map-section" aria-label="World map">
        <div className="world-map-container">
          <img
            src="/map/world.jpg"
            alt="Final Fantasy VIII world map"
            className="world-map-image"
          />
          {areas.map((area) => {
            const unlocked = area.order <= unlockedOrder
            const isNewest = unlocked && area.order === unlockedOrder && unlockedOrder > 0
            const region = getRegionById(area.regionId)
            const spots = getSpots(area.id)
            const hasShop = spots.some((s) => s.type === 'shop')
            const hasTournament = spots.some((s) => s.type === 'tournament')
            const showTooltip = hoveredAreaId === area.id && region
            return (
              <div
                key={area.id}
                className="world-map-marker-wrap"
                style={{ left: `${area.mapX}%`, top: `${area.mapY}%` }}
                onMouseEnter={() => setHoveredAreaId(area.id)}
                onMouseLeave={() => setHoveredAreaId(null)}
              >
                <button
                  type="button"
                  className={`world-map-marker ${selected?.id === area.id ? 'selected' : ''} ${unlocked ? '' : 'locked'} ${isNewest ? 'is-new' : ''}`}
                  onClick={() => unlocked && setSelected(area)}
                  disabled={!unlocked}
                  aria-pressed={selected?.id === area.id}
                  aria-label={unlocked ? `${area.name}, ${region?.name ?? ''}. Select to view.` : `${area.name} (locked)`}
                  aria-describedby={showTooltip ? `region-rules-${area.id}` : undefined}
                  onFocus={() => setHoveredAreaId(area.id)}
                  onBlur={() => setHoveredAreaId(null)}
                >
                  <span className="world-map-marker-dot" aria-hidden />
                  <span className="world-map-marker-label">
                    {unlocked ? area.name : <>🔒 ???</>}
                  </span>
                </button>
                {showTooltip && (
                  <div
                    id={`region-rules-${area.id}`}
                    className="world-map-marker-tooltip"
                    role="tooltip"
                  >
                    <strong>{region.name}</strong>
                    <span>Rules: {formatRules(region.rules)}</span>
                    <span>Trade: {region.tradeRule}</span>
                    {hasShop && <span className="world-map-tooltip-shop">Shop</span>}
                    {hasTournament && <span className="world-map-tooltip-tournament">Tournament</span>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {selected && (
        <section className="location-detail" aria-labelledby="location-detail-heading">
          <h2 id="location-detail-heading">{selected.name}</h2>
          {(() => {
            const region = getRegionById(selected.regionId)
            const characters = getCharactersAtLocation(selected.id)
            const spots = getSpots(selected.id)
            if (!region) return null
            return (
              <>
                <div className="detail-region-info">
                  <span><strong>Region:</strong> {region.name}</span>
                  <span><strong>Rules:</strong> {formatRules(region.rules)}</span>
                  <span><strong>Trade:</strong> {region.tradeRule}</span>
                </div>

                {characters.length > 0 && (
                  <div className="detail-section" aria-label="Characters at this area">
                    <h3 className="detail-section-heading">👥 Characters</h3>
                    <ul className="character-dialogue-list">
                      {characters.map((ch) => (
                        <li key={ch.id} className="character-dialogue">
                          <div className="character-dialogue-content">
                            <img
                              src={ch.imagePath ?? `/characters/${ch.id}.png`}
                              alt=""
                              className="character-portrait"
                              onError={(e) => { e.currentTarget.style.display = 'none' }}
                            />
                            <div>
                              <strong>{ch.name}:</strong> {ch.dialogue}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {spots.map((spot) => {
                  if (spot.type === 'tournament') {
                    const tournament = getTournamentAtLocation(spot.id)
                    if (!tournament) return null
                    return (
                      <div key={spot.id} className="detail-section" aria-label="Tournament">
                        <h3 className="detail-section-heading">🏆 Tournament</h3>
                        <div className="world-tournament">
                          <p>Entry: {tournament.entryFee} gil. Win one match to win a prize card.</p>
                          <button
                            type="button"
                            className="challenge-button tournament-entry"
                            onClick={() => onEnterTournament(spot)}
                            disabled={gil < tournament.entryFee}
                            aria-label={`Enter tournament for ${tournament.entryFee} gil. ${gil < tournament.entryFee ? 'Not enough gil.' : ''}`}
                          >
                            Enter tournament ({tournament.entryFee} gil)
                          </button>
                        </div>
                      </div>
                    )
                  }
                  if (spot.type === 'shop') {
                    const shop = getShopAtLocation(spot.id)
                    if (!shop || shop.items.length === 0) return null
                    return (
                      <div key={spot.id} className="detail-section" aria-label="Shop">
                        <h3 className="detail-section-heading">🛒 Shop</h3>
                        <ul className="shop-list">
                          {shop.items.map((item) => {
                            const ownedCount = inventory[item.cardId] ?? 0
                            const sellPrice = Math.floor(item.price / 2)
                            const canSell = isStarterCard(item.cardId) ? ownedCount > 1 : ownedCount > 0
                            return (
                              <li key={item.cardId} className="shop-item">
                                <span className="shop-item-name">{cardNameById[item.cardId] ?? item.cardId}</span>
                                <span className="shop-item-price">{item.price} gil</span>
                                {ownedCount > 0 && (
                                  <span className="shop-owned-badge">x{ownedCount}</span>
                                )}
                                <button
                                  type="button"
                                  className="shop-buy-button"
                                  onClick={() => onBuyCard(item.cardId, item.price)}
                                  disabled={gil < item.price}
                                  aria-label={`Buy ${cardNameById[item.cardId] ?? item.cardId} for ${item.price} gil`}
                                >
                                  Buy
                                </button>
                                {canSell && (
                                  <button
                                    type="button"
                                    className="shop-sell-button"
                                    onClick={() => onSellCard(item.cardId, sellPrice)}
                                    aria-label={`Sell ${cardNameById[item.cardId] ?? item.cardId} for ${sellPrice} gil`}
                                  >
                                    Sell ({sellPrice}g)
                                  </button>
                                )}
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    )
                  }
                  if (spot.type === 'duel') {
                    const wins = npcWins[selected.id] ?? 0
                    return (
                      <div key={spot.id} className="detail-section">
                        <h3 className="detail-section-heading">⚔ Challenge</h3>
                        <div className="location-opponent-block">
                          <div className="location-opponent">
                            {spot.opponentImagePath && (
                              <img
                                src={spot.opponentImagePath}
                                alt=""
                                className="opponent-portrait"
                                onError={(e) => { e.currentTarget.style.display = 'none' }}
                              />
                            )}
                            <p>Opponent: {spot.opponentName ?? 'Local player'}</p>
                            {wins > 0 && (
                              <span className="npc-win-badge" aria-label={`Won ${wins} time${wins !== 1 ? 's' : ''}`}>
                                W: {wins}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            className="challenge-button"
                            onClick={() => onChallenge(selected)}
                          >
                            {wins > 0 ? 'Rematch' : 'Challenge'}
                          </button>
                        </div>
                      </div>
                    )
                  }
                  return null
                })}
              </>
            )
          })()}
        </section>
      )}
    </div>
  )
}
