import React, { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuth } from '../../contexts/AuthContext'
import {
  LayoutDashboard, BookOpen, Feather, Settings, LogOut,
  ChevronLeft, ChevronRight, HelpCircle, PenLine, Users,
  Compass, GitBranch, Globe, FolderOpen, Loader2,
} from 'lucide-react'
import Codex from './Codex'
import { usePickUpThread } from '../../hooks/usePickUpThread'

/**
 * App sidebar — writer's den panel.
 *
 * IA (inspired by Scrivener binder + Campfire modules + Ulysses library):
 *   Library     → Dashboard, Projects
 *   Writing Desk → project-scoped craft tools (Write, Story, World)
 *   Recent      → last manuscripts
 *   Continue    → pick up a live thread
 *   Footer      → Settings, Codex, Sign out, identity
 */
export default function Sidebar({ collapsed, onToggle, onClose }) {
  const { currentUser, userProfile, logout } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [loggingOut,        setLoggingOut]        = useState(false)
  const [showCodex,         setShowCodex]         = useState(false)
  const [recentProjects,    setRecentProjects]    = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState(null)

  useEffect(() => {
    if (!currentUser) return
    const q = query(
      collection(db, 'projects'),
      where('userId', '==', currentUser.uid),
      orderBy('updatedAt', 'desc'),
      limit(4),
    )
    const unsub = onSnapshot(q, snap => {
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(p => p.status !== 'archived' && p.status !== 'trashed')
        .slice(0, 4)
      setRecentProjects(list)
      setSelectedProjectId(prev => prev ?? list[0]?.id ?? null)
    })
    return unsub
  }, [currentUser])

  const selectedProject = recentProjects.find(p => p.id === selectedProjectId) ?? null
  const { threads: liveThreads, loading: threadsLoading } = usePickUpThread(
    selectedProjectId,
    selectedProject?.structure ?? null,
  )

  async function handleLogout() {
    setLoggingOut(true)
    try { await logout(); navigate('/login') }
    finally { setLoggingOut(false) }
  }

  function handleNavClick() { onClose?.() }

  const displayName = userProfile?.displayName || currentUser?.displayName || 'Writer'
  const email       = currentUser?.email || ''
  const maskedEmail = (() => {
    if (!email.includes('@')) return ''
    const [local, domain] = email.split('@')
    const head = local.slice(0, Math.min(2, local.length))
    return `${head}${'•'.repeat(Math.max(3, local.length - head.length))}@${domain}`
  })()
  const initials = displayName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  const deskId   = recentProjects[0]?.id ?? null

  const libraryItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
    { to: '/projects',  icon: BookOpen,        label: 'Library' },
  ]

  // Project desk tools — grouped like Campfire modules, one click from the den
  const deskItems = deskId ? [
    {
      section: 'Write',
      items: [
        { to: `/projects/${deskId}`, icon: PenLine, label: 'Manuscript', match: p => p === `/projects/${deskId}` },
      ],
    },
    {
      section: 'Story',
      items: [
        { to: `/projects/${deskId}/characters`, icon: Users,     label: 'Characters' },
        { to: `/projects/${deskId}/threads`,    icon: GitBranch, label: 'Threads' },
      ],
    },
    {
      section: 'World',
      items: [
        { to: `/projects/${deskId}/lore`, icon: Compass, label: 'Lore Bible' },
        { to: `/projects/${deskId}/map`,  icon: Globe,   label: 'World Map' },
      ],
    },
  ] : null

  return (
    <aside
      className={`
        den-sidebar relative flex flex-col h-full flex-shrink-0
        transition-all duration-300 ease-out
        ${collapsed ? 'w-[68px]' : 'w-[272px]'}
      `}
    >
      {/* Soft wood/marble grain veil */}
      <div className="den-sidebar-grain pointer-events-none absolute inset-0" aria-hidden="true" />

      {/* ── Brand ─────────────────────────────────────────────────────── */}
      <div className={`relative flex items-center h-14 px-3.5 flex-shrink-0 den-sidebar-header ${collapsed ? 'justify-center' : 'gap-3'}`}>
        <div className="den-mark w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0">
          <Feather className="w-4 h-4 text-gold-400" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden min-w-0">
            <p className="font-serif text-[17px] font-semibold leading-tight tracking-tight whitespace-nowrap" style={{ color: 'var(--axiom-text)' }}>
              Axiom
            </p>
            <p className="text-[10px] leading-tight tracking-wide whitespace-nowrap" style={{ color: 'var(--axiom-muted)' }}>
              The writer's den
            </p>
          </div>
        )}
      </div>

      {/* ── Scrollable body ───────────────────────────────────────────── */}
      <div className="relative flex-1 overflow-y-auto overflow-x-hidden den-scrollbar">

        {/* Library */}
        <section className={`${collapsed ? 'px-2 pt-3' : 'px-3 pt-2 pb-1'}`}>
          {!collapsed && <SectionLabel>Library</SectionLabel>}
          <nav className={`space-y-0.5 ${!collapsed ? 'mt-1.5' : 'mt-1'}`}>
            {libraryItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={handleNavClick}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `nav-item den-nav-item ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-0' : ''}`
                }
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && <span className="text-sm">{item.label}</span>}
              </NavLink>
            ))}
          </nav>
        </section>

        {/* Writing Desk — project-scoped craft tools */}
        {deskItems && (
          <>
            <div className="den-rule mx-3 my-2.5" />
            <section className={`${collapsed ? 'px-2' : 'px-3 pb-1'}`}>
              {!collapsed && (
                <div className="flex items-center justify-between mb-1.5 px-1">
                  <SectionLabel>Writing Desk</SectionLabel>
                  {recentProjects[0]?.title && (
                    <span className="text-[9px] font-medium truncate max-w-[110px]" style={{ color: 'var(--axiom-muted)' }} title={recentProjects[0].title}>
                      {recentProjects[0].title}
                    </span>
                  )}
                </div>
              )}
              <nav className="space-y-0.5">
                {deskItems.map(group => (
                  <div key={group.section} className={!collapsed ? 'mb-1' : ''}>
                    {!collapsed && (
                      <p className="text-[9px] font-semibold uppercase tracking-[0.14em] px-3 pt-1.5 pb-0.5" style={{ color: 'var(--axiom-muted)', opacity: 0.7 }}>
                        {group.section}
                      </p>
                    )}
                    {group.items.map(item => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={!!item.match}
                        onClick={handleNavClick}
                        title={collapsed ? item.label : undefined}
                        className={({ isActive }) => {
                          const active = item.match ? item.match(location.pathname) : isActive
                          return `nav-item den-nav-item ${active ? 'active' : ''} ${collapsed ? 'justify-center px-0' : ''}`
                        }}
                      >
                        <item.icon className="w-4 h-4 flex-shrink-0" />
                        {!collapsed && <span className="text-sm">{item.label}</span>}
                      </NavLink>
                    ))}
                  </div>
                ))}
              </nav>
            </section>
          </>
        )}

        {/* Empty desk — no projects yet */}
        {!deskId && !collapsed && (
          <>
            <div className="den-rule mx-3 my-2.5" />
            <section className="px-3 pb-2">
              <SectionLabel>Writing Desk</SectionLabel>
              <p className="mt-2 px-1 text-[11px] leading-relaxed" style={{ color: 'var(--axiom-muted)' }}>
                Open a manuscript to unlock characters, lore, and threads here.
              </p>
              <NavLink
                to="/projects"
                onClick={handleNavClick}
                className="nav-item den-nav-item mt-2"
              >
                <BookOpen className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">Start a project</span>
              </NavLink>
            </section>
          </>
        )}

        {/* Recent manuscripts */}
        {!collapsed && recentProjects.length > 0 && (
          <>
            <div className="den-rule mx-3 my-2.5" />
            <section className="px-3 pb-2">
              <SectionLabel>Recent</SectionLabel>
              <div className="space-y-0.5 mt-1.5">
                {recentProjects.map(project => (
                  <RecentProjectItem
                    key={project.id}
                    project={project}
                    onClick={() => { navigate(`/projects/${project.id}`); onClose?.() }}
                  />
                ))}
              </div>
            </section>
          </>
        )}

        {/* Continue — pick up a thread */}
        {!collapsed && (
          <>
            <div className="den-rule mx-3 my-2.5" />
            <section className="px-3 pb-4">
              <div className="flex items-center justify-between mb-2">
                <SectionLabel>Continue</SectionLabel>
                {threadsLoading && (
                  <Loader2 className="w-3 h-3 animate-spin" style={{ color: 'var(--axiom-muted)' }} />
                )}
              </div>

              {recentProjects.length > 1 && (
                <div className="flex gap-1 mb-2.5 flex-wrap">
                  {recentProjects.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProjectId(p.id)}
                      className="den-chip"
                      data-active={p.id === selectedProjectId ? 'true' : 'false'}
                      title={p.title}
                    >
                      {p.title?.length > 10 ? p.title.slice(0, 9) + '…' : p.title}
                    </button>
                  ))}
                </div>
              )}

              {!threadsLoading && liveThreads.length > 0 && (
                <div className="space-y-1.5">
                  {liveThreads.map(thread => (
                    <ThreadCard
                      key={thread.type}
                      thread={thread}
                      onClick={() => { navigate(thread.href, thread.state ? { state: thread.state } : undefined); onClose?.() }}
                    />
                  ))}
                </div>
              )}

              {!threadsLoading && liveThreads.length === 0 && (
                <div className="space-y-1.5">
                  {(selectedProjectId ? [
                    { label: 'Write first scene',  icon: PenLine,   href: `/projects/${selectedProjectId}`,            accentRgb: '201,168,76'  },
                    { label: 'Build your world',   icon: Compass,   href: `/projects/${selectedProjectId}/lore`,       accentRgb: '45,212,191'  },
                    { label: 'Create a character', icon: Users,     href: `/projects/${selectedProjectId}/characters`, accentRgb: '158,125,212' },
                    { label: 'Start a thread',     icon: GitBranch, href: `/projects/${selectedProjectId}/threads`,    accentRgb: '249,115,22'  },
                  ] : [
                    { label: 'Start a project',    icon: BookOpen,  href: '/projects', accentRgb: '201,168,76'  },
                    { label: 'Build your world',   icon: Compass,   href: '/projects', accentRgb: '45,212,191'  },
                    { label: 'Create a character', icon: Users,     href: '/projects', accentRgb: '158,125,212' },
                    { label: 'Begin writing',      icon: PenLine,   href: '/projects', accentRgb: '249,115,22'  },
                  ]).map(item => (
                    <EmptyStateCard
                      key={item.label}
                      item={item}
                      onClick={() => { navigate(item.href); onClose?.() }}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <div className="relative den-sidebar-footer">
        <nav className={`px-2 pt-2 space-y-0.5 ${collapsed ? 'pb-2' : 'pb-1'}`}>
          <NavLink
            to="/settings"
            onClick={handleNavClick}
            title={collapsed ? 'Settings' : undefined}
            className={({ isActive }) =>
              `nav-item den-nav-item ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-0' : ''}`
            }
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span className="text-sm">Settings</span>}
          </NavLink>

          <button
            onClick={() => setShowCodex(true)}
            title={collapsed ? 'Codex' : undefined}
            className={`nav-item den-nav-item w-full ${collapsed ? 'justify-center px-0' : ''}`}
          >
            <HelpCircle className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span className="text-sm">Codex</span>}
          </button>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            title={collapsed ? 'Sign Out' : undefined}
            className={`nav-item den-nav-item w-full hover:!text-red-400 hover:!bg-red-900/10 ${collapsed ? 'justify-center px-0' : ''}`}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span className="text-sm">Sign Out</span>}
          </button>
        </nav>

        <div className={`px-2 pb-3 ${collapsed ? 'flex justify-center' : ''}`}>
          <NavLink
            to="/profile"
            onClick={handleNavClick}
            title={collapsed ? displayName : undefined}
            className={`den-user-card flex items-center gap-2.5 p-2 rounded-xl transition-all duration-200 ${collapsed ? 'justify-center' : ''}`}
          >
            <UserAvatar initials={initials} />
            {!collapsed && (
              <div className="overflow-hidden flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--axiom-text)' }}>{displayName}</p>
                <p className="text-[11px] truncate" style={{ color: 'var(--axiom-muted)' }}>{maskedEmail}</p>
              </div>
            )}
          </NavLink>
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="den-collapse-btn hidden md:flex absolute -right-3 top-[4.5rem] w-6 h-6 rounded-full items-center justify-center z-10"
        style={{ color: 'var(--axiom-muted)' }}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed
          ? <ChevronRight className="w-3 h-3" />
          : <ChevronLeft  className="w-3 h-3" />
        }
      </button>

      {showCodex && <Codex onClose={() => setShowCodex(false)} />}
    </aside>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] px-1" style={{ color: 'var(--axiom-muted)' }}>
      {children}
    </p>
  )
}

