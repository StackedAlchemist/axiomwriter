import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Eye, EyeOff, Feather, AlertCircle, Check } from 'lucide-react'
import usePageMeta from '../../hooks/usePageMeta'

export default function Signup() {
  const { signup, loginWithGoogle } = useAuth()
  const navigate   = useNavigate()

  usePageMeta({
    title: 'Claim Your Desk',
    description: 'Create a free Axiomwriter home — manuscript editor, characters, and your first project free. Come in and build that world.',
    path: '/signup',
  })

  const [form, setForm]         = useState({ displayName: '', email: '', password: '', confirm: '' })
  const [showPassword, setShow] = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  async function handleGoogleSignIn() {
    setError('')
    setGoogleLoading(true)
    try {
      await loginWithGoogle()
      navigate('/dashboard')
    } catch (err) {
      console.error('[Google sign-in]', err.code, err.message)
      setError(friendlyGoogleError(err.code))
    } finally {
      setGoogleLoading(false)
    }
  }

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    if (error) setError('')
  }

  const passwordChecks = [
    { label: 'At least 8 characters', pass: form.password.length >= 8 },
    { label: 'Contains a number',     pass: /\d/.test(form.password) },
    { label: 'Passwords match',       pass: form.password === form.confirm && form.confirm.length > 0 },
  ]

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.password !== form.confirm) return setError('Passwords do not match.')
    if (form.password.length < 8)       return setError('Password must be at least 8 characters.')
    setError('')
    setLoading(true)
    try {
      await signup(form.email, form.password, form.displayName.trim())
      navigate('/dashboard')
    } catch (err) {
      setError(friendlyError(err.code))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/writing-desk-login.png')" }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(160deg, rgba(6,11,20,0.84) 0%, rgba(6,11,20,0.58) 45%, rgba(6,11,20,0.8) 100%)',
        }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-noise pointer-events-none opacity-50" aria-hidden="true" />

      <header className="relative z-10 flex items-center justify-between px-5 sm:px-8 py-5">
        <Link to="/" className="flex items-center gap-2.5">
          <span
            className="inline-flex items-center justify-center w-9 h-9 rounded-xl"
            style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.28)' }}
          >
            <Feather className="w-5 h-5 text-gold-400" />
          </span>
          <span className="font-serif text-lg font-semibold text-slate-100">Axiomwriter</span>
        </Link>
        <Link to="/login" className="text-sm text-slate-300 hover:text-gold-400 transition-colors">
          Already home? <span className="text-gold-400">Sign in</span>
        </Link>
      </header>

      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-500/85 mb-3">
            Welcome home, author
          </p>
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{
              background: 'rgba(201,168,76,0.12)',
              border: '1px solid rgba(201,168,76,0.28)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Feather className="w-7 h-7 text-gold-400" />
          </div>
          <h1 className="font-serif text-3xl font-semibold text-slate-50 tracking-tight">
            Claim your desk.
          </h1>
          <p className="mt-2 text-slate-300/85 text-sm leading-relaxed max-w-sm mx-auto">
            Free forever to start. Come in — let’s build that fantasy world together.
          </p>
        </div>

        <div
          className="p-7 sm:p-8"
          style={{
            background: 'rgba(10, 16, 28, 0.72)',
            backdropFilter: 'blur(22px)',
            WebkitBackdropFilter: 'blur(22px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '1.35rem',
            boxShadow: '0 12px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          <h2 className="font-serif text-xl font-semibold text-slate-100 mb-0.5">Create your free home</h2>
          <p className="text-slate-400/80 text-sm mb-6">Manuscript, cast, and lore — ready when you are.</p>

          {error && (
            <div className="flex items-start gap-2.5 bg-red-900/20 border border-red-800/40 rounded-lg px-4 py-3 mb-5">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Display name</label>
              <input
                name="displayName"
                type="text"
                autoComplete="name"
                required
                value={form.displayName}
                onChange={handleChange}
                placeholder="Your pen name or real name"
                className="input-base"
                style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.10)' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Email</label>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="input-base"
                style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.10)' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Password</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="input-base pr-10"
                  style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.10)' }}
                />
                <button
                  type="button"
                  onClick={() => setShow(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Confirm password</label>
              <input
                name="confirm"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={form.confirm}
                onChange={handleChange}
                placeholder="••••••••"
                className="input-base"
                style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.10)' }}
              />
            </div>

            {/* Password strength */}
            {form.password.length > 0 && (
              <ul className="space-y-1.5 pt-1">
                {passwordChecks.map(({ label, pass }) => (
                  <li key={label} className={`flex items-center gap-2 text-xs transition-colors ${pass ? 'text-teal-400' : 'text-slate-600'}`}>
                    <Check className={`w-3.5 h-3.5 flex-shrink-0 ${pass ? 'opacity-100' : 'opacity-30'}`} />
                    {label}
                  </li>
                ))}
              </ul>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2 py-3">
              {loading ? (
                <span className="flex items-center gap-2 justify-center">
                  <Spinner /> Preparing your den…
                </span>
              ) : 'Open the den free'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="divider" style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
            <span
              className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 text-xs text-slate-500"
              style={{ background: 'rgba(10, 16, 28, 0.9)' }}
            >
              or
            </span>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="btn-secondary w-full flex items-center justify-center gap-3"
            style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.10)' }}
          >
            {googleLoading ? <Spinner /> : <GoogleIcon />}
            Continue with Google
          </button>

          <p className="text-center text-xs text-slate-500 mt-5">
            Already have a desk?{' '}
            <Link to="/login" className="text-gold-400 hover:text-gold-300 transition-colors font-medium">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6 max-w-sm mx-auto">
          By creating an account you agree to our{' '}
          <Link to="/terms" className="text-slate-400 underline underline-offset-2 hover:text-gold-400 transition-colors">Terms</Link>
          {' '}and{' '}
          <Link to="/privacy" className="text-slate-400 underline underline-offset-2 hover:text-gold-400 transition-colors">Privacy Policy</Link>.
        </p>
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

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

function friendlyGoogleError(code) {
  switch (code) {
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized for Google sign-in. Please contact support.'
    case 'auth/popup-blocked':
      return 'Pop-up was blocked by your browser. Please allow pop-ups for this site and try again.'
    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled. Please try again.'
    case 'auth/cancelled-popup-request':
      return ''
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email using a different sign-in method.'
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.'
    default:
      return `Google sign-in failed (${code || 'unknown'}). Please try again.`
  }
}

function friendlyError(code) {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.'
    case 'auth/invalid-email':
      return 'Please enter a valid email address.'
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.'
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.'
    default:
      return 'An unexpected error occurred. Please try again.'
  }
}
