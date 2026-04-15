import React, { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuth } from '../../contexts/AuthContext'
import {
  LayoutDashboard, BookOpen, Feather, Settings, User, LogOut,
  ChevronLeft, ChevronRight, HelpCircle, PenLine, Map, Users,
  Compass, Clock, StickyNote, Sparkles, GitBranch, ArrowRight,
  FolderOpen,
} from 'lucide-react'
import Codex from './Codex'

// ── Mock thread data ─────────────────────────────────────────────────────────
// Replace with real activity state when available
const MOCK_THREADS = [
  {
    id: 'writing',
    category: 'Writing',
    title: 'Chapter 6: The Crossing',
    context: 'You stopped mid-scene',
    cta: 'Resume writing',
    accentRgb: '201,168,76',
    icon: PenLine,
  },
  {
    id: 'world',
    category: 'World',
    title: 'Ashen Vale',
    context: 'Referenced in your last draft',
    cta: 'Expand world',
    accentRgb: '45,212,191',
    icon: Compass,
  },
  {
    id: 'character',
    category: 'Character',
    title: 'Elara Voss',
    context: 'Profile incomplete',
    cta: 'Continue character',
    accentRgb: '158,125,212',
    icon: Users,
  },
  {
    id: 'plot',
    category: 'Plot',
    title: 'Act II Turning Point',
    context: 'Open thread unresolved',
    cta: 'Continue plotting',
    accentRgb: '249,115,22',
    icon: GitBranch,
  },
]

// ── Nav items ────────────────────────────────────────────────────────────────
// `to` = routable. Missing `to` = needs project context or not implemented.
// `soon` = show "Soon" badge. `needsProject` = enabled only when recentProjectId exists.
const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects',  icon: BookOpen,        label: 'Projects'  },
  { icon: PenLine,    label: 'Writing Desk', needsProject: true, projectPath: '' },
  { icon: GitBranch,  label: 'Plot Board',   soon: true },
  { icon: Users,      label: 'Characters',   needsProject: true, projectPath: '/characters' },
  { icon: Compass,    label: 'World Bible',  needsProject: true, projectPath: '/lore' },
  { icon: Clock,      label: 'Timeline',     soon: true },
  { icon: StickyNote, label: 'Notes',        soon: true },
  { icon: Sparkles,   label: 'AI Studio',    soon: true },
]

