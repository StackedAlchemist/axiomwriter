import React from 'react'
import { useLocation, NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { Feather, Sun, Moon, Menu } from 'lucide-react'

const ROUTE_META = {
  '/dashboard': { title: 'Dashboard',  subtitle: 'Your writing command center' },
  '/projects':  { title: 'Projects',   subtitle: 'Manage your stories'          },
  '/settings':  { title: 'Settings',   subtitle: 'Preferences & account'        },
  '/profile':   { title: 'Profile',    subtitle: 'Your writer identity'          },
}

export default function Header({ onMenuClick }) {
  const location  = useLocation()
  const { userProfile, currentUser } = useAuth()
  const { theme, toggle } = useTheme()

  const meta = ROUTE_META[location.pathname] || { title: 'Axiom', subtitle: '' }
  const displayName = userProfile?.displayName || currentUser?.displayName || 'Writer'

  return (
    <header className="h-14 flex items-center justify-between px-4 md:px-6 border-b border-axiom-border bg-axiom-surface/80 backdrop-blur-sm flex-shrink-0">
      {/* Left: hamburger (mobile) + page title */}
      <div className="flex items-center gap-3 min-w-0">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="md:hidden btn-icon flex-shrink-0"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="font-serif text-base md:text-lg font-semibold leading-tight truncate" style={{ color: 'var(--axiom-text)' }}>
            {meta.title}
          </h1>
          {meta.subtitle && (
            <p className="text-xs leading-tight hidden sm:block" style={{ color: 'var(--axiom-muted)' }}>
              {meta.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right: theme toggle + user greeting */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Dark / Light toggle */}
        <button
          onClick={toggle}
          className="btn-icon"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark'
            ? <Sun  className="w-4 h-4 text-gold-400" />
            : <Moon className="w-4 h-4 text-gold-500" />
          }
        </button>

        {/* User greeting */}
        <NavLink
          to="/profile"
          className="flex items-center gap-2 hover:bg-axiom-surface2 px-2 md:px-3 py-1.5 rounded-lg transition-colors"
        >
          <span className="text-xs hidden sm:block" style={{ color: 'var(--axiom-muted)' }}>
            Hi, <span className="font-medium" style={{ color: 'var(--axiom-text)' }}>{displayName.split(' ')[0]}</span>
          </span>
          <Feather className="w-3 h-3 text-gold-500" />
        </NavLink>
      </div>
    </header>
  )
}
