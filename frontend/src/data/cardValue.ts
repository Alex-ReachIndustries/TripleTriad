import type { Card } from '../types/card'

/**
 * Card value system for the in-game economy.
 * Values scale steeply with card level so late-game cards are genuinely expensive.
 *
 * Level base values: L1=100, L2=300, L3=800, L4=2000, L5=5000
 * Stat bonus: (statTotal - 4) * multiplier per level
 */

const LEVEL_BASE: Record<number, number> = { 1: 100, 2: 300, 3: 800, 4: 2000, 5: 5000 }
const STAT_MULTIPLIER: Record<number, number> = { 1: 5, 2: 15, 3: 40, 4: 100, 5: 250 }

/** Intrinsic value of a card (used for buy prices and economy scaling). */
export function getCardValue(card: Card): number {
  const base = LEVEL_BASE[card.level] ?? 100
  const statTotal = card.top + card.right + card.bottom + card.left
  const bonus = (statTotal - 4) * (STAT_MULTIPLIER[card.level] ?? 5)
  return base + Math.max(0, bonus)
}

/** Buy price = full card value. Used by shops. */
export function getCardBuyPrice(card: Card): number {
  return getCardValue(card)
}

/** Sell price = 40% of value, minimum 10 gil. Always less than buy price. */
export function getCardSellPrice(card: Card): number {
  return Math.max(10, Math.floor(getCardValue(card) * 0.4))
}
