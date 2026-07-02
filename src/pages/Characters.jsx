import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  ArrowLeft, Plus, Users, Search, LayoutGrid, List,
  FileText, Loader2, X, Check, Zap, Sparkles, MapPin, Package,
} from 'lucide-react'
import { getDoc, doc, getDocs, collection } from 'firebase/firestore'
import { db } from '../firebase/config'
import { getAllChapters } from '../hooks/useManuscript'
import { useCharacters, IMPORTANCE_LEVELS, ROLE_OPTIONS } from '../hooks/useCharacters'
import { useLore } from '../hooks/useLore'
import { classifyManuscriptEntities } from '../lib/claudeApi'
import CharacterCard from '../components/characters/CharacterCard'
import CreateCharacterModal from '../components/characters/CreateCharacterModal'
import MomentumDashboard from '../components/characters/MomentumDashboard'
import MomentumHistoryGraph from '../components/characters/MomentumHistoryGraph'

// ── Name extraction helpers ───────────────────────────────────────────────────
// Layer 2 stoplist — common capitalized non-names (sentence-start words, aux verbs,
// conjunctions, prepositions, honorifics, number words). Acronyms and contractions
// are handled structurally below; the AI pass catches the rest.
const COMMON_WORDS = new Set([
  'The','A','An','He','She','It','They','We','I','You','His','Her','Its','Their',
  'My','Our','Your','This','That','These','Those','Then','There','When','Where',
  'What','Who','Whom','Whose','How','Why','Which','But','And','Or','So','Yet','For','Nor',
  'At','By','In','On','Up','As','To','Of','If','Do','Does','Done','Be','Been','Being',
  'Was','Were','Is','Am','Are','Has','Have','Had','Did','Can','Could','May','Might','Must',
  'Will','Would','Shall','Should','Just','Not','All','No','Yes','Into','With','Without',
  'From','Out','Off','Over','Under','Again','Once','Here','Now','Never','Always','Maybe',
  'Even','Still','Only','Also','Too','Very','Much','More','Most','Some','Any','Each','Every',
  'Both','Either','Neither','Other','Another','Such','Than','Because','Though','Although',
  'While','Before','After','Until','Since','About','Around','Through','Between','Against',
  'Oh','Okay','Ok','Well','Yeah','Hey','Like','Got','Get','Go','Come','Came','Said','Says',
  'One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten',
  'Mr','Mrs','Ms','Dr','Sir','Lady','Lord','Captain','Sergeant',
])

// Strip possessive endings: Frame's → Frame, Chris' → Chris
function stripPossessive(w) {
  return w.replace(/['’]s$/i, '').replace(/['’]$/, '')
}

/**
 * Layers 1 + 2 of entity extraction: pull capitalized tokens, normalize possessives
 * and plurals to a single root, and filter out contractions / acronyms / stopwords.
 * Returns [{ name, count, sample }] sorted by frequency. The AI pass (Layer 3) runs
 * on this output to decide which are real people vs places/things.
 */
