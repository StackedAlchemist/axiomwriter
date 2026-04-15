import React, { useState } from 'react'
import { Flame, Check, Target } from 'lucide-react'
import { useWritingGoals } from '../../hooks/useWritingGoals'

export default function WritingGoalBar({ projectId }) {
  const { dailyGoal, todayWords, streak, setDailyGoal } = useWritingGoals(projectId)

  const [editing,   setEditing]   = useState(false)
  const [goalInput, setGoalInput] = useState('')

  const pct = dailyGoal > 0 ? Math.min(100, Math.round((todayWords / dailyGoal) * 100)) : 0
  const met = dailyGoal > 0 && todayWords >= dailyGoal

  function openEdit() {
    setGoalInput(String(dailyGoal))
    setEditing(true)
  }

  function commitGoal() {
    const g = parseInt(goalInput, 10)
    if (!isNaN(g) && g > 0) setDailyGoal(g).catch(() => {})
    setEditing(false)
  }

  return (
    <div className="px-3 pt-3 pb-3 border-t border-axiom-border space-y-2 flex-shrink-0">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Target className="w-3 h-3 text-slate-600" />
          <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">Daily Goal</span>
        </div>
        {streak > 0 && (
          <span className="flex items-center gap-0.5 text-[11px] font-semibold text-orange-400" title={`${streak}-day writing streak`}>
            <Flame className="w-3 h-3" />
            {streak}d
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-axiom-surface2 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${met ? 'bg-teal-400' : 'bg-gold-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-slate-500 leading-none">
          <span className={`font-semibold tabular-nums ${met ? 'text-teal-400' : 'text-slate-300'}`}>
            {todayWords.toLocaleString()}
          </span>
          <span className="text-slate-700"> / </span>
          {editing ? (
            <input
              autoFocus
              type="number"
              min="1"
              value={goalInput}
              onChange={e => setGoalInput(e.target.value)}
              onBlur={commitGoal}
              onKeyDown={e => {
                if (e.key === 'Enter') commitGoal()
                if (e.key === 'Escape') setEditing(false)
              }}
              className="w-14 bg-transparent text-gold-400 outline-none border-b border-gold-500/50 text-[11px] text-center"
            />
          ) : (
            <button
              onClick={openEdit}
              className="text-slate-600 hover:text-gold-400 transition-colors tabular-nums"
              title="Click to set daily goal"
            >
              {dailyGoal.toLocaleString()}
            </button>
          )}
          <span className="text-slate-700"> words</span>
        </span>

        <div className="flex items-center gap-1.5">
          {pct > 0 && (
            <span className="text-[10px] text-slate-700 tabular-nums">{pct}%</span>
          )}
          {met && <Check className="w-3 h-3 text-teal-400" />}
        </div>
      </div>
    </div>
  )
}
