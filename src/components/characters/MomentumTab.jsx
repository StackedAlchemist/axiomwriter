import React, { useMemo } from 'react'
import { TrendingUp, Activity, BookOpen } from 'lucide-react'
import { IMPORTANCE_LEVELS, calculateMomentumScore } from '../../hooks/useCharacters'

// ── Importance history sparkline ──────────────────────────────────────────────
function ImportanceChart({ history }) {
  if (!history || history.length < 2) return null

  const W = 400
  const H = 80
  const PAD_X = 24
  const PAD_Y = 12

  // Build points
  const points = history.map((entry, i) => ({
    x: PAD_X + (i / (history.length - 1)) * (W - PAD_X * 2),
    y: H - PAD_Y - (entry.importance / 3) * (H - PAD_Y * 2),
    importance: entry.importance,
    date: entry.date,
    note: entry.note,
  }))

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  const impColors = ['#64748b', '#2dd4bf', '#d4b865', '#9e7dd4']

  return (
    <div className="space-y-1">
      <p className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold">Importance Over Time</p>
      <div className="bg-axiom-surface2 rounded-xl border border-axiom-border overflow-hidden">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
          {/* Grid lines */}
          {[0,1,2,3].map(level => {
            const y = H - PAD_Y - (level / 3) * (H - PAD_Y * 2)
            return (
              <g key={level}>
                <line
                  x1={PAD_X} y1={y}
                  x2={W - PAD_X} y2={y}
                  stroke="rgba(255,255,255,0.04)"
                  strokeWidth="1"
                />
                <text
                  x={PAD_X - 4}
                  y={y + 3}
                  textAnchor="end"
                  fill="rgba(255,255,255,0.2)"
                  fontSize="8"
                >
                  {IMPORTANCE_LEVELS[level]?.label[0]}
                </text>
              </g>
            )
          })}

          {/* Line */}
          <path
            d={pathD}
            fill="none"
            stroke="#d4b865"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Area fill */}
          <path
            d={`${pathD} L ${points[points.length-1].x} ${H} L ${points[0].x} ${H} Z`}
            fill="url(#momentumGrad)"
            opacity="0.15"
          />

          <defs>
            <linearGradient id="momentumGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d4b865" />
              <stop offset="100%" stopColor="#d4b865" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Data points */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x} cy={p.y}
              r={3.5}
              fill={impColors[p.importance] ?? '#d4b865'}
              stroke="#080818"
              strokeWidth="1.5"
            />
          ))}
        </svg>
      </div>
    </div>
  )
}