const THREAD_ICONS = {
  writing:   PenLine,
  world:     Compass,
  character: Users,
  plot:      GitBranch,
}

function ThreadCard({ thread, onClick }) {
  const Icon = THREAD_ICONS[thread.type] ?? PenLine
  return (
    <button
      onClick={onClick}
      className="den-thread-card w-full text-left rounded-xl px-2.5 py-2 transition-all duration-200"
      style={{
        background: `rgba(${thread.accentRgb},0.05)`,
        border: `1px solid rgba(${thread.accentRgb},0.14)`,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = `rgba(${thread.accentRgb},0.1)`
        e.currentTarget.style.borderColor = `rgba(${thread.accentRgb},0.28)`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = `rgba(${thread.accentRgb},0.05)`
        e.currentTarget.style.borderColor = `rgba(${thread.accentRgb},0.14)`
      }}
    >
      <div className="flex items-start gap-2">
        <div
          className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: `rgba(${thread.accentRgb},0.15)` }}
        >
          <Icon className="w-3 h-3" style={{ color: `rgba(${thread.accentRgb},1)` }} />
        </div>
        <div className="min-w-0 flex-1">
          <span
            className="text-[9px] font-semibold uppercase tracking-widest"
            style={{ color: `rgba(${thread.accentRgb},0.75)` }}
          >
            {thread.category}
          </span>
          <p className="text-xs font-medium leading-tight truncate mt-0.5" style={{ color: 'var(--axiom-text)' }}>
            {thread.title}
          </p>
          <p className="text-[10px] mt-0.5 leading-tight" style={{ color: 'var(--axiom-muted)' }}>
            {thread.context}
          </p>
          <p className="text-[10px] font-medium mt-1.5" style={{ color: `rgba(${thread.accentRgb},0.9)` }}>
            → {thread.cta}
          </p>
        </div>
      </div>
    </button>
  )
}

