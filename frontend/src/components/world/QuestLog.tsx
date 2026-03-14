import { useState } from 'react'
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
    case 'cutscene': return 'Cutscene'
    default: return source
  }
}

type QuestTab = 'available' | 'accepted' | 'completed'

interface QuestLogProps {
  worldState: WorldPlayerState
  onBack: () => void
}

export function QuestLog({ worldState, onBack }: QuestLogProps) {
  const [questTab, setQuestTab] = useState<QuestTab>('accepted')

  const accessible = QUESTS.filter(q => isQuestAccessible(q, worldState))
  const mainQuests = accessible.filter(q => q.isMainQuest)
  const sideQuests = accessible.filter(q => !q.isMainQuest)

  // Story log: sorted by order
  const storyEntries = [...(worldState.storyLog ?? [])].sort((a, b) => a.order - b.order)

  // Accepted (active) quests
  const acceptedMain = mainQuests.filter(q =>
    getQuestStatus(q.id, worldState.activeQuests, worldState.completedQuests) === 'active'
  )
  const acceptedSide = sideQuests.filter(q =>
    getQuestStatus(q.id, worldState.activeQuests, worldState.completedQuests) === 'active'
  )
  const accepted = [...acceptedMain, ...acceptedSide]

  // Available quests
  const availableMain = mainQuests.filter(q =>
    getQuestStatus(q.id, worldState.activeQuests, worldState.completedQuests) === 'available'
  )
  const availableSide = sideQuests.filter(q =>
    getQuestStatus(q.id, worldState.activeQuests, worldState.completedQuests) === 'available'
  )
  const available = [...availableMain, ...availableSide]

  // Completed quests (all, not just accessible)
  const completed = QUESTS.filter(q =>
    getQuestStatus(q.id, worldState.activeQuests, worldState.completedQuests) === 'completed'
  )

  const tabQuests: Quest[] = questTab === 'available' ? available
    : questTab === 'accepted' ? accepted
    : completed

  const tabStatus: QuestStatus = questTab === 'available' ? 'available'
    : questTab === 'accepted' ? 'active'
    : 'completed'

  return (
    <div className="ql-container">
      <div className="ql-header">
        <button type="button" className="wm-back-btn" onClick={onBack}>
          &#8592; World Map
        </button>
        <div className="ql-title-area">
          <h2 className="ql-title">Quest Log</h2>
          <div className="ql-chapter-badge">
            Chapter {worldState.storyChapter} of 18
          </div>
        </div>
      </div>

      <div className="ql-split">
        {/* Left panel: Story Log */}
        <section className="ql-panel ql-story-panel">
          <h3 className="ql-panel-title">Story Log</h3>
          <div className="ql-panel-scroll">
            {storyEntries.length === 0 ? (
              <p className="ql-empty">Your story has just begun...</p>
            ) : (
              <div className="ql-story-entries">
                {storyEntries.map(entry => (
                  <div key={entry.id} className="ql-story-entry">
                    <span className={`ql-story-source ql-source-${entry.source}`}>{sourceLabel(entry.source)}</span>
                    <p className="ql-story-text">{entry.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Right panel: Quests with tabs */}
        <section className="ql-panel ql-quest-panel">
          <div className="ql-tabs">
            <button
              type="button"
              className={`ql-tab ${questTab === 'available' ? 'active' : ''}`}
              onClick={() => setQuestTab('available')}
            >
              Available
              {available.length > 0 && <span className="ql-tab-count">{available.length}</span>}
            </button>
            <button
              type="button"
              className={`ql-tab ${questTab === 'accepted' ? 'active' : ''}`}
              onClick={() => setQuestTab('accepted')}
            >
              Accepted
              {accepted.length > 0 && <span className="ql-tab-count">{accepted.length}</span>}
            </button>
            <button
              type="button"
              className={`ql-tab ${questTab === 'completed' ? 'active' : ''}`}
              onClick={() => setQuestTab('completed')}
            >
              Completed
              {completed.length > 0 && <span className="ql-tab-count">{completed.length}</span>}
            </button>
          </div>
          <div className="ql-panel-scroll">
            {tabQuests.length === 0 ? (
              <p className="ql-empty">
                {questTab === 'available' ? 'No available quests right now.'
                  : questTab === 'accepted' ? 'No active quests. Talk to NPCs to find new quests!'
                  : 'No completed quests yet.'}
              </p>
            ) : (
              <div className="ql-quest-list">
                {tabQuests.map(q => <QuestCard key={q.id} quest={q} status={tabStatus} />)}
              </div>
            )}
          </div>
        </section>
      </div>
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
