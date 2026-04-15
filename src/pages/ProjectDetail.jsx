import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import ComposerPanel from '../components/composer/ComposerPanel'
import PauseDetectionBar from '../components/composer/PauseDetectionBar'
import { usePauseDetection } from '../hooks/usePauseDetection'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Upload, Download, Focus, Loader2, Users, BookOpen, ExternalLink, Search, GitBranch, ClipboardCheck, Globe, ImageIcon, Rocket, Sun, Moon, Sparkles } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { useWritingTheme } from '../contexts/WritingThemeContext'
import ThemeBackground from '../components/theme/ThemeBackground'
import ThemeSelector from '../components/theme/ThemeSelector'
import { useManuscript, findSceneMeta } from '../hooks/useManuscript'
import { useLore } from '../hooks/useLore'
import { useCharacters, AVATAR_COLORS, ROLE_OPTIONS } from '../hooks/useCharacters'
import ManuscriptSidebar from '../components/manuscript/ManuscriptSidebar'
import SceneEditor from '../components/manuscript/SceneEditor'
import ImportDocxModal from '../components/manuscript/ImportDocxModal'
import ExportDocxModal from '../components/manuscript/ExportDocxModal'
import CharacterQuickRef from '../components/characters/CharacterQuickRef'
import LoadingSpinner from '../components/common/LoadingSpinner'
import LayoutSelector from '../components/layout/LayoutSelector'
import ScenesGridLayout from './layouts/ScenesGridLayout'
import ThreadsLayout from './layouts/ThreadsLayout'
import CorkboardLayout from './layouts/CorkboardLayout'
import TimelineLayout from './layouts/TimelineLayout'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useMomentumEngine } from '../hooks/useMomentumEngine'
import CharacterSheetPanel from '../components/characters/CharacterSheetPanel'
import { useThreads } from '../hooks/useThreads'
import { runThreadAnalysis } from '../lib/threadEngine'
import AddThreadModal from '../components/threads/AddThreadModal'
import { useDevEdit } from '../hooks/useDevEdit'
import DevEditDetailPanel from '../components/devedit/DevEditDetailPanel'

