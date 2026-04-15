/**
 * relationshipService — the backbone of bidirectional linking.
 *
 * All cross-entity relationship updates are centralised here using Firestore
 * batch writes so links are always consistent (both sides updated atomically).
 *
 * Relationships are stored two ways:
 *  1. As array fields on each entity doc (fast reads, used by existing hooks)
 *  2. As explicit documents in the `relationships` top-level collection (queryable)
 *
 * This service writes both. Callers never need to manage both themselves.
 */

import {
  doc, collection, addDoc, deleteDoc, getDocs,
  writeBatch, query, where, serverTimestamp,
  arrayUnion, arrayRemove,
} from 'firebase/firestore'
import { db } from '../firebase/config'

// ── Helpers ───────────────────────────────────────────────────────────────────

function projectRef(projectId) {
  return `projects/${projectId}`
}

function entityRef(projectId, entityType, entityId) {
  // All entities currently live under projects/{id}/{type}/{id}
  const COLLECTIONS = {
    scene:     'scenes',
    character: 'characters',
    thread:    'threads',
    lore:      'lore',
  }
  const col = COLLECTIONS[entityType]
  if (!col) throw new Error(`[relationshipService] Unknown entity type: ${entityType}`)
  return doc(db, 'projects', projectId, col, entityId)
}

async function findRelationshipDoc(projectId, fromType, fromId, toType, toId) {
  const q = query(
    collection(db, 'relationships'),
    where('projectId', '==', projectId),
    where('fromType', '==', fromType),
    where('fromId', '==', fromId),
    where('toType', '==', toType),
    where('toId', '==', toId),
  )
  const snap = await getDocs(q)
  return snap.empty ? null : snap.docs[0]
}

// ── Core: generic link / unlink ───────────────────────────────────────────────

/**
 * Link two entities.
 * - fromField: the array field on the `from` doc to append `toId`
 * - toField:   the array field on the `to` doc to append `fromId`
 */
export async function linkEntities({
  projectId,
  fromType, fromId, fromField,
  toType,   toId,   toField,
  label = 'linked',
}) {
  const batch = writeBatch(db)

  // Update array fields on both entity docs
  batch.update(entityRef(projectId, fromType, fromId), {
    [fromField]: arrayUnion(toId),
    updatedAt: serverTimestamp(),
  })
  batch.update(entityRef(projectId, toType, toId), {
    [toField]: arrayUnion(fromId),
    updatedAt: serverTimestamp(),
  })

  await batch.commit()

  // Write explicit relationship doc (fire & forget — not blocking UX)
  addDoc(collection(db, 'relationships'), {
    projectId,
    fromType, fromId,
    toType,   toId,
    label,
    meta: {},
    createdAt: serverTimestamp(),
  }).catch(err => console.warn('[relationshipService] relationship doc write failed', err))
}

/**
 * Unlink two entities.
 */
export async function unlinkEntities({
  projectId,
  fromType, fromId, fromField,
  toType,   toId,   toField,
}) {
  const batch = writeBatch(db)

  batch.update(entityRef(projectId, fromType, fromId), {
    [fromField]: arrayRemove(toId),
    updatedAt: serverTimestamp(),
  })
  batch.update(entityRef(projectId, toType, toId), {
    [toField]: arrayRemove(fromId),
    updatedAt: serverTimestamp(),
  })

  await batch.commit()

  // Remove explicit relationship doc if it exists
  findRelationshipDoc(projectId, fromType, fromId, toType, toId)
    .then(d => d && deleteDoc(d.ref))
    .catch(err => console.warn('[relationshipService] relationship doc delete failed', err))
}

// ── Typed helpers — Thread ────────────────────────────────────────────────────

export function linkThreadToScene(projectId, threadId, sceneId) {
  return linkEntities({
    projectId,
    fromType: 'thread',    fromId: threadId,  fromField: 'linkedScenes',
    toType:   'scene',     toId:   sceneId,   toField:   'linkedThreadIds',
    label: 'appears-in',
  })
}

export function unlinkThreadFromScene(projectId, threadId, sceneId) {
  return unlinkEntities({
    projectId,
    fromType: 'thread',    fromId: threadId,  fromField: 'linkedScenes',
    toType:   'scene',     toId:   sceneId,   toField:   'linkedThreadIds',
  })
}

export function linkThreadToCharacter(projectId, threadId, characterId) {
  return linkEntities({
    projectId,
    fromType: 'thread',    fromId: threadId,    fromField: 'linkedCharacters',
    toType:   'character', toId:   characterId, toField:   'linkedThreadIds',
    label: 'linked',
  })
}

export function unlinkThreadFromCharacter(projectId, threadId, characterId) {
  return unlinkEntities({
    projectId,
    fromType: 'thread',    fromId: threadId,    fromField: 'linkedCharacters',
    toType:   'character', toId:   characterId, toField:   'linkedThreadIds',
  })
}

export function linkThreadToLoreEntry(projectId, threadId, loreId) {
  return linkEntities({
    projectId,
    fromType: 'thread', fromId: threadId, fromField: 'linkedLore',
    toType:   'lore',   toId:   loreId,   toField:   'linkedThreadIds',
    label: 'linked',
  })
}

export function unlinkThreadFromLoreEntry(projectId, threadId, loreId) {
  return unlinkEntities({
    projectId,
    fromType: 'thread', fromId: threadId, fromField: 'linkedLore',
    toType:   'lore',   toId:   loreId,   toField:   'linkedThreadIds',
  })
}

// ── Typed helpers — Character ─────────────────────────────────────────────────

export function linkCharacterToScene(projectId, characterId, sceneId) {
  return linkEntities({
    projectId,
    fromType: 'character', fromId: characterId, fromField: 'linkedSceneIds',
    toType:   'scene',     toId:   sceneId,     toField:   'linkedCharIds',
    label: 'appears-in',
  })
}

export function unlinkCharacterFromScene(projectId, characterId, sceneId) {
  return unlinkEntities({
    projectId,
    fromType: 'character', fromId: characterId, fromField: 'linkedSceneIds',
    toType:   'scene',     toId:   sceneId,     toField:   'linkedCharIds',
  })
}

// ── Query helpers ─────────────────────────────────────────────────────────────

/**
 * Get all relationships for a project (useful for dashboards / analytics).
 */
export async function getProjectRelationships(projectId) {
  const q = query(
    collection(db, 'relationships'),
    where('projectId', '==', projectId),
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

/**
 * Get all relationships involving a specific entity.
 */
export async function getEntityRelationships(projectId, entityType, entityId) {
  const [fromSnap, toSnap] = await Promise.all([
    getDocs(query(
      collection(db, 'relationships'),
      where('projectId', '==', projectId),
      where('fromType', '==', entityType),
      where('fromId', '==', entityId),
    )),
    getDocs(query(
      collection(db, 'relationships'),
      where('projectId', '==', projectId),
      where('toType', '==', entityType),
      where('toId', '==', entityId),
    )),
  ])
  const docs = [...fromSnap.docs, ...toSnap.docs]
  return docs.map(d => ({ id: d.id, ...d.data() }))
}
