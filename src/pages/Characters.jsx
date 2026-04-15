import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Plus, Users, Search, LayoutGrid, List,
  FileText, Loader2, X, Check, Zap,
} from 'lucide-react'
import { getDoc, doc, getDocs, collection } from 'firebase/firestore'
import { db } from '../firebase/config'
import { getAllChapters } from '../hooks/useManuscript'
import { useCharacters, IMPORTANCE_LEVELS, ROLE_OPTIONS } from '../hooks/useCharacters'
import CharacterCard from '../components/characters/CharacterCard'
import CreateCharacterModal from '../components/characters/CreateCharacterModal'
import MomentumDashboard from '../components/characters/MomentumDashboard'
import MomentumHistoryGraph from '../components/characters/MomentumHistoryGraph'

// ── Name extraction helpers ───────────────────────────────────────────────────
const COMMON_WORDS = new Set([
  'The','A','An','He','She','It','They','We','I','You','His','Her','Its','Their',
  'My','Our','Your','This','That','These','Those','Then','There','When','Where',
  'What','Who','How','Why','But','And','Or','So','Yet','For','Nor','At','By',
  'In','On','Up','As','To','Of','If','Do','Be','Was','Is','Are','Has','Had',
  'Did','Can','May','Will','Just','Not','All','No','Into','With','From',
])

