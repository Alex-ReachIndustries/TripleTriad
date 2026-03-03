import { useState, useRef, useCallback, useMemo } from 'react'
import { REGIONS, LOCATIONS } from '../../data/world'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Point { x: number; y: number }

interface RegionPolygon {
  regionId: string
  points: Point[]
}

interface LocationPos {
  locationId: string
  regionId: string
  /** Absolute position in SVG 0-100 coords (computed from mapX/mapY + region bbox) */
  absX: number
  absY: number
}

interface DragState {
  type: 'vertex' | 'location'
  regionId: string
  vertexIndex?: number
  locationId?: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseMapBounds(mapBounds: string): Point[] {
  const pts = mapBounds.split(' ').map(p => {
    const [x, y] = p.split(',').map(Number)
    return { x, y }
  })
  // Remove duplicate closing point
  if (pts.length > 1 && pts[0].x === pts[pts.length - 1].x && pts[0].y === pts[pts.length - 1].y) {
    pts.pop()
  }
  return pts
}

function pointsToMapBounds(points: Point[]): string {
  const closed = [...points, points[0]]
  return closed.map(p => `${round(p.x)},${round(p.y)}`).join(' ')
}

function getBBox(points: Point[]) {
  const xs = points.map(p => p.x)
  const ys = points.map(p => p.y)
  return {
    x1: Math.min(...xs),
    y1: Math.min(...ys),
    x2: Math.max(...xs),
    y2: Math.max(...ys),
  }
}

function getCentroid(points: Point[]): Point {
  const cx = points.reduce((s, p) => s + p.x, 0) / points.length
  const cy = points.reduce((s, p) => s + p.y, 0) / points.length
  return { x: cx, y: cy }
}

function round(n: number): number {
  return Math.round(n * 10) / 10
}

/** Convert client (mouse) coords to SVG 0-100 coords */
function clientToSvg(svg: SVGSVGElement, clientX: number, clientY: number): Point {
  const pt = svg.createSVGPoint()
  pt.x = clientX
  pt.y = clientY
  const ctm = svg.getScreenCTM()
  if (!ctm) return { x: 0, y: 0 }
  const svgPt = pt.matrixTransform(ctm.inverse())
  return { x: Math.max(0, Math.min(100, svgPt.x)), y: Math.max(0, Math.min(100, svgPt.y)) }
}

/** Convert absolute SVG position back to relative mapX/mapY within a region bbox */
function absToRelative(absX: number, absY: number, bbox: ReturnType<typeof getBBox>): { mapX: number; mapY: number } {
  const w = bbox.x2 - bbox.x1
  const h = bbox.y2 - bbox.y1
  if (w === 0 || h === 0) return { mapX: 50, mapY: 50 }
  return {
    mapX: round(((absX - bbox.x1) / w) * 100),
    mapY: round(((absY - bbox.y1) / h) * 100),
  }
}

/** Compute absolute position from mapX/mapY + region bbox */
function relativeToAbs(mapX: number, mapY: number, bbox: ReturnType<typeof getBBox>): { absX: number; absY: number } {
  const w = bbox.x2 - bbox.x1
  const h = bbox.y2 - bbox.y1
  return {
    absX: bbox.x1 + (mapX / 100) * w,
    absY: bbox.y1 + (mapY / 100) * h,
  }
}

/** Distance from point to line segment (for edge click detection) */
function distToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax, dy = by - ay
  const len2 = dx * dx + dy * dy
  if (len2 === 0) return Math.hypot(px - ax, py - ay)
  let t = ((px - ax) * dx + (py - ay) * dy) / len2
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

// ─── Region colors ───────────────────────────────────────────────────────────

const REGION_COLORS: Record<string, string> = {
  balamb: 'rgba(59,130,246,0.3)',   // blue
  dollet: 'rgba(168,85,247,0.3)',   // purple
  galbadia: 'rgba(239,68,68,0.3)', // red
  fh: 'rgba(34,197,94,0.3)',       // green
  trabia: 'rgba(56,189,248,0.3)',  // cyan
  centra: 'rgba(251,146,60,0.3)',  // orange
  esthar: 'rgba(236,72,153,0.3)',  // pink
}

const REGION_STROKE: Record<string, string> = {
  balamb: 'rgba(59,130,246,0.8)',
  dollet: 'rgba(168,85,247,0.8)',
  galbadia: 'rgba(239,68,68,0.8)',
  fh: 'rgba(34,197,94,0.8)',
  trabia: 'rgba(56,189,248,0.8)',
  centra: 'rgba(251,146,60,0.8)',
  esthar: 'rgba(236,72,153,0.8)',
}

// ─── Component ───────────────────────────────────────────────────────────────

export function MapEditor() {
  const svgRef = useRef<SVGSVGElement>(null)

  // Editable polygon data
  const [polygons, setPolygons] = useState<RegionPolygon[]>(() =>
    REGIONS.map(r => ({ regionId: r.id, points: parseMapBounds(r.mapBounds) }))
  )

  // Editable location positions (stored as absolute SVG coords)
  const [locations, setLocations] = useState<LocationPos[]>(() =>
    LOCATIONS.map(loc => {
      const region = REGIONS.find(r => r.id === loc.regionId)!
      const regionPts = parseMapBounds(region.mapBounds)
      const bbox = getBBox(regionPts)
      const { absX, absY } = relativeToAbs(loc.mapX, loc.mapY, bbox)
      return { locationId: loc.id, regionId: loc.regionId, absX, absY }
    })
  )

  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const [copied, setCopied] = useState(false)

  // Memoize polygon lookup
  const polyMap = useMemo(() => {
    const m = new Map<string, RegionPolygon>()
    for (const p of polygons) m.set(p.regionId, p)
    return m
  }, [polygons])

  // ─── Drag handlers ───────────────────────────────────────────────────────

  const handlePointerDown = useCallback((e: React.PointerEvent, state: DragState) => {
    e.preventDefault()
    e.stopPropagation()
    ;(e.target as Element).setPointerCapture(e.pointerId)
    setDrag(state)
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!drag || !svgRef.current) return
    const pt = clientToSvg(svgRef.current, e.clientX, e.clientY)

    if (drag.type === 'vertex' && drag.vertexIndex != null) {
      setPolygons(prev => prev.map(p => {
        if (p.regionId !== drag.regionId) return p
        const newPts = [...p.points]
        newPts[drag.vertexIndex!] = { x: round(pt.x), y: round(pt.y) }
        return { ...p, points: newPts }
      }))
    } else if (drag.type === 'location' && drag.locationId) {
      setLocations(prev => prev.map(loc => {
        if (loc.locationId !== drag.locationId) return loc
        return { ...loc, absX: round(pt.x), absY: round(pt.y) }
      }))
    }
  }, [drag])

