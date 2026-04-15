/**
 * MomentumDashboard
 * Shown in the Characters page Momentum tab.
 *
 * Sections:
 *  1. Characters to Watch — top 3 background/supporting with rising momentum
 *  2. All Characters bar chart — sorted by score, color-coded by role
 *  3. Trend legend
 */
import React, { useMemo, useState } from 'react'
import { TrendingUp, TrendingDown, Minus, Zap, ChevronRight } from 'lucide-react'
import { ROLE_OPTIONS, AVATAR_COLORS } from '../../hooks/useCharacters'
import { getMomentumTrend } from '../../lib/momentumEngine'

// Role → bar color
const ROLE_BAR = {
  protagonist: '#d4b865',   // gold
  antagonist:  '#f87171',   // red
  major:       '#9e7dd4',   // purple
  supporting:  '#2dd4bf',   // teal
  background:  '#617a94',   // slate
}

function TrendIcon({ trend, size = 'w-3.5 h-3.5' }) {
  if (trend === 'rising')  return <TrendingUp  className={`${size} text-teal-400`} />
  if (trend === 'falling') return <TrendingDown className={`${size} text-red-400`} />
  return <Minus className={`${size} text-slate-600`} />
}

function Avatar({ char, size = 7 }) {
  const ac = AVATAR_COLORS[char.role] ?? AVATAR_COLORS.supporting
  const initials = (char.name || '?').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  const sz = `w-${size} h-${size}`
  return (
    <div className={`${sz} rounded-full border flex items-center justify-center flex-shrink-0 overflow-hidden ${ac.bg} ${ac.border}`}>
      {char.photoUrl
        ? <img src={char.photoUrl} alt={char.name} className="w-full h-full object-cover rounded-full" />
        : <span className={`text-[10px] font-bold font-serif ${ac.text}`}>{initials}</span>
      }
    </div>
  )
}

// ── Characters to Watch card ──────────────────────────────────────────────────
function WatchCard({ character, onSelect }) {
  const score = character.momentumScore ?? 0
  const trend = getMomentumTrend(character)
  const role  = ROLE_OPTIONS.find(r => r.value === character.role)

  return (
    <button
      onClick={() => onSelect(character)}
      className="flex items-center gap-3 p-3 bg-axiom-surface border border-axiom-border rounded-xl hover:border-gold-500/40 hover:bg-axiom-surface2 transition-all text-left group"
    >
      <div className="relative flex-shrink-0">
        <Avatar char={character} size={9} />
        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-axiom-bg border border-axiom-border flex items-center justify-center">
          <TrendIcon trend={trend} size="w-2.5 h-2.5" />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-200 group-hover:text-white truncate">{character.name}</p>
        <p className={`text-[10px] ${role?.color ?? 'text-slate-500'}`}>{role?.label}</p>
      </div>

      <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
        <span
          className="text-lg font-serif font-bold leading-none"
          style={{ color: ROLE_BAR[character.role] ?? '#617a94' }}
        >
          {score}
        </span>
        <span className="text-[9px] text-slate-600">momentum</span>
      </div>

      <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-gold-400 transition-colors flex-shrink-0" />
    </button>
  )
}

