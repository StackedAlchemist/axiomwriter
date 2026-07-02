import { useState, useEffect } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../contexts/AuthContext'

// ── Tier definitions ──────────────────────────────────────────────────────────
export const TIERS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    projectLimit: 1,
    aiLimit: 0,
    features: [
      'manuscript_editor', 'basic_export', 'character_list',
    ],
  },
  writer: {
    id: 'writer',
    name: 'Writer',
    price: 9.99,
    projectLimit: Infinity,
    aiLimit: 100,
    features: [
      'manuscript_editor', 'basic_export', 'character_list',
      'unlimited_projects', 'all_layouts', 'voice_dna', 'lore_bible',
      'thread_detector', 'series',
    ],
  },
  composer: {
    id: 'composer',
    name: 'Composer',
    price: 19.99,
    projectLimit: Infinity,
    aiLimit: 1000,
    features: [
      'manuscript_editor', 'basic_export', 'character_list',
      'unlimited_projects', 'all_layouts', 'voice_dna', 'lore_bible',
      'thread_detector', 'series',
      'momentum_engine', 'composer_mode', 'map_builder',
      'cover_generator', 'publishing_export', 'unlimited_ai',
    ],
  },
  architect: {
    id: 'architect',
    name: 'Architect',
    price: 39.99,
    projectLimit: Infinity,
    aiLimit: 2000,
    features: [
      'manuscript_editor', 'basic_export', 'character_list',
      'unlimited_projects', 'all_layouts', 'voice_dna', 'lore_bible',
      'thread_detector', 'series',
      'momentum_engine', 'composer_mode', 'map_builder',
      'cover_generator', 'publishing_export', 'unlimited_ai',
      'collaboration', 'tracked_changes', 'beta_reader_portal',
      'reader_sharing',
    ],
  },
}

// Feature → minimum tier required
export const FEATURE_TIER = {
  manuscript_editor:  'free',
  basic_export:       'free',
  character_list:     'free',
  unlimited_projects: 'writer',
  all_layouts:        'writer',
  voice_dna:          'writer',
  lore_bible:         'writer',
  thread_detector:    'writer',
  series:             'writer',
  momentum_engine:    'composer',
  composer_mode:      'composer',
  map_builder:        'composer',
  cover_generator:    'composer',
  publishing_export:  'composer',
  unlimited_ai:       'composer',
  collaboration:        'architect',
  realtime_editing:     'architect',
  tracked_changes:      'architect',
  beta_reader_portal:   'architect',
  reader_sharing:       'architect',
}

const TIER_ORDER = ['free', 'writer', 'composer', 'architect']

const FOUNDER_EMAILS = new Set([
  'billylw75@gmail.com',
  'stackedalchemist@gmail.com',
])

function tierLevel(tierId) {
  return TIER_ORDER.indexOf(tierId ?? 'free')
}

export function useSubscription() {
  const { currentUser } = useAuth()
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUser) { setLoading(false); return }

    const ref = doc(db, 'users', currentUser.uid)
    const unsub = onSnapshot(ref, snap => {
      const data = snap.data()
      setSubscription(data?.subscription ?? null)
      setLoading(false)
    }, () => setLoading(false))

    return unsub
  }, [currentUser])

  const isFounder = FOUNDER_EMAILS.has(currentUser?.email?.toLowerCase())

  // 'trialing' grants the same access as 'active' — free-trial users get the
  // full tier they're trying.
  const tierId = isFounder
    ? 'architect'
    : ['active', 'trialing'].includes(subscription?.status)
      ? (subscription?.tier ?? 'free')
      : 'free'

  const tier = TIERS[tierId] ?? TIERS.free

  /** True if the user's tier includes the given feature */
  function canAccess(feature) {
    const required = FEATURE_TIER[feature]
    if (!required) return true // unknown feature = open
    return tierLevel(tierId) >= tierLevel(required)
  }

  /** True if user is at or above the given tier */
  function isAtLeast(requiredTier) {
    return tierLevel(tierId) >= tierLevel(requiredTier)
  }

  return {
    subscription,
    loading,
    tierId,
    tier,
    canAccess,
    isAtLeast,
  }
}
