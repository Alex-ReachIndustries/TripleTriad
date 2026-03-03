import { useState, useCallback } from 'react'
import type { Region, Location } from '../../types/world'
import type { WorldPlayerState } from '../../data/worldState'
import { getRegionById, getLocationById } from '../../data/world'
import { WorldMapView } from './WorldMapView'
import { RegionView } from './RegionView'

type WorldScreen =
  | { type: 'map' }
  | { type: 'region'; regionId: string }
  | { type: 'town'; locationId: string; regionId: string }
  | { type: 'dungeon'; locationId: string; regionId: string }

export interface WorldModeCallbacks {
  onInitiateDuel?: (npcId: string, locationId: string) => void
  onBuyCard?: (cardId: string, price: number) => void
  onSellCard?: (cardId: string, sellPrice: number) => void
  onEnterTournament?: (npcId: string) => void
  onAcceptQuest?: (questId: string) => void
  onClaimQuest?: (questId: string) => void
}

interface WorldModeProps extends WorldModeCallbacks {
  worldState: WorldPlayerState
}

export function WorldMode({ worldState }: WorldModeProps) {
  const [screen, setScreen] = useState<WorldScreen>({ type: 'map' })

  const handleSelectRegion = useCallback((region: Region) => {
    setScreen({ type: 'region', regionId: region.id })
  }, [])

  const handleBackToMap = useCallback(() => {
    setScreen({ type: 'map' })
  }, [])

  const handleBackToRegion = useCallback((regionId: string) => {
    setScreen({ type: 'region', regionId })
  }, [])

  const handleSelectLocation = useCallback((location: Location) => {
    const screenType = location.type === 'dungeon' ? 'dungeon' : 'town'
    setScreen({ type: screenType, locationId: location.id, regionId: location.regionId })
  }, [])

  switch (screen.type) {
    case 'map':
      return <WorldMapView worldState={worldState} onSelectRegion={handleSelectRegion} />

    case 'region': {
      const region = getRegionById(screen.regionId)
      if (!region) return null
      return (
        <RegionView
          region={region}
          worldState={worldState}
          onSelectLocation={handleSelectLocation}
          onBack={handleBackToMap}
        />
      )
    }

    case 'town': {
      const loc = getLocationById(screen.locationId)
      return (
        <div className="wm-placeholder">
          <button
            type="button"
            className="wm-back-btn"
            onClick={() => handleBackToRegion(screen.regionId)}
          >
            &#8592; Back to {getRegionById(screen.regionId)?.name ?? 'Region'}
          </button>
          <h2>{loc?.name ?? screen.locationId}</h2>
          <p className="wm-placeholder-text">Town view — coming in Phase 4c</p>
        </div>
      )
    }

    case 'dungeon': {
      const loc = getLocationById(screen.locationId)
      return (
        <div className="wm-placeholder">
          <button
            type="button"
            className="wm-back-btn"
            onClick={() => handleBackToRegion(screen.regionId)}
          >
            &#8592; Back to {getRegionById(screen.regionId)?.name ?? 'Region'}
          </button>
          <h2>{loc?.name ?? screen.locationId}</h2>
          <p className="wm-placeholder-text">Dungeon view — coming in Phase 4d</p>
        </div>
      )
    }
  }
}
