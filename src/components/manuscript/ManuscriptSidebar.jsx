import React, { useState } from 'react'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  ChevronRight, ChevronDown, Plus, Trash2, GripVertical,
  BookOpen, FileText, Layers, PanelLeftClose, PanelLeftOpen, Pencil,
} from 'lucide-react'
import { getAllChapters } from '../../hooks/useManuscript'
import WritingGoalBar from './WritingGoalBar'

const STATUS_DOT = {
  planned:  'bg-slate-600',
  drafted:  'bg-teal-500',
  revised:  'bg-gold-500',
  locked:   'bg-purple-500',
}

// ── Sortable scene item ───────────────────────────────────────────────────────
function SortableScene({ scene, isActive, onClick, onDelete, onRename, chapterId }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: scene.id })
  const [editing,  setEditing]  = useState(false)
  const [titleVal, setTitleVal] = useState(scene.title || '')
  const [confirmDel, setConfirmDel] = useState(false)
  const confirmTimer = React.useRef(null)

  function handleDeleteClick(e) {
    e.stopPropagation()
    if (confirmDel) {
      clearTimeout(confirmTimer.current)
      setConfirmDel(false)
      onDelete(scene.id, chapterId)
    } else {
      setConfirmDel(true)
      clearTimeout(confirmTimer.current)
      confirmTimer.current = setTimeout(() => setConfirmDel(false), 3000)
    }
  }

  function commitRename() {
    setEditing(false)
    if (titleVal.trim() && titleVal !== scene.title) onRename?.(scene.id, titleVal.trim())
    else setTitleVal(scene.title || '')
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className={`
        group flex items-center gap-1.5 pl-8 pr-2 py-1.5 min-h-[40px] rounded-md cursor-pointer
        text-xs transition-all duration-150
        ${isActive
          ? 'bg-gold-500/15 text-gold-300'
          : 'text-slate-500 hover:text-slate-200 hover:bg-axiom-surface2'
        }
      `}
      onClick={() => { if (!editing) onClick(scene.id) }}
    >
      {/* Drag handle */}
      <span
        {...attributes}
        {...listeners}
        className="opacity-0 group-hover:opacity-40 hover:!opacity-100 cursor-grab active:cursor-grabbing flex-shrink-0"
        onClick={e => e.stopPropagation()}
      >
        <GripVertical className="w-3 h-3" />
      </span>

      {/* Status dot */}
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[scene.status] ?? STATUS_DOT.planned}`} />

      {editing ? (
        <input
          autoFocus
          value={titleVal}
          onChange={e => setTitleVal(e.target.value)}
          onBlur={commitRename}
          onKeyDown={e => {
            if (e.key === 'Enter') commitRename()
            if (e.key === 'Escape') { setTitleVal(scene.title || ''); setEditing(false) }
          }}
          onClick={e => e.stopPropagation()}
          className="flex-1 bg-transparent outline-none border-b border-gold-500/50 text-slate-200 min-w-0"
        />
      ) : (
        <span
          className="flex-1 truncate"
          onDoubleClick={e => { e.stopPropagation(); setEditing(true) }}
        >
          {scene.title || 'Untitled Scene'}
        </span>
      )}

      {!editing && scene.wordCount > 0 && (
        <span className="text-[10px] text-slate-700 flex-shrink-0 group-hover:hidden">
          {scene.wordCount >= 1000 ? `${(scene.wordCount/1000).toFixed(1)}k` : scene.wordCount}
        </span>
      )}

      {!editing && (
        <div className="row-actions opacity-0 group-hover:opacity-100 flex items-center gap-0.5 flex-shrink-0">
          <button
            onClick={e => { e.stopPropagation(); setEditing(true) }}
            className="tap-target flex items-center justify-center p-1.5 rounded text-slate-600 hover:text-gold-400 transition-colors"
            title="Rename scene"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDeleteClick}
            className={`tap-target flex items-center justify-center p-1.5 rounded transition-colors ${confirmDel ? 'text-red-400 bg-red-500/15' : 'text-slate-600 hover:text-red-400'}`}
            title={confirmDel ? 'Tap again to delete' : 'Delete scene'}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}

// ── Chapter section ───────────────────────────────────────────────────────────
function ChapterSection({ chapter, activeSceneId, activeChapterId, onSceneClick, onChapterClick, onAddScene, onDeleteScene, onRenameChapter, onRenameScene, onDeleteChapter, onReorderScenes, partId }) {
  const [expanded,  setExpanded]  = useState(true)
  const [editing,   setEditing]   = useState(false)
  const [title,     setTitle]     = useState(chapter.title)
  const [activeId,  setActiveId]  = useState(null)
  const [confirmDel, setConfirmDel] = useState(false)
  const confirmTimer = React.useRef(null)

  function handleDeleteChapter() {
    if (confirmDel) {
      clearTimeout(confirmTimer.current)
      setConfirmDel(false)
      onDeleteChapter(chapter.id, partId)
    } else {
      setConfirmDel(true)
      clearTimeout(confirmTimer.current)
      confirmTimer.current = setTimeout(() => setConfirmDel(false), 3000)
    }
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function handleDragEnd(event) {
    const { active, over } = event
    setActiveId(null)
    if (!over || active.id === over.id) return
    const oldIdx = chapter.scenes.findIndex(s => s.id === active.id)
    const newIdx = chapter.scenes.findIndex(s => s.id === over.id)
    const reordered = arrayMove(chapter.scenes, oldIdx, newIdx)
    onReorderScenes(chapter.id, reordered, partId)
  }

  function commitRename() {
    setEditing(false)
    if (title.trim() && title !== chapter.title) onRenameChapter(chapter.id, title.trim())
    else setTitle(chapter.title)
  }

  return (
    <div className="mb-1">
      <div className={`group flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-axiom-surface2 transition-colors ${activeChapterId === chapter.id ? 'bg-axiom-surface2' : ''}`}>
        <button onClick={() => setExpanded(p => !p)} className="flex-shrink-0 text-slate-600 hover:text-slate-300">
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
        <BookOpen className={`w-3 h-3 flex-shrink-0 ${activeChapterId === chapter.id ? 'text-gold-400' : 'text-slate-600'}`} />

        {editing ? (
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={commitRename}
            onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') { setTitle(chapter.title); setEditing(false) } }}
            className="flex-1 bg-transparent text-xs text-slate-200 outline-none border-b border-gold-500/50"
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span
            className={`flex-1 text-xs font-medium truncate cursor-pointer hover:text-slate-200 transition-colors ${activeChapterId === chapter.id ? 'text-gold-300' : 'text-slate-400'}`}
            onClick={() => onChapterClick?.(chapter.id)}
            onDoubleClick={() => setEditing(true)}
          >
            {chapter.title}
          </span>
        )}

        <div className="row-actions opacity-0 group-hover:opacity-100 flex items-center gap-0.5 flex-shrink-0">
          <button onClick={() => setEditing(true)} className="tap-target flex items-center justify-center p-1.5 rounded text-slate-600 hover:text-gold-400" title="Rename chapter">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onAddScene(chapter.id, partId)} className="tap-target flex items-center justify-center p-1.5 rounded text-slate-600 hover:text-teal-400" title="Add scene">
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleDeleteChapter} className={`tap-target flex items-center justify-center p-1.5 rounded transition-colors ${confirmDel ? 'text-red-400 bg-red-500/15' : 'text-slate-600 hover:text-red-400'}`} title={confirmDel ? 'Tap again to delete' : 'Delete chapter'}>
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {expanded && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={e => setActiveId(e.active.id)} onDragEnd={handleDragEnd}>
          <SortableContext items={chapter.scenes.map(s => s.id)} strategy={verticalListSortingStrategy}>
            {chapter.scenes.map(scene => (
              <SortableScene
                key={scene.id}
                scene={scene}
                isActive={scene.id === activeSceneId}
                chapterId={chapter.id}
                onClick={onSceneClick}
                onDelete={onDeleteScene}
                onRename={onRenameScene}
              />
            ))}
          </SortableContext>
          <DragOverlay>
            {activeId ? (
              <div className="px-8 py-1.5 text-xs text-slate-300 bg-axiom-surface2 border border-axiom-border rounded-md shadow-card opacity-90">
                {chapter.scenes.find(s => s.id === activeId)?.title}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Add scene shortcut */}
      {expanded && (
        <button
          onClick={() => onAddScene(chapter.id, partId)}
          className="w-full text-left pl-8 pr-2 py-1 text-[11px] text-slate-700 hover:text-teal-500 transition-colors"
        >
          + Add scene
        </button>
      )}
    </div>
  )
}

// ── Main sidebar ──────────────────────────────────────────────────────────────
export default function ManuscriptSidebar({
  structure, activeSceneId, activeChapterId, projectId,
  onSceneClick, onChapterClick, onAddChapter, onAddPart, onAddScene,
  onRenameChapter, onRenamePart, onRenameScene, onDeleteScene, onDeleteChapter,
  onReorderScenes, onReorderChapters,
  onToggle, isOpen,
}) {
  // projectId is used by WritingGoalBar
  if (!structure) return null

  const chapters = structure.hasParts
    ? null
    : (structure.chapters || [])

  const parts = structure.hasParts
    ? (structure.parts || [])
    : null

  const totalWords = getAllChapters(structure)
    .flatMap(ch => ch.scenes)
    .reduce((s, sc) => s + (sc.wordCount || 0), 0)

  return (
    <aside className="w-full h-full flex flex-col bg-axiom-surface border-r border-axiom-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-axiom-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Manuscript</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => onAddChapter()} className="p-1 text-slate-600 hover:text-teal-400 transition-colors" title="Add chapter">
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button onClick={onToggle} className="p-1 text-slate-600 hover:text-slate-300" title="Collapse sidebar">
            <PanelLeftClose className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Word count pill */}
      <div className="px-3 py-2 border-b border-axiom-border flex-shrink-0">
        <span className="text-[11px] text-slate-700">
          {totalWords >= 1000 ? `${(totalWords/1000).toFixed(1)}k` : totalWords} words total
        </span>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-2 px-2">
        {structure.hasParts && parts?.map(part => (
          <PartSection
            key={part.id}
            part={part}
            activeSceneId={activeSceneId}
            activeChapterId={activeChapterId}
            onSceneClick={onSceneClick}
            onChapterClick={onChapterClick}
            onAddChapter={onAddChapter}
            onAddScene={onAddScene}
            onRenameChapter={onRenameChapter}
            onRenamePart={onRenamePart}
            onRenameScene={onRenameScene}
            onDeleteScene={onDeleteScene}
            onDeleteChapter={onDeleteChapter}
            onReorderScenes={onReorderScenes}
          />
        ))}

        {!structure.hasParts && chapters?.map(ch => (
          <ChapterSection
            key={ch.id}
            chapter={ch}
            activeSceneId={activeSceneId}
            activeChapterId={activeChapterId}
            onSceneClick={onSceneClick}
            onChapterClick={onChapterClick}
            onAddScene={onAddScene}
            onDeleteScene={onDeleteScene}
            onRenameChapter={onRenameChapter}
            onRenameScene={onRenameScene}
            onDeleteChapter={onDeleteChapter}
            onReorderScenes={onReorderScenes}
            partId={null}
          />
        ))}

        {/* Add chapter / part buttons */}
        <div className="mt-3 space-y-1 px-1">
          <button
            onClick={() => onAddChapter()}
            className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-slate-700 hover:text-teal-400 rounded transition-colors"
          >
            <Plus className="w-3 h-3" /> Add Chapter
          </button>
          {!structure.hasParts && (
            <button
              onClick={onAddPart}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-slate-700 hover:text-gold-400 rounded transition-colors"
            >
              <Plus className="w-3 h-3" /> Add Part
            </button>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="px-3 py-2 border-t border-axiom-border flex-shrink-0">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {Object.entries(STATUS_DOT).map(([status, dot]) => (
            <span key={status} className="flex items-center gap-1 text-[10px] text-slate-700 capitalize">
              <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
              {status}
            </span>
          ))}
        </div>
      </div>

      {/* Writing goal progress */}
      <WritingGoalBar projectId={projectId} />
    </aside>
  )
}

function PartSection({ part, activeSceneId, activeChapterId, onSceneClick, onChapterClick, onAddChapter, onAddScene, onRenameChapter, onRenamePart, onRenameScene, onDeleteScene, onDeleteChapter, onReorderScenes }) {
  const [expanded, setExpanded] = useState(true)
  const [editing,  setEditing]  = useState(false)
  const [title,    setTitle]    = useState(part.title)

  function commitRename() {
    setEditing(false)
    if (title.trim() && title !== part.title) onRenamePart(part.id, title.trim())
    else setTitle(part.title)
  }

  return (
    <div className="mb-2">
      <div className="group flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-axiom-surface2">
        <button onClick={() => setExpanded(p => !p)} className="text-slate-600 hover:text-slate-300 flex-shrink-0">
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
        <FileText className="w-3 h-3 text-gold-500/60 flex-shrink-0" />
        {editing ? (
          <input autoFocus value={title} onChange={e => setTitle(e.target.value)}
            onBlur={commitRename}
            onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') { setTitle(part.title); setEditing(false) } }}
            className="flex-1 bg-transparent text-xs font-semibold text-gold-400 outline-none border-b border-gold-500/50"
          />
        ) : (
          <span className="flex-1 text-xs font-semibold text-gold-500/80 truncate cursor-text" onDoubleClick={() => setEditing(true)}>
            {part.title}
          </span>
        )}
        <button onClick={() => onAddChapter(part.id)} className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-600 hover:text-teal-400" title="Add chapter">
          <Plus className="w-3 h-3" />
        </button>
      </div>

      {expanded && (part.chapters || []).map(ch => (
        <div key={ch.id} className="pl-3">
          <ChapterSection
            chapter={ch}
            activeSceneId={activeSceneId}
            activeChapterId={activeChapterId}
            onSceneClick={onSceneClick}
            onChapterClick={onChapterClick}
            onAddScene={onAddScene}
            onDeleteScene={onDeleteScene}
            onRenameChapter={onRenameChapter}
            onRenameScene={onRenameScene}
            onDeleteChapter={onDeleteChapter}
            onReorderScenes={onReorderScenes}
            partId={part.id}
          />
        </div>
      ))}

      {expanded && (
        <button onClick={() => onAddChapter(part.id)} className="w-full text-left pl-7 py-1 text-[11px] text-slate-700 hover:text-teal-500 transition-colors">
          + Add chapter
        </button>
      )}
    </div>
  )
}
