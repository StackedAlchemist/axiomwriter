import React from 'react'
import { Pencil, Loader2 } from 'lucide-react'

const STATUS_DOT = {
  planned:  'bg-slate-600',
  drafted:  'bg-teal-500',
  revised:  'bg-gold-500',
  locked:   'bg-purple-500',
}

function wordCount(html) {
  return (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length
}

export default function ChapterView({ chapter, sceneContents, loading, onEditScene }) {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-slate-600 animate-spin" />
      </div>
    )
  }

  if (!chapter) return null

  const scenes = chapter.scenes || []

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-8 py-10">

        {/* Chapter title */}
        <h1 className="font-serif text-3xl text-slate-200 mb-2">{chapter.title}</h1>
        <p className="text-xs text-slate-600 mb-10">
          {scenes.length} scene{scenes.length !== 1 ? 's' : ''} ·{' '}
          {scenes.reduce((s, sc) => s + (sc.wordCount || 0), 0).toLocaleString()} words
        </p>

        {scenes.length === 0 && (
          <div className="text-slate-600 text-sm italic">No scenes yet. Add a scene from the sidebar.</div>
        )}

        {scenes.map((scene, i) => {
          const content = sceneContents[scene.id]?.content ?? ''
          const wc = wordCount(content)

          return (
            <div key={scene.id} className="mb-12">
              {/* Scene divider */}
              <div className="flex items-center gap-3 mb-5 group">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[scene.status] ?? STATUS_DOT.planned}`} />
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Scene {i + 1}
                  </span>
                  {scene.title && scene.title !== `Scene ${i + 1}` && (
                    <span className="text-xs text-slate-600">— {scene.title}</span>
                  )}
                </div>
                <div className="flex-1 h-px bg-axiom-border" />
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-700">
                    {wc > 0 ? `${wc.toLocaleString()} words` : 'empty'}
                  </span>
                  <button
                    onClick={() => onEditScene(scene.id)}
                    className="flex items-center gap-1 px-2 py-0.5 text-[11px] text-slate-500 hover:text-gold-400 border border-axiom-border hover:border-gold-500/30 rounded transition-colors"
                  >
                    <Pencil className="w-2.5 h-2.5" />
                    Edit scene
                  </button>
                </div>
              </div>

              {/* Scene prose */}
              {content ? (
                <div
                  className="prose prose-invert prose-sm max-w-none
                    prose-p:text-slate-300 prose-p:leading-relaxed prose-p:my-3
                    prose-headings:text-slate-200 prose-headings:font-serif
                    prose-strong:text-slate-200
                    prose-em:text-slate-400
                    prose-blockquote:border-gold-500/30 prose-blockquote:text-slate-400
                    selection:bg-gold-500/20"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              ) : (
                <p className="text-slate-700 text-sm italic">
                  This scene is empty.{' '}
                  <button onClick={() => onEditScene(scene.id)} className="text-gold-500/60 hover:text-gold-400 underline">
                    Start writing
                  </button>
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