// ── Momentum score ring ───────────────────────────────────────────────────────
function MomentumRing({ score }) {
  const R = 34
  const CIRCUMFERENCE = 2 * Math.PI * R
  const filled = (score / 100) * CIRCUMFERENCE

  const scoreColor =
    score >= 75 ? '#d4b865' :
    score >= 50 ? '#2dd4bf' :
    score >= 25 ? '#9e7dd4' : '#64748b'

  return (
    <div className="flex items-center gap-4">
      <div className="relative flex-shrink-0">
        <svg width="88" height="88" viewBox="0 0 88 88">
          {/* Track */}
          <circle cx="44" cy="44" r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
          {/* Filled arc */}
          <circle
            cx="44" cy="44" r={R}
            fill="none"
            stroke={scoreColor}
            strokeWidth="6"
            strokeDasharray={`${filled} ${CIRCUMFERENCE}`}
            strokeLinecap="round"
            transform="rotate(-90 44 44)"
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
          <text
            x="44" y="44"
            textAnchor="middle"
            dominantBaseline="middle"
            fill={scoreColor}
            fontSize="18"
            fontWeight="bold"
            fontFamily="'Cormorant Garamond', serif"
          >
            {score}
          </text>
        </svg>
      </div>
      <div>
        <p className="font-serif text-lg font-semibold text-slate-200">Momentum Score</p>
        <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
          Calculated from importance level, scene appearances, and relationship density.
        </p>
        <div className="flex items-center gap-1.5 mt-2">
          <div className="h-1.5 rounded-full bg-axiom-surface2 flex-1 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${score}%`, backgroundColor: scoreColor }}
            />
          </div>
          <span className="text-xs text-slate-500">{score}/100</span>
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function MomentumTab({ character, onImportanceChange }) {
  const score          = useMemo(() => calculateMomentumScore(character), [character])
  const history        = character.importanceHistory ?? []
  const sceneHistory   = character.sceneHistory      ?? []
  const relationships  = character.relationshipMap   ?? []

  // Recent appearances (last 5)
  const recentScenes = [...sceneHistory].reverse().slice(0, 5)

  return (
    <div className="space-y-8 animate-slide-up">

      {/* ── Importance Level ── */}
      <div className="space-y-4">
        <div className="pb-2 border-b border-axiom-border">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Importance Level</h3>
          <p className="text-xs text-slate-700 mt-0.5">How significant is this character to the story right now?</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {IMPORTANCE_LEVELS.map(level => (
            <button
              key={level.value}
              onClick={() => onImportanceChange(level.value)}
              className={`px-4 py-3 rounded-xl text-sm font-semibold border transition-all ${
                character.importance === level.value
                  ? `${level.bg} ${level.color} shadow-glow-gold`
                  : 'text-slate-600 border-axiom-border hover:border-axiom-border-light hover:text-slate-400'
              }`}
            >
              <div className={`text-lg font-serif mb-0.5 ${character.importance === level.value ? level.color : 'text-slate-700'}`}>
                {['—', '·', '◆', '★'][level.value]}
              </div>
              {level.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Momentum Score ── */}
      <div className="space-y-4">
        <div className="pb-2 border-b border-axiom-border">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Momentum</h3>
        </div>
        <MomentumRing score={score} />

        {/* Breakdown */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-3 text-center">
            <Activity className="w-4 h-4 text-gold-400 mx-auto mb-1" />
            <p className="text-lg font-serif font-bold text-slate-100">{(character.importance ?? 1) * 25}</p>
            <p className="text-[10px] text-slate-600 uppercase tracking-wider">Importance</p>
          </div>
          <div className="card p-3 text-center">
            <BookOpen className="w-4 h-4 text-teal-400 mx-auto mb-1" />
            <p className="text-lg font-serif font-bold text-slate-100">{Math.min(sceneHistory.length * 8, 50)}</p>
            <p className="text-[10px] text-slate-600 uppercase tracking-wider">Appearances</p>
          </div>
          <div className="card p-3 text-center">
            <TrendingUp className="w-4 h-4 text-purple-400 mx-auto mb-1" />
            <p className="text-lg font-serif font-bold text-slate-100">{Math.min(relationships.length * 5, 25)}</p>
            <p className="text-[10px] text-slate-600 uppercase tracking-wider">Connections</p>
          </div>
        </div>
      </div>

      {/* ── Importance History Chart ── */}
      {history.length >= 2 && (
        <div className="space-y-4">
          <div className="pb-2 border-b border-axiom-border">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Importance History</h3>
            <p className="text-xs text-slate-700 mt-0.5">How their role has evolved as your story developed.</p>
          </div>
          <ImportanceChart history={history} />
          <div className="space-y-1.5">
            {[...history].reverse().slice(0, 5).map((entry, i) => {
              const level = IMPORTANCE_LEVELS[entry.importance]
              const date  = entry.date ? new Date(entry.date).toLocaleDateString() : ''
              return (
                <div key={i} className="flex items-center gap-3 text-xs text-slate-600">
                  <span className={`font-medium ${level?.color}`}>{level?.label}</span>
                  {date && <span className="text-slate-700">{date}</span>}
                  {entry.note && <span className="truncate">{entry.note}</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Recent Appearances ── */}
      {recentScenes.length > 0 && (
        <div className="space-y-4">
          <div className="pb-2 border-b border-axiom-border">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Recent Appearances</h3>
            <p className="text-xs text-slate-700 mt-0.5">The last {recentScenes.length} scene{recentScenes.length !== 1 ? 's' : ''} they appeared in.</p>
          </div>
          <div className="space-y-2">
            {recentScenes.map((entry, i) => (
              <div key={i} className="card px-4 py-3 flex items-center gap-3">
                <BookOpen className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-300 truncate">{entry.sceneId}</p>
                  {entry.emotionalState && (
                    <span className="text-xs text-gold-400/80">{entry.emotionalState}</span>
                  )}
                </div>
                {entry.addedAt && (
                  <span className="text-xs text-slate-700 flex-shrink-0">
                    {new Date(entry.addedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {history.length < 2 && recentScenes.length === 0 && (
        <div className="card p-8 text-center">
          <TrendingUp className="w-8 h-8 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-medium mb-1">No momentum data yet</p>
          <p className="text-slate-700 text-xs max-w-sm mx-auto">
            As you add scene appearances and evolve this character's importance level, their momentum will build here.
          </p>
        </div>
      )}
    </div>
  )
}
