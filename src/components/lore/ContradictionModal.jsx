import React from 'react'
import { X, AlertTriangle, CheckCircle } from 'lucide-react'

export default function ContradictionModal({ entryTitle, conflicts, onIgnore, onResolve }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="card w-full max-w-xl animate-slide-up">

        <div className="flex items-center justify-between p-5 border-b border-axiom-border">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            <h2 className="font-serif text-lg font-semibold text-slate-100">
              Lore Contradiction Detected
            </h2>
          </div>
          <button onClick={onIgnore} className="btn-icon">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          <p className="text-sm text-slate-400 mb-4">
            Your entry <span className="text-slate-200 font-medium">"{entryTitle}"</span> may conflict
            with existing lore:
          </p>

          <div className="space-y-3 mb-5 max-h-64 overflow-y-auto">
            {conflicts.map((conflict, i) => (
              <div key={i} className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-3">
                <p className="text-xs font-medium text-orange-400 mb-2">{conflict.explanation}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">Existing</p>
                    <p className="text-xs text-slate-400 bg-axiom-bg rounded p-2 leading-relaxed">
                      {conflict.existing}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">New Entry</p>
                    <p className="text-xs text-slate-400 bg-axiom-bg rounded p-2 leading-relaxed">
                      {conflict.new}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={onIgnore} className="btn-secondary text-sm">
              Keep Both
            </button>
            <button onClick={onResolve} className="btn-primary text-sm flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5" />
              I'll Resolve This
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
