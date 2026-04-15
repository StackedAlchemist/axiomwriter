/**
 * CharacterSheetPanel
 * Slide-in panel shown from the editor when a momentum spike suggestion is accepted.
 * Shows key character info + quick importance update without leaving the editor.
 */
import React from 'react'
import { X, ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { AVATAR_COLORS, IMPORTANCE_LEVELS, ROLE_OPTIONS } from '../../hooks/useCharacters'
import { useCharacter } from '../../hooks/useCharacters'
import { getMomentumTrend } from '../../lib/momentumEngine'

function TrendLabel({ trend }) {
  if (trend === 'rising')  return <span className="flex items-center gap-1 text-teal-400 text-xs"><TrendingUp className="w-3 h-3" /> Rising</span>
  if (trend === 'falling') return <span className="flex items-center gap-1 text-red-400 text-xs"><TrendingDown className="w-3 h-3" /> Falling</span>
  return <span className="flex items-center gap-1 text-slate-600 text-xs"><Minus className="w-3 h-3" /> Stable</span>
}

export default function CharacterSheetPanel({ characterId, onClose }) {
  const navigate  = useNavigate()
  const { projectId } = useParams()
  const { character, loading, update, updateImportance } = useCharacter(projectId, characterId)

  if (loading || !character) {
    return (
      <div className="w-[260px] flex-shrink-0 border-l border-axiom-border bg-axiom-surface flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-gold-500/30 border-t-gold-400 animate-spin" />
      </div>
    )
  }

  const ac        = AVATAR_COLORS[character.role] ?? AVATAR_COLORS.supporting
  const initials  = (character.name || '?').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  const score     = character.momentumScore ?? 0
  const trend     = getMomentumTrend(character)
  const roleLabel = ROLE_OPTIONS.find(r => r.value === character.role)?.label ?? 'Character'

  // Momentum ring
  const R = 28
  const CIRC = 2 * Math.PI * R
  const scoreColor = score >= 75 ? '#d4b865' : score >= 50 ? '#2dd4bf' : score >= 25 ? '#9e7dd4' : '#617a94'

  return (
    <div className="w-[260px] flex-shrink-0 border-l border-axiom-border bg-axiom-surface flex flex-col overflow-hidden animate-slide-in">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-axiom-border flex-shrink-0">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Character Sheet</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate(`/projects/${projectId}/characters/${characterId}`)}
            className="p-1.5 text-slate-600 hover:text-gold-400 transition-colors"
            title="Open full character sheet"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <button onClick={onClose} className="p-1.5 text-slate-600 hover:text-slate-300 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">

        {/* Identity */}
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center flex-shrink-0 overflow-hidden ${ac.bg} ${ac.border}`}>
            {character.photoUrl
              ? <img src={character.photoUrl} alt={character.name} className="w-full h-full object-cover rounded-full" />
              : <span className={`text-sm font-bold font-serif ${ac.text}`}>{initials}</span>
            }
          </div>
          <div className="min-w-0">
            <p className="font-serif font-semibold text-slate-100 truncate">{character.name || 'Unnamed'}</p>
            <p className={`text-xs ${ROLE_OPTIONS.find(r => r.value === character.role)?.color ?? 'text-slate-500'}`}>
              {roleLabel}
            </p>
          </div>
        </div>

        {/* Momentum score */}
        <div className="card p-3 flex items-center gap-3">
          <div className="flex-shrink-0">
            <svg width="72" height="72" viewBox="0 0 72 72">
              <circle cx="36" cy="36" r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
              <circle
                cx="36" cy="36" r={R}
                fill="none"
                stroke={scoreColor}
                strokeWidth="5"
                strokeDasharray={`${(score / 100) * CIRC} ${CIRC}`}
                strokeLinecap="round"
                transform="rotate(-90 36 36)"
                style={{ transition: 'stroke-dasharray 0.6s ease' }}
              />
              <text x="36" y="36" textAnchor="middle" dominantBaseline="middle"
                fill={scoreColor} fontSize="15" fontWeight="bold"
                fontFamily="'Cormorant Garamond', serif"
              >{score}</text>
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-300 mb-0.5">Momentum Score</p>
            <TrendLabel trend={trend} />
            {character.momentumHistory?.length > 0 && (
              <p className="text-[10px] text-slate-700 mt-1">
                Last updated {new Date(character.momentumHistory.at(-1)?.date).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* Quick momentum breakdown */}
        {character.momentumHistory?.length > 0 && (() => {
          const last = character.momentumHistory.at(-1)
          const c    = last?.components
          if (!c) return null
          return (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Score Breakdown</p>
              {[
                { label: 'Recent frequency',  value: c.recentFrequency,  weight: '×0.4' },
                { label: 'Dialogue density',  value: c.dialogueDensity,  weight: '×0.3' },
                { label: 'Reference count',   value: c.referenceCount,   weight: '×0.2' },
                { label: 'Plot impact',       value: c.plotImpact,       weight: '×0.1' },
              ].map(({ label, value, weight }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 w-[110px] flex-shrink-0">{label}</span>
                  <div className="flex-1 h-1 bg-axiom-surface2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gold-500/60"
                      style={{ width: `${value ?? 0}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-600 w-6 text-right">{value ?? 0}</span>
                  <span className="text-[9px] text-slate-700 w-7">{weight}</span>
                </div>
              ))}
            </div>
          )
        })()}

        {/* Importance selector */}
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Importance Level</p>
          <div className="grid grid-cols-2 gap-1.5">
            {IMPORTANCE_LEVELS.map(level => (
              <button
                key={level.value}
                onClick={() => updateImportance(level.value, character.importanceHistory, 'Updated via momentum panel')}
                className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                  character.importance === level.value
                    ? `${level.bg} ${level.color}`
                    : 'text-slate-600 border-axiom-border hover:border-axiom-border-light hover:text-slate-400'
                }`}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>

        {/* Role */}
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Role</p>
          <div className="flex flex-wrap gap-1.5">
            {ROLE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => update({ role: opt.value })}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                  character.role === opt.value
                    ? `${opt.bg} ${opt.color}`
                    : 'text-slate-600 border-axiom-border hover:border-axiom-border-light hover:text-slate-400'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Arc summary */}
        {character.arcSummary && (
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Arc</p>
            <p className="text-xs text-slate-400 leading-relaxed">{character.arcSummary}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-axiom-border flex-shrink-0">
        <button
          onClick={() => navigate(`/projects/${projectId}/characters/${characterId}`)}
          className="w-full btn-ghost text-xs justify-center"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Open Full Character Sheet
        </button>
      </div>
    </div>
  )
}
