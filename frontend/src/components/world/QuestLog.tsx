import type { WorldPlayerState } from '../../data/worldState'
import { QUESTS } from '../../data/quests'
import { getQuestStatus, isQuestAccessible } from '../../data/quests'
import type { Quest, QuestStatus } from '../../types/quest'
import type { StoryLogSource } from '../../types/world'

function sourceLabel(source: StoryLogSource): string {
  switch (source) {
    case 'prologue': return 'Prologue'
    case 'npc_talk': return 'Encounter'
    case 'quest_accept': return 'Quest'
    case 'quest_complete': return 'Milestone'
    case 'dungeon_clear': return 'Victory'
  }
}

interface QuestLogProps {
  worldState: WorldPlayerState
  onBack: () => void
}

export function QuestLog({ worldState, onBack }: QuestLogProps) {
  // Only consider quests whose giver NPC + location are currently accessible
  const accessible = QUESTS.filter(q => isQuestAccessible(q, worldState))
  const mainQuests = accessible.filter(q => q.isMainQuest)
  const sideQuests = accessible.filter(q => !q.isMainQuest)

  // Story log: sorted by order
  const storyEntries = [...(worldState.storyLog ?? [])].sort((a, b) => a.order - b.order)

  // Active quests — already accepted, giver still accessible
  const activeMain = mainQuests.filter(q =>
    getQuestStatus(q.id, worldState.activeQuests, worldState.completedQuests) === 'active'
  )
  const activeSide = sideQuests.filter(q =>
    getQuestStatus(q.id, worldState.activeQuests, worldState.completedQuests) === 'active'
  )

  // Available quests — not yet accepted, giver accessible at current chapter
  const availableMain = mainQuests.filter(q =>
    getQuestStatus(q.id, worldState.activeQuests, worldState.completedQuests) === 'available'
  )
  const availableSide = sideQuests.filter(q =>
    getQuestStatus(q.id, worldState.activeQuests, worldState.completedQuests) === 'available'
  )

  // Completed side quests (show regardless of current accessibility)
  const completedSide = QUESTS.filter(q =>
    !q.isMainQuest && getQuestStatus(q.id, worldState.activeQuests, worldState.completedQuests) === 'completed'
  )

  return (
    <div className="ql-container">
      <div className="ql-header">
        <button type="button" className="wm-back-btn" onClick={onBack}>
          &#8592; World Map
        </button>
        <div className="ql-title-area">
          <h2 className="ql-title">Quest Log</h2>
          <div className="ql-chapter-badge">
            Chapter {worldState.storyChapter} of 13
          </div>
        </div>
      </div>

      {/* Story Log — granular entries from NPCs, quests, dungeons */}
      <section className="ql-section">
        <h3 className="ql-section-title">
          <span className="ql-section-icon">&#x1F4D6;</span>
          Story Log
        </h3>
        {storyEntries.length === 0 ? (
          <p className="ql-empty">Your story has just begun...</p>
        ) : (
          <div className="ql-story-entries">
            {storyEntries.map(entry => (
              <div key={entry.id} className="ql-story-entry">
                <span className={`ql-story-source ${entry.source}`}>{sourceLabel(entry.source)}</span>
                <p className="ql-story-text">{entry.text}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Active Quests */}
      <section className="ql-section">
        <h3 className="ql-section-title">
          <span className="ql-section-icon">&#x2694;&#xFE0F;</span>
          Active Quests
          {(activeMain.length + activeSide.length) > 0 && (
            <span className="ql-count">{activeMain.length + activeSide.length}</span>
          )}
        </h3>
        {activeMain.length === 0 && activeSide.length === 0 ? (
          <p className="ql-empty">No active quests. Talk to NPCs to find new quests!</p>
        ) : (
          <div className="ql-quest-list">
            {activeMain.map(q => <QuestCard key={q.id} quest={q} status="active" />)}
            {activeSide.map(q => <QuestCard key={q.id} quest={q} status="active" />)}
          </div>
        )}
      </section>

      {/* Available Quests */}
      {(availableMain.length + availableSide.length) > 0 && (
        <section className="ql-section">
          <h3 className="ql-section-title">
            <span className="ql-section-icon">&#x2753;</span>
            Available Quests
            <span className="ql-count">{availableMain.length + availableSide.length}</span>
          </h3>
          <div className="ql-quest-list">
            {availableMain.map(q => <QuestCard key={q.id} quest={q} status="available" />)}
            {availableSide.map(q => <QuestCard key={q.id} quest={q} status="available" />)}
          </div>
        </section>
      )}

      {/* Completed Side Quests */}
      {completedSide.length > 0 && (
        <section className="ql-section">
          <h3 className="ql-section-title">
            <span className="ql-section-icon">&#x2705;</span>
            Completed
            <span className="ql-count">{completedSide.length}</span>
          </h3>
          <div className="ql-quest-list">
            {completedSide.map(q => <QuestCard key={q.id} quest={q} status="completed" />)}
          </div>
        </section>
      )}
    </div>
  )
}

function QuestCard({ quest, status }: { quest: Quest; status: QuestStatus }) {
  const typeLabel = quest.type === 'find_card' ? 'Find Card'
    : quest.type === 'beat_npc' ? 'Beat NPC'
    : 'Clear Dungeon'

  return (
    <div className={`ql-quest-card ${status}`}>
      <div className="ql-quest-badge-row">
        {quest.isMainQuest ? (
          <span className="ql-quest-type main">Main Quest</span>
        ) : (
          <span className="ql-quest-type side">Side Quest</span>
        )}
        <span className={`ql-quest-status ${status}`}>
          {status === 'active' ? 'In Progress' : status === 'available' ? 'Available' : 'Complete'}
        </span>
      </div>
      <div className="ql-quest-name">{quest.name}</div>
      <div className="ql-quest-desc">{quest.description}</div>
      <div className="ql-quest-footer">
        <span className="ql-quest-objective">{typeLabel}: {quest.targetId.replace(/_/g, ' ')}</span>
        <span className="ql-quest-reward">
          {quest.reward.gil > 0 && `${quest.reward.gil} Gil`}
          {quest.reward.cardId && (quest.reward.gil > 0 ? ' + ' : '') + `Card: ${quest.reward.cardId.replace(/_/g, ' ')}`}
        </span>
      </div>
    </div>
  )
}
