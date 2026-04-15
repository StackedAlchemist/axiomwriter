import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Sparkles, RefreshCw, Download, Image, Loader2,
  ChevronDown, ChevronUp, ZoomIn, ZoomOut, Upload, Type,
  BookOpen, AlertTriangle, Check, X, Save, FileDown,
} from 'lucide-react'
import { useManuscript } from '../hooks/useManuscript'
import { useCharacters }  from '../hooks/useCharacters'
import { useLore }        from '../hooks/useLore'
import { doc, updateDoc, getDoc, getDocs, collection } from 'firebase/firestore'
import { db } from '../firebase/config'
import { getAllChapters }  from '../hooks/useManuscript'
import {
  COVER_STYLES, COLOR_PALETTES, FONT_STYLES, TRIM_SIZES,
  buildCoverPrompt, generateCoverImage, generateSynopsis,
  compositeWrapSpread, exportCoverPNG, exportSpreadPDF,
  calcSpineWidth,
} from '../lib/coverEngine'
import LoadingSpinner from '../components/common/LoadingSpinner'

// ── Gradient preview palettes ─────────────────────────────────────────────────
const PALETTE_GRADIENTS = {
  dark:          'from-slate-900 via-slate-800 to-slate-900',
  light:         'from-stone-100 via-stone-200 to-stone-100',
  warm:          'from-amber-950 via-red-900 to-amber-900',
  cool:          'from-blue-950 via-indigo-900 to-blue-900',
  monochromatic: 'from-neutral-900 via-neutral-700 to-neutral-900',
  custom:        'from-violet-950 via-purple-900 to-violet-900',
}