export default function Sidebar({ collapsed, onToggle, onClose }) {
  const { currentUser, userProfile, logout } = useAuth()
  const navigate  = useNavigate()
  const [loggingOut,    setLoggingOut]    = useState(false)
  const [showCodex,     setShowCodex]     = useState(false)
  const [recentProjects, setRecentProjects] = useState([])

  // Fetch up to 4 most-recently-updated projects
  useEffect(() => {
    if (!currentUser) return
    const q = query(
      collection(db, 'projects'),
      where('userId', '==', currentUser.uid),
      where('status', 'in', ['active', null]),
      orderBy('updatedAt', 'desc'),
      limit(4),
    )
    // Firestore 'in' with null won't always work — fall back gracefully
    const q2 = query(
      collection(db, 'projects'),
      where('userId', '==', currentUser.uid),
      orderBy('updatedAt', 'desc'),
      limit(4),
    )
    const unsub = onSnapshot(q2, snap => {
      setRecentProjects(
        snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(p => !p.status || p.status === 'active')
          .slice(0, 4)
      )
    })
    return unsub
  }, [currentUser])

  async function handleLogout() {
    setLoggingOut(true)
    try { await logout(); navigate('/login') }
    finally { setLoggingOut(false) }
  }

  function handleNavClick() { onClose?.() }

  const displayName = userProfile?.displayName || currentUser?.displayName || 'Writer'
  const email       = currentUser?.email || ''
  const initials    = displayName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  const recentProjectId = recentProjects[0]?.id ?? null

  return (
    <aside
      className={`
        relative flex flex-col h-full border-r border-axiom-border flex-shrink-0
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-[64px]' : 'w-[280px]'}
      `}
      style={{ background: 'var(--axiom-surface)' }}
    >

      {/* ── HEADER ───────────────────────────────────────────────────── */}
      <div
        className={`flex items-center h-14 px-4 flex-shrink-0 ${collapsed ? 'justify-center' : 'gap-3'}`}
        style={{ borderBottom: '1px solid var(--axiom-border)' }}
      >
        <div className="w-8 h-8 rounded-lg bg-gold-500/10 border border-gold-500/20 flex items-center justify-center flex-shrink-0">
          <Feather className="w-4 h-4 text-gold-400" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden min-w-0">
            <p className="font-serif text-base font-semibold leading-tight whitespace-nowrap" style={{ color: 'var(--axiom-text)' }}>
              Axiom
            </p>
            <p className="text-[10px] leading-tight whitespace-nowrap" style={{ color: 'var(--axiom-muted)' }}>
              Your writing command center
            </p>
          </div>
        )}
      </div>

      {/* ── SCROLLABLE BODY ──────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">

        {/* ── NAVIGATE ───────────────────────────────────────────────── */}
        <section className={`${collapsed ? 'px-2 pt-3' : 'px-3 pt-1 pb-2'}`}>
          {!collapsed && <SectionLabel>Navigate</SectionLabel>}
          <nav className={`space-y-0.5 ${!collapsed ? 'mt-2' : 'mt-1'}`}>
            {NAV_ITEMS.map(item => {
              // Fully routable items
              if (item.to) {
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={handleNavClick}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      `nav-item ${isActive ? 'active' : ''} ${collapsed ? 'justify-center' : ''}`
                    }
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    {!collapsed && <span className="text-sm">{item.label}</span>}
                  </NavLink>
                )
              }

              // Items that need a project context
              if (item.needsProject) {
                const href = recentProjectId ? `/projects/${recentProjectId}${item.projectPath}` : null
                if (href) {
                  return (
                    <NavLink
                      key={item.label}
                      to={href}
                      onClick={handleNavClick}
                      title={collapsed ? item.label : undefined}
                      className={({ isActive }) =>
                        `nav-item ${isActive ? 'active' : ''} ${collapsed ? 'justify-center' : ''}`
                      }
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      {!collapsed && <span className="text-sm">{item.label}</span>}
                    </NavLink>
                  )
                }
                // No project yet — disabled
                return (
                  <DisabledNavItem key={item.label} item={item} collapsed={collapsed} badge="No project" />
                )
              }

              // Coming soon items
              return (
                <DisabledNavItem key={item.label} item={item} collapsed={collapsed} badge="Soon" />
              )
            })}
          </nav>
        </section>

        {/* ── RECENT PROJECTS ──────────────────────────────────────────── */}
        {!collapsed && recentProjects.length > 0 && (
          <>
            <div className="mx-3 my-2" style={{ height: 1, background: 'var(--axiom-border)' }} />
            <section className="px-3 pb-3">
              <SectionLabel>Recent Projects</SectionLabel>
              <div className="space-y-0.5 mt-2">
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

        {/* ── PICK UP A THREAD ───────────────────────────────────────── */}
        {!collapsed && (
          <>
            <div className="mx-3 my-2" style={{ height: 1, background: 'var(--axiom-border)' }} />
            <section className="px-3 pb-4">
              <SectionLabel>Pick up a thread</SectionLabel>
              <div className="space-y-1.5 mt-2">
                {MOCK_THREADS.map(thread => (
                  <ThreadCard key={thread.id} thread={thread} />
                ))}
              </div>
            </section>
          </>
        )}
      </div>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid var(--axiom-border)' }}>
        {/* Settings */}
        <nav className={`px-2 pt-2 space-y-0.5 ${collapsed ? 'pb-2' : 'pb-1'}`}>
          <NavLink
            to="/settings"
            onClick={handleNavClick}
            title={collapsed ? 'Settings' : undefined}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''} ${collapsed ? 'justify-center' : ''}`
            }
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span className="text-sm">Settings</span>}
          </NavLink>

          <button
            onClick={() => setShowCodex(true)}
            title={collapsed ? 'Codex' : undefined}
            className={`nav-item w-full ${collapsed ? 'justify-center' : ''}`}
          >
            <HelpCircle className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span className="text-sm">Codex</span>}
          </button>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            title={collapsed ? 'Sign Out' : undefined}
            className={`nav-item w-full hover:text-red-400 hover:bg-red-900/10 ${collapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span className="text-sm">Sign Out</span>}
          </button>
        </nav>

        {/* User card */}
        <div className={`px-2 pb-3 ${collapsed ? 'flex justify-center' : ''}`}>
          <NavLink
            to="/profile"
            onClick={handleNavClick}
            title={collapsed ? displayName : undefined}
            className={`flex items-center gap-2.5 p-2 rounded-lg transition-colors group ${collapsed ? 'justify-center' : ''}`}
            style={{ ':hover': {} }}
          >
            <UserAvatar initials={initials} />
            {!collapsed && (
              <div className="overflow-hidden flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--axiom-text)' }}>{displayName}</p>
                <p className="text-[11px] truncate" style={{ color: 'var(--axiom-muted)' }}>{email}</p>
              </div>
            )}
          </NavLink>
        </div>
      </div>

      {/* ── Collapse toggle ───────────────────────────────────────────── */}
      <button
        onClick={onToggle}
        className="
          hidden md:flex
          absolute -right-3 top-20
          w-6 h-6 rounded-full
          bg-axiom-surface border border-axiom-border-light
          items-center justify-center
          hover:border-gold-500/50
          transition-all duration-200 shadow-card z-10
        "
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
    <p className="text-[10px] font-semibold uppercase tracking-widest px-1" style={{ color: 'var(--axiom-muted)' }}>
      {children}
    </p>
  )
}

