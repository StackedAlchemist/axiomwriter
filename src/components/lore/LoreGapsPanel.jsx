import React, { useState, useCallback } from 'react'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { Loader2, Plus, X, Clock, RefreshCw } from 'lucide-react'
import { db } from '../../firebase/config'
import { getAllChapters } from '../../hooks/useManuscript'

const STOP_WORDS = new Set([
  'The','A','An','In','Of','For','To','And','But','Or','He','She','They','We',
  'You','I','His','Her','Its','Their','My','Our','Your','This','That','These',
  'Those','Then','When','Where','Who','Which','What','How','Why','No','Yes',
  'There','Here','With','From','Into','Than','After','Before','Upon','Over',
  'Under','About','Through','During','Without','Within','Against','Between',
  'Among','While','Although','Because','Since','Unless','Until','Once','Still',
  'Even','Just','Also','Now','Only','Very','Too','More','Most','Some','Such',
  'Many','Much','Few','All','Each','Every','Any','One','Two','Three','Four',
  'Five','Six','Seven','Eight','Nine','Ten','Monday','Tuesday','Wednesday',
  'Thursday','Friday','Saturday','Sunday','January','February','March','April',
  'May','June','July','August','September','October','November','December',
  'North','South','East','West','Mr','Mrs','Ms','Dr','Sir','Lady','Lord',
  'So','Though','However','Therefore','Thus','Hence','Oh','Ah','Well','Not',
  'By','As','At','On','Up','If','It',
])

