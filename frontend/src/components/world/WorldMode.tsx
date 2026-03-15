import { useState, useCallback, useEffect } from 'react'
import type { Region, Location, NPC, SpecialRule } from '../../types/world'
import type { WorldPlayerState } from '../../data/worldState'
import { getRegionById, getLocationById } from '../../data/world'
import { WorldMapView } from './WorldMapView'
import { RegionView } from './RegionView'
import { TownView } from './TownView'
import { DungeonView } from './DungeonView'
import { NpcInteraction } from './NpcInteraction'
import { QuestLog } from './QuestLog'
import { StoryCutscene, CUTSCENE_MAP, DUNGEON_ENTER_CUTSCENE_MAP } from '../StoryCutscene'

export type WorldScreen =
  | { type: 'map' }
  | { type: 'region'; regionId: string }
  | { type: 'town'; locationId: string; regionId: string }
  | { type: 'dungeon'; locationId: string; regionId: string }
  | { type: 'quest_log' }

export interface WorldModeCallbacks {
  onInitiateDuel?: (npcId: string, locationId: string) => void
  onBuyCard?: (cardId: string, price: number) => void
  onSellCard?: (cardId: string, sellPrice: number) => void
  onEnterTournament?: (npcId: string, locationId: string) => void
  onAcceptQuest?: (questId: string) => void
  onClaimQuest?: (questId: string) => void
  onSpreadRule?: (rule: SpecialRule, regionId: string) => void
  onAbolishRule?: (rule: SpecialRule, regionId: string) => void
  onNpcInteract?: (npc: NPC) => void
  onMarkCutsceneSeen?: (cutsceneId: string) => void
  onScreenChange?: (screen: WorldScreen) => void
}

interface WorldModeProps extends WorldModeCallbacks {
  worldState: WorldPlayerState
}

export function WorldMode({
  worldState,
  onInitiateDuel,
  onBuyCard,
  onSellCard,
  onEnterTournament,
  onAcceptQuest,
  onClaimQuest,
  onSpreadRule,
  onAbolishRule,
  onNpcInteract,
  onMarkCutsceneSeen,
  onScreenChange,
}: WorldModeProps) {
  const [screen, setScreen] = useState<WorldScreen>({ type: 'map' })

  // Report screen changes for music routing
  useEffect(() => {
    onScreenChange?.(screen)
  }, [screen, onScreenChange])
  const [selectedNpc, setSelectedNpc] = useState<NPC | null>(null)
  const [dungeonCutscene, setDungeonCutscene] = useState<string | null>(null)

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
    // Check for dungeon entrance cutscene
    if (location.type === 'dungeon') {
      const cutsceneId = DUNGEON_ENTER_CUTSCENE_MAP[location.id]
      if (cutsceneId && !worldState.seenCutscenes.includes(cutsceneId)) {
        setDungeonCutscene(cutsceneId)
      }
    }
    setScreen({ type: screenType, locationId: location.id, regionId: location.regionId })
  }, [worldState.seenCutscenes])

  const handleSelectNpc = useCallback((npc: NPC) => {
    setSelectedNpc(npc)
    onNpcInteract?.(npc)
  }, [onNpcInteract])

  const handleCloseNpc = useCallback(() => {
    setSelectedNpc(null)
  }, [])

  const handleInitiateDuel = useCallback((npcId: string) => {
    const npc = selectedNpc
    setSelectedNpc(null)
    if (onInitiateDuel && npc) {
      onInitiateDuel(npcId, npc.locationId)
    }
  }, [onInitiateDuel, selectedNpc])

  const handleBuyCard = useCallback((cardId: string, price: number) => {
    onBuyCard?.(cardId, price)
  }, [onBuyCard])

  const handleSellCard = useCallback((cardId: string, sellPrice: number) => {
    onSellCard?.(cardId, sellPrice)
  }, [onSellCard])

  const handleEnterTournament = useCallback((npcId: string) => {
    const npc = selectedNpc
    setSelectedNpc(null)
    if (onEnterTournament && npc) {
      onEnterTournament(npcId, npc.locationId)
    }
  }, [onEnterTournament, selectedNpc])

  const handleAcceptQuest = useCallback((questId: string) => {
    onAcceptQuest?.(questId)
  }, [onAcceptQuest])

  const handleClaimQuest = useCallback((questId: string) => {
    onClaimQuest?.(questId)
  }, [onClaimQuest])

  // NPC interaction modal (renders over any screen)
  const npcModal = selectedNpc ? (
    <NpcInteraction
      npc={selectedNpc}
      worldState={worldState}
      onClose={handleCloseNpc}
      onInitiateDuel={handleInitiateDuel}
      onBuyCard={handleBuyCard}
      onSellCard={handleSellCard}
      onEnterTournament={handleEnterTournament}
      onAcceptQuest={handleAcceptQuest}
      onClaimQuest={handleClaimQuest}
      onSpreadRule={onSpreadRule}
      onAbolishRule={onAbolishRule}
    />
  ) : null

  // Dungeon entrance cutscene overlay
  if (dungeonCutscene && CUTSCENE_MAP[dungeonCutscene]) {
    return (
      <StoryCutscene
        panels={CUTSCENE_MAP[dungeonCutscene]}
        onComplete={() => {
          onMarkCutsceneSeen?.(dungeonCutscene)
          setDungeonCutscene(null)
        }}
      />
    )
  }

  switch (screen.type) {
    case 'map':
      return (
        <>
          <WorldMapView
            worldState={worldState}
            onSelectRegion={handleSelectRegion}
            onOpenQuestLog={() => setScreen({ type: 'quest_log' })}
          />
          {npcModal}
        </>
      )

    case 'region': {
      const region = getRegionById(screen.regionId)
      if (!region) return null
      return (
        <>
          <RegionView
            region={region}
            worldState={worldState}
            onSelectLocation={handleSelectLocation}
            onBack={handleBackToMap}
          />
          {npcModal}
        </>
      )
    }

    case 'town': {
      const loc = getLocationById(screen.locationId)
      if (!loc) return null
      return (
        <>
          <TownView
            location={loc}
            worldState={worldState}
            onSelectNpc={handleSelectNpc}
            onSelectLocation={handleSelectLocation}
            onBack={() => handleBackToRegion(screen.regionId)}
          />
          {npcModal}
        </>
      )
    }

    case 'dungeon': {
      const loc = getLocationById(screen.locationId)
      if (!loc) return null
      return (
        <>
          <DungeonView
            location={loc}
            worldState={worldState}
            onStartFloor={handleSelectNpc}
            onBack={() => handleBackToRegion(screen.regionId)}
          />
          {npcModal}
        </>
      )
    }

    case 'quest_log':
      return (
        <QuestLog
          worldState={worldState}
          onBack={handleBackToMap}
        />
      )
  }
}
