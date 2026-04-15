/**
 * Firestore Sanitization Utilities
 *
 * IMPORTANT: Firestore FieldValues (serverTimestamp, arrayUnion, arrayRemove,
 * deleteField, increment) are special sentinel objects that must pass through
 * the sanitizer untouched. We detect them by checking that the value is NOT a
 * plain object (i.e., its prototype is not Object.prototype). Class instances
 * from the Firebase SDK satisfy this check and are left as-is.
 *
 * Firestore rejects writes that contain:
 *   - undefined values (any field)
 *   - nested arrays (arrays inside arrays)
 *
 * Safe values that are deliberately preserved: null, false, 0, "", FieldValues
 *
 * Usage:
 *   import { sanitizeForFirestore } from '../utils/sanitizeForFirestore'
 *   await updateDoc(ref, sanitizeForFirestore(payload))
 */

/**
 * Returns true if value is a plain JS object (NOT a class instance, Date,
 * Firebase FieldValue, etc.). Only plain objects are recursed into.
 */
function isPlainObject(value) {
  if (typeof value !== 'object' || value === null) return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

/**
 * Recursively removes undefined values from objects and arrays.
 * Does NOT mutate the input. Leaves Firestore FieldValues intact.
 */
export function removeUndefinedDeep(value) {
  if (value === undefined) return undefined          // signal to parent to drop this key
  if (value === null)      return null
  if (typeof value !== 'object') return value        // string, number, boolean — pass through
  if (!isPlainObject(value) && !Array.isArray(value)) return value  // FieldValue / class instance

  if (Array.isArray(value)) {
    return value
      .filter(item => item !== undefined)
      .map(item => removeUndefinedDeep(item))
  }

  // Plain object
  const out = {}
  for (const [k, v] of Object.entries(value)) {
    const cleaned = removeUndefinedDeep(v)
    if (cleaned !== undefined) {                     // drop keys whose value was undefined
      out[k] = cleaned
    }
  }
  return out
}

/**
 * Recursively flattens nested arrays (array-of-arrays) within object values.
 *
 * Firestore disallows nested arrays anywhere in a document.
 * Arrays of [x,y] coordinate pairs (e.g. faction border points) are the
 * most common source of this in Axiom.
 *
 * Coordinate pairs [[x0,y0],[x1,y1]] → [x0,y0,x1,y1] (flat number array).
 * If you need to restore the pair format for rendering, use:
 *   const pairs = flat.reduce((acc, _, i) => i % 2 === 0 ? [...acc, [flat[i], flat[i+1]]] : acc, [])
 *
 * Does NOT mutate the input.
 */
export function flattenNestedArraysDeep(value) {
  if (value === null || value === undefined) return value
  if (typeof value !== 'object') return value
  if (!isPlainObject(value) && !Array.isArray(value)) return value  // FieldValue / class instance

  if (Array.isArray(value)) {
    const hasNestedArray = value.some(item => Array.isArray(item))
    if (hasNestedArray) {
      // Flatten one level, then recurse to catch deeper nesting
      return flattenNestedArraysDeep(value.flat())
    }
    return value.map(item => flattenNestedArraysDeep(item))
  }

  // Plain object — recurse into values
  const out = {}
  for (const [k, v] of Object.entries(value)) {
    out[k] = flattenNestedArraysDeep(v)
  }
  return out
}

/**
 * Master sanitizer — apply this to every Firestore write payload.
 *
 * Pass 1: strip undefined
 * Pass 2: flatten nested arrays
 *
 * Preserves: null, false, 0, "", [], Firestore FieldValues (serverTimestamp, arrayUnion, etc.)
 */
export function sanitizeForFirestore(payload) {
  if (payload === null || payload === undefined) return payload
  if (typeof payload !== 'object') return payload

  const pass1 = removeUndefinedDeep(payload)
  const pass2 = flattenNestedArraysDeep(pass1)
  return pass2
}
