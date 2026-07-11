import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Feather } from 'lucide-react'

const glass = {
  background: 'rgba(10, 16, 28, 0.65)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '1.25rem',
  boxShadow: '0 8px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05)',
}

export { glass }

const NAV = [
  { to: '/#showcase', label: 'The den', hash: true },
  { to: '/pricing', label: 'Pricing' },
  { to: '/help', label: 'Help' },
  { to: '/faq', label: 'FAQ' },
]

/**
 * Shared chrome for public marketing pages — same den mood as the homepage.
 */
export default function MarketingLayout({
  children,
  heroImage = true,
  heroHeight = 'h-[42vh]',
  bare = false,
}) {
  return (
    <div className="min-h-screen relative text-slate-200" style={{ background: '#07060f' }}>
      {heroImage && (
        <div className={`absolute inset-x-0 top-0 ${heroHeight} overflow-hidden pointer-events-none`} aria-hidden="true">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/writing-desk-login.png')" }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(6,11,20,0.78) 0%, rgba(6,11,20,0.65) 45%, rgba(7,6,15,0.96) 88%, #07060f 100%)',
            }}
          />
          <div className="absolute inset-0 bg-noise opacity-50" />
        </div>
      )}

      {!bare && <MarketingNav />}
      <div className="relative z-10">{children}</div>
      {!bare && <MarketingFooter />}
    </div>
  )
}

export function MarketingNav() {
  const { pathname } = useLocation()

  return (
    <header className="relative z-20 max-w-6xl mx-auto flex items-center justify-between px-5 py-5">
      <Link to="/" className="flex items-center gap-2.5 group">
        <span
          className="inline-flex items-center justify-center w-9 h-9 rounded-xl transition-transform group-hover:scale-105"
          style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.25)' }}
        >
          <Feather className="w-5 h-5 text-gold-400" />
        </span>
        <span className="font-serif text-xl font-semibold text-slate-100">Axiomwriter</span>
      </Link>

      <nav className="flex items-center gap-1 sm:gap-2" aria-label="Main">
        {NAV.map(item => {
          const active = !item.hash && pathname === item.to
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`hidden sm:block text-sm px-2.5 py-2 transition-colors ${
                active ? 'text-gold-400' : 'text-slate-300 hover:text-gold-400'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
        <Link to="/login" className="text-sm text-slate-200 hover:text-gold-400 transition-colors px-2.5 sm:px-3 py-2">
          Sign in
        </Link>
        <Link to="/signup" className="btn-primary text-sm px-3.5 sm:px-4 py-2">
          Start free
        </Link>
      </nav>
    </header>
  )
}

export function MarketingFooter() {
  return (
    <footer className="relative z-10 border-t border-white/5 mt-8">
      <div className="max-w-6xl mx-auto px-5 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-4">
              <span
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg"
                style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.25)' }}
              >
                <Feather className="w-4 h-4 text-gold-400" />
              </span>
              <span className="font-serif text-lg font-semibold text-slate-100">Axiomwriter</span>
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed max-w-sm">
              The writer's den — manuscripts, characters, lore, and AI that knows
              <em className="text-slate-400"> your </em> world. Built by Stacked Alchemist LLC
              in Mesa, Arizona.
            </p>
            <p className="mt-4 text-xs text-gold-500/70 tracking-wide">
              Welcome home, author.
            </p>
          </div>

          <FooterCol title="Product">
            <FooterLink to="/#showcase">The den</FooterLink>
            <FooterLink to="/pricing">Pricing</FooterLink>
            <FooterLink to="/help">Help guide</FooterLink>
            <FooterLink to="/faq">FAQ</FooterLink>
            <FooterLink to="/signup">Start free</FooterLink>
          </FooterCol>

          <FooterCol title="Company">
            <FooterLink to="/about">About</FooterLink>
            <FooterLink to="/login">Sign in</FooterLink>
            <a
              href="mailto:hello@stackedalchemist.dev"
              className="block text-sm text-slate-400 hover:text-gold-400 transition-colors py-1"
            >
              Contact
            </a>
          </FooterCol>

          <FooterCol title="Legal">
            <FooterLink to="/terms">Terms of Service</FooterLink>
            <FooterLink to="/privacy">Privacy Policy</FooterLink>
          </FooterCol>
        </div>

        <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} Stacked Alchemist LLC. All rights reserved.
          </p>
          <p className="text-xs text-slate-600">
            Your stories stay yours. Export anytime.
          </p>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({ title, children }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 mb-3">{title}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

function FooterLink({ to, children }) {
  return (
    <Link to={to} className="block text-sm text-slate-400 hover:text-gold-400 transition-colors py-1">
      {children}
    </Link>
  )
}

/** Page hero block for interior marketing pages */
export function MarketingHero({ eyebrow, title, subtitle }) {
  return (
    <section className="max-w-3xl mx-auto text-center px-5 pt-10 sm:pt-14 pb-12">
      {eyebrow && (
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-500/80 mb-4">
          {eyebrow}
        </p>
      )}
      <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-slate-50 tracking-tight leading-tight">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-5 text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
    </section>
  )
}
