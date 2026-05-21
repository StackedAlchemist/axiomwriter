/**
 * WritingThemeContext
 *
 * Manages the immersive writing environment theme — completely separate from the
 * existing light/dark mode ThemeContext, which it does not touch.
 *
 * Responsibilities:
 *  - Persist the chosen theme id to localStorage
 *  - Expose currentTheme (full theme object), setTheme, and availableThemes
 *  - Write a `data-writing-env` attribute on <html> so pure CSS can react to
 *    the active theme without needing React context everywhere
 *
 * Future extension points:
 *  - Replace localStorage with per-project Firestore read in ProjectDetail
 *  - Expose currentTheme.aiMode to Claude prompts in ComposerPanel
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { THEMES, THEME_MAP, DEFAULT_THEME } from '../themes/themes'

const WritingThemeContext = createContext(null)

const STORAGE_KEY = 'axiom-writing-theme'

export function WritingThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return (saved && THEME_MAP[saved]) ? saved : DEFAULT_THEME.id
    } catch {
      return DEFAULT_THEME.id
    }
  })

  const currentTheme = THEME_MAP[themeId] ?? DEFAULT_THEME

  // Keep <html data-writing-env="..."> in sync and expose accent as CSS var
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-writing-env', themeId === 'none' ? '' : themeId)
    if (currentTheme.id !== 'none') {
      root.style.setProperty('--theme-accent-rgb', currentTheme.accentRgb)
    } else {
      root.style.removeProperty('--theme-accent-rgb')
    }
    return () => {
      root.setAttribute('data-writing-env', '')
      root.style.removeProperty('--theme-accent-rgb')
    }
  }, [themeId, currentTheme])

  // Persist and apply
  const setTheme = useCallback((id) => {
    if (!THEME_MAP[id]) return
    setThemeId(id)
    try { localStorage.setItem(STORAGE_KEY, id) } catch {}
  }, [])

  // Future: setThemeForProject(projectId, themeId) → updateDoc in Firestore
  // Future: loadThemeForProject(projectId) → getDoc, then setTheme()

  return (
    <WritingThemeContext.Provider value={{ currentTheme, setTheme, availableThemes: THEMES }}>
      {children}
    </WritingThemeContext.Provider>
  )
}

export function useWritingTheme() {
  const ctx = useContext(WritingThemeContext)
  if (!ctx) throw new Error('useWritingTheme must be used inside WritingThemeProvider')
  return ctx
}
