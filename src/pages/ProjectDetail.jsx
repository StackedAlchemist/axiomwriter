import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import ComposerPanel from '../components/composer/ComposerPanel'
import PauseDetectionBar from '../components/composer/PauseDetectionBar'
import { usePauseDetection } from '../hooks/usePauseDetection'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Loader2, Users, BookOpen, ExternalLink, Search, GitBranch, X } from 'lucide-react'
import ProjectNav from '../components/layout/ProjectNav'
import StructureScorePanel from '../components/manuscript/StructureScorePanel'
import { useTheme } from '../contexts/ThemeContext'
import { useWritingTheme } from '../contexts/WritingThemeContext'
import ThemeBackground from '../components/theme/ThemeBackground'
import ThemeSelector from '../components/theme/ThemeSelector'
import { useManuscript, findSceneMeta, getAllChapters } from '../hooks/useManuscript'
import { useLore } from '../hooks/useLore'
import { useCharacters, AVATAR_COLORS, ROLE_OPTIONS } from '../hooks/useCharacters'
import ManuscriptSidebar from '../components/manuscript/ManuscriptSidebar'
import SceneEditor from '../components/manuscript/SceneEditor'
import ChapterView from '../components/manuscript/ChapterView'
import ImportDocxModal from '../components/manuscript/ImportDocxModal'
import ExportDocxModal from '../components/manuscript/ExportDocxModal'
import CharacterQuickRef from '../components/characters/CharacterQuickRef'
import LoadingSpinner from '../components/common/LoadingSpinner'
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
import ShareModal from '../components/sharing/ShareModal'
import { useSubscription } from '../hooks/useSubscription'
import PricingModal from '../components/subscription/PricingModal'

