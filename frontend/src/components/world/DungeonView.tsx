import type { Location, NPC } from '../../types/world'
import type { WorldPlayerState } from '../../data/worldState'
import { getRegionById, getDungeonFloors } from '../../data/world'

interface DungeonViewProps {
  location: Location
  worldState: WorldPlayerState
  onStartFloor: (npc: NPC) => void
  onBack: () => void
}

export function DungeonView({ location, worldState, onStartFloor, onBack }: DungeonViewProps) {
  const region = getRegionById(location.regionId)
  const floors = getDungeonFloors(location.id)
  const isCleared = worldState.clearedDungeons.includes(location.id)

  // Determine which floor the player is up to: first undefeated floor
  // A floor is "defeated" if the player has beaten that NPC at least once
  const currentFloorIndex = floors.findIndex(f => (worldState.npcWins[f.id] ?? 0) === 0)
  // If all floors are beaten, currentFloorIndex is -1 (dungeon cleared)
  const allFloorsBeaten = currentFloorIndex === -1

  return (
    <div className="wm-dungeon">
      {/* Header */}
      <div className="wm-dungeon-header">
        <button type="button" className="wm-back-btn" onClick={onBack}>
          &#8592; Back to {region?.name ?? 'Region'}
        </button>
        <div className="wm-dungeon-title-area">
          <h2 className="wm-dungeon-name">
            {location.name}
            {isCleared && <span className="wm-dungeon-cleared-badge">Cleared</span>}
          </h2>
          <div className="wm-dungeon-meta">
            <span className="wm-dungeon-floors">{floors.length} Floor{floors.length !== 1 ? 's' : ''}</span>
            {isCleared && <span className="wm-dungeon-rematch-hint">Re-enter for rematches</span>}
          </div>
        </div>
      </div>

      {/* Flavour text */}
      {location.flavour && (
        <p className="wm-dungeon-flavour">{location.flavour}</p>
      )}

      {/* Floor path — rendered bottom-to-top (reversed) */}
      <div className="wm-dungeon-path" role="list" aria-label="Dungeon floors">
        {[...floors].reverse().map((floor, reversedIdx) => {
          const floorIdx = floors.length - 1 - reversedIdx
          const wins = worldState.npcWins[floor.id] ?? 0
          const isDefeated = wins > 0
          const isCurrent = floorIdx === currentFloorIndex
          const isAccessible = isDefeated || isCurrent
          const isBoss = floor.isBoss === true

          const introText = floor.dialogue.floorIntro
            ?? floor.dialogue.challenge
            ?? ''

          return (
            <div
              key={floor.id}
              className={[
                'wm-floor-node',
                isDefeated ? 'defeated' : '',
                isCurrent ? 'current' : '',
                isBoss ? 'boss' : '',
                !isAccessible && !isDefeated ? 'locked' : '',
              ].filter(Boolean).join(' ')}
              role="listitem"
            >
              {/* Connector line to next floor (not on last/top floor) */}
              {reversedIdx < floors.length - 1 && (
                <div className={`wm-floor-connector ${isDefeated ? 'completed' : ''}`} />
              )}

              {/* Floor marker */}
              <div className="wm-floor-marker">
                {isBoss ? (
                  <span className="wm-floor-boss-icon">{'\u{1F451}'}</span>
                ) : isDefeated ? (
                  <span className="wm-floor-check">{'\u2713'}</span>
                ) : (
                  <span className="wm-floor-number">{floorIdx + 1}</span>
                )}
              </div>

              {/* Floor info */}
              <div className="wm-floor-info">
                <div className="wm-floor-header-row">
                  <span className="wm-floor-name">
                    {isAccessible || isDefeated
                      ? (isBoss ? `BOSS: ${floor.name}` : floor.name)
                      : '???'
                    }
                  </span>
                  {floor.difficultyTier && (isAccessible || isDefeated) && (
                    <span className="wm-floor-tier">
                      {'★'.repeat(floor.difficultyTier)}{'☆'.repeat(5 - floor.difficultyTier)}
                    </span>
                  )}
                </div>

                {(isAccessible || isDefeated) && introText && (
                  <p className="wm-floor-intro">{introText}</p>
                )}

                {isDefeated && (
                  <span className="wm-floor-status defeated-text">
                    Defeated {wins > 1 ? `(${wins}x)` : ''}
                  </span>
                )}

                {isCurrent && !isDefeated && (
                  <button
                    type="button"
                    className="wm-floor-challenge-btn"
                    onClick={() => onStartFloor(floor)}
                  >
                    {isBoss ? 'Challenge Boss' : 'Challenge'}
                  </button>
                )}

                {isDefeated && (allFloorsBeaten || isCurrent) && (
                  <button
                    type="button"
                    className="wm-floor-rematch-btn"
                    onClick={() => onStartFloor(floor)}
                  >
                    Rematch
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Dungeon entrance message */}
      <div className="wm-dungeon-entrance">
        {allFloorsBeaten ? (
          <p className="wm-dungeon-complete-msg">
            {isCleared
              ? 'You have conquered this dungeon. Return any time for rematches.'
              : 'All opponents defeated! The dungeon is cleared.'}
          </p>
        ) : (
          <p className="wm-dungeon-progress-msg">
            Floor {(currentFloorIndex ?? 0) + 1} of {floors.length} — defeat each opponent to advance.
          </p>
        )}
      </div>
    </div>
  )
}
