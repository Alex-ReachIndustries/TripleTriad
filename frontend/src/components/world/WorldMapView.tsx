import { useState, useRef, useCallback } from 'react'
import type { Region } from '../../types/world'
import type { WorldPlayerState } from '../../data/worldState'
import { getRegions, formatRules } from '../../data/world'
import { isRegionUnlocked } from '../../data/unlock'
import { getRegionMarkers } from '../../data/markers'

interface WorldMapViewProps {
  worldState: WorldPlayerState
  onSelectRegion: (region: Region) => void
  onOpenQuestLog?: () => void
}

function getTouchDistance(t1: React.Touch, t2: React.Touch) {
  return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
}

function getTouchCenter(t1: React.Touch, t2: React.Touch) {
  return { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 }
}

export function WorldMapView({ worldState, onSelectRegion, onOpenQuestLog }: WorldMapViewProps) {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null)
  const [scale, setScale] = useState(1)
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const pinchRef = useRef<{ startDist: number; startScale: number; startCenter: { x: number; y: number }; startTranslate: { x: number; y: number } } | null>(null)
  const lastTapRef = useRef(0)
  const regions = getRegions()

  // Sort: locked regions render first (underneath), unlocked last (on top in SVG)
  const sortedRegions = [...regions].sort((a, b) => {
    const aU = isRegionUnlocked(a, worldState) ? 1 : 0
    const bU = isRegionUnlocked(b, worldState) ? 1 : 0
    return aU - bU
  })

  const unlockedCount = regions.filter(r => isRegionUnlocked(r, worldState)).length
  const hovered = hoveredRegion ? regions.find(r => r.id === hoveredRegion) : null
  const hoveredUnlocked = hovered ? isRegionUnlocked(hovered, worldState) : false

  const clampTranslate = useCallback((tx: number, ty: number, s: number) => {
    if (s <= 1) return { x: 0, y: 0 }
    const el = containerRef.current
    if (!el) return { x: tx, y: ty }
    const w = el.clientWidth
    const h = el.clientHeight
    const maxX = (w * (s - 1)) / 2
    const maxY = (h * (s - 1)) / 2
    return { x: Math.max(-maxX, Math.min(maxX, tx)), y: Math.max(-maxY, Math.min(maxY, ty)) }
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault()
      const dist = getTouchDistance(e.touches[0], e.touches[1])
      const center = getTouchCenter(e.touches[0], e.touches[1])
      pinchRef.current = { startDist: dist, startScale: scale, startCenter: center, startTranslate: translate }
    } else if (e.touches.length === 1 && scale > 1) {
      // Single finger pan when zoomed
      pinchRef.current = { startDist: 0, startScale: scale, startCenter: { x: e.touches[0].clientX, y: e.touches[0].clientY }, startTranslate: translate }
    }
    // Double-tap to reset
    if (e.touches.length === 1) {
      const now = Date.now()
      if (now - lastTapRef.current < 300) {
        setScale(1)
        setTranslate({ x: 0, y: 0 })
        pinchRef.current = null
      }
      lastTapRef.current = now
    }
  }, [scale, translate])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pinchRef.current) return
    if (e.touches.length === 2) {
      e.preventDefault()
      const dist = getTouchDistance(e.touches[0], e.touches[1])
      const newScale = Math.max(1, Math.min(4, pinchRef.current.startScale * (dist / pinchRef.current.startDist)))
      const center = getTouchCenter(e.touches[0], e.touches[1])
      const dx = center.x - pinchRef.current.startCenter.x
      const dy = center.y - pinchRef.current.startCenter.y
      const newT = clampTranslate(pinchRef.current.startTranslate.x + dx, pinchRef.current.startTranslate.y + dy, newScale)
      setScale(newScale)
      setTranslate(newT)
    } else if (e.touches.length === 1 && pinchRef.current.startDist === 0 && scale > 1) {
      e.preventDefault()
      const dx = e.touches[0].clientX - pinchRef.current.startCenter.x
      const dy = e.touches[0].clientY - pinchRef.current.startCenter.y
      const newT = clampTranslate(pinchRef.current.startTranslate.x + dx, pinchRef.current.startTranslate.y + dy, scale)
      setTranslate(newT)
    }
  }, [scale, clampTranslate])

  const handleTouchEnd = useCallback(() => {
    pinchRef.current = null
  }, [])

  return (
    <div className="wm-map">
      <div className="wm-map-header">
        <h2 className="wm-map-title">World Map</h2>
        <div className="wm-header-stats">
          <div className="wm-progress">
            <span className="wm-progress-label">{unlockedCount}/{regions.length} Regions</span>
            <div className="wm-progress-bar">
              <div
                className="wm-progress-fill"
                style={{ width: `${(unlockedCount / regions.length) * 100}%` }}
              />
            </div>
          </div>
          <div className="wm-gil">
            <span className="wm-gil-icon" aria-hidden>G</span>
            {worldState.gil.toLocaleString()}
          </div>
          {onOpenQuestLog && (
            <button type="button" className="wm-quest-log-btn" onClick={onOpenQuestLog}>
              {'\u{1F4D6}'} Quests
            </button>
          )}
        </div>
      </div>

      <div
        className="wm-map-container"
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: scale > 1 ? 'none' : 'pan-y' }}
      >
        <div
          className="wm-map-inner"
          style={{ transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`, transformOrigin: 'center center' }}
        >
          <img
            src="/map/world.jpg"
            alt="FFVIII World Map"
            className="wm-map-image"
            draggable={false}
          />
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="wm-map-svg"
            aria-hidden
          >
            {sortedRegions.map(region => {
              const unlocked = isRegionUnlocked(region, worldState)
              const isHovered = hoveredRegion === region.id
              return (
                <polygon
                  key={region.id}
                  points={region.mapBounds}
                  className={`wm-region-poly ${unlocked ? 'unlocked' : 'locked'} ${isHovered ? 'hovered' : ''}`}
                  onClick={() => unlocked && onSelectRegion(region)}
                  onMouseEnter={() => setHoveredRegion(region.id)}
                  onMouseLeave={() => setHoveredRegion(null)}
                  tabIndex={unlocked ? 0 : -1}
                  role="button"
                  aria-label={unlocked ? `${region.name} — ${formatRules(region.rules)}` : `Locked region`}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && unlocked) {
                      e.preventDefault()
                      onSelectRegion(region)
                    }
                  }}
                />
              )
            })}
          </svg>

          {/* Region name labels positioned at polygon centroids */}
          {regions.map(region => {
            const unlocked = isRegionUnlocked(region, worldState)
            const center = getPolygonCenter(region.mapBounds)
            return (
              <div
                key={`label-${region.id}`}
                className={`wm-region-label ${unlocked ? 'unlocked' : 'locked'} ${hoveredRegion === region.id ? 'hovered' : ''}`}
                style={{ left: `${center.x}%`, top: `${center.y}%` }}
                aria-hidden
              >
                {unlocked ? region.name : '???'}
                {unlocked && (() => {
                  const markers = getRegionMarkers(region.id, worldState)
                  if (markers.length === 0) return null
                  return (
                    <span className="wm-region-markers">
                      {markers.includes('main_quest') && <span className="wm-marker main-quest" title="Main quest available">!</span>}
                      {markers.includes('side_quest') && <span className="wm-marker side-quest" title="Side quest available">?</span>}
                    </span>
                  )
                })()}
              </div>
            )
          })}
        </div>
        {scale > 1 && (
          <button
            type="button"
            className="wm-zoom-reset"
            onClick={() => { setScale(1); setTranslate({ x: 0, y: 0 }) }}
            aria-label="Reset zoom"
          >
            Reset
          </button>
        )}
      </div>

      {/* Info panel below map — shows hovered or instruction */}
      <div className="wm-info-panel" aria-live="polite">
        {hovered && hoveredUnlocked ? (
          <>
            <h3 className="wm-info-name">{hovered.name}</h3>
            <p className="wm-info-desc">{hovered.description}</p>
            <div className="wm-info-details">
              <span className="wm-info-rules">Rules: {formatRules(hovered.rules)}</span>
              <span className="wm-info-trade">Trade: {hovered.tradeRule}</span>
            </div>
            <p className="wm-info-hint">Click to explore this region</p>
          </>
        ) : hovered && !hoveredUnlocked ? (
          <>
            <h3 className="wm-info-name">??? (Locked)</h3>
            <p className="wm-info-desc">Complete objectives in other regions to unlock this area.</p>
          </>
        ) : (
          <p className="wm-info-hint">Hover over a region to see details. Click an unlocked region to explore.</p>
        )}
      </div>
    </div>
  )
}

/** Compute centroid of a polygon defined by mapBounds string. */
function getPolygonCenter(mapBounds: string): { x: number; y: number } {
  const points = mapBounds.split(' ').map(p => {
    const [x, y] = p.split(',').map(Number)
    return { x, y }
  })
  // Remove duplicate closing point if present
  const unique =
    points.length > 1 &&
    points[0].x === points[points.length - 1].x &&
    points[0].y === points[points.length - 1].y
      ? points.slice(0, -1)
      : points
  const cx = unique.reduce((sum, p) => sum + p.x, 0) / unique.length
  const cy = unique.reduce((sum, p) => sum + p.y, 0) / unique.length
  return { x: cx, y: cy }
}