  const handlePointerUp = useCallback(() => {
    setDrag(null)
  }, [])

  // ─── Add vertex on edge right-click ──────────────────────────────────────

  const handleEdgeContextMenu = useCallback((e: React.MouseEvent, regionId: string) => {
    e.preventDefault()
    if (!svgRef.current) return
    const pt = clientToSvg(svgRef.current, e.clientX, e.clientY)
    const poly = polyMap.get(regionId)
    if (!poly) return

    // Find closest edge
    let bestDist = Infinity
    let bestIdx = 0
    for (let i = 0; i < poly.points.length; i++) {
      const a = poly.points[i]
      const b = poly.points[(i + 1) % poly.points.length]
      const d = distToSegment(pt.x, pt.y, a.x, a.y, b.x, b.y)
      if (d < bestDist) { bestDist = d; bestIdx = i }
    }

    // Insert new vertex after bestIdx
    setPolygons(prev => prev.map(p => {
      if (p.regionId !== regionId) return p
      const newPts = [...p.points]
      newPts.splice(bestIdx + 1, 0, { x: round(pt.x), y: round(pt.y) })
      return { ...p, points: newPts }
    }))
  }, [polyMap])

  // ─── Remove vertex on right-click ────────────────────────────────────────

  const handleVertexContextMenu = useCallback((e: React.MouseEvent, regionId: string, vertexIndex: number) => {
    e.preventDefault()
    e.stopPropagation()
    setPolygons(prev => prev.map(p => {
      if (p.regionId !== regionId) return p
      if (p.points.length <= 3) return p // min 3 vertices
      return { ...p, points: p.points.filter((_, i) => i !== vertexIndex) }
    }))
  }, [])