// ── Bar chart row ─────────────────────────────────────────────────────────────
function BarRow({ character, maxScore, onSelect }) {
  const score    = character.momentumScore ?? 0
  const pct      = maxScore > 0 ? (score / maxScore) * 100 : 0
  const trend    = getMomentumTrend(character)
  const barColor = ROLE_BAR[character.role] ?? '#617a94'
  const role     = ROLE_OPTIONS.find(r => r.value === character.role)

  return (
    <button
      onClick={() => onSelect(character)}
      className="w-full flex items-center gap-3 py-1.5 group hover:bg-axiom-surface/50 rounded-lg px-2 transition-colors"
    >
      <Avatar char={character} size={6} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-xs font-medium text-slate-300 group-hover:text-white truncate">{character.name}</span>
          <TrendIcon trend={trend} size="w-3 h-3" />
        </div>
        <div className="h-1.5 bg-axiom-surface2 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: barColor, opacity: 0.85 }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`text-[9px] ${role?.color ?? 'text-slate-600'}`}>{role?.label}</span>
        <span className="text-xs font-semibold tabular-nums w-6 text-right" style={{ color: barColor }}>
          {score}
        </span>
      </div>
    </button>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function MomentumDashboard({ characters, onSelectCharacter }) {
  const [sortBy, setSortBy] = useState('score') // 'score' | 'trend' | 'name'

  // Characters to Watch — bg/supporting with rising trend
  const toWatch = useMemo(() => {
    return characters
      .filter(c => (c.importance ?? 1) <= 1)
      .map(c => ({ ...c, trend: getMomentumTrend(c) }))
      .filter(c => c.trend === 'rising')
      .sort((a, b) => (b.momentumScore ?? 0) - (a.momentumScore ?? 0))
      .slice(0, 3)
  }, [characters])

  // Sorted characters for bar chart
  const sorted = useMemo(() => {
    const trendOrder = { rising: 0, stable: 1, falling: 2 }
    const arr = [...characters]
    if (sortBy === 'score') return arr.sort((a, b) => (b.momentumScore ?? 0) - (a.momentumScore ?? 0))
    if (sortBy === 'trend') return arr.sort((a, b) => {
      const ta = getMomentumTrend(a), tb = getMomentumTrend(b)
      return (trendOrder[ta] ?? 1) - (trendOrder[tb] ?? 1)
    })
    return arr.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  }, [characters, sortBy])

  const maxScore = Math.max(1, ...characters.map(c => c.momentumScore ?? 0))

  if (!characters.length) {
    return (
      <div className="card p-8 text-center">
        <Zap className="w-8 h-8 text-slate-700 mx-auto mb-3" />
        <p className="text-slate-500 text-sm font-medium mb-1">No characters yet</p>
        <p className="text-slate-700 text-xs max-w-sm mx-auto">
          Add characters and write scenes to see momentum build.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* ── Characters to Watch ── */}
      {toWatch.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-gold-400" />
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Characters to Watch</h3>
          </div>
          <div className="space-y-2">
            {toWatch.map(char => (
              <WatchCard key={char.id} character={char} onSelect={onSelectCharacter} />
            ))}
          </div>
          <p className="text-[10px] text-slate-700 leading-relaxed">
            Background &amp; supporting characters with rising momentum — they may be writing themselves into larger roles.
          </p>
        </div>
      )}

      {/* ── Bar Chart ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">All Characters</h3>
          <div className="flex gap-1">
            {[['score', 'Score'], ['trend', 'Trend'], ['name', 'A–Z']].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setSortBy(val)}
                className={`text-[10px] px-2 py-0.5 rounded transition-colors ${
                  sortBy === val
                    ? 'bg-gold-500/15 text-gold-400 border border-gold-500/20'
                    : 'text-slate-600 hover:text-slate-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="card p-3 space-y-0.5">
          {sorted.map(char => (
            <BarRow
              key={char.id}
              character={char}
              maxScore={maxScore}
              onSelect={onSelectCharacter}
            />
          ))}
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {Object.entries(ROLE_BAR).map(([role, color]) => {
          const opt = ROLE_OPTIONS.find(r => r.value === role)
          return (
            <span key={role} className="flex items-center gap-1.5 text-[10px] text-slate-600">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color, opacity: 0.8 }} />
              {opt?.label ?? role}
            </span>
          )
        })}
        <span className="flex items-center gap-1 text-[10px] text-teal-400 ml-2">
          <TrendingUp className="w-3 h-3" /> Rising
        </span>
        <span className="flex items-center gap-1 text-[10px] text-red-400">
          <TrendingDown className="w-3 h-3" /> Falling
        </span>
        <span className="flex items-center gap-1 text-[10px] text-slate-600">
          <Minus className="w-3 h-3" /> Stable
        </span>
      </div>
    </div>
  )
}