async function scanManuscript(projectId, loreTermSet) {
  const projectSnap = await getDoc(doc(db, 'projects', projectId))
  if (!projectSnap.exists()) return { gaps: [], dismissed: [] }

  const data = projectSnap.data()
  const structure = data.structure || { hasParts: false, chapters: [] }
  const dismissed = data.loreGapDismissed || []
  const snoozed = data.loreGapSnoozed || {}
  const now = Date.now()

  const dismissedSet = new Set(dismissed.map(t => t.toLowerCase()))
  const activeSnoozedSet = new Set(
    Object.entries(snoozed)
      .filter(([, ts]) => ts > now)
      .map(([term]) => term.toLowerCase())
  )

  const chapters = getAllChapters(structure)
  const sceneIds = chapters.flatMap(ch => (ch.scenes || []).map(s => s.id))
  if (!sceneIds.length) return { gaps: [], dismissed }

  const snaps = await Promise.all(
    sceneIds.map(id => getDoc(doc(db, 'projects', projectId, 'scenes', id)))
  )

  const termCounts = {}
  const regex = /\b([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)\b/g

  snaps.forEach(snap => {
    if (!snap.exists()) return
    const text = (snap.data().content || '').replace(/<[^>]+>/g, ' ')
    let m
    regex.lastIndex = 0
    while ((m = regex.exec(text)) !== null) {
      const term = m[1]
      const words = term.split(' ')
      if (words.length === 1 && STOP_WORDS.has(term)) continue
      if (loreTermSet.has(term.toLowerCase())) continue
      if (dismissedSet.has(term.toLowerCase())) continue
      if (activeSnoozedSet.has(term.toLowerCase())) continue
      termCounts[term] = (termCounts[term] || 0) + 1
    }
  })

  const gaps = Object.entries(termCounts)
    .filter(([, count]) => count >= 2)
    .sort(([, a], [, b]) => b - a)
    .map(([term, count]) => ({ term, count }))

  return { gaps, dismissed }
}

export default function LoreGapsPanel({ projectId, loreEntries, onCreateEntry }) {
  const [scanning, setScanning] = useState(false)
  const [gaps, setGaps] = useState(null)
  const [error, setError] = useState(null)

  const loreTermSet = React.useMemo(
    () => new Set(loreEntries.map(e => e.title.toLowerCase())),
    [loreEntries]
  )

  const scan = useCallback(async () => {
    setScanning(true)
    setError(null)
    try {
      const { gaps } = await scanManuscript(projectId, loreTermSet)
      setGaps(gaps)
    } catch (err) {
      console.error('[LoreGapsPanel]', err)
      setError('Could not scan manuscript. Make sure you have at least one scene with content.')
    } finally {
      setScanning(false)
    }
  }, [projectId, loreTermSet])

  // Scan on first render
  React.useEffect(() => { scan() }, []) // eslint-disable-line

  async function dismiss(term) {
    setGaps(prev => prev.filter(g => g.term !== term))
    try {
      const snap = await getDoc(doc(db, 'projects', projectId))
      const current = snap.data()?.loreGapDismissed || []
      if (!current.map(t => t.toLowerCase()).includes(term.toLowerCase())) {
        await updateDoc(doc(db, 'projects', projectId), {
          loreGapDismissed: [...current, term],
        })
      }
    } catch (err) {
      console.warn('[LoreGapsPanel] dismiss error:', err.message)
    }
  }

  async function snooze(term) {
    setGaps(prev => prev.filter(g => g.term !== term))
    try {
      const snap = await getDoc(doc(db, 'projects', projectId))
      const current = snap.data()?.loreGapSnoozed || {}
      await updateDoc(doc(db, 'projects', projectId), {
        loreGapSnoozed: {
          ...current,
          [term.toLowerCase()]: Date.now() + 7 * 24 * 60 * 60 * 1000,
        },
      })
    } catch (err) {
      console.warn('[LoreGapsPanel] snooze error:', err.message)
    }
  }

  if (scanning) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-600">
        <Loader2 className="w-5 h-5 animate-spin mb-2" />
        <span className="text-xs">Scanning manuscript for lore gaps…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-5 text-center">
        <p className="text-xs text-red-400 mb-3">{error}</p>
        <button onClick={scan} className="text-xs text-gold-500 hover:text-gold-400 transition-colors">
          Try again
        </button>
      </div>
    )
  }

  if (gaps === null) return null

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Panel header */}
      <div className="px-4 py-3 border-b border-axiom-border flex items-center justify-between flex-shrink-0">
        <div>
          <p className="text-xs font-semibold text-slate-300">
            {gaps.length > 0 ? `${gaps.length} Potential Lore Gap${gaps.length !== 1 ? 's' : ''}` : 'No Gaps Found'}
          </p>
          <p className="text-[10px] text-slate-600 mt-0.5">
            Capitalized terms used 2+ times with no Lore Bible entry
          </p>
        </div>
        <button
          onClick={scan}
          className="p-1 text-slate-600 hover:text-gold-400 transition-colors"
          title="Rescan manuscript"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {gaps.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center px-5 py-10">
          <p className="text-sm text-slate-500">All clear!</p>
          <p className="text-xs text-slate-700 mt-1">
            Every capitalized term in your manuscript appears in the Lore Bible (or has been dismissed).
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto divide-y divide-axiom-border">
          {gaps.map(({ term, count }) => (
            <div key={term} className="px-4 py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200 font-medium truncate">{term}</p>
                <p className="text-[10px] text-slate-600 mt-0.5">
                  Used {count} time{count !== 1 ? 's' : ''} in manuscript
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => onCreateEntry(term)}
                  className="flex items-center gap-1 px-2 py-1 bg-gold-500/10 border border-gold-500/20 text-gold-400 text-xs rounded hover:bg-gold-500/20 transition-colors"
                  title="Create lore entry for this term"
                >
                  <Plus className="w-3 h-3" />
                  Create
                </button>
                <button
                  onClick={() => snooze(term)}
                  className="p-1 text-slate-600 hover:text-slate-400 transition-colors"
                  title="Remind me later (7 days)"
                >
                  <Clock className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => dismiss(term)}
                  className="p-1 text-slate-600 hover:text-red-400 transition-colors"
                  title="Dismiss forever"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
