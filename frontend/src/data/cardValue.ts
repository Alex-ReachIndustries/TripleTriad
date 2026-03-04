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

/** Sell price = 50% of value, minimum 25 gil. */
export function getCardSellPrice(card: Card): number {
  return Math.max(25, Math.floor(getCardValue(card) / 2))
}