function extractCandidateNames(htmlContent) {
  const text = htmlContent.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ')
  const sentences = text.split(/(?<=[.!?])\s+/)
  const counts = {} // unigram root → { count, sample }
  const pairs  = {} // "First Last"  → { count, sample }

  // Returns the cleaned name token, or null if the word isn't name-shaped
  function cleanToken(word) {
    let clean = word.replace(/[^A-Za-z'’-]/g, '')
    if (clean.length < 2) return null
    if (!/^[A-Z]/.test(clean)) return null
    // Drop ALL-CAPS acronyms (HUD, POV, AI)
    if (/^[A-Z][A-Z]+$/.test(clean)) return null
    clean = stripPossessive(clean)
    if (clean.length < 2) return null
    // Drop contractions: a remaining apostrophe followed by a lowercase letter
    // (I'm, we're, don't) — keeps apostrophe names like O'Brien (uppercase after ').
    if (/['’][a-z]/.test(clean)) return null
    return clean
  }

  sentences.forEach(sentence => {
    const trimmed = sentence.trim()
    if (!trimmed) return
    const words   = trimmed.split(/\s+/)
    const cleaned = words.map(cleanToken)

    // Unigrams: skip the first word (start-of-sentence capitalization is not a signal)
    cleaned.forEach((clean, i) => {
      if (i === 0 || !clean || COMMON_WORDS.has(clean)) return
      if (!counts[clean]) counts[clean] = { count: 0, sample: trimmed.slice(0, 160) }
      counts[clean].count += 1
    })

    // Bigrams: two adjacent capitalized words read as "First Last" — a full
    // name (or a multi-word place, which the AI pass sorts out). Sentence
    // start is allowed here; two caps in a row is signal enough.
    for (let i = 0; i < cleaned.length - 1; i++) {
      const a = cleaned[i], b = cleaned[i + 1]
      if (!a || !b) continue
      if (COMMON_WORDS.has(a) || COMMON_WORDS.has(b)) continue
      // No pairing across clause boundaries ("...saw Kael. Rhyse said...")
      if (/[,.;:!?…]['"’”)\]]*$/.test(words[i])) continue
      // Possessives don't pair ("Kael's Toolbox" is not a full name)
      if (/['’]s?$/i.test(words[i].replace(/[^A-Za-z'’]/g, ''))) continue
      const key = `${a} ${b}`
      if (!pairs[key]) pairs[key] = { count: 0, sample: trimmed.slice(0, 160) }
      pairs[key].count += 1
    }
  })

  // Layer 1 plural merge: collapse "Frames" into "Frame" when the singular also
  // appears. Conservative — only single trailing 's' (not 'ss'), and only when the
  // singular is already a candidate, so names like "Chris"/"James" are untouched.
  Object.keys(counts).forEach(key => {
    if (/[^s]s$/.test(key)) {
      const singular = key.slice(0, -1)
      if (counts[singular]) {
        counts[singular].count += counts[key].count
        delete counts[key]
      }
    }
  })

  // ── Full-name assembly ──────────────────────────────────────────────────────
  // "Kael" + "Kael Rhyse" are one person: the full name becomes canonical and
  // the standalone first/last name folds in as an alias. A unigram only folds
  // when exactly ONE detected pair contains it (unambiguous ownership).
  const wordOwners = {} // word → Set of pair keys containing it
  Object.keys(pairs).forEach(key => {
    key.split(' ').forEach(w => {
      if (!wordOwners[w]) wordOwners[w] = new Set()
      wordOwners[w].add(key)
    })
  })

  const results = {}
  Object.entries(pairs).forEach(([key, v]) => {
    results[key] = { count: v.count, sample: v.sample, aliases: [] }
  })

  Object.entries(counts).forEach(([word, v]) => {
    const owners = wordOwners[word]
    if (owners && owners.size === 1) {
      const key = [...owners][0]
      results[key].count += v.count
      results[key].aliases.push(word)
      delete counts[word]
    }
  })

  // Pairs too rare even after folding are noise; standalone names need 2+ hits
  Object.keys(results).forEach(k => { if (results[k].count < 2) delete results[k] })
  Object.entries(counts).forEach(([word, v]) => {
    if (v.count >= 2 && !results[word]) {
      results[word] = { count: v.count, sample: v.sample, aliases: [] }
    }
  })

  return Object.entries(results)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 40)
    .map(([name, v]) => ({ name, count: v.count, sample: v.sample, aliases: v.aliases }))
}

// ── Import from Manuscript Modal ──────────────────────────────────────────────
function ImportFromManuscriptModal({ projectId, existingNames, existingLoreTitles, onClose, onCreate, onCreateLore }) {
  const [step,     setStep]     = useState('scanning')  // scanning | classifying | select
  const [persons,  setPersons]  = useState([])          // [{ name, count }]
  const [loreItems,setLoreItems]= useState([])          // [{ name, type }]  type: location | object
  const [aiUsed,   setAiUsed]   = useState(false)
  const [selChars, setSelChars] = useState(new Set())
  const [selLore,  setSelLore]  = useState(new Set())
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function scan() {
      try {
        const projectSnap = await getDoc(doc(db, 'projects', projectId))
        if (!projectSnap.exists()) { if (!cancelled) setStep('select'); return }

        const structure = projectSnap.data().structure
        const chapters  = getAllChapters(structure)
        const sceneIds  = chapters.flatMap(ch => (ch.scenes || []).map(s => s.id))

        // Load scene content in parallel (cap at 20 scenes)
        const toLoad = sceneIds.slice(0, 20)
        const snaps  = await Promise.all(
          toLoad.map(id => getDoc(doc(db, 'projects', projectId, 'scenes', id)))
        )
        const allHtml = snaps.filter(s => s.exists()).map(s => s.data().content ?? '').join(' ')

        // Layers 1+2 — normalize + stoplist
        const existing  = new Set(existingNames.map(n => n.toLowerCase()))
        const survivors = extractCandidateNames(allHtml).filter(c => !existing.has(c.name.toLowerCase()))
        if (cancelled) return

        if (survivors.length === 0) {
          setPersons([]); setLoreItems([]); setStep('select'); return
        }

        // Layer 3 — AI classification
        setStep('classifying')
        const byName  = new Map(survivors.map(c => [c.name, c]))
        const loreSet = new Set((existingLoreTitles || []).map(t => t.toLowerCase()))
        const buckets = await classifyManuscriptEntities(survivors)
        if (cancelled) return

        if (buckets) {
          const ppl = buckets.persons
            .filter(n => byName.has(n))
            .map(n => ({ name: n, count: byName.get(n).count, aliases: byName.get(n).aliases || [] }))
            .sort((a, b) => b.count - a.count)
          const lore = [
            ...buckets.locations.map(n => ({ name: n, type: 'location' })),
            ...buckets.objects.map(n => ({ name: n, type: 'object' })),
          ].filter(x => byName.has(x.name) && !loreSet.has(x.name.toLowerCase()))
          setPersons(ppl)
          setLoreItems(lore)
          setAiUsed(true)
        } else {
          // Graceful fallback — show the locally filtered survivors as people
          setPersons(survivors.map(c => ({ name: c.name, count: c.count, aliases: c.aliases || [] })))
          setLoreItems([])
          setAiUsed(false)
        }
        setStep('select')
      } catch (err) {
        console.error('[ImportFromManuscript]', err)
        if (!cancelled) setStep('select')
      }
    }
    scan()
    return () => { cancelled = true }
  }, [projectId, existingNames, existingLoreTitles])

  const toggle = (set, setter) => (name) => setter(prev => {
    const next = new Set(prev)
    next.has(name) ? next.delete(name) : next.add(name)
    return next
  })
  const toggleChar = toggle(selChars, setSelChars)
  const toggleLore = toggle(selLore, setSelLore)

  async function handleCreate() {
    if (selChars.size === 0 && selLore.size === 0) return
    setCreating(true)
    try {
      for (const name of selChars) {
        const person = persons.find(p => p.name === name)
        await onCreate({ name, aliases: person?.aliases || [], role: 'supporting', importance: 1 })
      }
      for (const name of selLore) {
        const item = loreItems.find(l => l.name === name)
        await onCreateLore?.({
          title:    name,
          category: item?.type === 'location' ? 'Location' : 'Item',
          content:  '<p>Auto-detected from the manuscript. Add details.</p>',
        })
      }
      onClose()
    } catch (err) {
      console.error('[ImportFromManuscript] create failed', err)
      setCreating(false)
    }
  }

  const totalSel = selChars.size + selLore.size
  const empty = step === 'select' && persons.length === 0 && loreItems.length === 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-axiom-surface border border-axiom-border rounded-2xl shadow-card w-full max-w-lg animate-slide-up max-h-[90vh] flex flex-col">

        <div className="flex items-center justify-between p-6 border-b border-axiom-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
              <FileText className="w-4 h-4 text-teal-400" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-semibold text-slate-100">Import from Manuscript</h2>
              <p className="text-xs text-slate-500">AI finds characters, places, and things in your prose</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon tap-target"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-6 overflow-y-auto">
          {step === 'scanning' ? (
            <div className="flex flex-col items-center py-8 gap-3">
              <Loader2 className="w-6 h-6 text-gold-400 animate-spin" />
              <p className="text-sm text-slate-400">Scanning manuscript…</p>
            </div>
          ) : step === 'classifying' ? (
            <div className="flex flex-col items-center py-8 gap-3">
              <Sparkles className="w-6 h-6 text-gold-400 animate-pulse" />
              <p className="text-sm text-slate-400">Identifying who's a person vs a place or thing…</p>
            </div>
          ) : empty ? (
            <div className="text-center py-8">
              <p className="text-slate-400 text-sm mb-1">No new entities detected</p>
              <p className="text-slate-600 text-xs">
                Everything found already exists, or no scenes have been written yet.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {!aiUsed && (
                <p className="text-[11px] text-gold-500/80 bg-gold-500/5 border border-gold-500/15 rounded-lg px-3 py-2">
                  AI classification was unavailable — showing raw name candidates. Review carefully before adding.
                </p>
              )}

              {/* Characters */}
              {persons.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-3.5 h-3.5 text-teal-400" />
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Characters</span>
                    <span className="text-[10px] text-slate-600">→ Cast</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {persons.map(({ name, count, aliases }) => {
                      const on = selChars.has(name)
                      return (
                        <button
                          key={name}
                          onClick={() => toggleChar(name)}
                          title={aliases?.length ? `Also appears as: ${aliases.join(', ')}` : undefined}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all ${
                            on ? 'bg-teal-500/15 border-teal-500/30 text-teal-300'
                               : 'bg-axiom-surface2 border-axiom-border text-slate-400 hover:border-axiom-border-light hover:text-slate-200'
                          }`}
                        >
                          {on && <Check className="w-3 h-3" />}
                          {name}
                          {aliases?.length > 0 && (
                            <span className="text-[10px] text-slate-500 italic">aka {aliases.join(', ')}</span>
                          )}
                          <span className="text-[10px] text-slate-600">{count}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Places & things → Lore Bible */}
              {loreItems.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-3.5 h-3.5 text-gold-400" />
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Places &amp; Things</span>
                    <span className="text-[10px] text-slate-600">→ Lore Bible</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {loreItems.map(({ name, type }) => {
                      const on = selLore.has(name)
                      const Icon = type === 'location' ? MapPin : Package
                      return (
                        <button
                          key={name}
                          onClick={() => toggleLore(name)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all ${
                            on ? 'bg-gold-500/15 border-gold-500/30 text-gold-300'
                               : 'bg-axiom-surface2 border-axiom-border text-slate-400 hover:border-axiom-border-light hover:text-slate-200'
                          }`}
                        >
                          {on ? <Check className="w-3 h-3" /> : <Icon className="w-3 h-3 opacity-60" />}
                          {name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {step === 'select' && !empty && (
          <div className="flex gap-3 p-6 pt-4 border-t border-axiom-border flex-shrink-0">
            <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={handleCreate}
              disabled={totalSel === 0 || creating}
              className="btn-primary flex-1"
            >
              {creating
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding…</>
                : `Add ${totalSel > 0 ? totalSel : ''} ${totalSel === 1 ? 'item' : 'items'}`
              }
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── List row view ─────────────────────────────────────────────────────────────
function CharacterRow({ character, onClick, onDelete, ROLE_OPTIONS, IMPORTANCE_LEVELS }) {
  const roleOpt  = ROLE_OPTIONS.find(r => r.value === character.role) ?? ROLE_OPTIONS[3]
  const impLevel = IMPORTANCE_LEVELS[character.importance ?? 1]

  return (
    <div
      onClick={onClick}
      className="card group cursor-pointer hover:border-axiom-border-light hover:shadow-glow-teal transition-all duration-200 px-4 py-3 flex items-center gap-4"
    >
      <div className="flex-1 min-w-0 flex items-center gap-3">
        <p className="font-serif font-semibold text-slate-100 text-sm group-hover:text-white transition-colors truncate">
          {character.name || <span className="italic text-slate-600">Unnamed</span>}
        </p>
        {character.aliases?.length > 0 && (
          <span className="text-xs text-slate-600 truncate hidden sm:block">aka {character.aliases.join(', ')}</span>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`badge border text-[10px] ${roleOpt.bg} ${roleOpt.color}`}>{roleOpt.label}</span>
        <span className={`badge border text-[10px] ${impLevel.bg} ${impLevel.color}`}>{impLevel.label}</span>
        {character.age && <span className="text-xs text-slate-600 hidden md:block">Age {character.age}</span>}
        <button
          onClick={e => { e.stopPropagation(); if (window.confirm(`Delete "${character.name}"?`)) onDelete() }}
          className="opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:text-red-400 p-1 transition-all"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Characters() {
  const { projectId } = useParams()
  const navigate      = useNavigate()
  const { characters, loading, createCharacter, deleteCharacter } = useCharacters(projectId)
  const { entries: loreEntries, createEntry: createLoreEntry } = useLore(projectId)

  const [search,         setSearch]         = useState('')
  const [roleFilter,     setRoleFilter]     = useState('all')
  const [impFilter,      setImpFilter]      = useState('all')
  const [viewMode,       setViewMode]       = useState('grid')   // 'grid' | 'list'
  const [showCreate,     setShowCreate]     = useState(false)
  const [showImport,     setShowImport]     = useState(false)
  const location = useLocation()

  // "Detect from manuscript" shortcuts elsewhere in the app land here with
  // navigation state asking for the import modal to open immediately.
  useEffect(() => {
    if (location.state?.openImport) {
      setShowImport(true)
      window.history.replaceState({}, '') // don't re-open on refresh/back
    }
  }, [location.state])
  const [activeTab,      setActiveTab]      = useState('cast')   // 'cast' | 'momentum'
  const [selectedCharId, setSelectedCharId] = useState(null)     // for history graph

  const filtered = characters.filter(c => {
    const matchSearch = !search || c.name?.toLowerCase().includes(search.toLowerCase())
    const matchRole   = roleFilter === 'all' || c.role === roleFilter
    const matchImp    = impFilter  === 'all' || String(c.importance) === impFilter
    return matchSearch && matchRole && matchImp
  })

  async function handleCreate(data) {
    const id = await createCharacter(data)
    setShowCreate(false)
    navigate(`/projects/${projectId}/characters/${id}`)
  }

  // Used by import modal — creates silently without navigating
  async function handleImportCreate(data) {
    await createCharacter(data)
  }

  const existingNames     = characters.map(c => c.name).filter(Boolean)
  const existingLoreTitles = loreEntries.map(e => e.title).filter(Boolean)

  return (
    <div className="min-h-screen bg-axiom-bg flex flex-col">

      {/* Top bar */}
      <header className="flex items-center justify-between h-12 px-4 bg-axiom-surface border-b border-axiom-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/projects/${projectId}`)} className="btn-icon">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-teal-400" />
            <span className="font-serif font-semibold text-slate-100 text-sm">Characters</span>
            {!loading && characters.length > 0 && (
              <span className="text-xs text-slate-600">({characters.length})</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="btn-ghost text-xs py-1.5 px-3"
            title="Import names from manuscript"
          >
            <FileText className="w-3.5 h-3.5" />
            Import
          </button>
          <button onClick={() => setShowCreate(true)} className="btn-primary text-xs py-1.5 px-3">
            <Plus className="w-3.5 h-3.5" />
            New Character
          </button>
        </div>
      </header>

      {/* Tab bar */}
      <div className="border-b border-axiom-border bg-axiom-surface flex-shrink-0">
        <div className="max-w-6xl mx-auto px-6 flex gap-1">
          <button
            onClick={() => setActiveTab('cast')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === 'cast'
                ? 'border-gold-500 text-gold-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Cast
          </button>
          <button
            onClick={() => setActiveTab('momentum')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === 'momentum'
                ? 'border-gold-500 text-gold-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Momentum
            {characters.filter(c => (c.momentumScore ?? 0) > 0).length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[9px] font-semibold bg-gold-500/15 text-gold-400 border border-gold-500/20 rounded-full">
                {characters.filter(c => (c.momentumScore ?? 0) > 0).length}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-6 space-y-5">

        {/* ── MOMENTUM TAB ── */}
        {activeTab === 'momentum' && (
          <div className="space-y-6">
            <MomentumDashboard
              characters={characters}
              onSelectCharacter={c => {
                setSelectedCharId(prev => prev === c.id ? null : c.id)
              }}
            />

            {/* History graph */}
            {characters.some(c => (c.momentumHistory ?? []).length >= 2) && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Momentum History {selectedCharId ? '— ' + (characters.find(c => c.id === selectedCharId)?.name ?? '') : '— All Characters'}
                  </h3>
                  {selectedCharId && (
                    <button onClick={() => setSelectedCharId(null)} className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
                      Show all
                    </button>
                  )}
                </div>
                <MomentumHistoryGraph
                  characters={characters}
                  selectedIds={selectedCharId ? [selectedCharId] : []}
                />
              </div>
            )}

            {!loading && characters.every(c => (c.momentumHistory ?? []).length < 2) && (
              <div className="card p-6 text-center text-slate-600 text-sm">
                <Zap className="w-6 h-6 mx-auto mb-2 text-slate-700" />
                <p className="text-slate-500 font-medium mb-1">No momentum data yet</p>
                <p className="text-xs text-slate-700">
                  Momentum scores are calculated automatically while you write. Open a project and save a few scenes.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── CAST TAB ── */}
        {activeTab === 'cast' && <>

        {/* Filters + view toggle */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search characters…"
              className="input-base pl-9 py-2 text-sm"
            />
          </div>

          {/* Role filter */}
          <div className="flex gap-1 flex-wrap">
            <FilterBtn active={roleFilter === 'all'} onClick={() => setRoleFilter('all')}>All Roles</FilterBtn>
            {ROLE_OPTIONS.map(r => (
              <FilterBtn key={r.value} active={roleFilter === r.value} onClick={() => setRoleFilter(r.value)}>
                {r.label}
              </FilterBtn>
            ))}
          </div>

          {/* Importance filter */}
          <div className="flex gap-1">
            <FilterBtn active={impFilter === 'all'} onClick={() => setImpFilter('all')}>All</FilterBtn>
            {IMPORTANCE_LEVELS.map(i => (
              <FilterBtn key={i.value} active={impFilter === String(i.value)} onClick={() => setImpFilter(String(i.value))}>
                {i.label}
              </FilterBtn>
            ))}
          </div>

          {/* View toggle */}
          <div className="flex gap-1 ml-auto border border-axiom-border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-axiom-surface2 text-gold-400' : 'text-slate-600 hover:text-slate-300'}`}
              title="Grid view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-axiom-surface2 text-gold-400' : 'text-slate-600 hover:text-slate-300'}`}
              title="List view"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'space-y-2'
          }>
            {[1,2,3].map(i => <div key={i} className="card h-24 animate-pulse-soft" />)}
          </div>
        )}

        {/* Characters */}
        {!loading && filtered.length > 0 && (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(char => (
                <CharacterCard
                  key={char.id}
                  character={char}
                  onClick={() => navigate(`/projects/${projectId}/characters/${char.id}`)}
                  onDelete={() => deleteCharacter(char.id)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(char => (
                <CharacterRow
                  key={char.id}
                  character={char}
                  onClick={() => navigate(`/projects/${projectId}/characters/${char.id}`)}
                  onDelete={() => deleteCharacter(char.id)}
                  ROLE_OPTIONS={ROLE_OPTIONS}
                  IMPORTANCE_LEVELS={IMPORTANCE_LEVELS}
                />
              ))}
            </div>
          )
        )}

        {/* Empty — no characters */}
        {!loading && characters.length === 0 && (
          <div className="card p-14 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-axiom-surface2 border border-axiom-border flex items-center justify-center mb-4">
              <Users className="w-7 h-7 text-slate-600" />
            </div>
            <h3 className="font-serif text-xl font-semibold text-slate-200 mb-2">No characters yet</h3>
            <p className="text-slate-500 text-sm max-w-sm leading-relaxed mb-5">
              Build your cast. Every unforgettable story starts with characters that feel real.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowImport(true)} className="btn-secondary text-sm">
                <FileText className="w-4 h-4" /> Import from Manuscript
              </button>
              <button onClick={() => setShowCreate(true)} className="btn-primary text-sm">
                <Plus className="w-4 h-4" /> Create First Character
              </button>
            </div>
          </div>
        )}

        {/* Empty — filtered */}
        {!loading && characters.length > 0 && filtered.length === 0 && (
          <div className="card p-8 text-center">
            <p className="text-slate-500 text-sm">No characters match your filters.</p>
            <button
              onClick={() => { setSearch(''); setRoleFilter('all'); setImpFilter('all') }}
              className="btn-ghost text-xs mt-2"
            >
              Clear filters
            </button>
          </div>
        )}
        </> /* end cast tab */}
      </div>

      {showCreate && (
        <CreateCharacterModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}

      {showImport && (
        <ImportFromManuscriptModal
          projectId={projectId}
          existingNames={existingNames}
          existingLoreTitles={existingLoreTitles}
          onClose={() => setShowImport(false)}
          onCreate={handleImportCreate}
          onCreateLore={createLoreEntry}
        />
      )}
    </div>
  )
}

function FilterBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1.5 rounded text-xs font-medium border transition-all ${
        active
          ? 'bg-gold-500/15 text-gold-400 border-gold-500/30'
          : 'bg-axiom-surface border-axiom-border text-slate-500 hover:text-slate-300 hover:border-axiom-border-light'
      }`}
    >
      {children}
    </button>
  )
}
