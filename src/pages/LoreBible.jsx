import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, Plus, BookMarked, GitBranch, X, FileText, Upload } from 'lucide-react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useLore, buildLoreContext } from '../hooks/useLore'
import { useCharacters } from '../hooks/useCharacters'
import { useDossiers } from '../hooks/useDossiers'
import LoreSidebar from '../components/lore/LoreSidebar'
import LoreEntryPanel from '../components/lore/LoreEntryPanel'
import CreateLoreModal from '../components/lore/CreateLoreModal'
import LoreGapsPanel from '../components/lore/LoreGapsPanel'
import ImportDossierModal from '../components/dossier/ImportDossierModal'
import DossierCard from '../components/dossier/DossierCard'
import DossierViewer from '../components/dossier/DossierViewer'
import { useSubscription } from '../hooks/useSubscription'
import UpgradePrompt from '../components/subscription/UpgradePrompt'

export default function LoreBible() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { canAccess, loading: subLoading } = useSubscription()

  // ── Lore ──────────────────────────────────────────────────────────────────
  const { entries, loading, createEntry, deleteEntry } = useLore(projectId)
  const { characters } = useCharacters(projectId)

  const [selectedId,    setSelectedId]    = useState(null)
  const [showCreate,    setShowCreate]    = useState(false)
  const [prefillTitle,  setPrefillTitle]  = useState('')
  const [showGapsPanel, setShowGapsPanel] = useState(false)
  const syncTimerRef = useRef(null)

  // ── Dossiers ───────────────────────────────────────────────────────────────
  const { dossiers, loading: dossiersLoading, createDossier, deleteDossier } = useDossiers(projectId)
  const [selectedDossierId, setSelectedDossierId] = useState(null)
  const [showImportDossier, setShowImportDossier] = useState(false)

  // ── Tab ────────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('lore') // 'lore' | 'dossiers'

  // Support ?new=<term> from manuscript gap detection
  useEffect(() => {
    const newTerm = searchParams.get('new')
    if (newTerm) {
      setPrefillTitle(decodeURIComponent(newTerm))
      setShowCreate(true)
      setSearchParams({}, { replace: true })
    }
  }, []) // eslint-disable-line

  // Auto-select first lore entry on load
  useEffect(() => {
    if (!loading && entries.length > 0 && !selectedId) {
      setSelectedId(entries[0].id)
    }
  }, [loading, entries.length]) // eslint-disable-line

  // Auto-select first dossier on load
  useEffect(() => {
    if (!dossiersLoading && dossiers.length > 0 && !selectedDossierId) {
      setSelectedDossierId(dossiers[0].id)
    }
  }, [dossiersLoading, dossiers.length]) // eslint-disable-line

  // Auto-sync lore context
  useEffect(() => {
    if (loading || !entries.length) return
    clearTimeout(syncTimerRef.current)
    syncTimerRef.current = setTimeout(() => {
      const context = buildLoreContext(entries)
      updateDoc(doc(db, 'projects', projectId), { loreBibleContext: context })
        .catch(err => console.error('[LoreBible] Failed to sync lore context:', err))
    }, 3000)
    return () => clearTimeout(syncTimerRef.current)
  }, [entries, loading, projectId]) // eslint-disable-line

  const existingCategories = useMemo(() => {
    const cats = new Set(entries.map(e => e.category).filter(Boolean))
    return Array.from(cats).sort()
  }, [entries])

  // ── Handlers ───────────────────────────────────────────────────────────────
  async function handleCreate(data) {
    const id = await createEntry(data)
    setSelectedId(id)
    setShowCreate(false)
    setPrefillTitle('')
  }

  async function handleDelete(entryId) {
    await deleteEntry(entryId)
    setSelectedId(entries.find(e => e.id !== entryId)?.id ?? null)
  }

  function openCreate() {
    setPrefillTitle('')
    setShowCreate(true)
  }

  async function handleDossierImported(data) {
    const id = await createDossier(data)
    setSelectedDossierId(id)
    setShowImportDossier(false)
  }

  async function handleDossierDelete(dossierId) {
    if (!window.confirm('Delete this dossier? This cannot be undone.')) return
    await deleteDossier(dossierId)
    setSelectedDossierId(dossiers.find(d => d.id !== dossierId)?.id ?? null)
  }

  const lockedCount = entries.filter(e => e.flexibility === 'locked').length
  const selectedDossier = dossiers.find(d => d.id === selectedDossierId) ?? null

  if (!subLoading && !canAccess('lore_bible')) {
    return (
      <div className="flex flex-col h-screen bg-axiom-bg">
        <header className="h-12 flex items-center px-4 border-b border-axiom-border bg-axiom-surface flex-shrink-0">
          <button onClick={() => navigate(`/projects/${projectId}`)} className="btn-icon">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <p className="ml-3 text-sm font-semibold text-slate-400">Lore Bible</p>
        </header>
        <UpgradePrompt
          feature="Lore Bible"
          description="Build a fully searchable world database — locations, factions, history, magic systems, and anything else that defines your story's universe. Available on Writer and above."
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-axiom-bg flex flex-col">

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between h-12 px-2 sm:px-4 gap-2 bg-axiom-surface border-b border-axiom-border flex-shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
          <button
            onClick={() => navigate(`/projects/${projectId}`)}
            className="btn-icon flex-shrink-0"
            title="Back to manuscript"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 flex-shrink-0">
            <BookOpen className="w-4 h-4 text-gold-500" />
            <span className="font-serif font-semibold text-slate-100 text-sm hidden sm:inline">Lore Bible</span>
          </div>

          {/* Tab switcher */}
          <div
            className="ml-0.5 sm:ml-3 flex gap-0.5 p-0.5 rounded-lg flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            {[
              ['lore',     'Lore',     entries.length],
              ['dossiers', 'Dossiers', dossiers.length],
            ].map(([id, label, count]) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all"
                style={{
                  background: activeTab === id ? 'rgba(201,168,76,0.12)' : 'transparent',
                  color:      activeTab === id ? 'rgba(201,168,76,0.9)'  : 'rgba(255,255,255,0.4)',
                  border:     activeTab === id ? '1px solid rgba(201,168,76,0.2)' : '1px solid transparent',
                }}
              >
                {label}
                {count > 0 && (
                  <span
                    className="text-[9px] px-1 rounded"
                    style={{
                      background: activeTab === id ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.08)',
                      color: activeTab === id ? 'rgba(201,168,76,1)' : 'rgba(255,255,255,0.4)',
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {activeTab === 'lore' && (
            <>
              <button
                onClick={() => setShowGapsPanel(p => !p)}
                className={`btn-ghost text-xs flex items-center gap-1.5 ${showGapsPanel ? 'text-gold-400' : ''}`}
                title="Potential lore gaps from manuscript"
              >
                <GitBranch className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="hidden sm:inline">Lore Gaps</span>
              </button>
              <button onClick={openCreate} className="btn-primary text-xs py-1.5 px-2.5 sm:px-3">
                <Plus className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="hidden sm:inline">New Entry</span>
              </button>
            </>
          )}
          {activeTab === 'dossiers' && (
            <button
              onClick={() => setShowImportDossier(true)}
              className="btn-primary text-xs py-1.5 px-3"
            >
              <Upload className="w-3.5 h-3.5" />
              Import Dossier
            </button>
          )}
        </div>
      </header>

      {/* ── LORE TAB ────────────────────────────────────────────────────── */}
      {activeTab === 'lore' && (
        loading ? (
          <div className="flex-1 flex items-center justify-center text-slate-600 text-sm">
            Loading lore bible…
          </div>
        ) : entries.length === 0 ? (
          <EmptyLore onNew={openCreate} />
        ) : (
          <div className="flex flex-1 overflow-hidden">
            <div className="w-[220px] flex-shrink-0">
              <LoreSidebar
                entries={entries}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onNew={openCreate}
              />
            </div>
            <div className="flex-1 flex overflow-hidden">
              {selectedId ? (
                <LoreEntryPanel
                  key={selectedId}
                  projectId={projectId}
                  entryId={selectedId}
                  onDelete={handleDelete}
                  characters={characters}
                  allEntries={entries}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-600 text-sm">
                  Select an entry from the sidebar.
                </div>
              )}
            </div>
            {showGapsPanel && (
              <div className="w-[300px] flex-shrink-0 border-l border-axiom-border flex flex-col">
                <div className="px-4 py-2.5 border-b border-axiom-border flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-1.5">
                    <GitBranch className="w-3.5 h-3.5 text-gold-500" />
                    <span className="text-xs font-semibold text-slate-300">Lore Gaps</span>
                  </div>
                  <button onClick={() => setShowGapsPanel(false)} className="btn-icon w-5 h-5 text-slate-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <LoreGapsPanel
                  projectId={projectId}
                  loreEntries={entries}
                  onCreateEntry={(term) => {
                    setPrefillTitle(term)
                    setShowCreate(true)
                    setShowGapsPanel(false)
                  }}
                />
              </div>
            )}
          </div>
        )
      )}

      {/* ── DOSSIERS TAB ────────────────────────────────────────────────── */}
      {activeTab === 'dossiers' && (
        dossiersLoading ? (
          <div className="flex-1 flex items-center justify-center text-slate-600 text-sm">
            Loading dossiers…
          </div>
        ) : dossiers.length === 0 ? (
          <EmptyDossiers onImport={() => setShowImportDossier(true)} />
        ) : (
          <div className="flex flex-1 overflow-hidden">
            {/* Dossier list sidebar */}
            <div
              className="w-[240px] flex-shrink-0 flex flex-col overflow-hidden"
              style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="px-3 py-2.5 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {dossiers.length} {dossiers.length === 1 ? 'dossier' : 'dossiers'}
                </p>
              </div>
              <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
                {dossiers.map(d => (
                  <DossierCard
                    key={d.id}
                    dossier={d}
                    isActive={d.id === selectedDossierId}
                    onClick={() => setSelectedDossierId(d.id)}
                    onDelete={handleDossierDelete}
                  />
                ))}
              </div>
              <div className="px-2 pb-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <button
                  onClick={() => setShowImportDossier(true)}
                  className="w-full flex items-center justify-center gap-2 py-2 mt-2 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: 'rgba(201,168,76,0.05)',
                    border: '1px dashed rgba(201,168,76,0.2)',
                    color: 'rgba(201,168,76,0.7)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(201,168,76,0.1)'
                    e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(201,168,76,0.05)'
                    e.currentTarget.style.borderColor = 'rgba(201,168,76,0.2)'
                  }}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Import another
                </button>
              </div>
            </div>

            {/* Dossier viewer */}
            <div className="flex-1 overflow-hidden flex flex-col" style={{ background: 'rgba(255,255,255,0.01)' }}>
              <DossierViewer dossier={selectedDossier} />
            </div>
          </div>
        )
      )}

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      {showCreate && (
        <CreateLoreModal
          onClose={() => { setShowCreate(false); setPrefillTitle('') }}
          onCreate={handleCreate}
          existingCategories={existingCategories}
          prefillTitle={prefillTitle}
        />
      )}

      {showImportDossier && (
        <ImportDossierModal
          onClose={() => setShowImportDossier(false)}
          onImported={handleDossierImported}
        />
      )}
    </div>
  )
}

// ── Empty states ──────────────────────────────────────────────────────────────

function EmptyLore({ onNew }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-10 animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center mb-5">
        <BookMarked className="w-7 h-7 text-gold-500" />
      </div>
      <h2 className="font-serif text-xl font-semibold text-slate-200 mb-2">Your Lore Bible is empty</h2>
      <p className="text-slate-500 text-sm max-w-xs mb-6">
        Document your world — factions, locations, magic systems, history.
        Lock entries the AI must never contradict.
      </p>
      <button onClick={onNew} className="btn-primary">
        <Plus className="w-4 h-4" />
        Create First Entry
      </button>
      <div className="mt-8">
        <p className="text-xs text-slate-700 mb-3">Suggested categories to get started:</p>
        <div className="flex flex-wrap justify-center gap-2">
          {['Locations', 'Factions', 'Magic System', 'History', 'Technology', 'Creatures', 'Artifacts', 'Rules of the World'].map(cat => (
            <span key={cat} className="px-2.5 py-1 rounded-full bg-axiom-surface border border-axiom-border text-xs text-slate-600">
              {cat}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function EmptyDossiers({ onImport }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-10 animate-fade-in">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}
      >
        <FileText className="w-7 h-7 text-gold-500" />
      </div>
      <h2 className="font-serif text-xl font-semibold text-slate-200 mb-2">No dossiers yet</h2>
      <p className="text-slate-500 text-sm max-w-xs mb-6">
        Import an HTML dossier — character profiles, faction files, location records.
        Axiom parses the structure and preserves the original artifact.
      </p>
      <button onClick={onImport} className="btn-primary">
        <Upload className="w-4 h-4" />
        Import Dossier
      </button>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {['Character Dossier', 'Faction File', 'Location Record', 'Relic Entry'].map(tag => (
          <span
            key={tag}
            className="px-2.5 py-1 rounded-full text-xs"
            style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)', color: 'rgba(201,168,76,0.6)' }}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}
