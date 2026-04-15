import React, { useState, useMemo } from 'react'
import { Search, Plus, ChevronDown, ChevronRight, Lock, Unlock, BookOpen } from 'lucide-react'

export default function LoreSidebar({ entries, selectedId, onSelect, onNew }) {
  const [search,     setSearch]     = useState('')
  const [collapsed,  setCollapsed]  = useState({})

  // Group entries by category, filtered by search
  const grouped = useMemo(() => {
    const q = search.toLowerCase()
    const filtered = entries.filter(e =>
      !q || e.title?.toLowerCase().includes(q) || e.category?.toLowerCase().includes(q)
    )

    const map = {}
    filtered.forEach(entry => {
      const cat = entry.category?.trim() || 'Uncategorized'
      if (!map[cat]) map[cat] = []
      map[cat].push(entry)
    })

    // Sort categories alphabetically, Uncategorized last
    return Object.entries(map).sort(([a], [b]) => {
      if (a === 'Uncategorized') return 1
      if (b === 'Uncategorized') return -1
      return a.localeCompare(b)
    })
  }, [entries, search])

  function toggleCategory(cat) {
    setCollapsed(prev => ({ ...prev, [cat]: !prev[cat] }))
  }

  const totalLocked = entries.filter(e => e.flexibility === 'locked').length

  return (
    <div className="h-full flex flex-col bg-axiom-surface border-r border-axiom-border">

      {/* Header */}
      <div className="p-3 border-b border-axiom-border flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-gold-500" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Lore Bible
            </span>
          </div>
          <button
            onClick={onNew}
            className="w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:text-gold-400 hover:bg-gold-500/10 transition-colors"
            title="New lore entry"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-600" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search entries…"
            className="w-full bg-axiom-bg border border-axiom-border rounded-md pl-7 pr-3 py-1.5 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-gold-500 transition-colors"
          />
        </div>

        {/* Stats */}
        {entries.length > 0 && (
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[10px] text-slate-600">{entries.length} entries</span>
            {totalLocked > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-red-500/70">
                <Lock className="w-2.5 h-2.5" />
                {totalLocked} locked
              </span>
            )}
          </div>
        )}
      </div>

      {/* Entry list */}
      <div className="flex-1 overflow-y-auto py-1">
        {grouped.length === 0 && (
          <div className="p-4 text-center">
            {search ? (
              <p className="text-xs text-slate-600">No entries match "{search}"</p>
            ) : (
              <div>
                <p className="text-xs text-slate-600 mb-2">No lore entries yet.</p>
                <button onClick={onNew} className="text-xs text-gold-500 hover:text-gold-400 transition-colors">
                  Create your first entry →
                </button>
              </div>
            )}
          </div>
        )}

        {grouped.map(([category, catEntries]) => (
          <div key={category} className="mb-1">
            {/* Category header */}
            <button
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center gap-1.5 px-3 py-1.5 text-left hover:bg-axiom-surface2 transition-colors group"
            >
              {collapsed[category]
                ? <ChevronRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
                : <ChevronDown className="w-3 h-3 text-slate-600 flex-shrink-0" />
              }
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate flex-1">
                {category}
              </span>
              <span className="text-[10px] text-slate-700 group-hover:text-slate-500">
                {catEntries.length}
              </span>
            </button>

            {/* Entries in category */}
            {!collapsed[category] && (
              <div className="ml-1">
                {catEntries.map(entry => (
                  <button
                    key={entry.id}
                    onClick={() => onSelect(entry.id)}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors ${
                      selectedId === entry.id
                        ? 'bg-gold-500/10 text-gold-400'
                        : 'text-slate-400 hover:bg-axiom-surface2 hover:text-slate-200'
                    }`}
                  >
                    {entry.flexibility === 'locked'
                      ? <Lock className="w-2.5 h-2.5 text-red-500/60 flex-shrink-0" />
                      : <div className="w-2.5 h-2.5 flex-shrink-0" />
                    }
                    <span className="text-xs truncate flex-1">{entry.title || 'Untitled'}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
