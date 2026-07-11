import React from 'react'
import {
  ArrowLeft, Menu, Users, GitBranch, ClipboardCheck, BookOpen,
  Globe, ImageIcon, Rocket, Share2, FolderOpen, Upload, Download,
  Focus, Sun, Moon, Sparkles, Loader2, PenLine,
} from 'lucide-react'
import LayoutSelector from './LayoutSelector'
import NavMenu from './NavMenu'

/**
 * Project command bar — researched IA from Scrivener / Dabble / Campfire / Atticus / Ulysses:
 *
 *   Write  → primary desk (layouts stay adjacent)
 *   Story  → Characters · Threads · Structure
 *   World  → Lore Bible · Map
 *   Publish → Cover · Export · Invite reader
 *   Files  → Import · Export
 *
 * Utilities (focus, theme, environment) stay pinned right so the craft tools
 * never compete with ambient controls.
 */
export default function ProjectNav({
  projectTitle,
  seriesName,
  activeLayout,
  focusMode,
  theme,
  writingTheme,
  showCharPanel,
  showStructurePanel,
  showThemeSelector,
  saveStatus,
  devEditScanning,
  devEditHealthScore,
  canAccess,
  onBack,
  onOpenSidebar,
  onLayoutSelect,
  onToggleChars,
  onStructureClick,
  onNavigate,
  onGate,
  onImport,
  onExport,
  onShare,
  onToggleFocus,
  onToggleTheme,
  onToggleEnv,
}) {
  const structureMeta = devEditHealthScore != null ? String(devEditHealthScore) : null
  const structureTone =
    devEditHealthScore == null ? ''
    : devEditHealthScore >= 85 ? 'text-teal-400'
    : devEditHealthScore >= 60 ? 'text-gold-400'
    : 'text-red-400'

  const storyItems = [
    {
      id: 'characters',
      label: 'Characters',
      description: 'Cast, voice DNA, and relationships',
      icon: Users,
      accentRgb: '158,125,212',
      active: showCharPanel,
      onClick: onToggleChars,
    },
    {
      id: 'threads',
      label: 'Plot Threads',
      description: 'Track arcs and open lines across scenes',
      icon: GitBranch,
      accentRgb: '249,115,22',
      locked: !canAccess('thread_detector'),
      onClick: () => canAccess('thread_detector')
        ? onNavigate('threads')
        : onGate('Thread Detector'),
    },
    {
      id: 'structure',
      label: 'Structure Health',
      description: 'Pacing, POV, dialogue balance, and more',
      icon: ClipboardCheck,
      accentRgb: '45,212,191',
      active: showStructurePanel,
      meta: structureMeta,
      disabled: devEditScanning,
      onClick: onStructureClick,
    },
  ]

  const worldItems = [
    {
      id: 'lore',
      label: 'Lore Bible',
      description: 'Factions, magic, history, and rules',
      icon: BookOpen,
      accentRgb: '45,212,191',
      locked: !canAccess('lore_bible'),
      onClick: () => canAccess('lore_bible')
        ? onNavigate('lore')
        : onGate('Lore Bible'),
    },
    {
      id: 'map',
      label: 'World Map',
      description: 'Visual geography of your setting',
      icon: Globe,
      accentRgb: '56,189,248',
      locked: !canAccess('map_builder'),
      onClick: () => canAccess('map_builder')
        ? onNavigate('map')
        : onGate('World Map Builder'),
    },
  ]

  const publishItems = [
    {
      id: 'cover',
      label: 'Cover Studio',
      description: 'Design your book cover with AI',
      icon: ImageIcon,
      accentRgb: '232,121,249',
      locked: !canAccess('cover_generator'),
      onClick: () => canAccess('cover_generator')
        ? onNavigate('cover')
        : onGate('Cover Studio'),
    },
    {
      id: 'publish',
      label: 'Publish & Export',
      description: 'EPUB, DOCX, PDF for KDP & beyond',
      icon: Rocket,
      accentRgb: '201,168,76',
      locked: !canAccess('publishing_export'),
      onClick: () => canAccess('publishing_export')
        ? onNavigate('publish')
        : onGate('Publishing Export'),
    },
    { divider: true },
    {
      id: 'share',
      label: 'Invite a Reader',
      description: 'Share a read-only manuscript link',
      icon: Share2,
      accentRgb: '45,212,191',
      locked: !canAccess('reader_sharing'),
      onClick: () => canAccess('reader_sharing')
        ? onShare()
        : onGate('Reader Sharing'),
    },
  ]

  const filesItems = [
    {
      id: 'import',
      label: 'Import',
      description: 'Bring in a .docx manuscript',
      icon: Upload,
      accentRgb: '201,168,76',
      onClick: onImport,
    },
    {
      id: 'export',
      label: 'Export',
      description: 'Save as .docx file',
      icon: Download,
      accentRgb: '45,212,191',
      onClick: onExport,
    },
  ]

  return (
    <header
      className={`
        project-detail-header den-chrome
        flex items-center h-12 px-2 md:px-3 gap-1
        flex-shrink-0
        transition-opacity duration-400
        ${focusMode ? 'focus-mode-dim' : ''}
      `}
    >
      {/* Identity cluster */}
      <div className="flex items-center gap-0.5 sm:gap-2 flex-shrink-0 min-w-0">
        {activeLayout === 'linear' && (
          <button
            onClick={onOpenSidebar}
            className="btn-icon flex-shrink-0 md:hidden"
            title="Open manuscript"
            aria-label="Open manuscript"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={onBack}
          className="btn-icon flex-shrink-0"
          title="Back to library"
          aria-label="Back to library"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="hidden sm:flex items-center gap-2 min-w-0 pl-0.5">
          <div className="w-6 h-6 rounded-md bg-gold-500/10 border border-gold-500/20 flex items-center justify-center flex-shrink-0">
            <PenLine className="w-3 h-3 text-gold-400" />
          </div>
          <div className="min-w-0">
            <h1 className="font-serif font-semibold text-sm truncate max-w-[140px] lg:max-w-[200px]" style={{ color: 'var(--axiom-text)' }}>
              {projectTitle ?? '…'}
            </h1>
            {seriesName && (
              <p className="text-[10px] truncate max-w-[140px] lg:max-w-[200px]" style={{ color: 'var(--axiom-muted)' }}>
                {seriesName}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="den-v-rule mx-1 hidden md:block" />

      {/* Primary craft menus */}
      <div className="relative flex-1 min-w-0">
        <div className="flex items-center gap-0.5 overflow-x-auto den-nav-scroll [&::-webkit-scrollbar]:hidden">
          {/* Write — layout is the primary writing-mode switch */}
          <LayoutSelector
            activeLayout={activeLayout}
            locked={!canAccess('all_layouts')}
            onSelect={onLayoutSelect}
          />

          <div className="den-v-rule mx-1 flex-shrink-0" />

          <NavMenu
            label="Story"
            icon={Users}
            title="Story craft — characters, threads, structure"
            active={showCharPanel || showStructurePanel}
            items={storyItems}
          />
          <NavMenu
            label="World"
            icon={Globe}
            title="Worldbuilding — lore bible and map"
            items={worldItems}
          />
          <NavMenu
            label="Publish"
            icon={Rocket}
            title="Publish — cover, export, invite readers"
            items={publishItems}
          />
          <NavMenu
            label="Files"
            icon={FolderOpen}
            title="Import and export your manuscript"
            items={filesItems}
          />

          {/* Structure score chip when known — keeps health ambient without opening menu */}
          {devEditHealthScore != null && (
            <button
              type="button"
              onClick={onStructureClick}
              className={`btn-ghost text-[10px] font-semibold flex-shrink-0 px-2 ${structureTone}`}
              title="Open structure health"
            >
              {devEditScanning
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : structureMeta}
            </button>
          )}
        </div>
      </div>

      {/* Pinned utilities */}
      <div className="flex items-center gap-0.5 flex-shrink-0 pl-1">
        <SaveIndicator status={saveStatus} />
        <div className="den-v-rule mx-0.5 hidden sm:block" />
        <button
          onClick={onToggleFocus}
          className={`btn-icon flex-shrink-0 ${focusMode ? 'text-gold-400' : ''}`}
          title="Focus mode — immerse in the page (Esc to exit)"
          aria-label="Focus mode"
        >
          <Focus className="w-4 h-4" />
        </button>
        <button
          onClick={onToggleTheme}
          className="btn-icon flex-shrink-0"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label="Toggle light/dark"
        >
          {theme === 'dark'
            ? <Sun className="w-4 h-4 text-gold-400" />
            : <Moon className="w-4 h-4 text-gold-500" />
          }
        </button>
        <button
          onClick={onToggleEnv}
          className={`btn-icon flex-shrink-0 ${showThemeSelector ? 'text-gold-400' : ''}`}
          title="Writing environment — set the mood of your den"
          aria-label="Writing environment"
          style={writingTheme?.id !== 'none' ? { color: `rgba(${writingTheme.accentRgb},0.9)` } : {}}
        >
          <Sparkles className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}

function SaveIndicator({ status }) {
  if (status === 'saving') {
    return (
      <span className="hidden sm:flex text-[11px] items-center gap-1.5 px-1.5" style={{ color: 'var(--axiom-muted)' }}>
        <Loader2 className="w-3 h-3 animate-spin" /> Saving
      </span>
    )
  }
  if (status === 'unsaved') {
    return <span className="hidden sm:inline text-[11px] px-1.5" style={{ color: 'var(--axiom-muted)' }}>Unsaved</span>
  }
  if (status === 'error') {
    return <span className="hidden sm:inline text-[11px] text-red-400 px-1.5">Save failed</span>
  }
  return (
    <span className="hidden md:inline text-[11px] px-1.5 opacity-60" style={{ color: 'var(--axiom-muted)' }}>
      Saved
    </span>
  )
}
