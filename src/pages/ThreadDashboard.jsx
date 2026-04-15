import React, { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, GitBranch, CheckCircle2, Archive, AlertTriangle } from 'lucide-react'
import { useThreads } from '../hooks/useThreads'
import { useManuscript } from '../hooks/useManuscript'
import { useCharacters } from '../hooks/useCharacters'
import { useLore } from '../hooks/useLore'
import ThreadCard from '../components/threads/ThreadCard'
import ThreadDetailPanel from '../components/threads/ThreadDetailPanel'
import AddThreadModal from '../components/threads/AddThreadModal'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { getAllChapters } from '../hooks/useManuscript'

export default function ThreadDashboard() {
  const { projectId } = useParams()
  const navigate      = useNavigate()
  const ms            = useManuscript(projectId)
  const { threads, loading, createThread, updateThread, deleteThread,
          linkCharacter, unlinkCharacter, linkLore, unlinkLore } = useThreads(projectId)
  const { characters } = useCharacters(projectId)
  const { entries: loreEntries } = useLore(projectId)

  const [selectedThread, setSelectedThread] = useState(null)
  const [showAdd,        setShowAdd]        = useState(false)

  // Build chapterMap from structure
  const chapterMap = useMemo(() => {
    const map = {}
    getAllChapters(ms.structure || { hasParts: false, chapters: [] }).forEach(ch => {
      map[ch.id] = ch.title || 'Untitled Chapter'
    })
    return map
  }, [ms.structure])

  // Group threads by status
  const active   = threads.filter(t => t.status === 'active')
  const resolved = threads.filter(t => t.status === 'resolved')
  const dropped  = threads.filter(t => t.status === 'dropped')

  // Forgotten alert count
  const forgottenCount = active.filter(t => (t.dormancyCount || 0) >= 7).length

  function handleNavigateToScene(sceneId) {
    navigate(`/projects/${projectId}`, { state: { openSceneId: sceneId } })
  }

  if (ms.loading) return <LoadingSpinner fullscreen />

  return (
    <div className="min-h-screen bg-axiom-bg flex flex-col">

      {/* Header */}
      <header className="flex items-center justify-between h-12 px-4 bg-axiom-surface border-b border-axiom-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/projects/${projectId}`)} className="btn-icon">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-teal-400" />
            <span className="font-serif font-semibold text-slate-100 text-sm">Plot Threads</span>
            {!loading && threads.length > 0 && (
              <span className="text-xs text-slate-600">({active.length} active)</span>
            )}
          </div>
          {forgottenCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-900/20 border border-red-500/30 rounded-full">
              <AlertTriangle className="w-3 h-3 text-red-400" />
              <span className="text-xs font-semibold text-red-400">{forgottenCount} forgotten</span>
            </div>
          )}
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary text-xs py-1.5 px-3">
          <Plus className="w-3.5 h-3.5" />
          Add Thread
        </button>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Three-column kanban */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <LoadingSpinner />
            </div>
          ) : threads.length === 0 ? (
            <EmptyState onAdd={() => setShowAdd(true)} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-full">

              {/* Active */}
              <Column
                title="Active"
                icon={<GitBranch className="w-3.5 h-3.5 text-teal-400" />}
                count={active.length}
                accent="teal"
                threads={active}
                chapterMap={chapterMap}
                selectedId={selectedThread?.id}
                onSelect={t => setSelectedThread(prev => prev?.id === t.id ? null : t)}
                onResolve={t => updateThread(t.id, { status: 'resolved' })}
                onDrop={t => updateThread(t.id, { status: 'dropped' })}
                onActivate={() => {}}
              />

              {/* Resolved */}
              <Column
                title="Resolved"
                icon={<CheckCircle2 className="w-3.5 h-3.5 text-gold-400" />}
                count={resolved.length}
                accent="gold"
                threads={resolved}
                chapterMap={chapterMap}
                selectedId={selectedThread?.id}
                onSelect={t => setSelectedThread(prev => prev?.id === t.id ? null : t)}
                onResolve={() => {}}
                onDrop={() => {}}
                onActivate={t => updateThread(t.id, { status: 'active', dormancyCount: 0 })}
              />

              {/* Dropped */}
              <Column
                title="Dropped"
                icon={<Archive className="w-3.5 h-3.5 text-slate-500" />}
                count={dropped.length}
                accent="slate"
                threads={dropped}
                chapterMap={chapterMap}
                selectedId={selectedThread?.id}
                onSelect={t => setSelectedThread(prev => prev?.id === t.id ? null : t)}
                onResolve={() => {}}
                onDrop={() => {}}
                onActivate={t => updateThread(t.id, { status: 'active', dormancyCount: 0 })}
              />
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selectedThread && (
          <ThreadDetailPanel
            thread={selectedThread}
            structure={ms.structure}
            onClose={() => setSelectedThread(null)}
            onUpdate={updateThread}
            onDelete={deleteThread}
            onNavigateToScene={handleNavigateToScene}
            characters={characters}
            loreEntries={loreEntries}
            onLinkCharacter={linkCharacter}
            onUnlinkCharacter={unlinkCharacter}
            onLinkLore={linkLore}
            onUnlinkLore={unlinkLore}
          />
        )}
      </div>

      {/* Modals */}
      {showAdd && (
        <AddThreadModal
          structure={ms.structure}
          onClose={() => setShowAdd(false)}
          onCreate={createThread}
        />
      )}
    </div>
  )
}

