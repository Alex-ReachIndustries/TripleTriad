import { useState } from 'react'
import type { Location, NPC } from '../../types/world'
import { getActiveRegionRules } from '../../data/worldState'
import type { WorldPlayerState } from '../../data/worldState'
import { getRegionById, getVisibleNpcs, getLocationsByParentTown, formatRules } from '../../data/world'
import { isLocationUnlocked } from '../../data/unlock'
import { getQuestsByNpc, getQuestStatus } from '../../data/quests'

/** NPC type → human-readable label */
const NPC_TYPE_LABEL: Record<string, string> = {
  duel: 'Duel',
  shop: 'Shop',
  dialogue: 'Talk',
  tournament: 'Tournament',
}

/** Get a brief description for an NPC based on their type and data */
function getNpcDescription(npc: NPC): string {
  switch (npc.type) {
    case 'duel':
      return npc.dialogue.challenge ?? 'Ready for a card game?'
    case 'shop':
      return `${npc.shopItems?.length ?? 0} cards available`
    case 'dialogue':
      return npc.dialogue.text ?? 'Has something to say...'
    case 'tournament':
      return npc.tournamentEntryFee
        ? `Entry: ${npc.tournamentEntryFee} Gil`
        : 'Enter the tournament!'
    default:
      return ''
  }
}