  // ─── Reset region ────────────────────────────────────────────────────────

  const resetRegion = useCallback((regionId: string) => {
    const orig = REGIONS.find(r => r.id === regionId)
    if (!orig) return

    setPolygons(prev => prev.map(p =>
      p.regionId === regionId ? { regionId, points: parseMapBounds(orig.mapBounds) } : p
    ))

    const origPts = parseMapBounds(orig.mapBounds)
    const bbox = getBBox(origPts)
    setLocations(prev => prev.map(loc => {
      if (loc.regionId !== regionId) return loc
      const origLoc = LOCATIONS.find(l => l.id === loc.locationId)!
      const { absX, absY } = relativeToAbs(origLoc.mapX, origLoc.mapY, bbox)
      return { ...loc, absX, absY }
    }))
  }, [])

  // ─── Export ──────────────────────────────────────────────────────────────

  const generateExport = useCallback(() => {
    const lines: string[] = ['// ── Updated Region mapBounds ──\n']
    for (const poly of polygons) {
      const region = REGIONS.find(r => r.id === poly.regionId)!
      lines.push(`// ${region.name}`)
      lines.push(`mapBounds: '${pointsToMapBounds(poly.points)}',\n`)
    }

    lines.push('\n// ── Updated Location mapX/mapY ──\n')
    for (const loc of locations) {
      const poly = polyMap.get(loc.regionId)
      if (!poly) continue
      const bbox = getBBox(poly.points)
      const { mapX, mapY } = absToRelative(loc.absX, loc.absY, bbox)
      const origLoc = LOCATIONS.find(l => l.id === loc.locationId)!
      lines.push(`// ${origLoc.name} (${origLoc.id})`)
      lines.push(`mapX: ${mapX}, mapY: ${mapY},\n`)
    }

    return lines.join('\n')
  }, [polygons, locations, polyMap])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(generateExport()).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [generateExport])

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="map-editor">
      <div className="map-editor-toolbar">
        <h2 className="map-editor-title">Map Editor</h2>
        <div className="map-editor-instructions">
          Drag vertices to reshape regions. Drag markers to reposition locations.
          Right-click polygon to add vertex. Right-click vertex to remove.
        </div>
        <div className="map-editor-actions">
          <button type="button" className="map-editor-btn copy" onClick={handleCopy}>
            {copied ? 'Copied!' : 'Copy All Data'}
          </button>
          {selectedRegion && (
            <button type="button" className="map-editor-btn reset" onClick={() => resetRegion(selectedRegion)}>
              Reset {REGIONS.find(r => r.id === selectedRegion)?.name}
            </button>
          )}
        </div>
      </div>

      <div className="map-editor-body">
        {/* Region selector sidebar */}
        <div className="map-editor-sidebar">
          <h3 className="map-editor-sidebar-title">Regions</h3>
          {REGIONS.map(r => {
            const poly = polyMap.get(r.id)
            const vertCount = poly?.points.length ?? 0
            const locCount = locations.filter(l => l.regionId === r.id).length
            return (
              <button
                key={r.id}
                type="button"
                className={`map-editor-region-btn ${selectedRegion === r.id ? 'selected' : ''}`}
                onClick={() => setSelectedRegion(prev => prev === r.id ? null : r.id)}
                style={{ borderLeftColor: REGION_STROKE[r.id] ?? '#888' }}
              >
                <span className="map-editor-region-name">{r.name}</span>
                <span className="map-editor-region-meta">{vertCount}v / {locCount}loc</span>
              </button>
            )
          })}

          {/* Output preview */}
          <div className="map-editor-output-preview">
            <h3 className="map-editor-sidebar-title">Export Preview</h3>
            <pre className="map-editor-output-code">{generateExport()}</pre>
          </div>
        </div>

        {/* Map canvas */}
        <div className="map-editor-canvas">
          <svg
            ref={svgRef}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="map-editor-svg-full"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {/* World map as SVG image — shares coordinate space with polygons */}
            <image href="/map/world.jpg" x="0" y="0" width="100" height="100" preserveAspectRatio="none" />
            {/* Region polygons */}
            {polygons.map(poly => {
              const isSelected = selectedRegion === poly.regionId
              const pts = [...poly.points, poly.points[0]].map(p => `${p.x},${p.y}`).join(' ')
              return (
                <polygon
                  key={poly.regionId}
                  points={pts}
                  fill={isSelected ? REGION_COLORS[poly.regionId]?.replace('0.3', '0.45') ?? 'rgba(100,100,100,0.45)' : REGION_COLORS[poly.regionId] ?? 'rgba(100,100,100,0.3)'}
                  stroke={REGION_STROKE[poly.regionId] ?? '#888'}
                  strokeWidth={isSelected ? 0.4 : 0.2}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedRegion(poly.regionId)}
                  onContextMenu={(e) => handleEdgeContextMenu(e, poly.regionId)}
                />
              )
            })}

            {/* Vertex handles (only for selected region, or all if none selected) */}
            {polygons
              .filter(p => !selectedRegion || p.regionId === selectedRegion)
              .map(poly =>
                poly.points.map((pt, i) => (
                  <circle
                    key={`v-${poly.regionId}-${i}`}
                    cx={pt.x}
                    cy={pt.y}
                    r={0.8}
                    fill={REGION_STROKE[poly.regionId] ?? '#fff'}
                    stroke="#fff"
                    strokeWidth={0.15}
                    style={{ cursor: 'grab' }}
                    onPointerDown={(e) => handlePointerDown(e, { type: 'vertex', regionId: poly.regionId, vertexIndex: i })}
                    onContextMenu={(e) => handleVertexContextMenu(e, poly.regionId, i)}
                  />
                ))
              )}

            {/* Region name labels */}
            {polygons.map(poly => {
              const center = getCentroid(poly.points)
              const region = REGIONS.find(r => r.id === poly.regionId)!
              return (
                <text
                  key={`label-${poly.regionId}`}
                  x={center.x}
                  y={center.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={1.8}
                  fontWeight="bold"
                  fill="#fff"
                  stroke="rgba(0,0,0,0.7)"
                  strokeWidth={0.3}
                  paintOrder="stroke"
                  pointerEvents="none"
                >
                  {region.name}
                </text>
              )
            })}

            {/* Location markers */}
            {locations
              .filter(l => !selectedRegion || l.regionId === selectedRegion)
              .map(loc => {
                const origLoc = LOCATIONS.find(l => l.id === loc.locationId)!
                const isDungeon = origLoc.type === 'dungeon'
                return (
                  <g key={loc.locationId}>
                    <circle
                      cx={loc.absX}
                      cy={loc.absY}
                      r={0.6}
                      fill={isDungeon ? '#ef4444' : '#facc15'}
                      stroke="#fff"
                      strokeWidth={0.15}
                      style={{ cursor: 'grab' }}
                      onPointerDown={(e) => handlePointerDown(e, { type: 'location', regionId: loc.regionId, locationId: loc.locationId })}
                    />
                    <text
                      x={loc.absX}
                      y={loc.absY - 1.2}
                      textAnchor="middle"
                      fontSize={1}
                      fill="#fff"
                      stroke="rgba(0,0,0,0.6)"
                      strokeWidth={0.2}
                      paintOrder="stroke"
                      pointerEvents="none"
                    >
                      {origLoc.name}
                    </text>
                  </g>
                )
              })}
          </svg>
        </div>
      </div>
    </div>
  )
}
