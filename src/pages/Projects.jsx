import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  collection, query, where, onSnapshot,
  doc, updateDoc, deleteDoc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../contexts/AuthContext'
import { BookOpen, Plus, Search, Archive, Library, ChevronRight, Trash2, Lock } from 'lucide-react'
import CreateProjectModal from '../components/projects/CreateProjectModal'
import ProjectCard from '../components/projects/ProjectCard'
import CreateSeriesModal from '../components/series/CreateSeriesModal'
import { useSeries } from '../hooks/useSeries'
import { useSubscription } from '../hooks/useSubscription'
import PricingModal from '../components/subscription/PricingModal'

const GENRES = ['All', 'Fantasy', 'Sci-Fi', 'Romance', 'Thriller', 'Mystery', 'Horror', 'Literary', 'YA', 'Historical', 'Other']
const BOOK_PALETTE = ['#c9a84c', '#2dd4bf', '#a78bfa', '#f97316', '#38bdf8', '#fb7185']

export default function Projects() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const [projects,  setProjects]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [genre,     setGenre]     = useState('All')
  const [view,      setView]      = useState('active') // 'active' | 'archived' | 'trash'
  const [showCreate,      setShowCreate]      = useState(false)
  const [showCreateSeries, setShowCreateSeries] = useState(false)
  const [showPricing,     setShowPricing]     = useState(false)

  const { series, createSeries, deleteSeries } = useSeries(currentUser?.uid)
  const { canAccess, tier } = useSubscription()

  function handleNewProject() {
    const activeCount = projects.filter(p => p.status !== 'archived' && p.status !== 'trashed').length
    if (!canAccess('unlimited_projects') && activeCount >= tier.projectLimit) {
      setShowPricing(true)
    } else {
      setShowCreate(true)
    }
  }

  useEffect(() => {
    if (!currentUser) return
    const q = query(collection(db, 'projects'), where('userId', '==', currentUser.uid))
    const unsub = onSnapshot(q, snap => {
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.updatedAt?.toMillis?.() ?? 0) - (a.updatedAt?.toMillis?.() ?? 0))
      setProjects(list)
      setLoading(false)
    })
    return unsub
  }, [currentUser])

  // Archive active → archived
  async function handleArchive(projectId) {
    await updateDoc(doc(db, 'projects', projectId), {
      status: 'archived',
      updatedAt: serverTimestamp(),
    })
  }

  // Restore archived/trashed → active
  async function handleRestore(projectId) {
    await updateDoc(doc(db, 'projects', projectId), {
      status: 'active',
      trashedAt: null,
      updatedAt: serverTimestamp(),
    })
  }

  // Move archived → trash (sets 30-day countdown)
  async function handleTrash(projectId) {
    await updateDoc(doc(db, 'projects', projectId), {
      status: 'trashed',
      trashedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }

  // Permanent delete (trashed only)
  async function handleDeleteForever(projectId) {
    await deleteDoc(doc(db, 'projects', projectId))
  }

  const activeProjects   = projects.filter(p => p.status !== 'archived' && p.status !== 'trashed')
  const archivedProjects = projects.filter(p => p.status === 'archived')
  const trashedProjects  = projects.filter(p => p.status === 'trashed')

  const displayList = view === 'archived' ? archivedProjects
                    : view === 'trash'    ? trashedProjects
                    : activeProjects

  const seriesProjectIds = new Set(series.flatMap(s => (s.books || []).map(b => b.projectId)))
  const standaloneProjects = (view === 'active' ? displayList.filter(p => !seriesProjectIds.has(p.id)) : displayList)

  const filtered = standaloneProjects.filter(p => {
    const matchSearch = !search || p.title?.toLowerCase().includes(search.toLowerCase())
    const matchGenre  = genre === 'All' || p.genre === genre
    return matchSearch && matchGenre
  })

  async function handleCreateSeries(data) {
    const id = await createSeries(data)
    navigate(`/series/${id}`)
  }

  async function handleDeleteSeries(seriesId) {
    if (!window.confirm('Delete this series? The books will not be deleted.')) return
    await deleteSeries(seriesId)
  }

  return (
    <div className="space-y-6 animate-slide-up">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-serif text-2xl font-semibold tracking-tight" style={{ color: 'var(--axiom-text)' }}>Library</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--axiom-muted)' }}>Every novel, story, and manuscript in one place</p>
        </div>
        <div className="flex items-center gap-2">

          {/* View tabs */}
          <div className="flex items-center gap-1 bg-axiom-surface border border-axiom-border rounded-lg p-0.5">
            <button
              onClick={() => setView('active')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${view === 'active' ? 'bg-gold-500/20 text-gold-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Active
            </button>
            <button
              onClick={() => setView('archived')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${view === 'archived' ? 'bg-gold-500/20 text-gold-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Archive className="w-3 h-3" />
              Archived
              {archivedProjects.length > 0 && (
                <span className="text-[10px] bg-axiom-surface2 text-slate-500 px-1.5 py-0.5 rounded-full">{archivedProjects.length}</span>
              )}
            </button>
            <button
              onClick={() => setView('trash')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${view === 'trash' ? 'bg-red-500/20 text-red-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Trash2 className="w-3 h-3" />
              Trash
              {trashedProjects.length > 0 && (
                <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full">{trashedProjects.length}</span>
              )}
            </button>
          </div>

          {view === 'active' && (
            <>
              <button onClick={() => setShowCreateSeries(true)} className="btn-ghost text-sm flex items-center gap-1.5">
                <Library className="w-4 h-4" />
                New Series
              </button>
              <button onClick={handleNewProject} className="btn-primary text-sm">
                <Plus className="w-4 h-4" />
                New Project
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Series section ─────────────────────────────────────────────────── */}
      {series.length > 0 && view === 'active' && (
        <div>
          <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Library className="w-3.5 h-3.5 text-gold-400" />
            Series
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {series.map((s, si) => {
              const books = [...(s.books || [])].sort((a, b) => a.bookNumber - b.bookNumber)
              const totalWords = books.reduce((sum, b) => {
                const proj = projects.find(p => p.id === b.projectId)
                return sum + (proj?.wordCount || 0)
              }, 0)
              return (
                <div
                  key={s.id}
                  className="card p-4 group hover:border-axiom-border-light transition-all cursor-pointer relative overflow-hidden"
                  onClick={() => navigate(`/series/${s.id}`)}
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-0.5 opacity-40"
                    style={{ background: BOOK_PALETTE[si % BOOK_PALETTE.length] }}
                  />
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <Library className="w-3.5 h-3.5" style={{ color: BOOK_PALETTE[si % BOOK_PALETTE.length] }} />
                        <p className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">
                          {s.name}
                        </p>
                      </div>
                      <p className="text-[10px] text-slate-600">{s.genre}</p>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); handleDeleteSeries(s.id) }}
                      className="btn-icon row-actions w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400 hover:bg-red-900/10"
                      title="Delete series"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="space-y-1.5 mb-3">
                    {books.length === 0 ? (
                      <p className="text-[10px] text-slate-700 italic">No books added yet</p>
                    ) : books.slice(0, 4).map((book, bi) => (
                      <div key={book.projectId} className="flex items-center gap-2">
                        <div
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: BOOK_PALETTE[(si + bi) % BOOK_PALETTE.length] }}
                        />
                        <p className="text-[11px] text-slate-400 truncate">
                          <span className="text-slate-600 mr-1">#{book.bookNumber}</span>
                          {book.title}
                        </p>
                      </div>
                    ))}
                    {books.length > 4 && (
                      <p className="text-[10px] text-slate-700">+{books.length - 4} more books</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-[10px] text-slate-600">
                      <span>{books.length} book{books.length !== 1 ? 's' : ''}</span>
                      {totalWords > 0 && <span>{(totalWords / 1000).toFixed(0)}k words</span>}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-gold-400 font-medium group-hover:text-gold-300 transition-colors">
                      Open <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Search + genre filter (not shown for trash) */}
      {view !== 'trash' && (
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search projects…"
              className="input-base pl-9"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {GENRES.map(g => (
              <button
                key={g}
                onClick={() => setGenre(g)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  genre === g
                    ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30'
                    : 'bg-axiom-surface border border-axiom-border text-slate-500 hover:text-slate-300 hover:border-axiom-border-light'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Section label for standalone (when series exist) */}
      {series.length > 0 && view === 'active' && (
        <div className="flex items-center gap-3">
          <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-widest">
            Standalone Projects
          </h3>
          <div className="flex-1 h-px bg-axiom-border" />
        </div>
      )}

      {/* Archived / Trash info banners */}
      {view === 'archived' && archivedProjects.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-axiom-surface2 border border-axiom-border rounded-xl text-xs text-slate-500">
          <Archive className="w-3.5 h-3.5" />
          Archived projects can be restored or moved to Trash via the ⋯ menu on each card.
        </div>
      )}
      {view === 'trash' && trashedProjects.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-red-900/20 border border-red-800/30 rounded-xl text-xs text-red-400">
          <Trash2 className="w-3.5 h-3.5" />
          Projects in Trash are permanently deleted after 30 days. Restore them anytime via the ⋯ menu.
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3].map(i => <div key={i} className="card h-52 animate-pulse-soft" />)}
        </div>
      )}

      {/* Project grid */}
      {!loading && (view === 'trash' ? trashedProjects : filtered).length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {(view === 'trash' ? trashedProjects : filtered).map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => navigate(`/projects/${project.id}`)}
              onArchive={project.status !== 'archived' && project.status !== 'trashed' ? handleArchive : undefined}
              onRestore={(project.status === 'archived' || project.status === 'trashed') ? handleRestore : undefined}
              onTrash={project.status === 'archived' ? handleTrash : undefined}
              onDeleteForever={project.status === 'trashed' ? handleDeleteForever : undefined}
            />
          ))}
        </div>
      )}

      {/* Empty states */}
      {!loading && projects.length === 0 && (
        <div className="card p-16 flex flex-col items-center justify-center text-center">
          <div className="relative mb-5">
            <div className="w-20 h-20 rounded-3xl bg-axiom-surface2 border border-axiom-border flex items-center justify-center">
              <BookOpen className="w-9 h-9 text-slate-600" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center">
              <Plus className="w-3.5 h-3.5 text-gold-400" />
            </div>
          </div>
          <h3 className="font-serif text-xl font-semibold text-slate-200 mb-2">No projects yet</h3>
          <p className="text-slate-500 text-sm max-w-md leading-relaxed mb-6">
            Every great story starts with a single project. Create yours and begin building
            your world — one scene at a time.
          </p>
          <button onClick={handleNewProject} className="btn-primary">
            <Plus className="w-4 h-4" />
            Create First Project
          </button>
        </div>
      )}

      {!loading && view === 'archived' && archivedProjects.length === 0 && (
        <div className="card p-10 text-center">
          <p className="text-slate-400 text-sm">No archived projects.</p>
        </div>
      )}

      {!loading && view === 'trash' && trashedProjects.length === 0 && (
        <div className="card p-10 text-center">
          <Trash2 className="w-8 h-8 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Trash is empty.</p>
        </div>
      )}

      {!loading && view === 'active' && displayList.length > 0 && filtered.length === 0 && (
        <div className="card p-10 text-center">
          <p className="text-slate-400 text-sm">No projects match your search.</p>
          <button onClick={() => { setSearch(''); setGenre('All') }} className="btn-ghost mt-3 text-xs">
            Clear filters
          </button>
        </div>
      )}

      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreated={id => navigate(`/projects/${id}`)}
        />
      )}

      {showCreateSeries && (
        <CreateSeriesModal
          onClose={() => setShowCreateSeries(false)}
          onCreated={handleCreateSeries}
        />
      )}

      {showPricing && (
        <PricingModal
          onClose={() => setShowPricing(false)}
          highlightFeature="Unlimited Projects"
        />
      )}
    </div>
  )
}
