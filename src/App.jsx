import React, { lazy, Suspense, useState, useEffect } from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { WritingThemeProvider } from './contexts/WritingThemeContext'
import { doc, getDoc } from 'firebase/firestore'
import { db } from './firebase/config'
import InstallPrompt from './components/pwa/InstallPrompt'
import OfflineIndicator from './components/pwa/OfflineIndicator'
import FeedbackWidget from './components/pwa/FeedbackWidget'
import ProtectedRoute from './components/common/ProtectedRoute'
import ErrorBoundary from './components/common/ErrorBoundary'
import AppShell from './components/layout/AppShell'
import OnboardingFlow from './components/onboarding/OnboardingFlow'

// ── Auth (small, load eagerly) ────────────────────────────────────────────────
import Login from './components/auth/Login'
import Signup from './components/auth/Signup'
import ForgotPassword from './components/auth/ForgotPassword'

// ── Lazy route components ─────────────────────────────────────────────────────
const Dashboard         = lazy(() => import('./pages/Dashboard'))
const Projects          = lazy(() => import('./pages/Projects'))
const ProjectDetail     = lazy(() => import('./pages/ProjectDetail'))
const Characters        = lazy(() => import('./pages/Characters'))
const CharacterDetail   = lazy(() => import('./pages/CharacterDetail'))
const LoreBible         = lazy(() => import('./pages/LoreBible'))
const ThreadDashboard   = lazy(() => import('./pages/ThreadDashboard'))
const DevEditDashboard  = lazy(() => import('./pages/DevEditDashboard'))
const WorldMap          = lazy(() => import('./pages/WorldMap'))
const CoverStudio       = lazy(() => import('./pages/CoverStudio'))
const PublishingExport  = lazy(() => import('./pages/PublishingExport'))
const Settings          = lazy(() => import('./pages/Settings'))
const UserProfile       = lazy(() => import('./components/profile/UserProfile'))
const SeriesView        = lazy(() => import('./pages/SeriesView'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="w-5 h-5 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
    </div>
  )
}

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

// ── Onboarding gate (reads Firestore once per session) ───────────────────────
function OnboardingGate() {
  const { currentUser } = useAuth()
  const [checked, setChecked] = useState(false)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)

  useEffect(() => {
    if (DEMO_MODE || !currentUser) { setChecked(true); return }
    getDoc(doc(db, 'users', currentUser.uid)).then(snap => {
      const complete = snap.data()?.onboardingComplete ?? false
      setNeedsOnboarding(!complete)
      setChecked(true)
    }).catch(() => setChecked(true))
  }, [currentUser])

  if (!checked) return <PageLoader />
  if (needsOnboarding) return <OnboardingFlow onComplete={() => setNeedsOnboarding(false)} />
  return <Outlet />
}

export default function App() {
  return (
    <WritingThemeProvider>
    <AuthProvider>
      <ErrorBoundary>
        <Routes>
          {/* Public auth routes */}
          <Route path="/login"           element={<Login />} />
          <Route path="/signup"          element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected app routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<OnboardingGate />}>

              {/* Full-screen project routes — no AppShell */}
              <Route path="/projects/:projectId"                          element={<Suspense fallback={<PageLoader />}><ErrorBoundary><ProjectDetail /></ErrorBoundary></Suspense>} />
              <Route path="/projects/:projectId/characters"               element={<Suspense fallback={<PageLoader />}><ErrorBoundary><Characters /></ErrorBoundary></Suspense>} />
              <Route path="/projects/:projectId/characters/:characterId"  element={<Suspense fallback={<PageLoader />}><ErrorBoundary><CharacterDetail /></ErrorBoundary></Suspense>} />
              <Route path="/projects/:projectId/lore"                     element={<Suspense fallback={<PageLoader />}><ErrorBoundary><LoreBible /></ErrorBoundary></Suspense>} />
              <Route path="/projects/:projectId/threads"                  element={<Suspense fallback={<PageLoader />}><ErrorBoundary><ThreadDashboard /></ErrorBoundary></Suspense>} />
              <Route path="/projects/:projectId/dev-edit"                 element={<Suspense fallback={<PageLoader />}><ErrorBoundary><DevEditDashboard /></ErrorBoundary></Suspense>} />
              <Route path="/projects/:projectId/map"                      element={<Suspense fallback={<PageLoader />}><ErrorBoundary><WorldMap /></ErrorBoundary></Suspense>} />
              <Route path="/projects/:projectId/cover"                    element={<Suspense fallback={<PageLoader />}><ErrorBoundary><CoverStudio /></ErrorBoundary></Suspense>} />
              <Route path="/projects/:projectId/publish"                  element={<Suspense fallback={<PageLoader />}><ErrorBoundary><PublishingExport /></ErrorBoundary></Suspense>} />
              <Route path="/series/:seriesId"                             element={<Suspense fallback={<PageLoader />}><ErrorBoundary><SeriesView /></ErrorBoundary></Suspense>} />

              {/* Standard shell routes */}
              <Route element={<AppShell />}>
                <Route path="/dashboard" element={<Suspense fallback={<PageLoader />}><ErrorBoundary><Dashboard /></ErrorBoundary></Suspense>} />
                <Route path="/projects"  element={<Suspense fallback={<PageLoader />}><ErrorBoundary><Projects /></ErrorBoundary></Suspense>} />
                <Route path="/settings"  element={<Suspense fallback={<PageLoader />}><ErrorBoundary><Settings /></ErrorBoundary></Suspense>} />
                <Route path="/profile"   element={<Suspense fallback={<PageLoader />}><ErrorBoundary><UserProfile /></ErrorBoundary></Suspense>} />
              </Route>

            </Route>
          </Route>

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </ErrorBoundary>

      {/* ── PWA & Beta overlays (always mounted) ───────────────────────── */}
      <OfflineIndicator />
      <InstallPrompt />
      <FeedbackWidget />
    </AuthProvider>
    </WritingThemeProvider>
  )
}