function ThreadCard({ thread }) {
  const Icon = thread.icon
  return (
    <button
      className="w-full text-left rounded-lg px-2.5 py-2 transition-all duration-150 group"
      style={{
        background: `rgba(${thread.accentRgb},0.04)`,
        border: `1px solid rgba(${thread.accentRgb},0.12)`,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = `rgba(${thread.accentRgb},0.09)`
        e.currentTarget.style.borderColor = `rgba(${thread.accentRgb},0.25)`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = `rgba(${thread.accentRgb},0.04)`
        e.currentTarget.style.borderColor = `rgba(${thread.accentRgb},0.12)`
      }}
    >
      <div className="flex items-start gap-2">
        <div
          className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: `rgba(${thread.accentRgb},0.15)` }}
        >
          <Icon className="w-3 h-3" style={{ color: `rgba(${thread.accentRgb},1)` }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span
              className="text-[9px] font-semibold uppercase tracking-widest"
              style={{ color: `rgba(${thread.accentRgb},0.75)` }}
            >
              {thread.category}
            </span>
          </div>
          <p className="text-xs font-medium leading-tight truncate" style={{ color: 'var(--axiom-text)' }}>
            {thread.title}
          </p>
          <p className="text-[10px] mt-0.5 leading-tight" style={{ color: 'var(--axiom-muted)' }}>
            {thread.context}
          </p>
          <div className="flex items-center gap-1 mt-1.5">
            <span
              className="text-[10px] font-medium"
              style={{ color: `rgba(${thread.accentRgb},0.9)` }}
            >
              → {thread.cta}
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}

function DisabledNavItem({ item, collapsed, badge }) {
  return (
    <div
      title={collapsed ? item.label : undefined}
      className={`nav-item opacity-40 cursor-not-allowed select-none ${collapsed ? 'justify-center' : ''}`}
    >
      <item.icon className="w-4 h-4 flex-shrink-0" />
      {!collapsed && (
        <>
          <span className="text-sm flex-1">{item.label}</span>
          {badge && (
            <span
              className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded"
              style={{
                background: 'rgba(201,168,76,0.1)',
                color: 'rgba(201,168,76,0.6)',
                border: '1px solid rgba(201,168,76,0.15)',
              }}
            >
              {badge}
            </span>
          )}
        </>
      )}
    </div>
  )
}

const BOOK_COLORS = ['#c9a84c', '#2dd4bf', '#9e7dd4', '#f97316', '#38bdf8']

function RecentProjectItem({ project, onClick }) {
  const colorIndex = project.title?.charCodeAt(0) % BOOK_COLORS.length ?? 0
  const color = BOOK_COLORS[colorIndex]

  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition-colors"
      style={{ '--hover-bg': 'var(--axiom-surface2)' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--axiom-surface2)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div
        className="w-5 h-6 rounded flex-shrink-0"
        style={{ background: `${color}22`, border: `1px solid ${color}44` }}
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
      <FolderOpen className="w-3 h-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--axiom-muted)' }} />
    </button>
  )
}

function UserAvatar({ initials }) {
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-500/30 to-teal-500/30 border border-gold-500/20 flex items-center justify-center flex-shrink-0">
      <span className="text-xs font-semibold text-gold-400">{initials}</span>
    </div>
  )
}
