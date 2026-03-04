import { useState, useMemo } from 'react'
import type { NPC, SpecialRule } from '../../types/world'
import type { Card } from '../../types/card'
import type { WorldPlayerState, } from '../../data/worldState'
import { isStarterCard, getActiveRegionRules } from '../../data/worldState'
import { getRegions, formatRules } from '../../data/world'
import { getCardSellPrice } from '../../data/cardValue'
import { getQuestsByNpc, getQuestStatus, isQuestComplete } from '../../data/quests'
import { rankLabel } from '../../types/card'
import cardsData from '../../data/cards.json'

const allCards: Card[] = cardsData.cards as Card[]
const cardMap = new Map(allCards.map(c => [c.id, c]))

function getCard(id: string): Card | undefined {
  return cardMap.get(id)
}

interface NpcInteractionProps {
  npc: NPC
  worldState: WorldPlayerState
  onClose: () => void
  onInitiateDuel: (npcId: string) => void
  onBuyCard: (cardId: string, price: number) => void
  onSellCard: (cardId: string, sellPrice: number) => void
  onEnterTournament: (npcId: string) => void
  onAcceptQuest: (questId: string) => void
  onClaimQuest: (questId: string) => void
  onSpreadRule?: (rule: SpecialRule, regionId: string) => void
  onAbolishRule?: (rule: SpecialRule, regionId: string) => void
}

