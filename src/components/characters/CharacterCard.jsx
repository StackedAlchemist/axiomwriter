import React, { useState } from 'react'
import { Trash2, MoreVertical } from 'lucide-react'
import { AVATAR_COLORS, IMPORTANCE_LEVELS, ROLE_OPTIONS } from '../../hooks/useCharacters'

export default function CharacterCard({ character, onClick, onDelete }) {
  const [showMenu, setShowMenu] = useState(false)

  const avatarColors = AVATAR_COLORS[character.role] ?? AVATAR_COLORS.supporting
  const initials     = (character.name || '?').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  const impLevel     = IMPORTANCE_LEVELS[character.importance ?? 1]
  const roleOpt      = ROLE_OPTIONS.find(r => r.value === character.role) ?? ROLE_OPTIONS[2]
  const blurb        = character.appearance || character.backstory || ''

  function handleDeleteClick(e) {
    e.stopPropagation()
    if (window.confirm(`Delete "${character.name}"? This cannot be undone.`)) {
      onDelete()
    }
  }

  return (
    <div
      onClick={onClick}
      className="card group cursor-pointer hover:border-axiom-border-light hover:shadow-glow-teal transition-all duration-300 p-4 flex gap-4"
    >
      {/* Avatar */}
      <div className={`w-12 h-12 rounded-xl border flex items-center justify-center flex-shrink-0 transition-all ${avatarColors.bg} ${avatarColors.border} group-hover:scale-105`}>
        <span className={`text-base font-bold font-serif ${avatarColors.text}`}>{initials}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-serif font-semibold text-slate-100 group-hover:text-white transition-colors text-sm leading-tight">
            {character.name || <span className="italic text-slate-600">Unnamed</span>}
          </h3>
          <button
            onClick={handleDeleteClick}
            className="opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:text-red-400 flex-shrink-0 p-0.5 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {character.aliases?.length > 0 && (
          <p className="text-xs text-slate-600 mt-0.5 truncate">aka {character.aliases.join(', ')}</p>
        )}

        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          <span className={`badge border text-[10px] ${roleOpt.bg} ${roleOpt.color}`}>{roleOpt.label}</span>
          <span className={`badge border text-[10px] ${impLevel.bg} ${impLevel.color}`}>{impLevel.label}</span>
          {character.age && <span className="text-[10px] text-slate-700">Age {character.age}</span>}
        </div>

        {blurb && (
          <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">{blurb}</p>
        )}
      </div>
    </div>
  )
}
