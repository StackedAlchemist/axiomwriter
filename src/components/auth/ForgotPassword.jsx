import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Feather, AlertCircle, ArrowLeft, MailCheck } from 'lucide-react'

export default function ForgotPassword() {
  const { resetPassword } = useAuth()

  const [email, setEmail]     = useState('')
  const [error, setError]     = useState('')
  const [sent, setSent]       = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await resetPassword(email)
      setSent(true)
    } catch (err) {
      setError(friendlyError(err.code))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-axiom-bg flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-noise pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-gradient-radial from-gold-500/5 via-transparent to-transparent pointer-events-none" />

      <div className="w-full max-w-md animate-slide-up relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gold-500/10 border border-gold-500/20 mb-4">
            <Feather className="w-7 h-7 text-gold-400" />
          </div>
          <h1 className="font-serif text-3xl font-semibold text-slate-100">Axiom</h1>
          <p className="text-slate-500 text-sm mt-1 tracking-wide">by Stacked Alchemist</p>
        </div>

        <div className="card p-8">
          {sent ? (
            /* Success state */
            <div className="text-center animate-fade-in">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 mb-4">
                <MailCheck className="w-7 h-7 text-teal-400" />
              </div>
              <h2 className="font-serif text-xl font-semibold text-slate-100 mb-2">Check your inbox</h2>
              <p className="text-slate-400 text-sm mb-6">
                We've sent a password reset link to <span className="text-slate-200 font-medium">{email}</span>.
                Check your spam folder if you don't see it.
              </p>
              <Link to="/login" className="btn-primary w-full text-center block">
                Back to Sign In
              </Link>
            </div>
          ) : (
            /* Form state */
            <>
              <h2 className="font-serif text-xl font-semibold text-slate-100 mb-1">Reset password</h2>
              <p className="text-slate-500 text-sm mb-6">
                Enter your email and we'll send you a reset link.
              </p>

              {error && (
                <div className="flex items-start gap-2.5 bg-red-900/20 border border-red-800/40 rounded-lg px-4 py-3 mb-5">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Email</label>
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={e => { setEmail(e.target.value); if (error) setError('') }}
                    placeholder="you@example.com"
                    className="input-base"
                  />
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Spinner /> Sending…
                    </span>
                  ) : 'Send Reset Link'}
                </button>
              </form>

              <div className="mt-5">
                <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}

function friendlyError(code) {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/invalid-email':
      return 'No account found with that email address.'
    case 'auth/too-many-requests':
      return 'Too many requests. Please wait a moment and try again.'
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.'
    default:
      return 'An unexpected error occurred. Please try again.'
  }
}