function EmptyStateCard({ item, onClick }) {
  const Icon = item.icon
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl px-2.5 py-2 transition-all duration-200"
      style={{
        background: `rgba(${item.accentRgb},0.03)`,
        border: `1px solid rgba(${item.accentRgb},0.1)`,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = `rgba(${item.accentRgb},0.08)`
        e.currentTarget.style.borderColor = `rgba(${item.accentRgb},0.22)`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = `rgba(${item.accentRgb},0.03)`
        e.currentTarget.style.borderColor = `rgba(${item.accentRgb},0.1)`
      }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ background: `rgba(${item.accentRgb},0.1)` }}
        >
          <Icon className="w-3 h-3" style={{ color: `rgba(${item.accentRgb},0.75)` }} />
        </div>
        <p className="text-xs font-medium" style={{ color: 'var(--axiom-muted)' }}>
          {item.label}
        </p>
      </div>
    </button>
  )
}

const BOOK_COLORS = ['#c9a84c', '#2dd4bf', '#9e7dd4', '#f97316', '#38bdf8']

function RecentProjectItem({ project, onClick }) {
  const colorIndex = (project.title?.charCodeAt(0) ?? 0) % BOOK_COLORS.length
  const color = BOOK_COLORS[colorIndex]

  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition-colors duration-150 group"
      onMouseEnter={e => e.currentTarget.style.background = 'var(--axiom-surface2)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div
        className="w-[18px] h-[22px] rounded-[3px] flex-shrink-0 shadow-sm"
        style={{
          background: `linear-gradient(145deg, ${color}33, ${color}18)`,
          border: `1px solid ${color}44`,
          boxShadow: `inset 0 1px 0 ${color}22`,
        }}
      />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium truncate" style={{ color: 'var(--axiom-text)' }}>
          {project.title || 'Untitled'}
        </p>
        {project.genre && (
          <p className="text-[10px] truncate" style={{ color: 'var(--axiom-muted)' }}>
            {project.genre}
          </p>
        )}
      </div>
      <FolderOpen className="w-3 h-3 flex-shrink-0 opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: 'var(--axiom-muted)' }} />
    </button>
  )
}

function UserAvatar({ initials }) {
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-500/35 to-teal-500/25 border border-gold-500/25 flex items-center justify-center flex-shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      <span className="text-xs font-semibold text-gold-400">{initials}</span>
    </div>
  )
}