export default function ProjectDetail() {
  const { projectId } = useParams()
  const navigate  = useNavigate()
  const location  = useLocation()

  const ms = useManuscript(projectId)
  const { entries: loreEntries } = useLore(projectId)

  const [focusMode,      setFocusMode]      = useState(false)
  const [showImport,     setShowImport]     = useState(false)
  const [showExport,     setShowExport]     = useState(false)
  const [saveStatus,     setSaveStatus]     = useState('saved')
  const [sidebarOpen,    setSidebarOpen]    = useState(true)
  const [showCharPanel,  setShowCharPanel]  = useState(false)
  const [quickRefChar,   setQuickRefChar]   = useState(null)
  const [charSearch,     setCharSearch]     = useState('')

  const [showComposer,         setShowComposer]         = useState(false)
  const [activeLayout,         setActiveLayoutState]    = useState('linear')
  const [momentumCharId,       setMomentumCharId]       = useState(null)
  const [pendingThreadSuggestions, setPendingThreadSuggestions] = useState([])  // Claude-detected
  const [dormantThreadAlerts,  setDormantThreadAlerts]  = useState([])          // forgotten alerts
  const [showAddThread,        setShowAddThread]        = useState(false)
  const [threadPrefill,        setThreadPrefill]        = useState(null)
  const threadEngineRunning    = useRef(false)
  const [devEditFinding, setDevEditFinding] = useState(null)
  const editorRef = useRef(null)
  const { markActivity, isPaused } = usePauseDetection()
  const { theme, toggle: toggleTheme } = useTheme()
  const { currentTheme: writingTheme } = useWritingTheme()
  const [showThemeSelector, setShowThemeSelector] = useState(false)
  const { triggerAnalysis, spikeSuggestions, dismissSuggestion } = useMomentumEngine(projectId)
  const { threads, createThread, updateThread, linkScene, unlinkScene } = useThreads(projectId)
  const {
    suggestions:       devEditSuggestions,
    isScanning:        devEditScanning,
    healthScore:       devEditHealthScore,
    onSceneSaved:      devEditOnSceneSaved,
    runManualScan:     devEditRunManualScan,
    dismissSuggestion: devEditDismiss,
    neverCheckType:    devEditNever,
  } = useDevEdit(projectId)

  // Sync layout from Firestore once project loads
  useEffect(() => {
    if (ms.project?.activeLayout) setActiveLayoutState(ms.project.activeLayout)
  }, [ms.project?.activeLayout])

  // Auto-open scene when navigating here from ThreadDashboard
  useEffect(() => {
    const sceneId = location.state?.openSceneId
    if (sceneId && ms.structure) {
      setActiveLayoutState('linear')
      ms.loadScene(sceneId)
      // Clear the state so a refresh doesn't re-open
      window.history.replaceState({}, '')
    }
  }, [location.state?.openSceneId, ms.structure])

  // Subscribe to characters whenever any panel, layout, or momentum engine needs them
  const needsChars = showCharPanel || showComposer || activeLayout === 'grid' || activeLayout === 'timeline' || !!ms.project
  const { characters } = useCharacters(needsChars ? projectId : null)
  const quickRefAnchor = useRef(null)

  async function setActiveLayout(id) {
    setActiveLayoutState(id)
    try {
      await updateDoc(doc(db, 'projects', projectId), { activeLayout: id })
    } catch { /* non-critical */ }
  }

  // When opening a scene from a non-linear layout, switch to linear view
  function openSceneFromLayout(sceneId) {
    setActiveLayoutState('linear')
    ms.loadScene(sceneId)
    updateDoc(doc(db, 'projects', projectId), { activeLayout: 'linear' }).catch(() => {})
  }

  // Active scene meta derived from structure
  const activeMeta = ms.activeSceneId && ms.structure
    ? findSceneMeta(ms.structure, ms.activeSceneId)?.scene ?? null
    : null

  // Stable array — only recreated when lore entries change, not on every render
  const loreTerms = useMemo(() => loreEntries.map(e => e.title), [loreEntries])

  const pauseSuggestions = []
  if (loreEntries.length > 0) {
    pauseSuggestions.push({
      text: 'You have a Lore Bible. Want to check for lore gaps?',
      yesLabel: 'Review',
      onAction: (action) => {
        if (action === 'yes') navigate(`/projects/${projectId}/lore`)
      },
    })
  }
  // Momentum spike suggestions queued by the engine
  spikeSuggestions.forEach(spike => {
    pauseSuggestions.push({
      text: `⚡ ${spike.text}`,
      yesLabel: 'Update Sheet',
      onAction: (action) => {
        if (action === 'yes') setMomentumCharId(spike.characterId)
        dismissSuggestion(spike.characterId)
      },
    })
  })
  // Dormant thread alerts
  dormantThreadAlerts.forEach(alert => {
    pauseSuggestions.push({
      text: `🕸 "${alert.title}" hasn't appeared in ${alert.dormancyCount} scenes`,
      yesLabel: 'View Thread',
      onAction: (action) => {
        if (action === 'yes') navigate(`/projects/${projectId}/threads`)
        setDormantThreadAlerts(prev => prev.filter(a => a.id !== alert.id))
      },
    })
  })
  // New thread suggestions from Claude
  pendingThreadSuggestions.forEach((suggestion, i) => {
    pauseSuggestions.push({
      text: `🧵 New thread detected: "${suggestion.title}"`,
      yesLabel: 'Track It',
      onAction: (action) => {
        if (action === 'yes') {
          setThreadPrefill(suggestion)
          setShowAddThread(true)
        }
        setPendingThreadSuggestions(prev => prev.filter((_, idx) => idx !== i))
      },
    })
  })
  // Developmental edit structural notes
  devEditSuggestions.forEach(finding => {
    pauseSuggestions.push({
      text: `📖 Structural note: ${finding.message}. ${finding.suggestion}`,
      yesLabel: 'View Details',
      laterLabel: 'Dismiss',
      neverLabel: 'Never check this',
      onAction: (action) => {
        if (action === 'yes') setDevEditFinding(finding)
        else if (action === 'later') devEditDismiss(finding.id)
        else if (action === 'never') devEditNever(finding.type)
      },
    })
  })

  const handleSaveStatusChange = useCallback((status) => {
    setSaveStatus(status)
    if (status === 'saved' && ms.structure && characters.length > 0) {
      triggerAnalysis(ms.structure, characters)
    }
    if (status === 'saved' && ms.structure) {
      devEditOnSceneSaved(ms.structure)
    }
    if (status === 'saved' && ms.activeSceneId && !threadEngineRunning.current) {
      threadEngineRunning.current = true
      const sceneContent = ms.activeSceneContent?.content ?? ''
      runThreadAnalysis({
        projectId,
        sceneId: ms.activeSceneId,
        sceneHtml: sceneContent,
        structure: ms.structure,
        threads,
        updateThread,
      }).then(({ suggestedThreads, dormantAlerts }) => {
        if (suggestedThreads?.length) setPendingThreadSuggestions(suggestedThreads)
        if (dormantAlerts?.length)    setDormantThreadAlerts(dormantAlerts)
      }).catch(() => {}).finally(() => { threadEngineRunning.current = false })
    }
  }, [ms.structure, ms.activeSceneId, ms.activeSceneContent, characters, triggerAnalysis, threads, updateThread, projectId])

  if (ms.loading) return <LoadingSpinner fullscreen />
  if (ms.error)   return (
    <div className="min-h-screen bg-axiom-bg flex items-center justify-center text-red-400">
      {ms.error}
    </div>
  )

  const SaveIndicator = () => {
    if (saveStatus === 'saving')  return <span className="text-slate-500 text-xs flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Saving…</span>
    if (saveStatus === 'unsaved') return <span className="text-slate-600 text-xs">Unsaved changes</span>
    if (saveStatus === 'error')   return <span className="text-red-500 text-xs">Save failed</span>
    return <span className="text-slate-600 text-xs">Saved</span>
  }

  return (
    <div className="project-detail-root flex flex-col h-screen overflow-hidden bg-axiom-bg">

      {/* ── Writing environment theme panels (fixed, behind everything) ── */}
      <ThemeBackground />

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header className={`
        project-detail-header
        flex items-center h-12 px-2 md:px-4 gap-1
        bg-axiom-surface border-b border-axiom-border flex-shrink-0
        transition-opacity duration-400
        ${focusMode ? 'focus-mode-dim' : ''}
      `}>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => navigate('/projects')}
            className="btn-icon flex-shrink-0"
            title="Back to Projects"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="hidden sm:block">
            <h1 className="font-serif font-semibold text-slate-100 text-sm truncate max-w-[120px]">
              {ms.project?.title ?? '…'}
            </h1>
            {ms.project?.seriesName && (
              <p className="text-xs text-slate-600 truncate max-w-[120px]">{ms.project.seriesName}</p>
            )}
          </div>
        </div>

        {/* Scrollable nav — overflow stays inside this child, not the header, so dropdowns aren't clipped */}
        <div className="flex items-center gap-2 overflow-x-auto flex-1 min-w-0 [&::-webkit-scrollbar]:hidden">
          <LayoutSelector activeLayout={activeLayout} onSelect={setActiveLayout} />
          <div className="w-px h-4 bg-axiom-border mx-1" />
          <SaveIndicator />
          <div className="w-px h-4 bg-axiom-border mx-1" />
          <button
            onClick={() => { setShowCharPanel(p => !p); setQuickRefChar(null) }}
            className={`btn-ghost text-xs flex items-center gap-1.5 ${showCharPanel ? 'text-gold-400' : ''}`}
            title="Character quick reference"
          >
            <Users className="w-3.5 h-3.5" />
            Characters
          </button>
          <button
            onClick={() => navigate(`/projects/${projectId}/threads`)}
            className="btn-ghost text-xs flex items-center gap-1.5"
            title="Plot Threads"
          >
            <GitBranch className="w-3.5 h-3.5" />
            Threads
          </button>
          <button
            onClick={() => devEditScanning ? null : devEditRunManualScan(ms.structure)}
            className={`btn-ghost text-xs flex items-center gap-1.5 ${devEditScanning ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={devEditHealthScore != null ? `Structural health: ${devEditHealthScore}/100` : 'Run structural check'}
          >
            {devEditScanning
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <ClipboardCheck className="w-3.5 h-3.5" />}
            Structure
            {devEditHealthScore != null && (
              <span className={`text-[10px] font-semibold ${devEditHealthScore >= 85 ? 'text-teal-400' : devEditHealthScore >= 60 ? 'text-gold-400' : 'text-red-400'}`}>
                {devEditHealthScore}
              </span>
            )}
          </button>
          <button
            onClick={() => navigate(`/projects/${projectId}/map`)}
            className="btn-ghost text-xs flex items-center gap-1.5"
            title="World Map"
          >
            <Globe className="w-3.5 h-3.5" />
            Map
          </button>
          <button
            onClick={() => navigate(`/projects/${projectId}/cover`)}
            className="btn-ghost text-xs flex items-center gap-1.5"
            title="Cover Studio"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Cover
          </button>
          <button
            onClick={() => navigate(`/projects/${projectId}/publish`)}
            className="btn-ghost text-xs flex items-center gap-1.5"
            title="Export for Publishing"
          >
            <Rocket className="w-3.5 h-3.5" />
            Publish
          </button>
          <button
            onClick={() => navigate(`/projects/${projectId}/lore`)}
            className="btn-ghost text-xs flex items-center gap-1.5"
            title="Lore Bible"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Lore Bible
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="btn-ghost text-xs flex items-center gap-1.5"
            title="Import .docx"
          >
            <Upload className="w-3.5 h-3.5" />
            Import
          </button>
          <button
            onClick={() => setShowExport(true)}
            className="btn-ghost text-xs flex items-center gap-1.5"
            title="Export to .docx"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
          <button
            onClick={() => setFocusMode(p => !p)}
            className={`btn-icon ${focusMode ? 'text-gold-400' : ''}`}
            title="Focus mode (Esc to exit)"
          >
            <Focus className="w-4 h-4" />
          </button>
          <button
            onClick={toggleTheme}
            className="btn-icon"
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark'
              ? <Sun  className="w-4 h-4 text-gold-400" />
              : <Moon className="w-4 h-4 text-gold-500" />
            }
          </button>
          {/* Writing environment theme selector */}
          <button
            onClick={() => setShowThemeSelector(p => !p)}
            className="btn-icon"
            title="Writing environment"
            style={writingTheme.id !== 'none' ? { color: `rgba(${writingTheme.accentRgb},0.9)` } : {}}
          >
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────────────────── */}

      {/* Non-linear layout views */}
      {activeLayout === 'grid' && (
        <ScenesGridLayout
          structure={ms.structure}
          characters={characters}
          onOpenScene={openSceneFromLayout}
          projectId={projectId}
        />
      )}
      {activeLayout === 'threads' && (
        <ThreadsLayout
          structure={ms.structure}
          onOpenScene={openSceneFromLayout}
        />
      )}
      {activeLayout === 'corkboard' && (
        <CorkboardLayout
          structure={ms.structure}
          onOpenScene={openSceneFromLayout}
        />
      )}
      {activeLayout === 'timeline' && (
        <TimelineLayout
          structure={ms.structure}
          characters={characters}
          onOpenScene={openSceneFromLayout}
        />
      )}

      {/* Linear layout (default) — use inline style so display:none always beats display:flex */}
      <div
        className="flex flex-1 overflow-hidden"
        style={{ display: activeLayout !== 'linear' ? 'none' : undefined }}
      >

        {/* Manuscript sidebar — hidden on mobile when closed */}
        <div className={`manuscript-sidebar-wrap transition-all duration-300 flex-shrink-0
          ${focusMode ? 'focus-mode-dim' : ''}
          ${sidebarOpen ? 'w-[240px]' : 'w-0'}
          ${sidebarOpen ? 'block' : 'hidden md:block'}
        `}>
          <ManuscriptSidebar
            structure={ms.structure}
            activeSceneId={ms.activeSceneId}
            projectId={projectId}
            onSceneClick={ms.loadScene}
            onAddChapter={ms.addChapter}
            onAddPart={ms.addPart}
            onAddScene={ms.addScene}
            onRenameChapter={ms.renameChapter}
            onRenamePart={ms.renamePart}
            onRenameScene={(sceneId, title) => ms.updateSceneMeta(sceneId, { title })}
            onDeleteScene={ms.deleteScene}
            onDeleteChapter={ms.deleteChapter}
            onReorderScenes={ms.reorderScenes}
            onReorderChapters={ms.reorderChapters}
            onToggle={() => setSidebarOpen(p => !p)}
            isOpen={sidebarOpen}
          />
        </div>

        {/* Editor area */}
        <div className="flex-1 flex overflow-hidden">
          {ms.activeSceneId ? (
            <SceneEditor
              ref={editorRef}
              key={ms.activeSceneId}
              sceneId={ms.activeSceneId}
              sceneMeta={activeMeta}
              initialContent={ms.activeSceneContent?.content ?? ''}
              sceneLoading={ms.sceneLoading}
              focusMode={focusMode}
              onFocusExit={() => setFocusMode(false)}
              onSave={ms.saveSceneContent}
              onSaveStatusChange={handleSaveStatusChange}
              onUpdateMeta={ms.updateSceneMeta}
              loreTerms={loreTerms}
              onCreateLoreEntry={(term) => navigate(`/projects/${projectId}/lore?new=${encodeURIComponent(term)}`)}
              onToggleComposer={() => setShowComposer(p => !p)}
              composerActive={showComposer}
              onActivity={markActivity}
              characters={characters}
              threads={threads}
              onLinkThread={(threadId) => {
                const current = activeMeta?.linkedThreadIds || []
                if (!current.includes(threadId)) {
                  ms.updateSceneMeta(ms.activeSceneId, { linkedThreadIds: [...current, threadId] })
                  linkScene(threadId, ms.activeSceneId)
                }
              }}
              onUnlinkThread={(threadId) => {
                const current = activeMeta?.linkedThreadIds || []
                ms.updateSceneMeta(ms.activeSceneId, { linkedThreadIds: current.filter(id => id !== threadId) })
                unlinkScene(threadId, ms.activeSceneId)
              }}
            />
          ) : (
            <EmptyEditorState
              hasSidebar={sidebarOpen}
              onToggleSidebar={() => setSidebarOpen(true)}
            />
          )}

          {/* Composer panel */}
          {showComposer && ms.activeSceneId && (
            <ComposerPanel
              projectId={projectId}
              activeSceneId={ms.activeSceneId}
              structure={ms.structure}
              loreEntries={loreEntries}
              characters={characters}
              editorRef={editorRef}
              onClose={() => setShowComposer(false)}
            />
          )}
        </div>

        {/* Character quick-reference panel */}
        {showCharPanel && (
          <div className={`w-[220px] flex-shrink-0 border-l border-axiom-border flex flex-col relative ${focusMode ? 'focus-mode-dim' : ''}`}>
            {/* Panel header */}
            <div className="px-3 py-2.5 border-b border-axiom-border flex items-center justify-between flex-shrink-0">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cast</span>
              <button
                onClick={() => navigate(`/projects/${projectId}/characters`)}
                className="p-1 text-slate-600 hover:text-gold-400 transition-colors"
                title="Open full character list"
              >
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {/* Search */}
            <div className="px-2 py-2 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-600" />
                <input
                  type="text"
                  value={charSearch}
                  onChange={e => setCharSearch(e.target.value)}
                  placeholder="Search…"
                  className="input-base pl-7 py-1.5 text-xs"
                />
              </div>
            </div>

            {/* Character list */}
            <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
              {characters
                .filter(c => !charSearch || c.name?.toLowerCase().includes(charSearch.toLowerCase()))
                .map(char => {
                  const ac = AVATAR_COLORS[char.role] ?? AVATAR_COLORS.supporting
                  const initials = (char.name || '?').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
                  const isActive = quickRefChar?.id === char.id
                  return (
                    <button
                      key={char.id}
                      ref={isActive ? quickRefAnchor : null}
                      onClick={() => setQuickRefChar(isActive ? null : char)}
                      className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left transition-all ${
                        isActive
                          ? 'bg-gold-500/10 border border-gold-500/20'
                          : 'hover:bg-axiom-surface2 border border-transparent'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0 overflow-hidden ${ac.bg} ${ac.border}`}>
                        {char.photoUrl
                          ? <img src={char.photoUrl} alt={char.name} className="w-full h-full object-cover" />
                          : <span className={`text-[10px] font-bold font-serif ${ac.text}`}>{initials}</span>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-300 truncate">{char.name || 'Unnamed'}</p>
                        <p className={`text-[10px] ${ROLE_OPTIONS.find(r => r.value === char.role)?.color ?? 'text-slate-600'}`}>
                          {ROLE_OPTIONS.find(r => r.value === char.role)?.label ?? 'Character'}
                        </p>
                      </div>
                    </button>
                  )
                })}
              {characters.length === 0 && (
                <p className="text-xs text-slate-700 text-center py-4">No characters yet</p>
              )}
            </div>

            {/* QuickRef popup — positioned above the selected item */}
            {quickRefChar && (
              <div className="absolute right-full top-0 mr-2 bottom-0 flex items-start pt-12 pointer-events-none">
                <div className="pointer-events-auto">
                  <CharacterQuickRef
                    character={quickRefChar}
                    onClose={() => setQuickRefChar(null)}
                    anchorRef={quickRefAnchor}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Momentum spike — character sheet slide-in panel */}
        {momentumCharId && (
          <CharacterSheetPanel
            characterId={momentumCharId}
            onClose={() => setMomentumCharId(null)}
          />
        )}

        {/* Dev edit — structural finding detail panel */}
        {devEditFinding && (
          <DevEditDetailPanel
            finding={devEditFinding}
            onClose={() => setDevEditFinding(null)}
            onDismiss={() => { devEditDismiss(devEditFinding.id); setDevEditFinding(null) }}
            onNeverCheck={() => { devEditNever(devEditFinding.type); setDevEditFinding(null) }}
          />
        )}
      </div>

      {/* Writing environment theme selector drawer */}
      <ThemeSelector
        open={showThemeSelector}
        onClose={() => setShowThemeSelector(false)}
      />

      {showImport && (
        <ImportDocxModal
          projectId={projectId}
          projectTitle={ms.project?.title}
          onClose={() => setShowImport(false)}
          onImported={ms.importStructure}
        />
      )}

      {showExport && (
        <ExportDocxModal
          project={ms.project}
          structure={ms.structure}
          projectId={projectId}
          onClose={() => setShowExport(false)}
        />
      )}

      <PauseDetectionBar
        isPaused={isPaused && !!ms.activeSceneId && !showComposer}
        suggestions={pauseSuggestions}
        onDismiss={() => {}}
      />

      {showAddThread && (
        <AddThreadModal
          structure={ms.structure}
          prefill={threadPrefill}
          onClose={() => { setShowAddThread(false); setThreadPrefill(null) }}
          onCreate={async (data) => {
            await createThread(data)
            setShowAddThread(false)
            setThreadPrefill(null)
          }}
        />
      )}
    </div>
  )
}

function EmptyEditorState({ hasSidebar, onToggleSidebar }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-600">
      {!hasSidebar && (
        <button onClick={onToggleSidebar} className="btn-ghost text-xs mb-6">
          Show manuscript
        </button>
      )}
      <p className="font-serif text-lg text-slate-500 mb-1">Select a scene to begin writing</p>
      <p className="text-sm text-slate-700">Choose a scene from the sidebar, or add a new one.</p>
    </div>
  )
}
