/**
 * Migration-safe normalizers for every Axiom entity type.
 *
 * Rules:
 *  - Missing arrays  → []
 *  - Missing nullable IDs → null
 *  - Missing counts  → 0
 *  - Missing strings → ''
 *  - Never break existing projects that lack new fields
 *  - Accepts either a raw Firestore DocumentSnapshot OR a plain {id, ...} object
 */

function fromSnap(snap) {
  if (snap && typeof snap.data === 'function') {
    return snap.exists() ? { id: snap.id, ...snap.data() } : null
  }
  return snap // already a plain object
}

// ─────────────────────────────────────────────────────────────────────────────
// Project
// ─────────────────────────────────────────────────────────────────────────────
export function normalizeProject(snap) {
  const raw = fromSnap(snap)
  if (!raw) return null
  return {
    id:             raw.id            ?? null,
    userId:         raw.userId        ?? raw.uid ?? null,  // Firestore field is `userId`
    title:          raw.title         ?? 'Untitled',
    description:    raw.description   ?? '',
    genre:          raw.genre         ?? '',
    targetWordCount:raw.targetWordCount?? 0,
    wordCount:      raw.wordCount     ?? 0,
    coverUrl:       raw.coverUrl      ?? null,
    status:         raw.status        ?? 'draft',
    // Manuscript structure lives embedded in project doc
    structure:      raw.structure     ?? { hasParts: false, chapters: [] },
    // Mode flags
    assistedMode:   raw.assistedMode  ?? false,
    // Series linkage
    seriesId:       raw.seriesId      ?? null,
    seriesOrder:    raw.seriesOrder   ?? null,
    // Timestamps
    createdAt:      raw.createdAt     ?? null,
    updatedAt:      raw.updatedAt     ?? null,
    // Preserve any extra fields
    ...omitKnown(raw, [
      'id','userId','uid','title','description','genre','targetWordCount','wordCount',
      'coverUrl','status','structure','assistedMode','seriesId','seriesOrder',
      'createdAt','updatedAt',
    ]),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Scene (content doc at projects/{id}/scenes/{id})
// ─────────────────────────────────────────────────────────────────────────────
export function normalizeScene(snap) {
  const raw = fromSnap(snap)
  if (!raw) return null
  return {
    id:             raw.id              ?? null,
    // content is stored in a separate Firestore doc; meta lives in structure
    content:        raw.content         ?? '',
    notes:          raw.notes           ?? '',
    // Meta fields that may be denormalised here or in structure
    title:          raw.title           ?? '',
    status:         raw.status          ?? 'planned',
    povCharacter:   raw.povCharacter    ?? '',
    tags:           Array.isArray(raw.tags)           ? raw.tags : [],
    linkedThreadIds:Array.isArray(raw.linkedThreadIds)? raw.linkedThreadIds : [],
    linkedCharIds:  Array.isArray(raw.linkedCharIds)  ? raw.linkedCharIds : [],
    wordCount:      raw.wordCount       ?? 0,
    updatedAt:      raw.updatedAt       ?? null,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Scene meta (the lightweight object embedded inside project.structure)
// ─────────────────────────────────────────────────────────────────────────────
export function normalizeSceneMeta(raw) {
  if (!raw) return null
  return {
    id:             raw.id              ?? null,
    title:          raw.title           ?? 'Untitled Scene',
    status:         raw.status          ?? 'planned',
    wordCount:      raw.wordCount       ?? 0,
    povCharacter:   raw.povCharacter    ?? '',
    tags:           Array.isArray(raw.tags)           ? raw.tags : [],
    linkedThreadIds:Array.isArray(raw.linkedThreadIds)? raw.linkedThreadIds : [],
    linkedCharIds:  Array.isArray(raw.linkedCharIds)  ? raw.linkedCharIds  : [],
    // location pin
    locationId:     raw.locationId      ?? null,
    // event linkage
    linkedEventIds: Array.isArray(raw.linkedEventIds) ? raw.linkedEventIds : [],
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Character
// ─────────────────────────────────────────────────────────────────────────────
export function normalizeCharacter(snap) {
  const raw = fromSnap(snap)
  if (!raw) return null
  return {
    id:                   raw.id                   ?? null,
    projectId:            raw.projectId            ?? null,
    name:                 raw.name                 ?? '',
    aliases:              Array.isArray(raw.aliases)              ? raw.aliases : [],
    role:                 raw.role                 ?? 'supporting',
    importance:           raw.importance           ?? 1,
    // Physical
    physicalDescription:  raw.physicalDescription  ?? {
      age: '', height: '', build: '', hairColor: '', eyeColor: '',
      distinctiveFeatures: '', style: '',
    },
    // Legacy flat fields (backward-compat)
    age:                  raw.age                  ?? '',
    appearance:           raw.appearance           ?? '',
    style:                raw.style                ?? '',
    distinguishingFeatures: raw.distinguishingFeatures ?? '',
    // Psychology
    backstory:            raw.backstory            ?? '',
    motivations:          raw.motivations          ?? '',
    fears:                raw.fears                ?? '',
    internalConflict:     raw.internalConflict     ?? '',
    externalConflict:     raw.externalConflict     ?? '',
    arcSummary:           raw.arcSummary           ?? '',
    customFields:         Array.isArray(raw.customFields) ? raw.customFields : [],
    // Voice DNA
    voiceDna:             raw.voiceDna             ?? {
      speechPatterns: '', vocabularyLevel: '', sentenceLengthPref: '',
      commonPhrases: [], neverSayPhrases: [], humorStyle: '',
      tellsLying: '', tellsStressed: '', whenWantsSomething: '', whenThreatened: '',
    },
    // Relationships + history
    relationshipMap:      Array.isArray(raw.relationshipMap)      ? raw.relationshipMap : [],
    sceneHistory:         Array.isArray(raw.sceneHistory)         ? raw.sceneHistory : [],
    importanceHistory:    Array.isArray(raw.importanceHistory)    ? raw.importanceHistory : [],
    momentumScore:        raw.momentumScore        ?? 0,
    photoUrl:             raw.photoUrl             ?? null,
    // Timestamps
    createdAt:            raw.createdAt            ?? null,
    updatedAt:            raw.updatedAt            ?? null,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Thread
// ─────────────────────────────────────────────────────────────────────────────
export function normalizeThread(snap) {
  const raw = fromSnap(snap)
  if (!raw) return null
  return {
    id:                         raw.id                         ?? null,
    projectId:                  raw.projectId                  ?? null,
    title:                      raw.title                      ?? 'Untitled Thread',
    description:                raw.description                ?? '',
    type:                       raw.type                       ?? 'mystery',
    status:                     raw.status                     ?? 'active',
    resolutionNotes:            raw.resolutionNotes            ?? '',
    introducedInScene:          raw.introducedInScene          ?? null,
    introducedInChapter:        raw.introducedInChapter        ?? null,
    lastReferencedInScene:      raw.lastReferencedInScene      ?? null,
    lastReferencedInChapter:    raw.lastReferencedInChapter    ?? null,
    scenesAppearingIn:          Array.isArray(raw.scenesAppearingIn)          ? raw.scenesAppearingIn : [],
    linkedScenes:               Array.isArray(raw.linkedScenes)               ? raw.linkedScenes : [],
    linkedCharacters:           Array.isArray(raw.linkedCharacters)           ? raw.linkedCharacters : [],
    linkedLore:                 Array.isArray(raw.linkedLore)                 ? raw.linkedLore : [],
    dormancyCount:              raw.dormancyCount              ?? 0,
    createdAt:                  raw.createdAt                  ?? null,
    updatedAt:                  raw.updatedAt                  ?? null,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Lore Entry
// ─────────────────────────────────────────────────────────────────────────────
export function normalizeLoreEntry(snap) {
  const raw = fromSnap(snap)
  if (!raw) return null
  return {
    id:                 raw.id                 ?? null,
    projectId:          raw.projectId          ?? null,
    title:              raw.title              ?? '',
    category:           raw.category           ?? '',
    content:            raw.content            ?? '',
    tags:               Array.isArray(raw.tags)               ? raw.tags : [],
    relatedCharacters:  Array.isArray(raw.relatedCharacters)  ? raw.relatedCharacters : [],
    relatedLocations:   Array.isArray(raw.relatedLocations)   ? raw.relatedLocations : [],
    flexibility:        raw.flexibility        ?? 'flexible',
    // Gap tracking
    hasGap:             raw.hasGap             ?? false,
    gapDescription:     raw.gapDescription     ?? '',
    createdAt:          raw.createdAt          ?? null,
    updatedAt:          raw.updatedAt          ?? null,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Location (pins on the world map)
// ─────────────────────────────────────────────────────────────────────────────
export function normalizeLocation(snap) {
  const raw = fromSnap(snap)
  if (!raw) return null
  return {
    id:           raw.id           ?? null,
    projectId:    raw.projectId    ?? null,
    mapId:        raw.mapId        ?? null,
    name:         raw.name         ?? '',
    description:  raw.description  ?? '',
    type:         raw.type         ?? 'location',
    x:            raw.x            ?? 0,
    y:            raw.y            ?? 0,
    color:        raw.color        ?? '#c9a84c',
    icon:         raw.icon         ?? 'map-pin',
    linkedScenes: Array.isArray(raw.linkedScenes) ? raw.linkedScenes : [],
    linkedChars:  Array.isArray(raw.linkedChars)  ? raw.linkedChars : [],
    createdAt:    raw.createdAt    ?? null,
    updatedAt:    raw.updatedAt    ?? null,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Event (story timeline events)
// ─────────────────────────────────────────────────────────────────────────────
export function normalizeEvent(snap) {
  const raw = fromSnap(snap)
  if (!raw) return null
  return {
    id:               raw.id               ?? null,
    projectId:        raw.projectId        ?? null,
    title:            raw.title            ?? '',
    description:      raw.description      ?? '',
    type:             raw.type             ?? 'plot',
    storyDate:        raw.storyDate        ?? '',
    order:            raw.order            ?? 0,
    linkedScenes:     Array.isArray(raw.linkedScenes)     ? raw.linkedScenes : [],
    linkedCharacters: Array.isArray(raw.linkedCharacters) ? raw.linkedCharacters : [],
    linkedLocations:  Array.isArray(raw.linkedLocations)  ? raw.linkedLocations : [],
    linkedThreads:    Array.isArray(raw.linkedThreads)    ? raw.linkedThreads : [],
    createdAt:        raw.createdAt        ?? null,
    updatedAt:        raw.updatedAt        ?? null,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Relationship (explicit bidirectional link record)
// ─────────────────────────────────────────────────────────────────────────────
export function normalizeRelationship(snap) {
  const raw = fromSnap(snap)
  if (!raw) return null
  return {
    id:         raw.id         ?? null,
    projectId:  raw.projectId  ?? null,
    fromType:   raw.fromType   ?? '',   // 'thread' | 'character' | 'scene' | 'lore' | 'event' | 'location'
    fromId:     raw.fromId     ?? null,
    toType:     raw.toType     ?? '',
    toId:       raw.toId       ?? null,
    label:      raw.label      ?? '',   // e.g. 'linked', 'introduced-in', 'appears-in'
    meta:       raw.meta       ?? {},
    createdAt:  raw.createdAt  ?? null,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// User Progress (guidance / onboarding state)
// ─────────────────────────────────────────────────────────────────────────────
export function normalizeUserProgress(snap) {
  const raw = fromSnap(snap)
  if (!raw) return null
  return {
    id:                  raw.id                  ?? null,
    uid:                 raw.uid                 ?? null,
    onboardingComplete:  raw.onboardingComplete  ?? false,
    onboardingSkipped:   raw.onboardingSkipped   ?? false,
    completedSteps:      Array.isArray(raw.completedSteps) ? raw.completedSteps : [],
    currentTip:          raw.currentTip          ?? null,
    tipsShown:           Array.isArray(raw.tipsShown) ? raw.tipsShown : [],
    updatedAt:           raw.updatedAt           ?? null,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AI Suggestion
// ─────────────────────────────────────────────────────────────────────────────
export function normalizeAiSuggestion(snap) {
  const raw = fromSnap(snap)
  if (!raw) return null
  return {
    id:          raw.id          ?? null,
    projectId:   raw.projectId   ?? null,
    uid:         raw.uid         ?? null,
    context:     raw.context     ?? '',
    prompt:      raw.prompt      ?? '',
    response:    raw.response    ?? '',
    model:       raw.model       ?? '',
    tokens:      raw.tokens      ?? 0,
    accepted:    raw.accepted    ?? null,  // true | false | null (pending)
    sceneId:     raw.sceneId     ?? null,
    createdAt:   raw.createdAt   ?? null,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function omitKnown(obj, keys) {
  const out = {}
  for (const k of Object.keys(obj)) {
    if (!keys.includes(k)) out[k] = obj[k]
  }
  return out
}