// ── Placeholder cover preview ─────────────────────────────────────────────────
function CoverPlaceholder({ title, author, series, style, palette, fontStyle }) {
  const gradient = PALETTE_GRADIENTS[palette] || PALETTE_GRADIENTS.dark
  const fontClass = {
    serif:   'font-serif',
    sans:    'font-sans',
    script:  'font-serif italic',
    display: 'font-sans font-black uppercase tracking-widest',
    fantasy: 'font-serif',
  }[fontStyle] || 'font-serif'

  const styleAccent = {
    cinematic:   'border-slate-500/30',
    illustrated: 'border-amber-500/30',
    atmospheric: 'border-purple-500/30',
    minimalist:  'border-white/20',
    vintage:     'border-amber-700/40',
    custom:      'border-teal-500/30',
  }[style] || 'border-white/20'

  return (
    <div className={`relative w-full h-full bg-gradient-to-b ${gradient} flex flex-col items-center justify-between p-6 border ${styleAccent} rounded`}>
      {/* Series */}
      {series && (
        <p className={`${fontClass} text-xs tracking-widest uppercase opacity-60 text-center`}
           style={{ color: 'rgba(220,200,150,0.8)' }}>
          {series}
        </p>
      )}

      {/* Decorative center element */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-white/10 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full border border-white/20" />
          </div>
          <div className="absolute inset-0 rounded-full bg-white/5 blur-xl" />
        </div>
      </div>

      {/* Title */}
      <div className="text-center space-y-2 w-full">
        <h2 className={`${fontClass} text-2xl font-bold text-white leading-tight`}
            style={{ textShadow: '0 2px 20px rgba(0,0,0,0.8)' }}>
          {title || 'Your Title'}
        </h2>
        {author && (
          <p className={`${fontClass} text-xs tracking-wider opacity-70 text-white`}>
            {author}
          </p>
        )}
      </div>
    </div>
  )
}

// ── Wrap spread preview ───────────────────────────────────────────────────────
function WrapSpreadPreview({ frontImage, backImage, title, author, series, synopsis, fontStyle, trimSizeId, pageCount, zoom }) {
  const trim      = TRIM_SIZES.find(t => t.id === trimSizeId) || TRIM_SIZES[0]
  const spineIn   = calcSpineWidth(pageCount || 300)
  const ratio     = trim.h / trim.w
  const frontW    = 160 * zoom
  const frontH    = frontW * ratio
  const spineW    = Math.max(18, spineIn * 96 * zoom)
  const backW     = frontW
  const totalW    = backW + spineW + frontW

  const fontClass = {
    serif:   'font-serif',
    sans:    'font-sans',
    script:  'font-serif italic',
    display: 'font-sans font-black uppercase tracking-wider',
    fantasy: 'font-serif',
  }[fontStyle] || 'font-serif'

  return (
    <div className="flex items-stretch shadow-2xl" style={{ height: frontH }}>
      {/* Back cover */}
      <div
        className="relative bg-gradient-to-r from-slate-900 to-slate-800 border border-white/10 overflow-hidden flex flex-col p-3"
        style={{ width: backW, height: frontH }}
      >
        {synopsis && (
          <p className={`${fontClass} text-[7px] leading-relaxed text-slate-300/80 line-clamp-[12] flex-1 overflow-hidden`}>
            {synopsis}
          </p>
        )}
        <div className="mt-auto space-y-1">
          <p className={`${fontClass} text-[7px] font-bold text-white/70`}>{author || 'Author Name'}</p>
          {/* ISBN placeholder */}
          <div className="border border-white/10 rounded w-14 h-7 flex items-center justify-center">
            <span className="text-[5px] text-white/20 uppercase tracking-wider">ISBN</span>
          </div>
        </div>
      </div>

      {/* Spine */}
      <div
        className="relative bg-slate-950 border-y border-white/10 flex items-center justify-center overflow-hidden"
        style={{ width: spineW, height: frontH }}
      >
        <div
          className="absolute"
          style={{
            transform: 'rotate(-90deg)',
            whiteSpace: 'nowrap',
            fontSize: Math.min(10, spineW * 0.45),
          }}
        >
          <span className={`${fontClass} text-white/80 font-bold`}>
            {title || 'Title'}
          </span>
          <span className="text-white/40 mx-1">·</span>
          <span className={`${fontClass} text-white/60`}>
            {author || 'Author'}
          </span>
        </div>
      </div>

      {/* Front cover */}
      <div
        className="relative border border-white/10 overflow-hidden"
        style={{ width: frontW, height: frontH, background: frontImage ? 'black' : undefined }}
      >
        {frontImage ? (
          <img src={frontImage} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
            <Image className="w-8 h-8 text-slate-600" />
          </div>
        )}
        {/* Title overlay */}
        <div className="absolute inset-0 flex flex-col justify-between p-3 pointer-events-none">
          {series && (
            <p className={`${fontClass} text-[7px] tracking-widest uppercase text-yellow-300/80 text-center`}>
              {series}
            </p>
          )}
          <div className="text-center mt-auto space-y-1">
            <h2
              className={`${fontClass} text-white font-bold leading-tight`}
              style={{ fontSize: Math.min(18, frontW * 0.1), textShadow: '0 2px 12px rgba(0,0,0,0.9)' }}
            >
              {title || 'Your Title'}
            </h2>
            {author && (
              <p
                className={`${fontClass} text-white/80`}
                style={{ fontSize: Math.min(9, frontW * 0.055), textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}
              >
                {author}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Artist import panel ───────────────────────────────────────────────────────
function ArtistImportPanel({ onImageLoaded, currentImage }) {
  const fileRef   = useRef(null)
  const [dragging, setDragging] = useState(false)

  function handleFile(file) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = e => onImageLoaded(e.target.result)
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Artist Import</p>
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${dragging ? 'border-gold-500/60 bg-gold-500/5' : 'border-axiom-border hover:border-axiom-border-light'}`}
      >
        {currentImage ? (
          <div className="space-y-1">
            <Check className="w-5 h-5 text-teal-400 mx-auto" />
            <p className="text-xs text-slate-400">Custom artwork loaded</p>
            <p className="text-[10px] text-slate-600">Drop or click to replace</p>
          </div>
        ) : (
          <div className="space-y-1">
            <Upload className="w-5 h-5 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-500">Drop artwork here</p>
            <p className="text-[10px] text-slate-700">PNG, JPG, SVG · Recommended 300dpi+</p>
          </div>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
export default function CoverStudio() {
  const { projectId } = useParams()
  const navigate      = useNavigate()

  const ms  = useManuscript(projectId)
  const { characters }       = useCharacters(projectId)
  const { entries: loreEntries } = useLore(projectId)

  // ── Config state ─────────────────────────────────────────────────────────
  const [style,        setStyle]        = useState('cinematic')
  const [customStyle,  setCustomStyle]  = useState('')
  const [primaryVisual,setPrimaryVisual]= useState('')
  const [palette,      setPalette]      = useState('dark')
  const [customColors, setCustomColors] = useState('')
  const [fontStyle,    setFontStyle]    = useState('serif')
  const [trimSizeId,   setTrimSizeId]   = useState('kdp_55x85')
  const [authorName,   setAuthorName]   = useState('')
  const [autoPopulate, setAutoPopulate] = useState(true)
  const [synopsis,     setSynopsis]     = useState(ms.project?.synopsis || '')
  const [pageCount,    setPageCount]    = useState(300)

  // ── Generation state ──────────────────────────────────────────────────────
  const [generating,      setGenerating]      = useState(false)
  const [genStep,         setGenStep]         = useState('')
  const [imageA,          setImageA]          = useState(null)  // generated or imported
  const [imageB,          setImageB]          = useState(null)
  const [activeVariant,   setActiveVariant]   = useState('A')
  const [promptA,         setPromptA]         = useState('')
  const [promptB,         setPromptB]         = useState('')
  const [generatingSync,  setGeneratingSync]  = useState(false)
  const [generatingMeta,  setGeneratingMeta]  = useState(false)
  const [zoom,            setZoom]            = useState(1)
  const [saving,          setSaving]          = useState(false)
  const [saved,           setSaved]           = useState(false)
  const [artistImage,     setArtistImage]     = useState(null)

  // Estimate page count from word count
  useEffect(() => {
    const wc = ms.project?.wordCount || 0
    if (wc > 0) setPageCount(Math.round(wc / 250))
  }, [ms.project?.wordCount])

  // Auto-fill synopsis from project
  useEffect(() => {
    if (ms.project?.synopsis && !synopsis) setSynopsis(ms.project.synopsis)
  }, [ms.project?.synopsis]) // eslint-disable-line

  // Auto-fill author name
  useEffect(() => {
    if (!authorName && ms.project) setAuthorName(ms.project.authorName || '')
  }, [ms.project]) // eslint-disable-line

  const activeImage = artistImage || (activeVariant === 'A' ? imageA : imageB)

  // ── Step 1 + 2: Generate cover ────────────────────────────────────────────
  async function handleGenerate() {
    setGenerating(true)
    setGenStep('Building optimized prompt with Claude…')

    // Step 1: Claude builds prompt
    const prompts = await buildCoverPrompt({
      project: ms.project,
      characters,
      loreEntries,
      style,
      customStyle,
      primaryVisual,
      colorPalette: palette,
      customColors,
      autoPopulate,
    })

    if (!prompts) {
      setGenStep('Claude prompt generation failed. Check your API key.')
      setGenerating(false)
      return
    }

    setPromptA(prompts.promptA)
    setPromptB(prompts.promptB)

    // Step 2: Generate images simultaneously (if Stability AI key present)
    if (import.meta.env.VITE_STABILITY_API_KEY) {
      setGenStep('Generating two cover variations via Stability AI…')
      const trim = TRIM_SIZES.find(t => t.id === trimSizeId)
      const [imgA, imgB] = await Promise.all([
        generateCoverImage(prompts.promptA, trim),
        generateCoverImage(prompts.promptB, trim),
      ])
      setImageA(imgA)
      setImageB(imgB)
      if (!imgA && !imgB) {
        setGenStep('Image generation failed. Check your Stability AI key.')
      } else {
        setGenStep('')
        setActiveVariant(imgA ? 'A' : 'B')
      }
    } else {
      setGenStep('Prompts ready. Add VITE_STABILITY_API_KEY to .env to generate images.')
    }

    setGenerating(false)
  }

  // ── Synopsis generation ───────────────────────────────────────────────────
  async function handleGenerateSynopsis() {
    setGeneratingMeta(true)
    try {
      // Fetch first 20% of manuscript text
      const chapters    = getAllChapters(ms.structure || { chapters: [], hasParts: false })
      const allScenes   = chapters.flatMap(ch => ch.scenes || [])
      const first20pct  = allScenes.slice(0, Math.max(1, Math.ceil(allScenes.length * 0.2)))
      const sceneTexts  = await Promise.all(
        first20pct.map(s =>
          getDoc(doc(db, 'projects', projectId, 'scenes', s.id))
            .then(d => d.exists() ? (d.data().content || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 400) : '')
            .catch(() => '')
        )
      )
      const excerpt = sceneTexts.join('\n').slice(0, 1500)

      const blurb = await generateSynopsis({
        project: ms.project,
        characters,
        loreEntries,
        sceneExcerpts: excerpt,
      })
      if (blurb) setSynopsis(blurb)
    } catch (err) {
      console.error('[generateSynopsis]', err)
    }
    setGeneratingMeta(false)
  }

  // ── Save to project ───────────────────────────────────────────────────────
  async function handleSaveToProject() {
    if (!activeImage) return
    setSaving(true)
    try {
      await updateDoc(doc(db, 'projects', projectId), {
        coverImageUrl: activeImage,
        synopsis:      synopsis || ms.project?.synopsis || '',
        authorName:    authorName || '',
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error('[saveToProject]', err)
    }
    setSaving(false)
  }

  // ── Export ────────────────────────────────────────────────────────────────
  function handleExportFront() {
    if (!activeImage) return
    const img = document.createElement('img')
    img.onload = () => {
      const canvas   = document.createElement('canvas')
      canvas.width   = img.naturalWidth
      canvas.height  = img.naturalHeight
      canvas.getContext('2d').drawImage(img, 0, 0)
      exportCoverPNG(canvas, `${ms.project?.title || 'cover'}_front.png`)
    }
    img.src = activeImage
  }

  async function handleExportSpread() {
    const canvas = await compositeWrapSpread({
      frontImageDataUrl: activeImage,
      trimSize:          trimSizeId,
      pageCount,
      title:             ms.project?.title || 'Untitled',
      authorName,
      seriesName:        ms.project?.seriesName,
      synopsis,
      fontStyle,
      dpi:               300,
    })
    exportSpreadPDF(canvas, trimSizeId, pageCount, ms.project?.title)
  }

  if (ms.loading) return <LoadingSpinner fullscreen />

  const project   = ms.project
  const title     = project?.title || 'Untitled'
  const seriesName= project?.seriesName || ''

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-axiom-bg">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between h-12 px-4 bg-axiom-surface border-b border-axiom-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/projects/${projectId}`)} className="btn-icon">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="font-serif font-semibold text-slate-100 text-sm">Cover Studio</span>
          <span className="text-xs text-slate-600 truncate max-w-[200px]">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {activeImage && (
            <>
              <button
                onClick={handleSaveToProject}
                disabled={saving}
                className={`btn-ghost text-xs flex items-center gap-1.5 ${saved ? 'text-teal-400' : ''}`}
              >
                {saving
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                {saved ? 'Saved!' : 'Save to Project'}
              </button>
              <button onClick={handleExportFront} className="btn-ghost text-xs flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5" />Front PNG
              </button>
              <button onClick={handleExportSpread} className="btn-ghost text-xs flex items-center gap-1.5">
                <FileDown className="w-3.5 h-3.5" />Export PDF
              </button>
            </>
          )}
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left: Config panel ────────────────────────────────────────── */}
        <div className="w-[300px] flex-shrink-0 border-r border-axiom-border overflow-y-auto bg-axiom-surface">
          <div className="p-4 space-y-5">

            {/* Author name */}
            <div>
              <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block mb-1.5">Author Name</label>
              <input
                value={authorName}
                onChange={e => setAuthorName(e.target.value)}
                placeholder="Your name as it appears on the cover"
                className="input-base text-xs w-full"
              />
            </div>

            {/* Visual style */}
            <div>
              <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block mb-2">Visual Style</label>
              <div className="grid grid-cols-2 gap-1.5">
                {COVER_STYLES.map(s => (
                  <button
                    key={s.value}
                    onClick={() => setStyle(s.value)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${style === s.value ? 'border-gold-500/40 bg-gold-500/10' : 'border-axiom-border bg-axiom-surface2 hover:border-axiom-border-light'}`}
                  >
                    <p className={`text-[10px] font-semibold mb-0.5 ${style === s.value ? 'text-gold-400' : 'text-slate-300'}`}>{s.label}</p>
                    <p className="text-[9px] text-slate-700 leading-tight">{s.desc}</p>
                  </button>
                ))}
              </div>
              {style === 'custom' && (
                <textarea
                  value={customStyle}
                  onChange={e => setCustomStyle(e.target.value)}
                  placeholder="Describe the aesthetic you want…"
                  rows={2}
                  className="input-base text-xs w-full mt-2 resize-none"
                />
              )}
            </div>

            {/* Primary visual */}
            <div>
              <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block mb-1.5">Primary Visual Element</label>
              <input
                value={primaryVisual}
                onChange={e => setPrimaryVisual(e.target.value)}
                placeholder="e.g. a lone figure against a stormy sky"
                className="input-base text-xs w-full"
              />
              <p className="text-[9px] text-slate-700 mt-1">Leave blank for Claude to decide based on your lore.</p>
            </div>

            {/* Color palette */}
            <div>
              <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block mb-2">Color Palette</label>
              <div className="grid grid-cols-3 gap-1.5">
                {COLOR_PALETTES.map(p => (
                  <button
                    key={p.value}
                    onClick={() => setPalette(p.value)}
                    className={`p-2 rounded-xl border text-center transition-all ${palette === p.value ? 'border-gold-500/40 bg-gold-500/10' : 'border-axiom-border bg-axiom-surface2 hover:border-axiom-border-light'}`}
                  >
                    {/* Swatch */}
                    <div className="flex gap-0.5 justify-center mb-1">
                      {(p.colors.length > 0 ? p.colors : ['#8b5cf6', '#6d28d9', '#4c1d95']).map((c, i) => (
                        <div key={i} className="w-3 h-3 rounded-sm" style={{ background: c }} />
                      ))}
                    </div>
                    <p className={`text-[9px] font-medium ${palette === p.value ? 'text-gold-400' : 'text-slate-500'}`}>{p.label}</p>
                  </button>
                ))}
              </div>
              {palette === 'custom' && (
                <input
                  value={customColors}
                  onChange={e => setCustomColors(e.target.value)}
                  placeholder="#hex, #hex, #hex"
                  className="input-base text-xs w-full mt-2"
                />
              )}
            </div>

            {/* Title font */}
            <div>
              <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block mb-2">Title Font Style</label>
              <div className="flex flex-wrap gap-1.5">
                {FONT_STYLES.map(f => (
                  <button
                    key={f.value}
                    onClick={() => setFontStyle(f.value)}
                    className={`px-2.5 py-1.5 rounded-lg border text-[10px] transition-all ${fontStyle === f.value ? 'border-gold-500/40 bg-gold-500/10 text-gold-400' : 'border-axiom-border text-slate-500 hover:text-slate-300'}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Trim size */}
            <div>
              <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block mb-2">Trim Size</label>
              <select
                value={trimSizeId}
                onChange={e => setTrimSizeId(e.target.value)}
                className="input-base text-xs w-full"
              >
                {TRIM_SIZES.map(t => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Page count for spine */}
            <div>
              <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block mb-1.5">
                Page Count (for spine)
              </label>
              <input
                type="number"
                value={pageCount}
                onChange={e => setPageCount(Number(e.target.value))}
                min={100}
                className="input-base text-xs w-full"
              />
              <p className="text-[9px] text-slate-700 mt-1">
                Estimated: ~{Math.round((ms.project?.wordCount || 0) / 250)} pages from word count
              </p>
            </div>

            {/* Auto-populate toggle */}
            <div className="flex items-center justify-between py-2 border-t border-axiom-border">
              <div>
                <p className="text-xs font-medium text-slate-300">Auto-populate from project</p>
                <p className="text-[9px] text-slate-600 mt-0.5">Use character descriptions and world aesthetic</p>
              </div>
              <button
                onClick={() => setAutoPopulate(p => !p)}
                className={`relative w-9 h-5 rounded-full border transition-all ${autoPopulate ? 'border-teal-500/50 bg-teal-500/20' : 'border-slate-700 bg-axiom-surface2'}`}
              >
                <span className={`absolute top-[2px] w-[14px] h-[14px] rounded-full transition-all ${autoPopulate ? 'left-[20px] bg-teal-400' : 'left-[2px] bg-slate-600'}`} />
              </button>
            </div>

            {/* Artist import */}
            <ArtistImportPanel onImageLoaded={img => { setArtistImage(img); setImageA(null); setImageB(null) }} currentImage={artistImage} />

            {/* No Stability key warning */}
            {!import.meta.env.VITE_STABILITY_API_KEY && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-gold-500/5 border border-gold-500/20">
                <AlertTriangle className="w-4 h-4 text-gold-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-semibold text-gold-300">Stability AI key needed</p>
                  <p className="text-[9px] text-slate-600 mt-0.5 leading-relaxed">
                    Add <code className="text-slate-500">VITE_STABILITY_API_KEY</code> to .env to generate images. Claude will still build your optimized prompt.
                  </p>
                </div>
              </div>
            )}

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              {generating
                ? <><Loader2 className="w-4 h-4 animate-spin" />Generating…</>
                : <><Sparkles className="w-4 h-4" />Generate Cover</>}
            </button>

            {genStep && (
              <p className="text-[10px] text-slate-500 text-center leading-relaxed">{genStep}</p>
            )}
          </div>
        </div>

        {/* ── Right: Preview area ──────────────────────────────────────── */}
        <div className="flex-1 overflow-hidden flex flex-col bg-axiom-bg">

          {/* Preview toolbar */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-axiom-border bg-axiom-surface flex-shrink-0">
            <div className="flex items-center gap-2">
              {/* Variant selector */}
              {(imageA || imageB) && (
                <div className="flex items-center gap-1 bg-axiom-surface2 border border-axiom-border rounded-lg p-0.5">
                  {['A', 'B'].map(v => (
                    <button
                      key={v}
                      onClick={() => setActiveVariant(v)}
                      disabled={v === 'A' ? !imageA : !imageB}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all disabled:opacity-30 ${activeVariant === v ? 'bg-gold-500/20 text-gold-400' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      Variation {v}
                    </button>
                  ))}
                </div>
              )}
              {artistImage && (
                <button onClick={() => setArtistImage(null)} className="text-[10px] text-slate-600 hover:text-red-400 flex items-center gap-1 transition-colors">
                  <X className="w-3 h-3" />Clear artwork
                </button>
              )}
            </div>

            {/* Zoom */}
            <div className="flex items-center gap-1.5">
              <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="btn-icon w-6 h-6">
                <ZoomOut className="w-3 h-3" />
              </button>
              <span className="text-[10px] text-slate-600 w-10 text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="btn-icon w-6 h-6">
                <ZoomIn className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Spread preview */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-8">
            <WrapSpreadPreview
              frontImage={activeImage}
              title={title}
              author={authorName}
              series={seriesName}
              synopsis={synopsis}
              fontStyle={fontStyle}
              trimSizeId={trimSizeId}
              pageCount={pageCount}
              zoom={zoom}
            />
          </div>

          {/* ── Synopsis / back cover ─────────────────────────────────── */}
          <div className="border-t border-axiom-border bg-axiom-surface p-4 space-y-3 flex-shrink-0" style={{ maxHeight: 240 }}>
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Back Cover Synopsis</p>
              <button
                onClick={handleGenerateSynopsis}
                disabled={generatingMeta}
                className="btn-ghost text-[10px] flex items-center gap-1.5"
              >
                {generatingMeta
                  ? <><Loader2 className="w-3 h-3 animate-spin" />Generating…</>
                  : <><Sparkles className="w-3 h-3" />Generate Synopsis</>}
              </button>
            </div>
            <textarea
              value={synopsis}
              onChange={e => setSynopsis(e.target.value)}
              placeholder="Your 150-200 word back cover blurb will appear here. Click 'Generate Synopsis' to create one using Claude, or type your own."
              rows={4}
              className="input-base text-xs w-full resize-none leading-relaxed"
            />

            {/* Prompted text — shows the optimized prompt if no Stability key */}
            {promptA && !import.meta.env.VITE_STABILITY_API_KEY && (
              <details className="text-[10px] text-slate-700">
                <summary className="cursor-pointer hover:text-slate-500 transition-colors">View Claude-optimized image prompts</summary>
                <div className="mt-2 space-y-2">
                  <div className="p-2 rounded bg-axiom-surface2 border border-axiom-border">
                    <p className="text-[9px] font-semibold text-slate-600 mb-1">PROMPT A</p>
                    <p className="text-[9px] text-slate-500 leading-relaxed">{promptA}</p>
                  </div>
                  {promptB && (
                    <div className="p-2 rounded bg-axiom-surface2 border border-axiom-border">
                      <p className="text-[9px] font-semibold text-slate-600 mb-1">PROMPT B</p>
                      <p className="text-[9px] text-slate-500 leading-relaxed">{promptB}</p>
                    </div>
                  )}
                  <p className="text-[9px] text-slate-700">Use these with Midjourney, DALL-E 3, or any image generation service.</p>
                </div>
              </details>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