function extractCandidateNames(htmlContent) {
  // Strip HTML tags
  const text = htmlContent.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ')
  // Find capitalized words not at sentence start
  const sentences = text.split(/[.!?]+/)
  const nameCounts = {}

  sentences.forEach(sentence => {
    const trimmed = sentence.trim()
    if (!trimmed) return
    const words = trimmed.split(/\s+/)
    // Skip the very first word of the sentence (likely start-of-sentence cap)
    words.slice(1).forEach(word => {
      const clean = word.replace(/[^a-zA-Z'-]/g, '')
      if (
        clean.length >= 2 &&
        /^[A-Z]/.test(clean) &&
        !COMMON_WORDS.has(clean)
      ) {
        nameCounts[clean] = (nameCounts[clean] || 0) + 1
      }
    })
  })

  // Return names appearing 2+ times, sorted by frequency
  return Object.entries(nameCounts)
    .filter(([, count]) => count >= 2)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 30)
    .map(([name]) => name)
}

// ── Import from Manuscript Modal ──────────────────────────────────────────────
function ImportFromManuscriptModal({ projectId, existingNames, onClose, onCreate }) {
  const [step,      setStep]      = useState('scanning') // scanning | select
  const [candidates, setCandidates] = useState([])
  const [selected,   setSelected]   = useState(new Set())
  const [creating,   setCreating]   = useState(false)

  useEffect(() => {
    async function scan() {
      try {
        const projectSnap = await getDoc(doc(db, 'projects', projectId))
        if (!projectSnap.exists()) { setStep('select'); return }

        const structure = projectSnap.data().structure
        const chapters  = getAllChapters(structure)
        const sceneIds  = chapters.flatMap(ch => (ch.scenes || []).map(s => s.id))

        // Load scene content in parallel (cap at 20 scenes)
        const toLoad = sceneIds.slice(0, 20)
        const snaps  = await Promise.all(
          toLoad.map(id => getDoc(doc(db, 'projects', projectId, 'scenes', id)))
        )

        const allHtml = snaps
          .filter(s => s.exists())
          .map(s => s.data().content ?? '')
          .join(' ')

        const names   = extractCandidateNames(allHtml)
        const existing = new Set(existingNames.map(n => n.toLowerCase()))
        const filtered = names.filter(n => !existing.has(n.toLowerCase()))

        setCandidates(filtered)
        setStep('select')
      } catch (err) {
        console.error('[ImportFromManuscript]', err)
        setStep('select')
      }
    }
    scan()
  }, [projectId, existingNames])

  function toggle(name) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  async function handleCreate() {
    if (selected.size === 0) return
    setCreating(true)
    for (const name of selected) {
      await onCreate({ name, role: 'supporting', importance: 1 })
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-axiom-surface border border-axiom-border rounded-2xl shadow-card w-full max-w-lg animate-slide-up">

        <div className="flex items-center justify-between p-6 border-b border-axiom-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
              <FileText className="w-4 h-4 text-teal-400" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-semibold text-slate-100">Import from Manuscript</h2>
              <p className="text-xs text-slate-500">Scan scenes for character names</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-6">
          {step === 'scanning' ? (
            <div className="flex flex-col items-center py-8 gap-3">
              <Loader2 className="w-6 h-6 text-gold-400 animate-spin" />
              <p className="text-sm text-slate-400">Scanning manuscript for names…</p>
            </div>
          ) : candidates.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400 text-sm mb-1">No new names detected</p>
              <p className="text-slate-600 text-xs">
                All detected names already exist as characters, or no scenes have been written yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                These names appear in your manuscript and aren't yet in your character list.
                Select the ones you want to add.
              </p>
              <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto">
                {candidates.map(name => {
                  const isSelected = selected.has(name)
                  return (
                    <button
                      key={name}
                      onClick={() => toggle(name)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all ${
                        isSelected
                          ? 'bg-teal-500/15 border-teal-500/30 text-teal-300'
                          : 'bg-axiom-surface2 border-axiom-border text-slate-400 hover:border-axiom-border-light hover:text-slate-200'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      {name}
                    </button>
                  )
                })}
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
                <button
                  onClick={handleCreate}
                  disabled={selected.size === 0 || creating}
                  className="btn-primary flex-1"
                >
                  {creating
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
                    : `Add ${selected.size > 0 ? selected.size : ''} Character${selected.size !== 1 ? 's' : ''}`
                  }
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── List row view ─────────────────────────────────────────────────────────────
function CharacterRow({ character, onClick, onDelete, ROLE_OPTIONS, IMPORTANCE_LEVELS }) {
  const roleOpt  = ROLE_OPTIONS.find(r => r.value === character.role) ?? ROLE_OPTIONS[3]
  const impLevel = IMPORTANCE_LEVELS[character.importance ?? 1]

  return (
    <div
      onClick={onClick}
      className="card group cursor-pointer hover:border-axiom-border-light hover:shadow-glow-teal transition-all duration-200 px-4 py-3 flex items-center gap-4"
    >
      <div className="flex-1 min-w-0 flex items-center gap-3">
        <p className="font-serif font-semibold text-slate-100 text-sm group-hover:text-white transition-colors truncate">
          {character.name || <span className="italic text-slate-600">Unnamed</span>}
        </p>
        {character.aliases?.length > 0 && (
          <span className="text-xs text-slate-600 truncate hidden sm:block">aka {character.aliases.join(', ')}</span>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`badge border text-[10px] ${roleOpt.bg} ${roleOpt.color}`}>{roleOpt.label}</span>
        <span className={`badge border text-[10px] ${impLevel.bg} ${impLevel.color}`}>{impLevel.label}</span>
        {character.age && <span className="text-xs text-slate-600 hidden md:block">Age {character.age}</span>}
        <button
          onClick={e => { e.stopPropagation(); if (window.confirm(`Delete "${character.name}"?`)) onDelete() }}
          className="opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:text-red-400 p-1 transition-all"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Characters() {
  const { projectId } = useParams()
  const navigate      = useNavigate()
  const { characters, loading, createCharacter, deleteCharacter } = useCharacters(projectId)

  const [search,         setSearch]         = useState('')
  const [roleFilter,     setRoleFilter]     = useState('all')
  const [impFilter,      setImpFilter]      = useState('all')
  const [viewMode,       setViewMode]       = useState('grid')   // 'grid' | 'list'
  const [showCreate,     setShowCreate]     = useState(false)
  const [showImport,     setShowImport]     = useState(false)
  const [activeTab,      setActiveTab]      = useState('cast')   // 'cast' | 'momentum'
  const [selectedCharId, setSelectedCharId] = useState(null)     // for history graph

  const filtered = characters.filter(c => {
    const matchSearch = !search || c.name?.toLowerCase().includes(search.toLowerCase())
    const matchRole   = roleFilter === 'all' || c.role === roleFilter
    const matchImp    = impFilter  === 'all' || String(c.importance) === impFilter
    return matchSearch && matchRole && matchImp
  })

  async function handleCreate(data) {
    const id = await createCharacter(data)
    setShowCreate(false)
    navigate(`/projects/${projectId}/characters/${id}`)
  }

  // Used by import modal — creates silently without navigating
  async function handleImportCreate(data) {
    await createCharacter(data)
  }

  const existingNames = characters.map(c => c.name).filter(Boolean)

  return (
    <div className="min-h-screen bg-axiom-bg flex flex-col">

      {/* Top bar */}
      <header className="flex items-center justify-between h-12 px-4 bg-axiom-surface border-b border-axiom-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/projects/${projectId}`)} className="btn-icon">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-teal-400" />
            <span className="font-serif font-semibold text-slate-100 text-sm">Characters</span>
            {!loading && characters.length > 0 && (
              <span className="text-xs text-slate-600">({characters.length})</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="btn-ghost text-xs py-1.5 px-3"
            title="Import names from manuscript"
          >
            <FileText className="w-3.5 h-3.5" />
            Import
          </button>
          <button onClick={() => setShowCreate(true)} className="btn-primary text-xs py-1.5 px-3">
            <Plus className="w-3.5 h-3.5" />
            New Character
          </button>
        </div>
      </header>

      {/* Tab bar */}
      <div className="border-b border-axiom-border bg-axiom-surface flex-shrink-0">
        <div className="max-w-6xl mx-auto px-6 flex gap-1">
          <button
            onClick={() => setActiveTab('cast')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === 'cast'
                ? 'border-gold-500 text-gold-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Cast
          </button>
          <button
            onClick={() => setActiveTab('momentum')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === 'momentum'
                ? 'border-gold-500 text-gold-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Momentum
            {characters.filter(c => (c.momentumScore ?? 0) > 0).length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[9px] font-semibold bg-gold-500/15 text-gold-400 border border-gold-500/20 rounded-full">
                {characters.filter(c => (c.momentumScore ?? 0) > 0).length}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-6 space-y-5">

        {/* ── MOMENTUM TAB ── */}
        {activeTab === 'momentum' && (
          <div className="space-y-6">
            <MomentumDashboard
              characters={characters}
              onSelectCharacter={c => {
                setSelectedCharId(prev => prev === c.id ? null : c.id)
              }}
            />

            {/* History graph */}
            {characters.some(c => (c.momentumHistory ?? []).length >= 2) && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Momentum History {selectedCharId ? '— ' + (characters.find(c => c.id === selectedCharId)?.name ?? '') : '— All Characters'}
                  </h3>
                  {selectedCharId && (
                    <button onClick={() => setSelectedCharId(null)} className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
                      Show all
                    </button>
                  )}
                </div>
                <MomentumHistoryGraph
                  characters={characters}
                  selectedIds={selectedCharId ? [selectedCharId] : []}
                />
              </div>
            )}

            {!loading && characters.every(c => (c.momentumHistory ?? []).length < 2) && (
              <div className="card p-6 text-center text-slate-600 text-sm">
                <Zap className="w-6 h-6 mx-auto mb-2 text-slate-700" />
                <p className="text-slate-500 font-medium mb-1">No momentum data yet</p>
                <p className="text-xs text-slate-700">
                  Momentum scores are calculated automatically while you write. Open a project and save a few scenes.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── CAST TAB ── */}
        {activeTab === 'cast' && <>

        {/* Filters + view toggle */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search characters…"
              className="input-base pl-9 py-2 text-sm"
            />
          </div>

          {/* Role filter */}
          <div className="flex gap-1 flex-wrap">
            <FilterBtn active={roleFilter === 'all'} onClick={() => setRoleFilter('all')}>All Roles</FilterBtn>
            {ROLE_OPTIONS.map(r => (
              <FilterBtn key={r.value} active={roleFilter === r.value} onClick={() => setRoleFilter(r.value)}>
                {r.label}
              </FilterBtn>
            ))}
          </div>

          {/* Importance filter */}
          <div className="flex gap-1">
            <FilterBtn active={impFilter === 'all'} onClick={() => setImpFilter('all')}>All</FilterBtn>
            {IMPORTANCE_LEVELS.map(i => (
              <FilterBtn key={i.value} active={impFilter === String(i.value)} onClick={() => setImpFilter(String(i.value))}>
                {i.label}
              </FilterBtn>
            ))}
          </div>

          {/* View toggle */}
          <div className="flex gap-1 ml-auto border border-axiom-border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-axiom-surface2 text-gold-400' : 'text-slate-600 hover:text-slate-300'}`}
              title="Grid view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-axiom-surface2 text-gold-400' : 'text-slate-600 hover:text-slate-300'}`}
              title="List view"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'space-y-2'
          }>
            {[1,2,3].map(i => <div key={i} className="card h-24 animate-pulse-soft" />)}
          </div>
        )}

        {/* Characters */}
        {!loading && filtered.length > 0 && (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(char => (
                <CharacterCard
                  key={char.id}
                  character={char}
                  onClick={() => navigate(`/projects/${projectId}/characters/${char.id}`)}
                  onDelete={() => deleteCharacter(char.id)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(char => (
                <CharacterRow
                  key={char.id}
                  character={char}
                  onClick={() => navigate(`/projects/${projectId}/characters/${char.id}`)}
                  onDelete={() => deleteCharacter(char.id)}
                  ROLE_OPTIONS={ROLE_OPTIONS}
                  IMPORTANCE_LEVELS={IMPORTANCE_LEVELS}
                />
              ))}
            </div>
          )
        )}

        {/* Empty — no characters */}
        {!loading && characters.length === 0 && (
          <div className="card p-14 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-axiom-surface2 border border-axiom-border flex items-center justify-center mb-4">
              <Users className="w-7 h-7 text-slate-600" />
            </div>
            <h3 className="font-serif text-xl font-semibold text-slate-200 mb-2">No characters yet</h3>
            <p className="text-slate-500 text-sm max-w-sm leading-relaxed mb-5">
              Build your cast. Every unforgettable story starts with characters that feel real.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowImport(true)} className="btn-secondary text-sm">
                <FileText className="w-4 h-4" /> Import from Manuscript
              </button>
              <button onClick={() => setShowCreate(true)} className="btn-primary text-sm">
                <Plus className="w-4 h-4" /> Create First Character
              </button>
            </div>
          </div>
        )}

        {/* Empty — filtered */}
        {!loading && characters.length > 0 && filtered.length === 0 && (
          <div className="card p-8 text-center">
            <p className="text-slate-500 text-sm">No characters match your filters.</p>
            <button
              onClick={() => { setSearch(''); setRoleFilter('all'); setImpFilter('all') }}
              className="btn-ghost text-xs mt-2"
            >
              Clear filters
            </button>
          </div>
        )}
        </> /* end cast tab */}
      </div>

      {showCreate && (
        <CreateCharacterModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}

      {showImport && (
        <ImportFromManuscriptModal
          projectId={projectId}
          existingNames={existingNames}
          onClose={() => setShowImport(false)}
          onCreate={handleImportCreate}
        />
      )}
    </div>
  )
}

function FilterBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1.5 rounded text-xs font-medium border transition-all ${
        active
          ? 'bg-gold-500/15 text-gold-400 border-gold-500/30'
          : 'bg-axiom-surface border-axiom-border text-slate-500 hover:text-slate-300 hover:border-axiom-border-light'
      }`}
    >
      {children}
    </button>
  )
}
