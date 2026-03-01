import type { Card } from '../types/card'
import { rankLabel } from '../types/card'

interface CardViewProps {
  card: Card
  selected?: boolean
  onSelect?: () => void
  compact?: boolean
}

export function CardView({ card, selected, onSelect, compact }: CardViewProps) {
  const handleClick = onSelect ? () => onSelect() : undefined
  return (
    <div
      role={onSelect ? 'button' : undefined}
      onClick={handleClick}
      className={`card-view ${selected ? 'selected' : ''} ${compact ? 'compact' : ''}`}
      style={{
        border: selected ? '3px solid #4a9' : '1px solid #333',
        cursor: onSelect ? 'pointer' : 'default',
      }}
    >
      <div className="card-name">{card.name}</div>
      <div className="card-level">Lv {card.level}</div>
      {card.element && <div className="card-element">{card.element}</div>}
      <div className="card-ranks">
        <span className="rank top">{rankLabel(card.top)}</span>
        <span className="rank right">{rankLabel(card.right)}</span>
        <span className="rank bottom">{rankLabel(card.bottom)}</span>
        <span className="rank left">{rankLabel(card.left)}</span>
      </div>
    </div>
  )
}
