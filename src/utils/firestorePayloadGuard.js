/**
 * Firestore Payload Size Guard
 *
 * Firestore's hard document size limit is 1,048,576 bytes (~1 MB).
 * Large payloads most commonly come from:
 *   - Base64-encoded canvas images (map backgrounds)
 *   - Large HTML scene content
 *   - Accumulated embedded arrays
 *
 * Usage:
 *   import { assertFirestoreSafeSize } from '../utils/firestorePayloadGuard'
 *   assertFirestoreSafeSize(payload, '[useWorldMap] persistMap')
 *   await updateDoc(ref, payload)
 */

const SAFE_THRESHOLD_BYTES   = 900_000   // ~900 KB — warn at this level
const BLOCKED_THRESHOLD_BYTES = 980_000  // ~980 KB — block before Firestore rejects

/**
 * Estimates the serialized size of a payload in bytes.
 * Uses JSON.stringify as a proxy — actual Firestore encoding is similar.
 */
export function estimatePayloadSize(payload) {
  try {
    return new TextEncoder().encode(JSON.stringify(payload)).length
  } catch {
    // Circular refs or Firestore FieldValues that can't be serialized —
    // treat as unknown size rather than crashing.
    return 0
  }
}

/**
 * Checks payload size and throws a developer-friendly error if it would
 * exceed Firestore's document limit.
 *
 * @param {object} payload     - The data object about to be written
 * @param {string} contextLabel - Where this write is happening (for logs)
 * @throws {Error} if payload exceeds BLOCKED_THRESHOLD_BYTES
 */
export function assertFirestoreSafeSize(payload, contextLabel = 'Firestore write') {
  const bytes = estimatePayloadSize(payload)
  if (bytes === 0) return  // couldn't estimate — allow through

  if (bytes > BLOCKED_THRESHOLD_BYTES) {
    // Find the largest field to help diagnose
    let largestKey = 'unknown'
    let largestSize = 0
    if (typeof payload === 'object' && payload !== null) {
      for (const [k, v] of Object.entries(payload)) {
        const fieldSize = estimatePayloadSize(v)
        if (fieldSize > largestSize) {
          largestSize = fieldSize
          largestKey = k
        }
      }
    }
    const msg = `[${contextLabel}] BLOCKED — payload is ${(bytes / 1024).toFixed(0)} KB, exceeds ${(BLOCKED_THRESHOLD_BYTES / 1024).toFixed(0)} KB Firestore safety limit. Largest field: "${largestKey}" (${(largestSize / 1024).toFixed(0)} KB). Move large binary data to Firebase Storage.`
    console.error(msg)
    throw new Error(msg)
  }

  if (bytes > SAFE_THRESHOLD_BYTES) {
    console.warn(`[${contextLabel}] Payload is ${(bytes / 1024).toFixed(0)} KB — approaching Firestore limit. Consider moving large fields to Firebase Storage.`)
  }
}
