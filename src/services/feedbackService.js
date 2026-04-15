/**
 * feedbackService — structured feedback submissions.
 *
 * Each feedback type goes to its own Firestore collection so they can be
 * queried and triaged independently:
 *   bugReports         → UI bugs, crash reports
 *   featureRequests    → new feature ideas
 *   supportQuestions   → how-to questions
 *
 * The legacy `feedback` collection is still written to for backward-compat
 * so any existing data is not lost.
 */

import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'
import { sanitizeForFirestore } from '../utils/sanitizeForFirestore'

const APP_VERSION = '0.2.0-beta'

function basePayload(userId, userEmail, page) {
  return {
    userId:     userId     || 'anonymous',
    userEmail:  userEmail  || '',
    page:       page       || '/',
    userAgent:  typeof navigator !== 'undefined' ? navigator.userAgent : '',
    appVersion: APP_VERSION,
    status:     'new',      // new | reviewed | resolved
    createdAt:  serverTimestamp(),
  }
}

// ── Bug Report ────────────────────────────────────────────────────────────────

/**
 * @param {object} opts
 * @param {string} opts.userId
 * @param {string} opts.userEmail
 * @param {string} opts.page
 * @param {string} opts.what      - "What happened?"
 * @param {string} opts.doing     - "What were you doing?"
 * @param {string} [opts.severity] - 'low' | 'medium' | 'high'
 */
export async function submitBugReport({ userId, userEmail, page, what, doing, severity = 'medium' }) {
  const payload = sanitizeForFirestore({
    ...basePayload(userId, userEmail, page),
    what:     what.trim(),
    doing:    (doing || '').trim(),
    severity,
  })
  await Promise.all([
    addDoc(collection(db, 'bugReports'), payload),
    // Legacy write — keeps existing dashboard data intact
    addDoc(collection(db, 'feedback'), sanitizeForFirestore({
      ...payload,
      type:    'bug',
      message: `WHAT HAPPENED:\n${what}\n\nWHAT WERE YOU DOING:\n${doing}`,
    })),
  ])
}

// ── Feature Request ───────────────────────────────────────────────────────────

/**
 * @param {object} opts
 * @param {string} opts.userId
 * @param {string} opts.userEmail
 * @param {string} opts.page
 * @param {string} opts.what      - "What do you want?"
 * @param {string} opts.problem   - "What problem does it solve?"
 */
export async function submitFeatureRequest({ userId, userEmail, page, what, problem }) {
  const payload = sanitizeForFirestore({
    ...basePayload(userId, userEmail, page),
    what:    what.trim(),
    problem: (problem || '').trim(),
    votes:   1,
  })
  await Promise.all([
    addDoc(collection(db, 'featureRequests'), payload),
    addDoc(collection(db, 'feedback'), sanitizeForFirestore({
      ...payload,
      type:    'suggestion',
      message: `WHAT DO YOU WANT:\n${what}\n\nPROBLEM IT SOLVES:\n${problem}`,
    })),
  ])
}

// ── Support Question ──────────────────────────────────────────────────────────

/**
 * @param {object} opts
 * @param {string} opts.userId
 * @param {string} opts.userEmail
 * @param {string} opts.page
 * @param {string} opts.message   - the question text
 */
export async function submitSupportQuestion({ userId, userEmail, page, message }) {
  const payload = sanitizeForFirestore({
    ...basePayload(userId, userEmail, page),
    message: message.trim(),
  })
  await Promise.all([
    addDoc(collection(db, 'supportQuestions'), payload),
    addDoc(collection(db, 'feedback'), sanitizeForFirestore({
      ...payload,
      type: 'question',
    })),
  ])
}

// ── Optional: EmailJS notification ───────────────────────────────────────────

export async function notifyViaEmail({ type, userEmail, payload }) {
  const serviceId  = import.meta.env.VITE_EMAILJS_SERVICE_ID
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
  const publicKey  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY
  if (!serviceId || !templateId || !publicKey) return

  const message = typeof payload.message === 'string'
    ? payload.message
    : JSON.stringify(payload, null, 2)

  await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id:  serviceId,
      template_id: templateId,
      user_id:     publicKey,
      template_params: {
        to_email:      'hello@stackedalchemist.dev',
        from_email:    userEmail || 'Anonymous',
        feedback_type: type.toUpperCase(),
        message,
        page:          payload.page || '/',
        app_version:   APP_VERSION,
      },
    }),
  }).catch(() => {}) // non-fatal
}
