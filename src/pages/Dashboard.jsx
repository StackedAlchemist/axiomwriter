import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { db } from '../firebase/config'
import { collection, query, where, getDocs } from 'firebase/firestore'
import {
  BookOpen, Feather, ArrowRight,
  TrendingUp, Clock, Star, Zap, GitBranch, AlertTriangle, Loader2,
} from 'lucide-react'

export default function Dashboard() {
  const { userProfile, currentUser } = useAuth()
  const navigate = useNavigate()
  const displayName = userProfile?.displayName || currentUser?.displayName || 'Writer'
  const firstName   = displayName.split(' ')[0]

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const [projects,      setProjects]      = useState([])
  const [statsLoading,  setStatsLoading]  = useState(true)
  const [threadDigests, setThreadDigests] = useState([])

  const [streak,     setStreak]     = useState(null)
  const [weekWords,  setWeekWords]  = useState(null)

  // Single Firestore fetch for both stats and thread digest
  useEffect(() => {
    if (!currentUser) { setStatsLoading(false); return }

    const thirtyDaysAgo = (() => {
      const d = new Date(); d.setDate(d.getDate() - 30)
      return d.toISOString().slice(0, 10)
    })()

    const monday = (() => {
      const d = new Date()
      const day = d.getDay() || 7
      d.setDate(d.getDate() - day + 1)
      return d.toISOString().slice(0, 10)
    })()

    getDocs(query(collection(db, 'projects'), where('userId', '==', currentUser.uid)))
      .then(async snap => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        setProjects(list)

        const digests = []
        list.forEach(p => {
          if (p.forgottenThreadDigest?.count > 0) {
            digests.push({ projectId: p.id, projectTitle: p.title, ...p.forgottenThreadDigest })
          }
        })
        setThreadDigests(digests)

        // Aggregate writingDays across all projects
        const daySnaps = await Promise.all(
          list.map(p => getDocs(
            query(collection(db, 'projects', p.id, 'writingDays'), where('date', '>=', thirtyDaysAgo))
          ))
        )
        const byDate = {}
        daySnaps.forEach(s => s.docs.forEach(d => {
          const { date, wordsWritten } = d.data()
          byDate[date] = (byDate[date] || 0) + (wordsWritten || 0)
        }))

        // Streak: count consecutive days back from today
        let s = 0
        const cursor = new Date()
        for (let i = 0; i < 30; i++) {
          const key = cursor.toISOString().slice(0, 10)
          if ((byDate[key] || 0) > 0) { s++; cursor.setDate(cursor.getDate() - 1) }
          else break
        }
        setStreak(s)

        // This week total
        const ww = Object.entries(byDate)
          .filter(([date]) => date >= monday)
          .reduce((sum, [, w]) => sum + w, 0)
        setWeekWords(ww)
      })
      .catch(err => console.error('[Dashboard] Failed to load projects:', err))
      .finally(() => setStatsLoading(false))
  }, [currentUser])

  // Derived stats
  const activeProjects = useMemo(
    () => projects.filter(p => p.status !== 'archived' && p.status !== 'trashed'),
    [projects]
  )
  const totalWords = useMemo(
    () => projects.reduce((sum, p) => sum + (p.wordCount || 0), 0),
    [projects]
  )
  const latestProject = useMemo(
    () => [...projects].sort((a, b) => (b.updatedAt?.toMillis?.() ?? 0) - (a.updatedAt?.toMillis?.() ?? 0))[0] ?? null,
    [projects]
  )

  function formatWords(n) {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000)    return `${(n / 1000).toFixed(1)}k`
    return String(n)
  }

  const statCards = [
    { icon: BookOpen,   label: 'Projects',      value: statsLoading ? null : String(activeProjects.length), sub: 'Active' },
    { icon: Feather,    label: 'Words Written',  value: statsLoading ? null : formatWords(totalWords),        sub: 'All time' },
    { icon: Clock,      label: 'Streak',    value: streak    === null ? null : streak === 0 ? '0 days' : `${streak}d`,
      sub: streak === 0 ? 'Write today to start a streak' : 'Daily writing' },
    { icon: TrendingUp, label: 'This Week', value: weekWords === null ? null : formatWords(weekWords),
      sub: weekWords === 0 ? 'Words this week — the page is waiting' : 'Words written' },
  ]

  return (
    <div className="space-y-8 animate-slide-up">

      {/* Welcome hero — step into the den */}
      <div className="relative overflow-hidden card p-8 md:p-10">
        <div className="absolute inset-0 bg-gradient-radial from-gold-500/8 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-radial from-teal-500/6 via-transparent to-transparent pointer-events-none" />
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.04\'/%3E%3C/svg%3E")',
          }}
          aria-hidden="true"
        />
        <div className="relative">
          <p className="text-xs font-medium uppercase tracking-[0.18em] mb-2" style={{ color: 'var(--axiom-muted)' }}>
            {greeting}
          </p>
          <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-3 tracking-tight" style={{ color: 'var(--axiom-text)' }}>
            Welcome back, <span className="text-gradient-gold">{firstName}</span>
          </h2>
          <p className="max-w-xl text-sm leading-relaxed" style={{ color: 'var(--axiom-muted)' }}>
            Step into your den. The page is warm, the tools are within reach —
            bring the vision, and write something that lasts.
          </p>

          <div className="mt-6 flex items-center gap-3 flex-wrap">
            <Link to="/projects" className="btn-primary text-sm">
              <BookOpen className="w-4 h-4" />
              {activeProjects.length === 0 ? 'Start a Project' : 'Open Library'}
            </Link>
            {latestProject && (
              <button
                onClick={() => navigate(`/projects/${latestProject.id}`)}
                className="btn-secondary text-sm"
              >
                <Feather className="w-4 h-4" />
                Continue writing
              </button>
            )}
            <span className="badge-gold">
              <Zap className="w-3 h-3 mr-1" />
              AI that knows your world
            </span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ icon: Icon, label, value, sub }) => (
          <div key={label} className="card p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-axiom-surface2 border border-axiom-border flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-slate-500" />
            </div>
            <div>
              {value === null
                ? <div className="w-10 h-5 bg-axiom-surface2 rounded animate-pulse-soft mb-1" />
                : <p className="text-xl font-semibold leading-tight" style={{ color: 'var(--axiom-text)' }}>{value}</p>
              }
              <p className="text-xs font-medium text-slate-400">{label}</p>
              <p className="text-xs text-slate-600 mt-0.5">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-widest mb-3">Quick Actions</h3>
        <div className="grid sm:grid-cols-2 gap-4">

          {/* New Project — always active */}
          <Link
            to="/projects"
            className="card p-5 hover:border-axiom-border-light transition-all duration-200 group relative overflow-hidden"
          >
            <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center bg-gold-500/10 border border-gold-500/20 group-hover:bg-gold-500/20 transition-all duration-200">
              <BookOpen className="w-5 h-5 text-gold-400" />
            </div>
            <h4 className="font-medium text-sm mb-1 group-hover:text-white transition-colors" style={{ color: 'var(--axiom-text)' }}>New Project</h4>
            <p className="text-xs text-slate-500 leading-relaxed">Start a new story, novel, or script</p>
            <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-gold-400 group-hover:translate-x-1 transition-all duration-200 mt-3" />
          </Link>

          {/* Continue Writing — links to most recent project if one exists */}
          {statsLoading ? (
            <div className="card p-5 opacity-50 animate-pulse-soft">
              <div className="w-10 h-10 rounded-xl mb-3 bg-axiom-surface2 border border-axiom-border" />
              <div className="h-3 bg-axiom-surface2 rounded w-2/3 mb-2" />
              <div className="h-2 bg-axiom-surface2 rounded w-1/2" />
            </div>
          ) : latestProject ? (
            <button
              onClick={() => navigate(`/projects/${latestProject.id}`)}
              className="card p-5 hover:border-axiom-border-light transition-all duration-200 group relative overflow-hidden text-left"
            >
              <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center bg-teal-500/10 border border-teal-500/20 group-hover:bg-teal-500/20 transition-all duration-200">
                <Feather className="w-5 h-5 text-teal-400" />
              </div>
              <h4 className="font-medium text-sm mb-0.5 group-hover:text-white transition-colors" style={{ color: 'var(--axiom-text)' }}>Continue Writing</h4>
              <p className="text-xs text-slate-400 truncate leading-relaxed">{latestProject.title}</p>
              <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-teal-400 group-hover:translate-x-1 transition-all duration-200 mt-3" />
            </button>
          ) : (
            <div className="card p-5 opacity-40 cursor-not-allowed relative overflow-hidden">
              <span className="absolute top-3 right-3 text-[10px] font-semibold bg-axiom-border text-slate-600 px-2 py-0.5 rounded-full">
                No projects yet
              </span>
              <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center bg-teal-500/10 border border-teal-500/20">
                <Feather className="w-5 h-5 text-teal-400" />
              </div>
              <h4 className="font-medium text-slate-300 text-sm mb-1">Continue Writing</h4>
              <p className="text-xs text-slate-600 leading-relaxed">Jump back into your latest chapter</p>
            </div>
          )}

        </div>
      </div>

      {/* Forgotten Threads digest */}
      {threadDigests.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-widest mb-3 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            Forgotten Threads
          </h3>
          <div className="space-y-3">
            {threadDigests.map(digest => (
              <div key={digest.projectId} className="card p-4 border-red-500/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-sm font-medium text-slate-300">{digest.projectTitle}</span>
                  </div>
                  <Link
                    to={`/projects/${digest.projectId}/threads`}
                    className="text-xs text-gold-400 hover:text-gold-300 transition-colors flex items-center gap-1"
                  >
                    View All <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="space-y-1.5">
                  {(digest.threads || []).map(t => (
                    <div key={t.id} className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 truncate">{t.title}</span>
                      <span className="text-red-400 font-medium flex-shrink-0 ml-2">
                        {t.dormancyCount} scenes ago
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent activity */}
      <div>
        <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-widest mb-3">Recent Activity</h3>
        {statsLoading ? (
          <div className="card p-6 space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-3 bg-axiom-surface2 rounded animate-pulse-soft" />)}
          </div>
        ) : activeProjects.length > 0 ? (
          <div className="space-y-2">
            {activeProjects.slice(0, 5).map(p => (
              <button
                key={p.id}
                onClick={() => navigate(`/projects/${p.id}`)}
                className="w-full card p-4 flex items-center justify-between hover:border-axiom-border-light transition-all group text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-gold-500/10 border border-gold-500/20 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-3.5 h-3.5 text-gold-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-white transition-colors" style={{ color: 'var(--axiom-text)' }}>
                      {p.title}
                    </p>
                    <p className="text-xs text-slate-600">
                      {p.wordCount ? `${formatWords(p.wordCount)} words` : 'No scenes yet'}
                      {p.genre ? ` · ${p.genre}` : ''}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-700 group-hover:text-gold-400 group-hover:translate-x-1 transition-all flex-shrink-0 ml-3" />
              </button>
            ))}
            {activeProjects.length > 5 && (
              <Link to="/projects" className="block text-center text-xs text-slate-600 hover:text-slate-400 transition-colors py-2">
                View all {activeProjects.length} projects →
              </Link>
            )}
          </div>
        ) : (
          <div className="card p-8 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-axiom-surface2 border border-axiom-border flex items-center justify-center mb-3">
              <Star className="w-5 h-5 text-slate-600" />
            </div>
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--axiom-muted)' }}>No activity yet</p>
            <p className="text-xs text-slate-600 max-w-xs">
              Create your first project to start building your writing history.
            </p>
            <Link to="/projects" className="btn-secondary mt-4 text-xs">
              Create First Project
            </Link>
          </div>
        )}
      </div>

    </div>
  )
}