// ── Column component ──────────────────────────────────────────────────────────
function Column({ title, icon, count, accent, threads, chapterMap, selectedId, onSelect, onResolve, onDrop, onActivate }) {
  const ACCENT = {
    teal:  'border-teal-500/30',
    gold:  'border-gold-500/30',
    slate: 'border-slate-600/30',
  }
  const HEADER = {
    teal:  'text-teal-400',
    gold:  'text-gold-400',
    slate: 'text-slate-500',
  }

  return (
    <div className={`flex flex-col rounded-xl border ${ACCENT[accent] ?? 'border-axiom-border'} bg-axiom-surface/30 min-h-[200px]`}>
      {/* Column header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-axiom-border/50">
        {icon}
        <span className={`text-xs font-semibold uppercase tracking-wider ${HEADER[accent]}`}>{title}</span>
        {count > 0 && (
          <span className="ml-auto text-xs text-slate-600 tabular-nums">{count}</span>
        )}
      </div>

      {/* Cards */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto">
        {threads.length === 0 ? (
          <p className="text-xs text-slate-700 text-center py-6 italic">
            {title === 'Active' ? 'No active threads' :
             title === 'Resolved' ? 'Nothing resolved yet' : 'Nothing dropped'}
          </p>
        ) : (
          threads
            .sort((a, b) => (b.dormancyCount || 0) - (a.dormancyCount || 0))
            .map(t => (
              <div key={t.id} className={selectedId === t.id ? 'ring-1 ring-gold-500/30 rounded-xl' : ''}>
                <ThreadCard
                  thread={t}
                  chapterMap={chapterMap}
                  onClick={() => onSelect(t)}
                  onResolve={e => { e.stopPropagation(); onResolve(t) }}
                  onDrop={e => { e.stopPropagation(); onDrop(t) }}
                  onActivate={e => { e.stopPropagation(); onActivate(t) }}
                />
              </div>
            ))
        )}
      </div>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ onAdd }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8">
      <div className="w-16 h-16 rounded-2xl bg-axiom-surface border border-axiom-border flex items-center justify-center mb-4">
        <GitBranch className="w-7 h-7 text-slate-600" />
      </div>
      <h3 className="font-serif text-xl font-semibold text-slate-200 mb-2">No threads yet</h3>
      <p className="text-slate-500 text-sm max-w-sm leading-relaxed mb-6">
        Threads track the forces shaping your story. Create one now, or link them as you write.
      </p>
      <button onClick={onAdd} className="btn-primary text-sm">
        <Plus className="w-4 h-4" />
        Create Thread
      </button>
    </div>
  )
}
