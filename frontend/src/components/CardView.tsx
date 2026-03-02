import { rankLabel } from '../types/card'
import type { Card } from '../types/card'

const ELEMENT_ICONS: Record<NonNullable<Card['element']>, string> = {
  Fire: '🔥',
  Ice: '❄',
  Lightning: '⚡',
  Water: '💧',
  Earth: '🌿',
  Poison: '☠',
  Holy: '✨',
  Wind: '🌀',
}

interface CardViewProps {
  card: Card
  selected?: boolean
  onSelect?: () => void
  compact?: boolean
  /** Owner player index — adds coloured border + tint overlay */
  owner?: 0 | 1
  /** Show the card name below the face (default: true) */
  showName?: boolean
}

export function CardView({ card, selected, onSelect, compact, owner, showName = true }: CardViewProps) {
  const handleClick = onSelect ? () => onSelect() : undefined
  const cardImageSrc = `/cards/${card.id}.png`
  const ownerClass = owner !== undefined ? ` owner-${owner}` : ''
  return (
    <div
      role={onSelect ? 'button' : undefined}
      onClick={handleClick}
      className={`card-view${selected ? ' selected' : ''}${compact ? ' compact' : ''}${ownerClass}`}
      style={{ cursor: onSelect ? 'pointer' : 'default' }}
    >
      <div className="card-face">
        <img src={cardImageSrc} alt={card.name} className="card-image" />
        <div className="card-ranks" aria-hidden="true">
          <span className="rank top">{rankLabel(card.top)}</span>
          <span className="rank right">{rankLabel(card.right)}</span>
          <span className="rank bottom">{rankLabel(card.bottom)}</span>
          <span className="rank left">{rankLabel(card.left)}</span>
        </div>
        {card.element && (
          <span className="card-element-badge" aria-hidden="true">
            {ELEMENT_ICONS[card.element]}
          </span>
        )}
        {owner !== undefined && <div className="card-owner-tint" aria-hidden="true" />}
      </div>
      {showName && <div className="card-name">{card.name}</div>}
    </div>
  )
}