export function NpcInteraction({
  npc,
  worldState,
  onClose,
  onInitiateDuel,
  onBuyCard,
  onSellCard,
  onEnterTournament,
  onAcceptQuest,
  onClaimQuest,
  onSpreadRule,
  onAbolishRule,
}: NpcInteractionProps) {
  return (
    <div className="wm-npc-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="wm-npc-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={`Interaction with ${npc.name}`}
      >
        <button type="button" className="wm-npc-modal-close" onClick={onClose} aria-label="Close">
          {'\u2715'}
        </button>
        <div className="wm-npc-modal-header">
          <h3 className="wm-npc-modal-name">{npc.name}</h3>
        </div>
        <div className="wm-npc-modal-body">
          {npc.type === 'dialogue' && npc.id === 'queen_of_cards' && onSpreadRule && onAbolishRule && (
            <QueenOfCardsPanel npc={npc} worldState={worldState} onSpreadRule={onSpreadRule} onAbolishRule={onAbolishRule} />
          )}
          {npc.type === 'dialogue' && npc.id !== 'queen_of_cards' && (
            <DialoguePanel npc={npc} worldState={worldState} onAcceptQuest={onAcceptQuest} onClaimQuest={onClaimQuest} />
          )}
          {npc.type === 'shop' && (
            <ShopPanel npc={npc} worldState={worldState} onBuyCard={onBuyCard} onSellCard={onSellCard} />
          )}
          {npc.type === 'duel' && (
            <DuelPanel npc={npc} worldState={worldState} onInitiateDuel={onInitiateDuel} />
          )}
          {npc.type === 'tournament' && (
            <TournamentPanel npc={npc} worldState={worldState} onEnterTournament={onEnterTournament} />
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Dialogue Panel ──────────────────────── */

function DialoguePanel({
  npc,
  worldState,
  onAcceptQuest,
  onClaimQuest,
}: {
  npc: NPC
  worldState: WorldPlayerState
  onAcceptQuest: (questId: string) => void
  onClaimQuest: (questId: string) => void
}) {
  const quests = getQuestsByNpc(npc.id)
  const wins = worldState.npcWins[npc.id] ?? 0

  const dialogueText = wins > 0
    ? (npc.dialogue.rematch ?? npc.dialogue.defeated ?? npc.dialogue.text ?? '')
    : (npc.dialogue.text ?? npc.dialogue.challenge ?? '')

  return (
    <div className="wm-interact-dialogue">
      <p className="wm-interact-text">{dialogueText}</p>

      {quests.map(quest => {
        const status = getQuestStatus(quest.id, worldState.activeQuests, worldState.completedQuests)
        const dungeonSet = new Set(worldState.clearedDungeons)
        const canClaim = status === 'active' && isQuestComplete(quest, worldState.inventory, worldState.npcWins, dungeonSet)

        return (
          <div key={quest.id} className={`wm-quest-card ${status}`}>
            <div className="wm-quest-header">
              <span className="wm-quest-name">{quest.name}</span>
              <span className={`wm-quest-status-badge ${status}`}>
                {status === 'available' ? 'New' : status === 'active' ? (canClaim ? 'Ready!' : 'In Progress') : 'Done'}
              </span>
            </div>
            <p className="wm-quest-desc">{quest.description}</p>
            <div className="wm-quest-reward">
              Reward: {quest.reward.gil > 0 && `${quest.reward.gil} Gil`}
              {quest.reward.gil > 0 && quest.reward.cardId && ' + '}
              {quest.reward.cardId && `${getCard(quest.reward.cardId)?.name ?? quest.reward.cardId}${quest.reward.cardCount && quest.reward.cardCount > 1 ? ` x${quest.reward.cardCount}` : ''}`}
            </div>
            {status === 'available' && (
              <button type="button" className="wm-quest-btn accept" onClick={() => onAcceptQuest(quest.id)}>
                Accept Quest
              </button>
            )}
            {canClaim && (
              <button type="button" className="wm-quest-btn claim" onClick={() => onClaimQuest(quest.id)}>
                Claim Reward
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ── Shop Panel ──────────────────────────── */

function ShopPanel({
  npc,
  worldState,
  onBuyCard,
  onSellCard,
}: {
  npc: NPC
  worldState: WorldPlayerState
  onBuyCard: (cardId: string, price: number) => void
  onSellCard: (cardId: string, sellPrice: number) => void
}) {
  const [tab, setTab] = useState<'buy' | 'sell'>('buy')
  const shopItems = npc.shopItems ?? []

  const dialogueText = npc.dialogue.text ?? npc.dialogue.challenge ?? 'Welcome to my shop!'

  // Build sellable cards from inventory
  const sellableCards = useMemo(() => {
    return Object.entries(worldState.inventory)
      .filter(([, count]) => count > 0)
      .map(([cardId, count]) => {
        const card = getCard(cardId)
        if (!card) return null
        const minCount = isStarterCard(cardId) ? 1 : 0
        const sellable = count - minCount
        const sellPrice = getCardSellPrice(card)
        return { cardId, card, count, sellable, sellPrice }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null && item.sellable > 0)
      .sort((a, b) => a.card.level - b.card.level)
  }, [worldState.inventory])

  return (
    <div className="wm-interact-shop">
      <p className="wm-interact-text">{dialogueText}</p>
      <div className="wm-shop-gil">{'\u{1F4B0}'} {worldState.gil} Gil</div>

      <div className="wm-shop-tabs">
        <button
          type="button"
          className={`wm-shop-tab ${tab === 'buy' ? 'active' : ''}`}
          onClick={() => setTab('buy')}
        >
          Buy
        </button>
        <button
          type="button"
          className={`wm-shop-tab ${tab === 'sell' ? 'active' : ''}`}
          onClick={() => setTab('sell')}
        >
          Sell
        </button>
      </div>

      {tab === 'buy' && (
        <div className="wm-shop-list">
          {shopItems.map(item => {
            const card = getCard(item.cardId)
            if (!card) return null
            const owned = worldState.inventory[item.cardId] ?? 0
            const canAfford = worldState.gil >= item.buyPrice
            return (
              <div key={item.cardId} className="wm-shop-item">
                <div className="wm-shop-item-info">
                  <img src={`/cards/${item.cardId}.png`} alt={card.name} className="wm-shop-card-img" />
                  <div className="wm-shop-item-details">
                    <span className="wm-shop-item-name">{card.name}</span>
                    <span className="wm-shop-item-stats">
                      Lv.{card.level} | {rankLabel(card.top)}-{rankLabel(card.right)}-{rankLabel(card.bottom)}-{rankLabel(card.left)}
                    </span>
                    <span className="wm-shop-item-owned">Owned: {owned}</span>
                  </div>
                </div>
                <div className="wm-shop-item-action">
                  <span className="wm-shop-price">{item.buyPrice} Gil</span>
                  <button
                    type="button"
                    className="wm-shop-buy-btn"
                    disabled={!canAfford}
                    onClick={() => onBuyCard(item.cardId, item.buyPrice)}
                  >
                    Buy
                  </button>
                </div>
              </div>
            )
          })}
          {shopItems.length === 0 && (
            <p className="wm-shop-empty">Nothing for sale right now.</p>
          )}
        </div>
      )}

      {tab === 'sell' && (
        <div className="wm-shop-list">
          {sellableCards.map(({ cardId, card, count, sellable, sellPrice }) => (
            <div key={cardId} className="wm-shop-item">
              <div className="wm-shop-item-info">
                <img src={`/cards/${cardId}.png`} alt={card.name} className="wm-shop-card-img" />
                <div className="wm-shop-item-details">
                  <span className="wm-shop-item-name">{card.name}</span>
                  <span className="wm-shop-item-stats">
                    Lv.{card.level} | {rankLabel(card.top)}-{rankLabel(card.right)}-{rankLabel(card.bottom)}-{rankLabel(card.left)}
                  </span>
                  <span className="wm-shop-item-owned">Owned: {count} (can sell: {sellable})</span>
                </div>
              </div>
              <div className="wm-shop-item-action">
                <span className="wm-shop-price sell">{sellPrice} Gil</span>
                <button
                  type="button"
                  className="wm-shop-sell-btn"
                  onClick={() => onSellCard(cardId, sellPrice)}
                >
                  Sell
                </button>
              </div>
            </div>
          ))}
          {sellableCards.length === 0 && (
            <p className="wm-shop-empty">No cards to sell.</p>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Duel Panel ──────────────────────────── */

function DuelPanel({
  npc,
  worldState,
  onInitiateDuel,
}: {
  npc: NPC
  worldState: WorldPlayerState
  onInitiateDuel: (npcId: string) => void
}) {
  const wins = worldState.npcWins[npc.id] ?? 0

  const dialogueText = wins > 0
    ? (npc.dialogue.rematch ?? npc.dialogue.challenge ?? 'Ready for another round?')
    : (npc.dialogue.challenge ?? 'Let\'s play!')

  return (
    <div className="wm-interact-duel">
      <p className="wm-interact-text">{dialogueText}</p>

      {npc.difficultyTier && (
        <div className="wm-duel-tier">
          Difficulty: {'★'.repeat(npc.difficultyTier)}{'☆'.repeat(5 - npc.difficultyTier)}
        </div>
      )}

      {npc.gilReward != null && npc.gilReward > 0 && (
        <div className="wm-duel-reward">Reward: {npc.gilReward} Gil</div>
      )}

      {wins > 0 && (
        <div className="wm-duel-wins">Wins: {wins}</div>
      )}

      <button
        type="button"
        className="wm-duel-start-btn"
        onClick={() => onInitiateDuel(npc.id)}
      >
        {wins > 0 ? 'Rematch!' : 'Challenge!'}
      </button>
    </div>
  )
}

/* ── Tournament Panel ────────────────────── */

function TournamentPanel({
  npc,
  worldState,
  onEnterTournament,
}: {
  npc: NPC
  worldState: WorldPlayerState
  onEnterTournament: (npcId: string) => void
}) {
  const entryFee = npc.tournamentEntryFee ?? 0
  const prizePool = npc.tournamentPrizePool ?? []
  const canAfford = worldState.gil >= entryFee

  const dialogueText = npc.dialogue.challenge ?? npc.dialogue.text ?? 'Welcome to the tournament!'

  return (
    <div className="wm-interact-tournament">
      <p className="wm-interact-text">{dialogueText}</p>

      <div className="wm-tournament-info">
        <div className="wm-tournament-fee">
          Entry Fee: <strong>{entryFee} Gil</strong>
          {!canAfford && <span className="wm-tournament-cant-afford"> (Not enough Gil)</span>}
        </div>
        <div className="wm-tournament-prizes">
          <span className="wm-tournament-prizes-label">Prize Pool:</span>
          <div className="wm-tournament-prize-list">
            {prizePool.map(cardId => {
              const card = getCard(cardId)
              return (
                <span key={cardId} className="wm-tournament-prize-card">
                  {card?.name ?? cardId}
                </span>
              )
            })}
          </div>
        </div>
      </div>

      <button
        type="button"
        className="wm-duel-start-btn"
        disabled={!canAfford}
        onClick={() => onEnterTournament(npc.id)}
      >
        Enter Tournament
      </button>
      {!canAfford && (
        <p className="wm-duel-invalid-msg">Not enough Gil for the entry fee.</p>
      )}
    </div>
  )
}

/* ── Queen of Cards Panel ───────────────── */

const ALL_SPECIAL_RULES: SpecialRule[] = ['Open', 'Same', 'Same Wall', 'Plus', 'Combo', 'Elemental', 'Random', 'Sudden Death']
const SPREAD_COST = 1000
const ABOLISH_COST = 500

function QueenOfCardsPanel({
  npc,
  worldState,
  onSpreadRule,
  onAbolishRule,
}: {
  npc: NPC
  worldState: WorldPlayerState
  onSpreadRule: (rule: SpecialRule, regionId: string) => void
  onAbolishRule: (rule: SpecialRule, regionId: string) => void
}) {
  const [tab, setTab] = useState<'spread' | 'abolish' | 'view'>('view')
  const [selectedRule, setSelectedRule] = useState<SpecialRule | null>(null)
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const regions = getRegions()

  const handleSpread = () => {
    if (!selectedRule || !selectedRegion) return
    if (worldState.gil < SPREAD_COST) {
      setFeedback('Not enough Gil!')
      return
    }
    const activeRules = getActiveRegionRules(
      regions.find(r => r.id === selectedRegion)?.rules ?? [],
      selectedRegion,
      worldState.regionRuleMods,
    )
    if (activeRules.includes(selectedRule)) {
      setFeedback(`${regions.find(r => r.id === selectedRegion)?.name} already has ${selectedRule}!`)
      return
    }
    onSpreadRule(selectedRule, selectedRegion)
    setFeedback(`${selectedRule} has been spread to ${regions.find(r => r.id === selectedRegion)?.name ?? selectedRegion}!`)
    setSelectedRule(null)
    setSelectedRegion(null)
  }

  const handleAbolish = () => {
    if (!selectedRule || !selectedRegion) return
    if (worldState.gil < ABOLISH_COST) {
      setFeedback('Not enough Gil!')
      return
    }
    const activeRules = getActiveRegionRules(
      regions.find(r => r.id === selectedRegion)?.rules ?? [],
      selectedRegion,
      worldState.regionRuleMods,
    )
    if (!activeRules.includes(selectedRule)) {
      setFeedback(`${regions.find(r => r.id === selectedRegion)?.name} doesn't have ${selectedRule}!`)
      return
    }
    if (activeRules.length <= 1) {
      setFeedback('Cannot abolish the last rule in a region!')
      return
    }
    onAbolishRule(selectedRule, selectedRegion)
    setFeedback(`${selectedRule} has been abolished from ${regions.find(r => r.id === selectedRegion)?.name ?? selectedRegion}!`)
    setSelectedRule(null)
    setSelectedRegion(null)
  }

  return (
    <div className="wm-queen-panel">
      <p className="wm-interact-text">{npc.dialogue.text}</p>
      <div className="wm-shop-gil">{'\u{1F4B0}'} {worldState.gil} Gil</div>

      <div className="wm-shop-tabs">
        <button type="button" className={`wm-shop-tab ${tab === 'view' ? 'active' : ''}`} onClick={() => { setTab('view'); setFeedback(null) }}>
          View Rules
        </button>
        <button type="button" className={`wm-shop-tab ${tab === 'spread' ? 'active' : ''}`} onClick={() => { setTab('spread'); setFeedback(null); setSelectedRule(null); setSelectedRegion(null) }}>
          Spread ({SPREAD_COST}G)
        </button>
        <button type="button" className={`wm-shop-tab ${tab === 'abolish' ? 'active' : ''}`} onClick={() => { setTab('abolish'); setFeedback(null); setSelectedRule(null); setSelectedRegion(null) }}>
          Abolish ({ABOLISH_COST}G)
        </button>
      </div>

      {feedback && <p className="wm-queen-feedback">{feedback}</p>}

      {tab === 'view' && (
        <div className="wm-queen-regions">
          {regions.map(region => {
            const activeRules = getActiveRegionRules(region.rules, region.id, worldState.regionRuleMods)
            return (
              <div key={region.id} className="wm-queen-region-row">
                <span className="wm-queen-region-name">{region.name}</span>
                <span className="wm-queen-region-rules">{formatRules(activeRules)}</span>
                <span className="wm-queen-region-trade">Trade: {region.tradeRule}</span>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'spread' && (
        <div className="wm-queen-action">
          <label className="wm-queen-label">Rule to spread:</label>
          <div className="wm-queen-rule-grid">
            {ALL_SPECIAL_RULES.map(rule => (
              <button
                key={rule}
                type="button"
                className={`wm-queen-rule-btn ${selectedRule === rule ? 'selected' : ''}`}
                onClick={() => setSelectedRule(rule)}
              >
                {rule}
              </button>
            ))}
          </div>
          <label className="wm-queen-label">Target region:</label>
          <div className="wm-queen-region-btns">
            {regions.map(region => (
              <button
                key={region.id}
                type="button"
                className={`wm-queen-region-btn ${selectedRegion === region.id ? 'selected' : ''}`}
                onClick={() => setSelectedRegion(region.id)}
              >
                {region.name}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="wm-duel-start-btn"
            disabled={!selectedRule || !selectedRegion || worldState.gil < SPREAD_COST}
            onClick={handleSpread}
          >
            Spread Rule ({SPREAD_COST} Gil)
          </button>
        </div>
      )}

      {tab === 'abolish' && (
        <div className="wm-queen-action">
          <label className="wm-queen-label">Select region:</label>
          <div className="wm-queen-region-btns">
            {regions.map(region => (
              <button
                key={region.id}
                type="button"
                className={`wm-queen-region-btn ${selectedRegion === region.id ? 'selected' : ''}`}
                onClick={() => { setSelectedRegion(region.id); setSelectedRule(null) }}
              >
                {region.name}
              </button>
            ))}
          </div>
          {selectedRegion && (() => {
            const region = regions.find(r => r.id === selectedRegion)
            const activeRules = getActiveRegionRules(region?.rules ?? [], selectedRegion, worldState.regionRuleMods)
            return (
              <>
                <label className="wm-queen-label">Rule to abolish:</label>
                <div className="wm-queen-rule-grid">
                  {activeRules.map(rule => (
                    <button
                      key={rule}
                      type="button"
                      className={`wm-queen-rule-btn ${selectedRule === rule ? 'selected' : ''}`}
                      onClick={() => setSelectedRule(rule)}
                      disabled={activeRules.length <= 1}
                    >
                      {rule}
                    </button>
                  ))}
                </div>
              </>
            )
          })()}
          <button
            type="button"
            className="wm-duel-start-btn"
            disabled={!selectedRule || !selectedRegion || worldState.gil < ABOLISH_COST}
            onClick={handleAbolish}
          >
            Abolish Rule ({ABOLISH_COST} Gil)
          </button>
        </div>
      )}
    </div>
  )
}
