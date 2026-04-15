import React, { useState } from 'react'
import { X, Sparkles, Map, Loader2, CheckCircle2, AlertTriangle, Check } from 'lucide-react'
import { MAP_STYLES } from '../../hooks/useWorldMap'
import { analyzeLoreForMap, generateProceduralBackground, generateStabilityBackground } from '../../lib/mapAnalysis'

const STEPS = [
  { id: 'style',    label: 'Choose style' },
  { id: 'analyze',  label: 'Analyze lore' },
  { id: 'generate', label: 'Generate map' },
]

export default function GenerateFromLoreModal({ loreEntries, onClose, onCreate }) {
  const [step,      setStep]      = useState('style')   // style | analyzing | done | error
  const [style,     setStyle]     = useState('parchment')
  const [analyzing, setAnalyzing] = useState(false)
  const [error,     setError]     = useState(null)
  const [progress,  setProgress]  = useState('')
  const [mapName,   setMapName]   = useState('World Map')

  const locationCount = loreEntries.filter(e =>
    ['Location', 'Place', 'Geography', 'Region', 'City', 'Town', 'Setting'].some(
      cat => (e.category || '').toLowerCase().includes(cat.toLowerCase())
    )
  ).length

  const factionCount = loreEntries.filter(e =>
    ['Faction', 'Organization', 'Kingdom', 'Nation', 'Empire'].some(
      cat => (e.category || '').toLowerCase().includes(cat.toLowerCase())
    )
  ).length

  async function handleGenerate() {
    setStep('analyzing')
    setAnalyzing(true)
    setError(null)

    try {
      // Step 1: Claude analyzes lore
      setProgress('Analyzing geographic relationships in your lore…')
      const analysis = await analyzeLoreForMap(loreEntries, 1600, 900)

      // Step 2: Generate background
      setProgress('Generating map background…')
      let backgroundData = null

      // Try Stability AI first (if key set), fall back to procedural
      if (import.meta.env.VITE_STABILITY_API_KEY) {
        setProgress('Generating AI map background (Stability AI)…')
        backgroundData = await generateStabilityBackground(
          analysis?.mapDescription || `A ${style} fantasy world map`,
          style
        )
      }

      if (!backgroundData) {
        setProgress('Generating procedural map background…')
        backgroundData = generateProceduralBackground(style, 1600, 900)
      }

      // Step 3: Build map data
      setProgress('Placing locations and territories…')

      const pins = (analysis?.locations || []).map((loc, i) => ({
        id:          `pin_${i}`,
        x:           loc.x,
        y:           loc.y,
        name:        loc.name,
        type:        loc.type || 'town',
        loreEntryId: loc.loreEntryId || null,
        notes:       loc.notes || '',
        hasChildMap: false,
        scenePins:   [],
      }))

      const factionBorders = (analysis?.factionTerritories || []).map((f, i) => {
        // Approximate territory as a rough polygon around center
        const cx = f.centerX || (200 + i * 300)
        const cy = f.centerY || (200 + i * 150)
        const r  = 150
        const pts = Array.from({ length: 6 }, (_, j) => {
          const angle = (j / 6) * Math.PI * 2
          const jitter = (Math.random() - 0.5) * 60
          return [cx + Math.cos(angle) * (r + jitter), cy + Math.sin(angle) * (r + jitter)]
        })
        return {
          id:          `faction_${i}`,
          name:        f.name,
          color:       f.color || '#ef4444',
          loreEntryId: f.loreEntryId || null,
          points:      pts,
        }
      })

      setProgress('Done!')
      setAnalyzing(false)

      // Return the map seed data
      onCreate({
        name:           mapName,
        style,
        backgroundData,
        pins,
        factionBorders,
        labels: analysis?.mapDescription ? [{
          id: 'title_label',
          x:  32,
          y:  32,
          text:     mapName,
          fontSize: 22,
          color:    style === 'parchment' ? '#3a2010' : style === 'schematic' ? '#3a9fd5' : '#e0e0e0',
          fontStyle: 'bold',
        }] : [],
      })
    } catch (err) {
      console.error('[GenerateFromLoreModal]', err)
      setError('Something went wrong analyzing your lore. Check your API key and try again.')
      setAnalyzing(false)
      setStep('style')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-axiom-surface border border-axiom-border rounded-2xl shadow-card w-full max-w-lg animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-axiom-border">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-gold-400" />
            <span className="font-serif font-semibold text-slate-100 text-sm">Generate Map from Lore Bible</span>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-600 hover:text-slate-300 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-5 space-y-5">

          {/* Lore summary */}
          <div className="flex gap-4">
            <div className="flex-1 px-3 py-2.5 rounded-xl bg-axiom-surface2 border border-axiom-border text-center">
              <p className="text-xl font-bold font-serif text-gold-400">{locationCount}</p>
              <p className="text-[10px] text-slate-600 uppercase tracking-wider mt-0.5">Locations</p>
            </div>
            <div className="flex-1 px-3 py-2.5 rounded-xl bg-axiom-surface2 border border-axiom-border text-center">
              <p className="text-xl font-bold font-serif text-gold-400">{factionCount}</p>
              <p className="text-[10px] text-slate-600 uppercase tracking-wider mt-0.5">Factions</p>
            </div>
            <div className="flex-1 px-3 py-2.5 rounded-xl bg-axiom-surface2 border border-axiom-border text-center">
              <p className="text-xl font-bold font-serif text-gold-400">{loreEntries.length}</p>
              <p className="text-[10px] text-slate-600 uppercase tracking-wider mt-0.5">Total Entries</p>
            </div>
          </div>

          {loreEntries.length === 0 && (
            <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-gold-500/5 border border-gold-500/20">
              <AlertTriangle className="w-4 h-4 text-gold-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-400 leading-relaxed">
                Your Lore Bible is empty. Claude will generate a blank world — add locations and factions to your Lore Bible for a richer map.
              </p>
            </div>
          )}

          {/* Map name */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Map Name</label>
            <input
              value={mapName}
              onChange={e => setMapName(e.target.value)}
              className="input-base text-sm w-full"
              placeholder="World Map"
            />
          </div>

          {/* Style picker */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Visual Style</label>
            <div className="grid grid-cols-2 gap-2">
              {MAP_STYLES.map(s => (
                <button
                  key={s.value}
                  onClick={() => setStyle(s.value)}
                  className={`p-3 rounded-xl border text-left transition-all relative ${
                    style === s.value
                      ? 'border-gold-500/40 bg-gold-500/10'
                      : 'border-axiom-border bg-axiom-surface2 hover:border-axiom-border-light'
                  }`}
                >
                  {style === s.value && (
                    <Check className="w-3 h-3 text-gold-400 absolute top-2 right-2" />
                  )}
                  <p className={`text-xs font-semibold mb-0.5 ${style === s.value ? 'text-gold-400' : 'text-slate-300'}`}>
                    {s.label}
                  </p>
                  <p className="text-[10px] text-slate-600 leading-snug">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}

          {/* Progress */}
          {analyzing && (
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-axiom-surface2 border border-axiom-border">
              <Loader2 className="w-4 h-4 text-gold-400 animate-spin flex-shrink-0" />
              <p className="text-xs text-slate-400">{progress}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary text-xs" disabled={analyzing}>
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={analyzing}
            className="btn-primary text-xs flex items-center gap-1.5"
          >
            {analyzing
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Generating…</>
              : <><Sparkles className="w-3.5 h-3.5" />Generate Map</>}
          </button>
        </div>
      </div>
    </div>
  )
}
