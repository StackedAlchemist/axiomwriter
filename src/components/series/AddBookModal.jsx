import React, { useState, useEffect } from 'react'
import { X, BookOpen, Plus, Loader2, Search } from 'lucide-react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuth } from '../../contexts/AuthContext'

export default function AddBookModal({ seriesId, existingBookIds, onAdd, onClose }) {
  const { currentUser } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [selected, setSelected] = useState(null)       // projectId
  const [bookNum,  setBookNum]  = useState('')
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')

  // Load user projects not already in this series
  useEffect(() => {
    if (!currentUser) return
    getDocs(query(collection(db, 'projects'), where('userId', '==', currentUser.uid)))
      .then(snap => {
        const list = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(p => p.status !== 'archived' && !existingBookIds.includes(p.id))
          .sort((a, b) => (b.updatedAt?.toMillis?.() ?? 0) - (a.updatedAt?.toMillis?.() ?? 0))
        setProjects(list)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [currentUser]) // eslint-disable-line

  const filtered = search
    ? projects.filter(p => p.title?.toLowerCase().includes(search.toLowerCase()))
    : projects

  const selectedProject = projects.find(p => p.id === selected)

  async function handleAdd() {
    if (!selected || !bookNum) { setError('Select a project and set a book number.'); return }
    setSaving(true)
    try {
      await onAdd(selected, bookNum, selectedProject?.title || 'Untitled')
      onClose()
    } catch {
      setError('Failed to add book. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-axiom-surface border border-axiom-border rounded-2xl w-full max-w-lg shadow-2xl animate-slide-up flex flex-col max-h-[80vh]">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-axiom-border flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-teal-400" />
            </div>
            <h2 className="font-serif text-lg font-semibold text-slate-100">Add Book to Series</h2>
          </div>
          <button onClick={onClose} className="btn-icon"><X className="w-4 h-4" /></button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-axiom-border flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search your projects…"
              className="input-base pl-9 w-full"
            />
          </div>
        </div>

        {/* Project list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {loading && <p className="text-center text-slate-600 text-sm py-6">Loading projects…</p>}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-8">
              <p className="text-slate-500 text-sm">No available projects.</p>
              <p className="text-slate-700 text-xs mt-1">All projects are already in this series, or you have no projects.</p>
            </div>
          )}
          {filtered.map(project => (
            <button
              key={project.id}
              onClick={() => setSelected(project.id === selected ? null : project.id)}
              className={`w-full text-left p-3 rounded-xl border transition-all ${
                selected === project.id
                  ? 'border-gold-500/40 bg-gold-500/10'
                  : 'border-axiom-border bg-axiom-surface2 hover:border-axiom-border-light'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-200">{project.title}</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    {project.genre} · {(project.wordCount || 0).toLocaleString()} words
                  </p>
                </div>
                {selected === project.id && (
                  <div className="w-5 h-5 rounded-full bg-gold-500/20 border border-gold-500/40 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-gold-400" />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-axiom-border flex-shrink-0 space-y-3">
          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                Book Number
              </label>
              <input
                type="number"
                value={bookNum}
                onChange={e => setBookNum(e.target.value)}
                placeholder="e.g. 1"
                min={1}
                className="input-base w-full text-sm"
              />
            </div>
            <div className="flex gap-2 flex-shrink-0 pt-4">
              <button onClick={onClose} className="btn-ghost">Cancel</button>
              <button
                onClick={handleAdd}
                disabled={!selected || !bookNum || saving}
                className="btn-primary"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add Book
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
