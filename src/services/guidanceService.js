/**
 * guidanceService — user progress + onboarding state.
 *
 * User progress lives at: userProgress/{uid}
 * (top-level collection, one doc per user)
 *
 * Also handles in-app tips and "next step" prompts via the `tipsShown` array
 * so we never show the same tip twice.
 */

import {
  doc, getDoc, setDoc, updateDoc,
  onSnapshot, serverTimestamp, arrayUnion,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { normalizeUserProgress } from '../schemas/index'

const ref = (uid) => doc(db, 'userProgress', uid)

// ── Bootstrap ─────────────────────────────────────────────────────────────────

/**
 * Create a fresh userProgress doc if it doesn't exist yet.
 */
export async function bootstrapUserProgress(uid) {
  const snap = await getDoc(ref(uid))
  if (snap.exists()) return normalizeUserProgress(snap)

  const initial = {
    uid,
    onboardingComplete: false,
    onboardingSkipped:  false,
    completedSteps:     [],
    currentTip:         null,
    tipsShown:          [],
    updatedAt:          serverTimestamp(),
  }
  await setDoc(ref(uid), initial)
  return normalizeUserProgress({ id: uid, ...initial })
}

// ── Read ──────────────────────────────────────────────────────────────────────

export async function getUserProgress(uid) {
  const snap = await getDoc(ref(uid))
  return snap.exists() ? normalizeUserProgress(snap) : null
}

export function subscribeToUserProgress(uid, onChange, onError) {
  return onSnapshot(
    ref(uid),
    snap => onChange(snap.exists() ? normalizeUserProgress(snap) : null),
    err  => onError?.(err),
  )
}

// ── Onboarding ────────────────────────────────────────────────────────────────

export async function completeOnboarding(uid, { skipped = false } = {}) {
  await setDoc(ref(uid), {
    uid,
    onboardingComplete: true,
    onboardingSkipped:  skipped,
    updatedAt:          serverTimestamp(),
  }, { merge: true })
}

export async function markStepComplete(uid, stepId) {
  await setDoc(ref(uid), {
    completedSteps: arrayUnion(stepId),
    updatedAt:      serverTimestamp(),
  }, { merge: true })
}

// ── Tips ──────────────────────────────────────────────────────────────────────

export async function markTipShown(uid, tipId) {
  await setDoc(ref(uid), {
    tipsShown: arrayUnion(tipId),
    updatedAt: serverTimestamp(),
  }, { merge: true })
}

export async function setCurrentTip(uid, tipId) {
  await updateDoc(ref(uid), {
    currentTip: tipId,
    updatedAt:  serverTimestamp(),
  })
}

// ── Project activity log ──────────────────────────────────────────────────────

/**
 * Log a user activity event to the `projectActivity` collection.
 * Used for the dashboard "recently active" feed and analytics.
 */
export async function logActivity(uid, projectId, { type, entityId, entityType, summary }) {
  const { addDoc, collection } = await import('firebase/firestore')
  await addDoc(collection(db, 'projectActivity'), {
    uid,
    projectId,
    type,         // e.g. 'scene_saved' | 'character_created' | 'thread_linked'
    entityId:     entityId     || null,
    entityType:   entityType   || null,
    summary:      summary      || '',
    createdAt:    serverTimestamp(),
  }).catch(err => console.warn('[guidanceService] logActivity failed', err))
}