export default function ProjectDetail() {
  const { projectId } = useParams()
  const navigate  = useNavigate()
  const location  = useLocation()

  const ms = useManuscript(projectId)
  const { entries: loreEntries } = useLore(projectId)

  const [focusMode,      setFocusMode]      = useState(false)
  const [showImport,     setShowImport]     = useState(false)
  const [showExport,     setShowExport]     = useState(false)
  const [showShare,      setShowShare]      = useState(false)
  const [showPricing,    setShowPricing]    = useState(false)
  const [pricingFeature, setPricingFeature] = useState('')
  const [saveStatus,     setSaveStatus]     = useState('saved')
  const [sidebarOpen,    setSidebarOpen]    = useState(() => typeof window === 'undefined' ? true : window.innerWidth >= 768)
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
  const [devEditFinding,       setDevEditFinding]       = useState(null)
  const [pasteImportText,      setPasteImportText]      = useState(null)
  const [editorTab,            setEditorTab]            = useState('write') // survives scene switches
  const [showStructurePanel,   setShowStructurePanel]   = useState(false)
  const [structurePanelPos,    setStructurePanelPos]    = useState({ left: 0, top: 52 })
  const editorRef        = useRef(null)
  const { markActivity, isPaused } = usePauseDetection()
  const { theme, toggle: toggleTheme } = useTheme()
  const { currentTheme: writingTheme } = useWritingTheme()
  const [showThemeSelector, setShowThemeSelector] = useState(false)
  const { triggerAnalysis, spikeSuggestions, dismissSuggestion } = useMomentumEngine(projectId)
  const { threads, createThread, updateThread, linkScene, unlinkScene } = useThreads(projectId)
  const { canAccess } = useSubscription()
  const {
    suggestions:       devEditSuggestions,
    isScanning:        devEditScanning,
    healthScore:       devEditHealthScore,
    lastScanAt:        devEditLastScanAt,
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

  // Single-panel rule: selecting from the manuscript drawer dismisses it on mobile
  const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 768
  function handleSidebarSceneClick(sceneId) {
    ms.loadScene(sceneId)
    if (isMobile()) setSidebarOpen(false)
  }
  function handleSidebarChapterClick(chapterId) {
    ms.loadChapter(chapterId)
    if (isMobile()) setSidebarOpen(false)
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

  // Close structure panel when clicking outside it
  useEffect(() => {
    if (!showStructurePanel) return
    function handle(e) {
      if (e.target.closest?.('[data-structure-panel]')) return
      setShowStructurePanel(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [showStructurePanel])

  function handleStructureClick() {
    if (devEditScanning) return
    if (showStructurePanel) { setShowStructurePanel(false); return }
    // Anchor near the Story menu cluster (center-right of header)
    const left = Math.min(Math.max(window.innerWidth * 0.35, 16), window.innerWidth - 340)
    setStructurePanelPos({ left, top: 52 })
    setShowStructurePanel(true)
  }

  function handleProjectNavigate(dest) {
    const map = {
      threads:  `/projects/${projectId}/threads`,
      lore:     `/projects/${projectId}/lore`,
      map:      `/projects/${projectId}/map`,
      cover:    `/projects/${projectId}/cover`,
      publish:  `/projects/${projectId}/publish`,
    }
    if (map[dest]) navigate(map[dest])
  }

  function handleGate(feature) {
    setPricingFeature(feature)
    setShowPricing(true)
  }

  if (ms.loading) return <LoadingSpinner fullscreen />
  if (ms.error)   return (
    <div className="min-h-screen bg-axiom-bg flex items-center justify-center text-red-400">
      {ms.error}
    </div>
  )

  return (
    <div className="project-detail-root flex flex-col h-screen overflow-hidden bg-axiom-bg">

      {/* ── Writing environment backdrop (fixed full-viewport, z-0) ── */}
      <ThemeBackground />

      {/* ── Content layer — lifted above the backdrop (z-1) so the
              environment sits behind, not over, the app ── */}
      <div className="project-detail-content relative z-[1] flex flex-col flex-1 min-h-0">

      {/* ── Categorized command bar (Story · World · Publish · Files) ── */}
      <ProjectNav
        projectTitle={ms.project?.title}
        seriesName={ms.project?.seriesName}
        activeLayout={activeLayout}
        focusMode={focusMode}
        theme={theme}
        writingTheme={writingTheme}
        showCharPanel={showCharPanel}
        showStructurePanel={showStructurePanel}
        showThemeSelector={showThemeSelector}
        saveStatus={saveStatus}
        devEditScanning={devEditScanning}
        devEditHealthScore={devEditHealthScore}
        canAccess={canAccess}
        onBack={() => navigate('/projects')}
        onOpenSidebar={() => setSidebarOpen(true)}
        onLayoutSelect={id => {
          if (id !== 'linear' && !canAccess('all_layouts')) {
            handleGate('Editor Layouts')
            return
          }
          setActiveLayout(id)
        }}
        onToggleChars={() => { setShowCharPanel(p => !p); setQuickRefChar(null) }}
        onStructureClick={handleStructureClick}
        onNavigate={handleProjectNavigate}
        onGate={handleGate}
        onImport={() => setShowImport(true)}
        onExport={() => setShowExport(true)}
        onShare={() => setShowShare(true)}
        onToggleFocus={() => setFocusMode(p => !p)}
        onToggleTheme={toggleTheme}
        onToggleEnv={() => setShowThemeSelector(p => !p)}
      />

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

        {/* Mobile drawer backdrop — tap to dismiss (single-panel rule) */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Manuscript sidebar — overlay drawer on mobile, in-flow pane on desktop */}
        <div className={`manuscript-sidebar-wrap flex-shrink-0
          ${focusMode ? 'focus-mode-dim' : ''}
          fixed top-12 bottom-0 left-0 z-40 w-[280px] max-w-[85vw]
          transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:static md:top-auto md:bottom-auto md:z-auto md:max-w-none md:w-auto
          md:translate-x-0 md:transition-[width] md:duration-300
          ${sidebarOpen ? 'md:w-[240px]' : 'md:w-0'}
        `}>
          <ManuscriptSidebar
            structure={ms.structure}
            activeSceneId={ms.activeSceneId}
            activeChapterId={ms.activeChapterId}
            projectId={projectId}
            onSceneClick={handleSidebarSceneClick}
            onChapterClick={handleSidebarChapterClick}
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

        {/* Editor area — grows to fill remaining viewport (border-to-border under the nav) */}
        <div className="flex-1 min-w-0 flex overflow-hidden">
          {ms.activeChapterId && !ms.activeSceneId ? (
            <ChapterView
              chapter={getAllChapters(ms.structure).find(ch => ch.id === ms.activeChapterId)}
              sceneContents={ms.chapterSceneContents}
              loading={ms.chapterLoading}
              onEditScene={ms.loadScene}
              onSaveScene={ms.saveSceneContent}
              onInsertSceneAfter={ms.insertSceneAfter}
              onSaveStatusChange={handleSaveStatusChange}
            />
          ) : ms.activeSceneId ? (
            <SceneEditor
              ref={editorRef}
              key={ms.activeSceneId}
              sceneId={ms.activeSceneId}
              sceneMeta={activeMeta}
              initialContent={ms.activeSceneContent?.content ?? ''}
              sceneLoading={ms.sceneLoading}
              focusMode={focusMode}
              onLargePaste={text => setPasteImportText(text)}
              activeTab={editorTab}
              onTabChange={setEditorTab}
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

        {/* Character quick-reference panel — right overlay on mobile, in-flow pane on desktop */}
        {showCharPanel && (
          <>
            <div
              className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setShowCharPanel(false)}
              aria-hidden="true"
            />
          <div className={`flex flex-col relative bg-axiom-surface border-l border-axiom-border
            fixed top-12 bottom-0 right-0 z-40 w-[280px] max-w-[85vw]
            md:static md:top-auto md:bottom-auto md:z-auto md:w-[220px] md:max-w-none md:flex-shrink-0
            ${focusMode ? 'focus-mode-dim' : ''}`}>
            {/* Panel header */}
            <div className="px-3 py-2.5 border-b border-axiom-border flex items-center justify-between flex-shrink-0">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cast</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => navigate(`/projects/${projectId}/characters`)}
                  className="p-1 text-slate-600 hover:text-gold-400 transition-colors"
                  title="Open full character list"
                >
                  <ExternalLink className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setShowCharPanel(false)}
                  className="p-1 text-slate-600 hover:text-slate-300 transition-colors md:hidden"
                  title="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
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
          </>
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

      {/* ── Structure score panel ── */}
      {showStructurePanel && (
        <div data-structure-panel>
          <StructureScorePanel
            style={{ left: structurePanelPos.left, top: structurePanelPos.top }}
            healthScore={devEditHealthScore}
            isScanning={devEditScanning}
            suggestions={devEditSuggestions}
            lastScanAt={devEditLastScanAt}
            onRunScan={() => { devEditRunManualScan(ms.structure); setShowStructurePanel(false) }}
            onOpenFinding={finding => { setDevEditFinding(finding); setShowStructurePanel(false) }}
            onClose={() => setShowStructurePanel(false)}
          />
        </div>
      )}

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

      {/* Large paste intercepted by the editor → structured import flow */}
      {pasteImportText && (
        <ImportDocxModal
          projectId={projectId}
          projectTitle={ms.project?.title}
          initialText={pasteImportText}
          onClose={() => setPasteImportText(null)}
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

      {showShare && ms.project && (
        <ShareModal
          project={ms.project}
          structure={ms.structure}
          onClose={() => setShowShare(false)}
        />
      )}

      {showPricing && (
        <PricingModal
          onClose={() => setShowPricing(false)}
          highlightFeature={pricingFeature}
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
    </div>
  )
}

function EmptyEditorState({ hasSidebar, onToggleSidebar }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
      {/* Scrim card keeps this readable over any writing-environment backdrop */}
      <div className="px-8 py-6 rounded-2xl bg-black/45 backdrop-blur-sm border border-white/10 shadow-lg">
        {!hasSidebar && (
          <button onClick={onToggleSidebar} className="btn-ghost text-xs mb-4">
            Show manuscript
          </button>
        )}
        <p className="font-serif text-lg text-slate-100 mb-1" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
          Select a scene to begin writing
        </p>
        <p className="text-sm text-slate-300/90" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
          Choose a scene from the sidebar, or add a new one.
        </p>
      </div>
    </div>
  )
}
