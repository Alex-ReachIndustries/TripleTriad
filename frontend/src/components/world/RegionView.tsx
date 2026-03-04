import type { Region, Location } from '../../types/world'
import { getActiveRegionRules } from '../../data/worldState'
import type { WorldPlayerState } from '../../data/worldState'
import { getLocationsByRegion, formatRules, getVisibleNpcs } from '../../data/world'
import { isLocationUnlocked } from '../../data/unlock'
import { getLocationMarkers } from '../../data/markers'

interface RegionViewProps {
  region: Region
  worldState: WorldPlayerState
  onSelectLocation: (location: Location) => void
  onBack: () => void
}

export function RegionView({ region, worldState, onSelectLocation, onBack }: RegionViewProps) {
  const locations = getLocationsByRegion(region.id)
  const bbox = getPolygonBBox(region.mapBounds)

  const padding = 6
  const vx = Math.max(0, bbox.x1 - padding)
  const vy = Math.max(0, bbox.y1 - padding)
  const vw = Math.min(100, bbox.x2 + padding) - vx
  const vh = Math.min(100, bbox.y2 + padding) - vy

  const regionW = bbox.x2 - bbox.x1
  const regionH = bbox.y2 - bbox.y1

  // Scale marker sizes relative to viewBox dimensions
  const markerR = Math.max(0.7, vw * 0.025)
  const fontSize = Math.max(0.6, vw * 0.028)
  const labelOffset = markerR + fontSize * 1.2

  const unlockedCount = locations.filter(l => isLocationUnlocked(l, worldState)).length

  return (
    <div className="wm-region">
      <div className="wm-region-header">
        <button type="button" className="wm-back-btn" onClick={onBack}>
          &#8592; World Map
        </button>
        <div className="wm-region-title-area">
          <h2 className="wm-region-name">{region.name}</h2>
          <div className="wm-region-meta">
            <span className="wm-region-rules-badge">Rules: {formatRules(getActiveRegionRules(region.rules, region.id, worldState.regionRuleMods))}</span>
            <span className="wm-region-trade-badge">Trade: {region.tradeRule}</span>
            <span className="wm-region-loc-count">{unlockedCount}/{locations.length} Locations</span>
          </div>
        </div>
      </div>

      {region.description && (
        <p className="wm-region-desc">{region.description}</p>
      )}

      <div className="wm-region-map-container">
        <svg
          viewBox={`${vx} ${vy} ${vw} ${vh}`}
          className="wm-region-map-svg"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={`Map of ${region.name} region`}
        >
          {/* Full world map image stretched to 0-100 coordinate space */}
          <image href="/map/world.jpg" x="0" y="0" width="100" height="100" preserveAspectRatio="none" />

          {/* Dark overlay on everything */}
          <rect x="0" y="0" width="100" height="100" fill="rgba(0,0,0,0.45)" />

          {/* Bright cutout for the region (re-render image clipped to region polygon) */}
          <defs>
            <clipPath id={`region-clip-${region.id}`}>
              <polygon points={region.mapBounds} />
            </clipPath>
          </defs>
          <image
            href="/map/world.jpg"
            x="0" y="0" width="100" height="100"
            preserveAspectRatio="none"
            clipPath={`url(#region-clip-${region.id})`}
          />

          {/* Region boundary glow */}
          <polygon
            points={region.mapBounds}
            fill="none"
            stroke="rgba(201,162,39,0.6)"
            strokeWidth={vw * 0.008}
          />

          {/* Connection lines between sequential locations */}
          {locations.slice(1).map((loc, i) => {
            const prev = locations[i]
            const px = bbox.x1 + (prev.mapX / 100) * regionW
            const py = bbox.y1 + (prev.mapY / 100) * regionH
            const cx = bbox.x1 + (loc.mapX / 100) * regionW
            const cy = bbox.y1 + (loc.mapY / 100) * regionH
            const unlocked = isLocationUnlocked(loc, worldState)
            return (
              <line
                key={`line-${loc.id}`}
                x1={px} y1={py} x2={cx} y2={cy}
                stroke={unlocked ? 'rgba(201,162,39,0.4)' : 'rgba(100,100,100,0.25)'}
                strokeWidth={vw * 0.004}
                strokeDasharray={unlocked ? 'none' : `${vw * 0.01} ${vw * 0.008}`}
              />
            )
          })}

          {/* Location markers */}
          {locations.map(loc => {
            const absX = bbox.x1 + (loc.mapX / 100) * regionW
            const absY = bbox.y1 + (loc.mapY / 100) * regionH
            const unlocked = isLocationUnlocked(loc, worldState)
            const npcCount = getVisibleNpcs(loc.id, worldState.storyChapter).length
            const isDungeon = loc.type === 'dungeon'

            return (
              <g
                key={loc.id}
                className={`wm-loc-marker ${unlocked ? 'unlocked' : 'locked'}`}
                onClick={() => unlocked && onSelectLocation(loc)}
                tabIndex={unlocked ? 0 : -1}
                role="button"
                aria-label={unlocked ? `${loc.name} — ${npcCount} NPCs` : 'Locked location'}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && unlocked) {
                    e.preventDefault()
                    onSelectLocation(loc)
                  }
                }}
                style={{ cursor: unlocked ? 'pointer' : 'not-allowed' }}
              >
                {/* Marker pulse ring for unlocked */}
                {unlocked && (
                  <circle
                    cx={absX} cy={absY} r={markerR * 1.4}
                    fill="none"
                    stroke="rgba(201,162,39,0.3)"
                    strokeWidth={vw * 0.003}
                    className="wm-loc-pulse"
                  />
                )}

                {/* Main marker */}
                {isDungeon ? (
                  <rect
                    x={absX - markerR} y={absY - markerR}
                    width={markerR * 2} height={markerR * 2}
                    rx={markerR * 0.2}
                    fill={unlocked ? 'rgba(180,30,30,0.85)' : 'rgba(80,80,80,0.6)'}
                    stroke={unlocked ? 'rgba(255,200,100,0.8)' : 'rgba(150,150,150,0.4)'}
                    strokeWidth={vw * 0.005}
                  />
                ) : (
                  <circle
                    cx={absX} cy={absY} r={markerR}
                    fill={unlocked ? 'rgba(201,162,39,0.85)' : 'rgba(80,80,80,0.6)'}
                    stroke={unlocked ? 'rgba(255,255,255,0.7)' : 'rgba(150,150,150,0.4)'}
                    strokeWidth={vw * 0.005}
                  />
                )}

                {/* Type icon in marker */}
                <text
                  x={absX} y={absY + fontSize * 0.35}
                  textAnchor="middle"
                  fontSize={fontSize * 0.9}
                  fill="white"
                  fontFamily="sans-serif"
                  pointerEvents="none"
                >
                  {isDungeon ? '\u2694' : '\u25CF'}
                </text>

                {/* Name label below marker */}
                <text
                  x={absX} y={absY + labelOffset}
                  textAnchor="middle"
                  fontSize={fontSize * 0.85}
                  fill={unlocked ? '#e8e6e3' : '#9ca3af'}
                  fontWeight="bold"
                  fontFamily="sans-serif"
                  pointerEvents="none"
                >
                  {unlocked ? loc.name : '???'}
                </text>

                {/* NPC count or lock indicator */}
                <text
                  x={absX} y={absY + labelOffset + fontSize * 0.9}
                  textAnchor="middle"
                  fontSize={fontSize * 0.65}
                  fill={unlocked ? '#9ca3af' : '#6b7280'}
                  fontFamily="sans-serif"
                  pointerEvents="none"
                >
                  {unlocked
                    ? `${npcCount} NPC${npcCount !== 1 ? 's' : ''}`
                    : '\uD83D\uDD12 Locked'}
                </text>

                {/* Notification markers (top-right of marker) */}
                {unlocked && (() => {
                  const markers = getLocationMarkers(loc.id, worldState)
                  if (markers.length === 0) return null
                  const badgeR = markerR * 0.35
                  const bx = absX + markerR * 0.7
                  const by = absY - markerR * 0.7
                  return (
                    <>
                      {markers.includes('main_quest') && (
                        <>
                          <circle cx={bx} cy={by} r={badgeR} fill="#d4a017" stroke="#1a1a2e" strokeWidth={vw * 0.002} />
                          <text x={bx} y={by + badgeR * 0.4} textAnchor="middle" fontSize={badgeR * 1.4} fill="#1a1a2e" fontWeight="bold" fontFamily="sans-serif" pointerEvents="none">!</text>
                        </>
                      )}
                      {markers.includes('side_quest') && (
                        <>
                          <circle cx={markers.includes('main_quest') ? bx + badgeR * 2.2 : bx} cy={by} r={badgeR} fill="#3b82f6" stroke="#1a1a2e" strokeWidth={vw * 0.002} />
                          <text x={markers.includes('main_quest') ? bx + badgeR * 2.2 : bx} y={by + badgeR * 0.4} textAnchor="middle" fontSize={badgeR * 1.4} fill="white" fontWeight="bold" fontFamily="sans-serif" pointerEvents="none">?</text>
                        </>
                      )}
                    </>
                  )
                })()}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Location list below map for quick access */}
      <div className="wm-region-loc-list">
        {locations.map(loc => {
          const unlocked = isLocationUnlocked(loc, worldState)
          const npcCount = getVisibleNpcs(loc.id, worldState.storyChapter).length
          return (
            <button
              key={loc.id}
              type="button"
              className={`wm-region-loc-card ${unlocked ? 'unlocked' : 'locked'} ${loc.type}`}
              onClick={() => unlocked && onSelectLocation(loc)}
              disabled={!unlocked}
            >
              <span className="wm-loc-card-icon">{loc.type === 'dungeon' ? '\u2694\uFE0F' : '\uD83C\uDFD8\uFE0F'}</span>
              <span className="wm-loc-card-name">{unlocked ? loc.name : '???'}</span>
              {unlocked && <span className="wm-loc-card-count">{npcCount} NPCs</span>}
              {!unlocked && <span className="wm-loc-card-lock">{'\u{1F512}'}</span>}
              {unlocked && (() => {
                const markers = getLocationMarkers(loc.id, worldState)
                if (markers.length === 0) return null
                return (
                  <span className="wm-loc-card-markers">
                    {markers.includes('main_quest') && <span className="wm-marker main-quest" title="Main quest">!</span>}
                    {markers.includes('side_quest') && <span className="wm-marker side-quest" title="Side quest">?</span>}
                  </span>
                )
              })()}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** Extract bounding box from a mapBounds polygon string. */
function getPolygonBBox(mapBounds: string) {
  const points = mapBounds.split(' ').map(p => {
    const [x, y] = p.split(',').map(Number)
    return { x, y }
  })
  return {
    x1: Math.min(...points.map(p => p.x)),
    y1: Math.min(...points.map(p => p.y)),
    x2: Math.max(...points.map(p => p.x)),
    y2: Math.max(...points.map(p => p.y)),
  }
}
