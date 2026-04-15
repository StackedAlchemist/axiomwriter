/**
 * MomentumHistoryGraph
 * SVG multi-line chart showing each character's momentum score over time.
 * Hover tooltip shows exact score, date, and chapter count.
 */
import React, { useState, useRef } from 'react'
import { ROLE_OPTIONS } from '../../hooks/useCharacters'

const W   = 600
const H   = 200
const PAD = { top: 16, right: 16, bottom: 32, left: 36 }

const INNER_W = W - PAD.left - PAD.right
const INNER_H = H - PAD.top  - PAD.bottom

// Role → line color
const ROLE_COLOR = {
  protagonist: '#d4b865',
  antagonist:  '#f87171',
  major:       '#9e7dd4',
  supporting:  '#2dd4bf',
  background:  '#849ab2',
}

function lerp(a, b, t) { return a + (b - a) * t }

export default function MomentumHistoryGraph({ characters, selectedIds }) {
  const [tooltip, setTooltip] = useState(null)  // { x, y, text }
  const svgRef = useRef(null)

  // Only show characters that have history and are selected (or all if no selection)
  const visibleChars = characters.filter(c => {
    const hasHistory = (c.momentumHistory ?? []).length >= 2
    if (!hasHistory) return false
    return !selectedIds?.length || selectedIds.includes(c.id)
  })

  if (!visibleChars.length) {
    return (
      <div className="card p-6 text-center text-slate-600 text-sm">
        No momentum history yet. Run the analysis by saving scenes.
      </div>
    )
  }

  // Gather all data points to find global min/max dates + score range
  const allPoints = visibleChars.flatMap(c =>
    (c.momentumHistory || []).map(h => ({ ...h, charId: c.id }))
  )

  // Sort by date
  const sorted = [...allPoints].sort((a, b) => new Date(a.date) - new Date(b.date))
  const firstDate = new Date(sorted[0]?.date ?? Date.now()).getTime()
  const lastDate  = new Date(sorted[sorted.length - 1]?.date ?? Date.now()).getTime()
  const dateRange = Math.max(lastDate - firstDate, 1)

  function xForDate(dateStr) {
    const t = (new Date(dateStr).getTime() - firstDate) / dateRange
    return PAD.left + t * INNER_W
  }
  function yForScore(score) {
    return PAD.top + INNER_H - (score / 100) * INNER_H
  }

  return (
    <div className="space-y-3">
      <div className="bg-axiom-surface2 rounded-xl border border-axiom-border overflow-hidden relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          onMouseLeave={() => setTooltip(null)}
        >
          {/* Y-axis gridlines + labels */}
          {[0, 25, 50, 75, 100].map(score => {
            const y = yForScore(score)
            return (
              <g key={score}>
                <line
                  x1={PAD.left} y1={y}
                  x2={W - PAD.right} y2={y}
                  stroke="rgba(255,255,255,0.04)"
                  strokeWidth="1"
                />
                <text
                  x={PAD.left - 4} y={y + 3}
                  textAnchor="end"
                  fill="rgba(255,255,255,0.2)"
                  fontSize="8"
                >
                  {score}
                </text>
              </g>
            )
          })}

          {/* Lines per character */}
          {visibleChars.map((char, ci) => {
            const history = [...(char.momentumHistory || [])].sort(
              (a, b) => new Date(a.date) - new Date(b.date)
            )
            if (history.length < 2) return null

            const color = ROLE_COLOR[char.role] ?? '#849ab2'
            const points = history.map(h => ({
              x: xForDate(h.date),
              y: yForScore(h.score),
              score:    h.score,
              date:     h.date,
              chapters: h.chapterCount ?? '?',
            }))

            const pathD = points
              .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
              .join(' ')

            const areaD =
              pathD +
              ` L ${points[points.length - 1].x.toFixed(1)} ${(PAD.top + INNER_H).toFixed(1)}` +
              ` L ${points[0].x.toFixed(1)} ${(PAD.top + INNER_H).toFixed(1)} Z`

            return (
              <g key={char.id}>
                {/* Area fill */}
                <path d={areaD} fill={color} opacity="0.06" />

                {/* Line */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.9"
                />

                {/* Data points (hover targets) */}
                {points.map((p, pi) => (
                  <circle
                    key={pi}
                    cx={p.x} cy={p.y}
                    r={4}
                    fill={color}
                    stroke="#141430"
                    strokeWidth="1.5"
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={e => {
                      const rect = svgRef.current?.getBoundingClientRect()
                      setTooltip({
                        x: p.x / W * 100,  // percentage
                        y: p.y / H * 100,
                        text: `${char.name}: ${p.score}`,
                        sub: `${new Date(p.date).toLocaleDateString()} · Ch ${p.chapters}`,
                        color,
                      })
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                ))}
              </g>
            )
          })}

          {/* Tooltip */}
          {tooltip && (
            <g>
              <rect
                x={Math.min(tooltip.x / 100 * W + 6, W - 120)}
                y={Math.max(tooltip.y / 100 * H - 28, 4)}
                width="116"
                height="30"
                rx="4"
                fill="#0d0d2b"
                stroke="rgba(201,168,76,0.3)"
                strokeWidth="0.5"
              />
              <text
                x={Math.min(tooltip.x / 100 * W + 14, W - 112)}
                y={Math.max(tooltip.y / 100 * H - 16, 14)}
                fill={tooltip.color}
                fontSize="9"
                fontWeight="600"
              >
                {tooltip.text}
              </text>
              <text
                x={Math.min(tooltip.x / 100 * W + 14, W - 112)}
                y={Math.max(tooltip.y / 100 * H - 7, 23)}
                fill="rgba(255,255,255,0.35)"
                fontSize="8"
              >
                {tooltip.sub}
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Character legend */}
      <div className="flex flex-wrap gap-3">
        {visibleChars.map(char => {
          const color     = ROLE_COLOR[char.role] ?? '#849ab2'
          const score     = char.momentumScore ?? 0
          const roleLabel = ROLE_OPTIONS.find(r => r.value === char.role)?.label ?? ''
          return (
            <div key={char.id} className="flex items-center gap-1.5 text-xs">
              <span className="w-3 h-0.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-slate-400">{char.name}</span>
              <span className="text-slate-600">{score}</span>
              <span className={`text-[9px] ${ROLE_OPTIONS.find(r => r.value === char.role)?.color ?? 'text-slate-700'}`}>
                {roleLabel}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
