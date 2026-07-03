import React, { useState, useEffect } from 'react'
import { doc, getDoc, updateDoc, deleteDoc, collection, getDocs, writeBatch, query, where } from 'firebase/firestore'
import { updatePassword, deleteUser, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth'
import { db, auth } from '../firebase/config'
import { useAuth } from '../contexts/AuthContext'
import { useSubscription, TIERS } from '../hooks/useSubscription'
import { useUsageTracking } from '../hooks/useUsageTracking'
import { openBillingPortal } from '../lib/stripe'
import UsageMeter from '../components/subscription/UsageMeter'
import PricingModal from '../components/subscription/PricingModal'
import { EXPORT_SECTIONS, exportUserDocx } from '../lib/dataExport'
import {
  Shield, CreditCard, Zap, Download, AlertTriangle,
  Check, ChevronRight, ExternalLink,
} from 'lucide-react'

const SECTIONS = [
  { id: 'billing',  icon: CreditCard,    label: 'Plan & Billing'   },
  { id: 'ai',       icon: Zap,           label: 'AI Settings'      },
  { id: 'account',  icon: Shield,        label: 'Account & Security'},
  { id: 'data',     icon: Download,      label: 'Data & Export'    },
  { id: 'danger',   icon: AlertTriangle, label: 'Danger Zone'      },
]

export default function Settings() {
  const { currentUser, userProfile, logout } = useAuth()
  const { tierId, tier, subscription } = useSubscription()
  const { usage, limit, percentUsed } = useUsageTracking()
  const [active, setActive] = useState('billing')
  const [showPricing, setShowPricing] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [portalError, setPortalError] = useState('')
  const [upgraded, setUpgraded] = useState(false)

  // A manageable billing account only exists once the user has completed Stripe
  // checkout. Founder/comped accounts (architect via email) never do.
  const hasStripeBilling = !!subscription?.stripeSubscriptionId

  useEffect(() => {
    if (window.location.search.includes('upgraded=1') || window.location.search.includes('checkout=success')) {
      setUpgraded(true)
      setActive('billing')
      window.history.replaceState({}, '', '/settings')
    }
  }, [])

  async function handleBillingPortal() {
    setPortalError('')
    setPortalLoading(true)
    try {
      // On success this redirects to Stripe, so we don't reset loading here.
      await openBillingPortal(currentUser.uid)
    } catch (err) {
      const noCustomer = err?.code === 'functions/not-found'
        || /no stripe customer/i.test(err?.message || '')
      setPortalError(noCustomer
        ? 'No billing account to manage yet.'
        : 'Couldn’t open the billing portal. Please try again.')
      setPortalLoading(false)
    }
  }

  return (
    <div className="h-full flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-52 flex-shrink-0 border-r border-axiom-border py-6 px-3 space-y-0.5">
        {SECTIONS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={`
              w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left transition-colors
              ${active === id
                ? 'bg-axiom-surface2 text-slate-100'
                : 'text-slate-500 hover:text-slate-300 hover:bg-axiom-surface2/50'}
            `}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </button>
        ))}
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl">

          {/* ── Billing ─────────────────────────────────────── */}
          {active === 'billing' && (
            <div className="space-y-6">
              <SectionHeader title="Plan & Billing" subtitle="Manage your subscription" />

              {upgraded && (
                <div className="flex items-center gap-2 px-4 py-3 bg-teal-900/20 border border-teal-500/30 rounded-lg text-sm text-teal-300">
                  <Check className="w-4 h-4" />
                  Upgrade successful! Welcome to {TIERS[tierId]?.name}.
                </div>
              )}

              {/* Current plan card */}
              <div className="bg-axiom-surface2 border border-axiom-border rounded-xl p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Current plan</p>
                    <h3 className="text-xl font-semibold text-slate-100">{tier.name}</h3>
                    {tier.price > 0 && (
                      <p className="text-sm text-slate-500">${tier.price}/month</p>
                    )}
                  </div>
                  {tierId === 'free' ? (
                    <button
                      onClick={() => setShowPricing(true)}
                      className="px-4 py-2 rounded-lg bg-gold-500/10 hover:bg-gold-500/20 text-gold-400 border border-gold-500/30 text-sm font-semibold transition-colors"
                    >
                      Upgrade
                    </button>
                  ) : hasStripeBilling ? (
                    <button
                      onClick={handleBillingPortal}
                      disabled={portalLoading}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-axiom-surface hover:bg-axiom-border text-slate-300 border border-axiom-border text-sm font-medium transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      {portalLoading ? 'Loading…' : 'Manage billing'}
                    </button>
                  ) : (
                    <span className="text-xs text-slate-500 italic max-w-[160px] text-right">
                      Complimentary plan — no billing to manage
                    </span>
                  )}
                </div>

                {portalError && (
                  <p className="text-xs text-red-400 mt-3">{portalError}</p>
                )}

                {subscription?.currentPeriodEnd && (
                  <p className="text-xs text-slate-600">
                    {subscription.cancelAtPeriodEnd ? 'Cancels' : 'Renews'} on{' '}
                    {new Date(subscription.currentPeriodEnd.seconds * 1000).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* Usage meter */}
              <div className="bg-axiom-surface2 border border-axiom-border rounded-xl p-5 space-y-3">
                <h4 className="text-sm font-medium text-slate-300">AI Usage — This Month</h4>
                {limit === Infinity ? (
                  <p className="text-sm text-teal-400 flex items-center gap-1.5">
                    <Check className="w-4 h-4" /> Unlimited AI assists
                  </p>
                ) : (
                  <UsageMeter />
                )}
              </div>

              {tierId !== 'architect' && (
                <button
                  onClick={() => setShowPricing(true)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-axiom-surface2 hover:bg-axiom-border border border-axiom-border rounded-xl text-sm text-slate-300 transition-colors"
                >
                  <span>Compare all plans</span>
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
              )}
            </div>
          )}

          {/* ── AI Settings ──────────────────────────────────── */}
          {active === 'ai' && (
            <AISettings userProfile={userProfile} currentUser={currentUser} tierId={tierId} />
          )}

          {/* ── Account ──────────────────────────────────────── */}
          {active === 'account' && (
            <AccountSettings currentUser={currentUser} />
          )}

          {/* ── Data ─────────────────────────────────────────── */}
          {active === 'data' && (
            <DataSettings currentUser={currentUser} />
          )}

          {/* ── Danger Zone ──────────────────────────────────── */}
          {active === 'danger' && (
            <DangerZone currentUser={currentUser} logout={logout} />
          )}
        </div>
      </main>

      {showPricing && <PricingModal onClose={() => setShowPricing(false)} />}
    </div>
  )
}

// ── Sub-sections ─────────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }) {
  return (
    <div className="mb-6">
      <h2 className="font-serif text-xl text-slate-100">{title}</h2>
      {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
  )
}

function AISettings({ userProfile, currentUser, tierId }) {
  const [model, setModel] = useState(userProfile?.aiModel || 'haiku')
  const [saved, setSaved] = useState(false)

  async function save() {
    await updateDoc(doc(db, 'users', currentUser.uid), { aiModel: model })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="AI Settings" subtitle="Customize your AI experience" />

      <div className="bg-axiom-surface2 border border-axiom-border rounded-xl p-5 space-y-4">
        <div>
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-2">
            Default AI Model
          </label>
          <div className="space-y-2">
            {[
              { id: 'haiku',  label: 'Claude Haiku', desc: 'Fast, great for quick assists & brainstorming' },
              { id: 'sonnet', label: 'Claude Sonnet', desc: 'Balanced quality & speed for longer tasks' },
            ].map(m => (
              <label
                key={m.id}
                className={`
                  flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                  ${model === m.id
                    ? 'border-gold-500/40 bg-gold-500/5'
                    : 'border-axiom-border hover:border-axiom-border-light'}
                `}
              >
                <input
                  type="radio"
                  name="model"
                  value={m.id}
                  checked={model === m.id}
                  onChange={() => setModel(m.id)}
                  className="accent-yellow-500"
                />
                <div>
                  <p className="text-sm text-slate-200">{m.label}</p>
                  <p className="text-xs text-slate-500">{m.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={save}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-axiom-surface hover:bg-axiom-border text-sm text-slate-300 border border-axiom-border transition-colors"
        >
          {saved ? <><Check className="w-3.5 h-3.5 text-teal-400" /> Saved</> : 'Save preferences'}
        </button>
      </div>
    </div>
  )
}

function AccountSettings({ currentUser }) {
  const [newPassword, setNewPassword] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [status, setStatus] = useState(null) // { type: 'success'|'error', msg }

  async function handlePasswordChange(e) {
    e.preventDefault()
    setStatus(null)
    try {
      const cred = EmailAuthProvider.credential(currentUser.email, currentPassword)
      await reauthenticateWithCredential(currentUser, cred)
      await updatePassword(currentUser, newPassword)
      setStatus({ type: 'success', msg: 'Password updated.' })
      setNewPassword(''); setCurrentPassword('')
    } catch (err) {
      setStatus({ type: 'error', msg: err.message })
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Account & Security" subtitle="Manage login credentials" />

      <div className="bg-axiom-surface2 border border-axiom-border rounded-xl p-5 space-y-4">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Email</p>
          <p className="text-sm text-slate-300">{currentUser?.email}</p>
        </div>

        <div className="border-t border-axiom-border pt-4">
          <p className="text-sm font-medium text-slate-300 mb-3">Change password</p>
          <form onSubmit={handlePasswordChange} className="space-y-3">
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="Current password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="w-full input-base"
              required
            />
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="New password (min 6 chars)"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full input-base"
              minLength={6}
              required
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
                <input type="checkbox" checked={showPw} onChange={e => setShowPw(e.target.checked)} className="accent-yellow-500" />
                Show passwords
              </label>
              <button type="submit" className="px-4 py-2 rounded-lg bg-axiom-surface hover:bg-axiom-border text-sm text-slate-300 border border-axiom-border transition-colors">
                Update password
              </button>
            </div>
          </form>
          {status && (
            <p className={`text-xs mt-2 ${status.type === 'success' ? 'text-teal-400' : 'text-red-400'}`}>
              {status.msg}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function DataSettings({ currentUser }) {
  const [exporting, setExporting]   = useState(false)
  const [selected, setSelected]     = useState(() => new Set(EXPORT_SECTIONS.map(s => s.id)))
  const [progress, setProgress]     = useState('')
  const [exportMsg, setExportMsg]   = useState(null) // { type: 'ok'|'err', text }

  function toggleSection(id) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function exportDocx() {
    if (selected.size === 0) return
    setExporting(true)
    setExportMsg(null)
    try {
      const { fileCount } = await exportUserDocx(currentUser.uid, [...selected], setProgress)
      setExportMsg({ type: 'ok', text: fileCount === 1 ? 'Downloaded 1 Word document.' : `Downloaded ${fileCount} Word documents in a ZIP.` })
    } catch (err) {
      console.error('[export]', err)
      setExportMsg({ type: 'err', text: err?.message || 'Export failed. Please try again.' })
    } finally {
      setExporting(false)
      setProgress('')
    }
  }

  async function exportData() {
    setExporting(true)
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid))
      // Projects live at the top-level `projects` collection with a `userId` field
      const projectsSnap = await getDocs(
        query(collection(db, 'projects'), where('userId', '==', currentUser.uid))
      )
      const projects = []
      for (const p of projectsSnap.docs) {
        const charSnap = await getDocs(collection(db, 'projects', p.id, 'characters'))
        const loreSnap = await getDocs(collection(db, 'projects', p.id, 'lore'))
        const threadsSnap = await getDocs(collection(db, 'projects', p.id, 'threads'))
        projects.push({
          ...p.data(),
          id: p.id,
          characters: charSnap.docs.map(c => ({ id: c.id, ...c.data() })),
          lore: loreSnap.docs.map(c => ({ id: c.id, ...c.data() })),
          threads: threadsSnap.docs.map(c => ({ id: c.id, ...c.data() })),
        })
      }

      const payload = {
        exportedAt: new Date().toISOString(),
        user: { email: currentUser.email, ...userDoc.data() },
        projects,
      }

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `axiom-export-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Data & Export" subtitle="Download your work as Word documents" />

      {/* ── Word export ── */}
      <div className="bg-axiom-surface2 border border-axiom-border rounded-xl p-5">
        <h4 className="text-sm font-medium text-slate-300 mb-1">Export as Word documents</h4>
        <p className="text-xs text-slate-500 mb-4">
          Formatted .docx files that open in Word, Pages, or Google Docs — styled the way you wrote them here.
          Pick the sections you want; multiple sections (or multiple projects) arrive as a ZIP organized by project.
        </p>

        <div className="grid sm:grid-cols-2 gap-2 mb-4">
          {EXPORT_SECTIONS.map(section => {
            const on = selected.has(section.id)
            return (
              <button
                key={section.id}
                onClick={() => toggleSection(section.id)}
                className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                  on ? 'border-gold-500/40 bg-gold-500/10' : 'border-axiom-border hover:border-axiom-border-light'
                }`}
              >
                <div className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center flex-shrink-0 ${
                  on ? 'bg-gold-500/20 border-gold-500/50' : 'border-slate-600'
                }`}>
                  {on && <Check className="w-3 h-3 text-gold-400" />}
                </div>
                <div>
                  <p className={`text-xs font-semibold ${on ? 'text-gold-400' : 'text-slate-300'}`}>{section.label}</p>
                  <p className="text-[10px] text-slate-600 leading-relaxed mt-0.5">{section.desc}</p>
                </div>
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={exportDocx}
            disabled={exporting || selected.size === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gold-500/10 hover:bg-gold-500/20 text-sm text-gold-400 border border-gold-500/30 transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            {exporting
              ? (progress || 'Preparing…')
              : selected.size === EXPORT_SECTIONS.length
                ? 'Download everything'
                : `Download ${selected.size} section${selected.size !== 1 ? 's' : ''}`}
          </button>
          {exportMsg && (
            <span className={`text-xs ${exportMsg.type === 'ok' ? 'text-teal-400' : 'text-red-400'}`}>
              {exportMsg.text}
            </span>
          )}
        </div>
      </div>

      {/* ── Raw backup ── */}
      <div className="bg-axiom-surface2 border border-axiom-border rounded-xl p-5">
        <h4 className="text-sm font-medium text-slate-300 mb-1">Raw backup (JSON)</h4>
        <p className="text-xs text-slate-500 mb-4">
          A machine-readable archive of everything, for safekeeping or migrating data. Most writers want the Word export above instead.
        </p>
        <button
          onClick={exportData}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-axiom-surface hover:bg-axiom-border text-sm text-slate-300 border border-axiom-border transition-colors disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          {exporting ? 'Preparing…' : 'Download JSON backup'}
        </button>
      </div>
    </div>
  )
}

function DangerZone({ currentUser, logout }) {
  const [confirm, setConfirm] = useState('')
  const [password, setPassword] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete(e) {
    e.preventDefault()
    if (confirm !== 'DELETE') return
    setDeleting(true)
    setError('')
    try {
      const cred = EmailAuthProvider.credential(currentUser.email, password)
      await reauthenticateWithCredential(currentUser, cred)
      // Delete Firestore data
      const batch = writeBatch(db)
      batch.delete(doc(db, 'users', currentUser.uid))
      await batch.commit()
      await deleteUser(currentUser)
      await logout()
    } catch (err) {
      setError(err.message)
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Danger Zone" subtitle="Irreversible actions" />

      <div className="border border-red-500/30 rounded-xl p-5 bg-red-900/10">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-red-300">Delete account</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              This permanently deletes your account and all associated data. This cannot be undone.
            </p>
          </div>
        </div>
        <form onSubmit={handleDelete} className="space-y-3">
          <input
            type="password"
            placeholder="Your password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full input-base"
            required
          />
          <input
            placeholder='Type "DELETE" to confirm'
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            className="w-full input-base"
            required
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={confirm !== 'DELETE' || deleting}
            className="px-4 py-2 rounded-lg bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-500/30 text-sm font-medium transition-colors disabled:opacity-40"
          >
            {deleting ? 'Deleting…' : 'Permanently delete my account'}
          </button>
        </form>
      </div>
    </div>
  )
}
