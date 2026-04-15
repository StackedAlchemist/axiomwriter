/**
 * DossierCard
 * Compact list card shown in the dossier sidebar/list.
 */

import React from 'react'
import { FileText, User, Users, MapPin, Zap, Trash2 } from 'lucide-react'

const TYPE_META = {
  character_dossier: { icon: User,    label: 'Character', accent: '201,168,76' },
  faction_dossier:   { icon: Users,   label: 'Faction',   accent: '45,212,191' },
  location_dossier:  { icon: MapPin,  label: 'Location',  accent: '158,125,212' },
  relic:             { icon: Zap,     label: 'Relic',     accent: '249,115,22' },
}

export default function DossierCard({ dossier, isActive, onClick, onDelete }) {
  const meta  = TYPE_META[dossier.type] ?? { icon: FileText, label: 'Dossier', accent: '201,168,76' }
  const Icon  = meta.icon
  const rgb   = meta.accent

  return (
    <div
      onClick={onClick}
      className="group relative flex items-start gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150"
      style={{
        background: isActive
          ? `rgba(${rgb},0.1)`
          : 'transparent',
        border: isActive
          ? `1px solid rgba(${rgb},0.25)`
          : '1px solid transparent',
      }}
      onMouseEnter={e => {
        if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
      }}
      onMouseLeave={e => {
        if (!isActive) e.currentTarget.style.background = 'transparent'
      }}
    >
      {/* Icon */}
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{
          background: `rgba(${rgb},0.12)`,
          border: `1px solid rgba(${rgb},0.2)`,
        }}
      >
        <Icon className="w-3.5 h-3.5" style={{ color: `rgba(${rgb},1)` }} />
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p
          className="text-xs font-semibold truncate"
          style={{ color: isActive ? `rgba(${rgb},1)` : 'rgba(255,255,255,0.85)' }}
        >
          {dossier.title || 'Untitled'}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span
            className="text-[9px] font-semibold uppercase tracking-wide"
            style={{ color: `rgba(${rgb},0.6)` }}
          >
            {meta.label}
          </span>
          {dossier.identity?.alias && (
            <>
              <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
              <span className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {dossier.identity.alias}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Delete (hover only) */}
      {onDelete && (
        <button
          onClick={e => { e.stopPropagation(); onDelete(dossier.id) }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-900/20"
          title="Delete dossier"
        >
          <Trash2 className="w-3 h-3 text-red-400/60" />
        </button>
      )}
    </div>
  )
}