/** Generate initials from NPC name for avatar fallback */
function getInitials(name: string): string {
  const words = name.split(/[\s_-]+/)
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

/** Get avatar background colour based on NPC type */
function getAvatarColor(type: string): string {
  switch (type) {
    case 'duel': return 'var(--player-0)'
    case 'shop': return 'var(--accent)'
    case 'dialogue': return 'var(--success)'
    case 'tournament': return '#a855f7'
    default: return 'var(--text-muted)'
  }
}

interface TownViewProps {
  location: Location
  worldState: WorldPlayerState
  onSelectNpc: (npc: NPC) => void
  onSelectLocation?: (location: Location) => void
  onBack: () => void
}

export function TownView({ location, worldState, onSelectNpc, onSelectLocation, onBack }: TownViewProps) {
  const [hoveredNpc, setHoveredNpc] = useState<string | null>(null)
  const region = getRegionById(location.regionId)
  const npcs = getVisibleNpcs(location.id, worldState.storyChapter)

  // TD (Town-Dungeon) child locations that are accessed from this town
  const tdLocations = getLocationsByParentTown(location.id)
    .filter(td => isLocationUnlocked(td, worldState))

  // Group NPCs by type for visual organization
  const duelNpcs = npcs.filter(n => n.type === 'duel')
  const shopNpcs = npcs.filter(n => n.type === 'shop')
  const tournamentNpcs = npcs.filter(n => n.type === 'tournament')
  const dialogueNpcs = npcs.filter(n => n.type === 'dialogue')

  // Ordered: duel first (main gameplay), then tournaments, shops, dialogue
  const orderedNpcs = [...duelNpcs, ...tournamentNpcs, ...shopNpcs, ...dialogueNpcs]

  return (
    <div className="wm-town">
      {/* Header */}
      <div
        className="wm-town-header"
        style={{ backgroundImage: `url(/locations/${location.id}.png)` }}
      >
        <div className="wm-town-header-overlay" />
        <button type="button" className="wm-back-btn" onClick={onBack}>
          &#8592; Back to {region?.name ?? 'Region'}
        </button>
        <div className="wm-town-title-area">
          <h2 className="wm-town-name">{location.name}</h2>
          <div className="wm-town-meta">
            <span className="wm-town-rules">Rules: {formatRules(getActiveRegionRules(region?.rules ?? [], region?.id ?? '', worldState.regionRuleMods))}</span>
            <span className="wm-town-gil">{'\u{1F4B0}'} {worldState.gil} Gil</span>
            <span className="wm-town-npc-count">{npcs.length} NPC{npcs.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* Flavour text */}
      {location.flavour && (
        <p className="wm-town-flavour">{location.flavour}</p>
      )}

      {/* NPC Grid */}
      <div className="wm-npc-grid" role="list" aria-label="NPCs in this location">
        {/* TD dungeon entrances */}
        {tdLocations.map(td => (
          <button
            key={td.id}
            type="button"
            className="wm-npc-card dungeon-entrance"
            role="listitem"
            onClick={() => onSelectLocation?.(td)}
            aria-label={`Enter ${td.name}`}
          >
            <div className="wm-npc-avatar" style={{ backgroundColor: 'var(--danger, #dc2626)' }}>
              <span className="wm-npc-initials">{'\u2694'}</span>
            </div>
            <div className="wm-npc-info">
              <span className="wm-npc-name">{td.name}</span>
              <span className="wm-npc-type-badge">
                <span className="wm-npc-type-icon">{'\u{1F5E1}\uFE0F'}</span>
                Dungeon
              </span>
              <span className="wm-npc-desc">{td.flavour ?? 'Enter the dungeon...'}</span>
            </div>
          </button>
        ))}
        {orderedNpcs.map(npc => {
          const isHovered = hoveredNpc === npc.id
          const questsForNpc = getQuestsByNpc(npc.id)
          const activeQuest = questsForNpc.find(q =>
            getQuestStatus(q.id, worldState.activeQuests, worldState.completedQuests) === 'active'
          )
          const availableQuest = questsForNpc.find(q =>
            getQuestStatus(q.id, worldState.activeQuests, worldState.completedQuests) === 'available'
          )
          const completedAllQuests = questsForNpc.length > 0 && questsForNpc.every(q =>
            getQuestStatus(q.id, worldState.activeQuests, worldState.completedQuests) === 'completed'
          )

          const wins = worldState.npcWins[npc.id] ?? 0

          return (
            <button
              key={npc.id}
              type="button"
              className={`wm-npc-card ${npc.type} ${isHovered ? 'hovered' : ''}`}
              role="listitem"
              onClick={() => onSelectNpc(npc)}
              onMouseEnter={() => setHoveredNpc(npc.id)}
              onMouseLeave={() => setHoveredNpc(null)}
              aria-label={`${npc.name} — ${NPC_TYPE_LABEL[npc.type] ?? npc.type}`}
            >
              {/* Quest indicator */}
              {availableQuest && !activeQuest && (
                <span className="wm-npc-quest-badge available" title="Quest available!">!</span>
              )}
              {activeQuest && (
                <span className="wm-npc-quest-badge active" title={`Quest: ${activeQuest.name}`}>?</span>
              )}
              {completedAllQuests && (
                <span className="wm-npc-quest-badge completed" title="All quests completed">{'\u2713'}</span>
              )}

              {/* Portrait / Avatar */}
              <div className="wm-npc-avatar" style={{ backgroundColor: getAvatarColor(npc.type) }}>
                {npc.portrait ? (
                  <img src={npc.portrait} alt={npc.name} className="wm-npc-portrait" />
                ) : (
                  <span className="wm-npc-initials">{getInitials(npc.name)}</span>
                )}
              </div>

              {/* Info */}
              <div className="wm-npc-info">
                <span className="wm-npc-name">{npc.name}</span>
                <span className="wm-npc-type-badge">
                  <NpcTypeIcon type={npc.type} />
                  {NPC_TYPE_LABEL[npc.type] ?? npc.type}
                </span>
                <span className="wm-npc-desc">{getNpcDescription(npc)}</span>
              </div>

              {/* Stats (for duel/tournament NPCs) */}
              {(npc.type === 'duel' || npc.type === 'tournament') && (
                <div className="wm-npc-stats">
                  {npc.difficultyTier && (
                    <span className="wm-npc-tier" title={`Difficulty tier ${npc.difficultyTier}`}>
                      {'★'.repeat(npc.difficultyTier)}{'☆'.repeat(5 - npc.difficultyTier)}
                    </span>
                  )}
                  {npc.gilReward != null && npc.gilReward > 0 && (
                    <span className="wm-npc-reward">{npc.gilReward} Gil</span>
                  )}
                  {wins > 0 && (
                    <span className="wm-npc-wins">{wins} win{wins !== 1 ? 's' : ''}</span>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Empty state */}
      {npcs.length === 0 && (
        <p className="wm-town-empty">No NPCs here yet. Check back later!</p>
      )}
    </div>
  )
}

/** Renders NPC type icon using JS expressions for proper emoji rendering */
function NpcTypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'duel': return <span className="wm-npc-type-icon">{'\u2694\uFE0F'}</span>
    case 'shop': return <span className="wm-npc-type-icon">{'\u{1F4B0}'}</span>
    case 'dialogue': return <span className="wm-npc-type-icon">{'\u{1F4AC}'}</span>
    case 'tournament': return <span className="wm-npc-type-icon">{'\u{1F3C6}'}</span>
    default: return null
  }
}
