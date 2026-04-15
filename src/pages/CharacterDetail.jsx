import React, { useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Trash2, Users, Upload } from 'lucide-react'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { deleteDoc, doc } from 'firebase/firestore'
import { storage, db } from '../firebase/config'
import { useCharacter, AVATAR_COLORS, IMPORTANCE_LEVELS, ROLE_OPTIONS } from '../hooks/useCharacters'
import CoreSheet from '../components/characters/CoreSheet'
import VoiceDNA from '../components/characters/VoiceDNA'
import SceneHistory from '../components/characters/SceneHistory'
import RelationshipMap from '../components/characters/RelationshipMap'
import MomentumTab from '../components/characters/MomentumTab'
import LoadingSpinner from '../components/common/LoadingSpinner'

const TABS = [
  { id: 'core',          label: 'Core Sheet'    },
  { id: 'voice',         label: 'Voice DNA'     },
  { id: 'relationships', label: 'Relationships' },
  { id: 'history',       label: 'Scene History' },
  { id: 'momentum',      label: 'Momentum'      },
]

export default function CharacterDetail() {
  const { projectId, characterId } = useParams()
  const navigate = useNavigate()
  const { character, loading, update, updateImportance } = useCharacter(projectId, characterId)

  const [activeTab,     setActiveTab]     = useState('core')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [saveIndicator, setSaveIndicator] = useState('')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const save = useCallback(async (updates) => {
    setSaveIndicator('saving')
    try {
      await update(updates)
      setSaveIndicator('saved')
      setTimeout(() => setSaveIndicator(''), 2000)
    } catch (err) {
      setSaveIndicator('error')
      console.error(err)
    }
  }, [update])

  const handleImportanceChange = useCallback(async (newImportance) => {
    setSaveIndicator('saving')
    try {
      await updateImportance(newImportance, character?.importanceHistory ?? [])
      setSaveIndicator('saved')
      setTimeout(() => setSaveIndicator(''), 2000)
    } catch (err) {
      setSaveIndicator('error')
    }
  }, [updateImportance, character])

  async function handleDelete() {
    await deleteDoc(doc(db, 'projects', projectId, 'characters', characterId))
    navigate(`/projects/${projectId}/characters`)
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPhoto(true)
    try {
      const path    = `character-photos/${projectId}/${characterId}`
      const fileRef = storageRef(storage, path)
      await uploadBytes(fileRef, file)
      const url = await getDownloadURL(fileRef)
      await save({ photoUrl: url })
    } catch (err) {
      console.error('[PhotoUpload]', err)
    } finally {
      setUploadingPhoto(false)
    }
  }

  if (loading) return <LoadingSpinner fullscreen />
  if (!character) return (
    <div className="min-h-screen bg-axiom-bg flex items-center justify-center text-slate-500">
      Character not found.
    </div>
  )

  const avatarColors = AVATAR_COLORS[character.role] ?? AVATAR_COLORS.supporting
  const initials     = (character.name || '?').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  const impLevel     = IMPORTANCE_LEVELS[Number(character.importance) ?? 1] ?? IMPORTANCE_LEVELS[1]
  const roleOpt      = ROLE_OPTIONS.find(r => r.value === character.role) ?? ROLE_OPTIONS[3]

  return (
    <div className="min-h-screen bg-axiom-bg flex flex-col">

      {/* Top bar */}
      <header className="flex items-center justify-between h-12 px-4 bg-axiom-surface border-b border-axiom-border flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => navigate(`/projects/${projectId}/characters`)} className="btn-icon flex-shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <Users className="w-4 h-4 text-teal-400 flex-shrink-0" />
            <span className="font-serif font-semibold text-slate-100 text-sm truncate">
              {character.name || 'Unnamed Character'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {saveIndicator === 'saving' && <span className="text-xs text-slate-600">Saving…</span>}
          {saveIndicator === 'saved'  && <span className="text-xs text-teal-500">Saved</span>}
          {saveIndicator === 'error'  && <span className="text-xs text-red-500">Error saving</span>}
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-400">Delete character?</span>
              <button onClick={handleDelete} className="text-xs px-2 py-1 bg-red-500/20 border border-red-500/40 text-red-400 rounded hover:bg-red-500/30 transition-colors">Yes, delete</button>
              <button onClick={() => setConfirmDelete(false)} className="btn-ghost text-xs py-1">Cancel</button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)} className="btn-icon text-slate-600 hover:text-red-400">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Character hero bar */}
      <div className="bg-axiom-surface border-b border-axiom-border px-6 py-4 flex-shrink-0">
        <div className="max-w-5xl mx-auto flex items-center gap-4">

          {/* Avatar / Photo */}
          <label className="relative group cursor-pointer flex-shrink-0">
            <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center overflow-hidden transition-all ${avatarColors.bg} ${avatarColors.border} group-hover:opacity-80`}>
              {character.photoUrl ? (
                <img src={character.photoUrl} alt={character.name} className="w-full h-full object-cover" />
              ) : (
                <span className={`text-lg font-bold font-serif ${avatarColors.text}`}>{initials}</span>
              )}
            </div>
            {uploadingPhoto ? (
              <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            ) : (
              <div className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                <Upload className="w-4 h-4 text-white" />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </label>

          {/* Name + meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-serif text-xl font-semibold text-slate-100">
                {character.name || <span className="text-slate-600 italic">Unnamed Character</span>}
              </h1>
              {character.aliases?.length > 0 && (
                <span className="text-slate-600 text-sm">aka {character.aliases.join(', ')}</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`badge border text-xs ${roleOpt.bg} ${roleOpt.color}`}>{roleOpt.label}</span>
              <span className={`badge border text-xs ${impLevel.bg} ${impLevel.color}`}>{impLevel.label}</span>
              {(character.physicalDescription?.age || character.age) && (
                <span className="text-xs text-slate-600">Age {character.physicalDescription?.age || character.age}</span>
              )}
            </div>
          </div>

          {/* Importance selector */}
          <div className="flex-shrink-0 hidden sm:block">
            <p className="text-[10px] text-slate-700 uppercase tracking-wider mb-1.5 text-right">Importance</p>
            <div className="flex gap-1">
              {IMPORTANCE_LEVELS.map(level => (
                <button
                  key={level.value}
                  onClick={() => handleImportanceChange(level.value)}
                  className={`px-2.5 py-1 rounded text-xs font-medium border transition-all ${
                    character.importance === level.value
                      ? `${level.bg} ${level.color}`
                      : 'text-slate-600 border-axiom-border hover:border-axiom-border-light hover:text-slate-400'
                  }`}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-axiom-surface border-b border-axiom-border flex-shrink-0">
        <div className="max-w-5xl mx-auto px-6 flex gap-1 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-gold-500 text-gold-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-6">
          {activeTab === 'core'          && <CoreSheet       character={character} onSave={save} />}
          {activeTab === 'voice'         && <VoiceDNA        character={character} onSave={save} />}
          {activeTab === 'relationships' && <RelationshipMap character={character} onSave={save} projectId={projectId} />}
          {activeTab === 'history'       && <SceneHistory    character={character} onSave={save} projectId={projectId} />}
          {activeTab === 'momentum'      && <MomentumTab     character={character} onSave={save} onImportanceChange={handleImportanceChange} />}
        </div>
      </div>
    </div>
  )
}
