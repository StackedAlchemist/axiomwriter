/**
 * FeedbackWidget — Feedback Hub: Report a Bug, Request a Feature, Ask a Question.
 *
 * Submissions stored in Firestore `feedback` collection
 * AND optionally emailed via EmailJS (configure VITE_EMAILJS_* env vars).
 */

import React, { useState } from 'react'
import {
  MessageSquare, X, Send, Loader2, Check,
  Bug, Lightbulb, HelpCircle,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import {
  submitBugReport,
  submitFeatureRequest,
  submitSupportQuestion,
  notifyViaEmail,
} from '../../services/feedbackService'

const TYPES = [
  { value: 'bug',        label: 'Report a Bug',       icon: Bug,          color: 'text-red-400',    bg: 'bg-red-900/20 border-red-500/20'   },
  { value: 'suggestion', label: 'Request a Feature',  icon: Lightbulb,    color: 'text-gold-400',   bg: 'bg-gold-500/10 border-gold-500/20' },
  { value: 'question',   label: 'Ask a Question',     icon: HelpCircle,   color: 'text-blue-400',   bg: 'bg-blue-900/20 border-blue-500/20' },
]

const INITIAL_BUG  = { what: '', doing: '' }
const INITIAL_FEAT = { what: '', problem: '' }

export default function FeedbackWidget() {
  const { currentUser } = useAuth()
  const [open,    setOpen]    = useState(false)
  const [type,    setType]    = useState('bug')
  const [bugForm, setBugForm] = useState(INITIAL_BUG)
  const [featForm,setFeatForm]= useState(INITIAL_FEAT)
  const [message, setMessage] = useState('')  // for 'question'
  const [sending, setSending] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState('')

  function reset() {
    setBugForm(INITIAL_BUG)
    setFeatForm(INITIAL_FEAT)
    setMessage('')
    setError('')
    setType('bug')
  }

  function buildPayload() {
    if (type === 'bug') {
      return `WHAT HAPPENED:\n${bugForm.what}\n\nWHAT WERE YOU DOING:\n${bugForm.doing}`
    }
    if (type === 'suggestion') {
      return `WHAT DO YOU WANT:\n${featForm.what}\n\nPROBLEM IT SOLVES:\n${featForm.problem}`
    }
    return message.trim()
  }

  function isValid() {
    if (type === 'bug')        return bugForm.what.trim().length > 0
    if (type === 'suggestion') return featForm.what.trim().length > 0
    return message.trim().length > 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!isValid()) return
    setSending(true)
    setError('')

    const userId    = currentUser?.uid   || 'anonymous'
    const userEmail = currentUser?.email || ''
    const page      = window.location.pathname

    try {
      if (type === 'bug') {
        await submitBugReport({ userId, userEmail, page, what: bugForm.what, doing: bugForm.doing })
        await notifyViaEmail({ type, userEmail, payload: { page, message: buildPayload() } })
      } else if (type === 'suggestion') {
        await submitFeatureRequest({ userId, userEmail, page, what: featForm.what, problem: featForm.problem })
        await notifyViaEmail({ type, userEmail, payload: { page, message: buildPayload() } })
      } else {
        await submitSupportQuestion({ userId, userEmail, page, message })
        await notifyViaEmail({ type, userEmail, payload: { page, message } })
      }

      setSent(true)
      setTimeout(() => {
        setSent(false)
        setOpen(false)
        reset()
      }, 2500)
    } catch {
      setError('Failed to send. Please try again.')
    }

    setSending(false)
  }

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        className="
          fixed bottom-20 right-4 z-40 sm:bottom-5 sm:right-5
          w-11 h-11 rounded-full
          bg-axiom-surface border border-axiom-border
          flex items-center justify-center
          shadow-lg hover:border-gold-500/40 hover:bg-axiom-surface2
          transition-all duration-200 group
        "
        title="Feedback Hub"
        aria-label="Open Feedback Hub"
      >
        {open
          ? <X className="w-4 h-4 text-slate-400" />
          : <MessageSquare className="w-4 h-4 text-slate-500 group-hover:text-gold-400 transition-colors" />
        }
        <span className="
          absolute -top-1 -left-1
          text-[7px] font-bold bg-gold-500/20 border border-gold-500/30
          text-gold-400 px-1 py-0.5 rounded-full uppercase tracking-wider
        ">
          β
        </span>
      </button>

      {/* Feedback drawer */}
      {open && (
        <div className="
          fixed bottom-20 right-5 z-40
          w-80 bg-axiom-surface border border-axiom-border
          rounded-2xl shadow-2xl animate-slide-up overflow-hidden
        ">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-axiom-border">
            <div>
              <p className="text-sm font-semibold text-slate-100">Feedback Hub</p>
              <p className="text-[10px] text-slate-600 mt-0.5">Report bugs, request features, ask questions</p>
            </div>
            <button onClick={() => setOpen(false)} className="btn-icon w-6 h-6">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {sent ? (
            <div className="p-6 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center">
                <Check className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-200">Thank you!</p>
                <p className="text-xs text-slate-500 mt-0.5">Your feedback has been received.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              {/* Type selector */}
              <div className="grid grid-cols-3 gap-1.5">
                {TYPES.map(t => {
                  const Icon = t.icon
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition-all ${type === t.value ? t.bg : 'border-axiom-border bg-axiom-surface2 hover:border-axiom-border-light'}`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${type === t.value ? t.color : 'text-slate-600'}`} />
                      <span className={`text-[9px] font-medium leading-tight ${type === t.value ? t.color : 'text-slate-600'}`}>{t.label}</span>
                    </button>
                  )
                })}
              </div>

              {/* Structured bug form */}
              {type === 'bug' && (
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      What happened?
                    </label>
                    <textarea
                      value={bugForm.what}
                      onChange={e => setBugForm(f => ({ ...f, what: e.target.value }))}
                      placeholder="Describe the bug…"
                      rows={2}
                      className="input-base text-xs w-full resize-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      What were you doing?
                    </label>
                    <textarea
                      value={bugForm.doing}
                      onChange={e => setBugForm(f => ({ ...f, doing: e.target.value }))}
                      placeholder="Steps to reproduce…"
                      rows={2}
                      className="input-base text-xs w-full resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Structured feature form */}
              {type === 'suggestion' && (
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      What do you want?
                    </label>
                    <textarea
                      value={featForm.what}
                      onChange={e => setFeatForm(f => ({ ...f, what: e.target.value }))}
                      placeholder="Describe the feature…"
                      rows={2}
                      className="input-base text-xs w-full resize-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      What problem does it solve?
                    </label>
                    <textarea
                      value={featForm.problem}
                      onChange={e => setFeatForm(f => ({ ...f, problem: e.target.value }))}
                      placeholder="What friction does this remove?"
                      rows={2}
                      className="input-base text-xs w-full resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Question form */}
              {type === 'question' && (
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="What would you like to know?"
                  rows={4}
                  className="input-base text-xs w-full resize-none"
                  required
                />
              )}

              {error && (
                <p className="text-[10px] text-red-400">{error}</p>
              )}

              <button
                type="submit"
                disabled={!isValid() || sending}
                className="w-full btn-primary text-xs"
              >
                {sending
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Sending…</>
                  : <><Send className="w-3.5 h-3.5" />Send</>}
              </button>

              <p className="text-[9px] text-slate-700 text-center leading-relaxed">
                {currentUser?.email || 'Anonymous'}
              </p>
            </form>
          )}
        </div>
      )}
    </>
  )
}
