import React, { useRef, useState, useEffect, useCallback } from 'react'
import { Stage, Layer, Line, Image as KonvaImage, Circle, Text, RegularPolygon, Star, Group, Rect } from 'react-konva'
import { TOOL_TYPES, STAMP_TYPES, PATH_TYPES } from '../../hooks/useWorldMap'
import { StampShape } from './stampLibrary'
import useImage from './useImage'

// ── Pin marker ────────────────────────────────────────────────────────────────
function LocationPin({ pin, isSelected, onClick, onRightClick, onDragEnd, mapStyle }) {
  const colors = {
    parchment: { fill: '#8b5e3c', stroke: '#5a3a1a', text: '#3a2010' },
    fantasy:   { fill: '#c8a84b', stroke: '#8b6914', text: '#fffde0' },
    schematic: { fill: '#3a9fd5', stroke: '#1a6fa5', text: '#e0f4ff' },
    modern:    { fill: '#2563eb', stroke: '#1d4ed8', text: '#ffffff' },
  }
  const c = colors[mapStyle] || colors.parchment

  const typeIcons = {
    city: '⬟', town: '⬡', landmark: '★', dungeon: '▽',
    wilderness: '◈', sea: '〜', mountain: '▲', default: '●',
  }

  return (
    <Group
      x={pin.x}
      y={pin.y}
      draggable
      onClick={onClick}
      onContextMenu={onRightClick}
      onDragEnd={e => onDragEnd(e.target.x(), e.target.y())}
    >
      {/* Glow for selected */}
      {isSelected && (
        <Circle radius={16} fill="rgba(255,215,0,0.25)" stroke="rgba(255,215,0,0.6)" strokeWidth={1.5} />
      )}
      {/* Pin body */}
      <Circle
        radius={8}
        fill={c.fill}
        stroke={isSelected ? '#ffd700' : c.stroke}
        strokeWidth={isSelected ? 2 : 1.5}
      />
      {/* Name label */}
      <Text
        text={pin.name || 'Location'}
        x={-40}
        y={11}
        width={80}
        align="center"
        fontSize={10}
        fill={mapStyle === 'parchment' ? '#3a2010' : mapStyle === 'schematic' ? '#7ad0f0' : '#1a1a2e'}
        fontStyle="bold"
        fontFamily={mapStyle === 'parchment' ? 'Georgia, serif' : 'sans-serif'}
        shadowColor="rgba(255,255,255,0.8)"
        shadowBlur={3}
        shadowOffsetX={0}
        shadowOffsetY={0}
      />
      {/* Scene pin indicator */}
      {(pin.scenePins?.length > 0) && (
        <Circle
          x={8} y={-8}
          radius={5}
          fill="#f59e0b"
          stroke="#92400e"
          strokeWidth={1}
        />
      )}
      {/* Child map indicator */}
      {pin.hasChildMap && (
        <Text text="↗" x={6} y={-20} fontSize={10} fill={c.fill} />
      )}
    </Group>
  )
}

// ── Map stamp (vector asset from the stamp library) ───────────────────────────
function MapStamp({ stamp, isSelected, onClick, onDragEnd, mapStyle }) {
  const scale = stamp.scale || 1
  return (
    <Group
      x={stamp.x}
      y={stamp.y}
      rotation={stamp.rotation || 0}
      scaleX={scale * (stamp.flipX ? -1 : 1)}
      scaleY={scale}
      draggable
      onClick={onClick}
      onTap={onClick}
      onDragEnd={e => onDragEnd(e.target.x(), e.target.y())}
    >
      {isSelected && (
        <Circle radius={26} fill="rgba(255,215,0,0.12)" stroke="rgba(255,215,0,0.5)" strokeWidth={1.5 / scale} />
      )}
      <StampShape type={stamp.type} mapStyle={mapStyle} />
    </Group>
  )
}

// ── Faction territory ─────────────────────────────────────────────────────────
function FactionBorder({ border, isSelected, onClick }) {
  if (!border.points || border.points.length < 4) return null
  // Support both flat [x,y,x,y,...] (new) and nested [[x,y],...] (legacy) formats
  const flat = Array.isArray(border.points[0])
    ? border.points.flatMap(([x, y]) => [x, y])
    : border.points
  const hex  = border.color || '#ff6b35'
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)

  return (
    <Line
      points={flat}
      closed
      fill={`rgba(${r},${g},${b},0.15)`}
      stroke={isSelected ? '#ffd700' : hex}
      strokeWidth={isSelected ? 2.5 : 1.5}
      dash={[8, 4]}
      hitStrokeWidth={14}
      onClick={onClick}
    />
  )
}

// ── Map label ─────────────────────────────────────────────────────────────────
function MapLabel({ label, isSelected, onClick, onDragEnd }) {
  return (
    <Group x={label.x} y={label.y} draggable onClick={onClick} onDragEnd={e => onDragEnd(e.target.x(), e.target.y())}>
      {isSelected && <Rect x={-4} y={-2} width={(label.text?.length || 0) * (label.fontSize || 14) * 0.6 + 8} height={(label.fontSize || 14) * 1.4} fill="rgba(255,215,0,0.1)" stroke="rgba(255,215,0,0.5)" strokeWidth={1} cornerRadius={2} />}
      <Text
        text={label.text || ''}
        fontSize={label.fontSize || 14}
        fill={label.color || '#3a2010'}
        fontStyle={label.fontStyle || 'normal'}
        fontFamily="Georgia, serif"
        shadowColor="rgba(255,255,255,0.6)"
        shadowBlur={4}
      />
    </Group>
  )
}

// ── Background image ──────────────────────────────────────────────────────────
function BackgroundImage({ src, width, height }) {
  const [image] = useImage(src)
  if (!image) return null
  return <KonvaImage name="background" image={image} width={width} height={height} x={0} y={0} />
}

// ── Main Canvas ───────────────────────────────────────────────────────────────
export default function MapCanvas({
  map,
  activeTool,
  activeColor,
  strokeWidth,
  onAddPin,
  onUpdatePin,
  onDeletePin,
  onAddPath,
  onDeletePath,
  onAddStamp,
  onUpdateStamp,
  onDeleteStamp,
  painter,
  terrainBrush,
  brushSize,
  onTerrainCommit,
  onAddFactionBorder,
  onUpdateFactionBorder,
  onDeleteFactionBorder,
  onAddLabel,
  onUpdateLabel,
  onDeleteLabel,
  onPinClick,
  onPinContextMenu,
  selectedId,
  onSelect,
  stageRef,
}) {
  const containerRef  = useRef(null)
  const [stageSize, setStageSize]   = useState({ width: 800, height: 600 })
  const [scale, setScale]           = useState(1)
  const [pos, setPos]               = useState({ x: 0, y: 0 })
  const [drawing, setDrawing]       = useState(false)
  const [currentPath, setCurrentPath] = useState([])
  const [factionDraft, setFactionDraft] = useState(null) // { points: [[x,y]] }
  const [labelDraft, setLabelDraft]   = useState(null)   // { x, y }
  const [labelInput, setLabelInput]   = useState('')
  const painting        = useRef(false)
  const terrainNodeRef  = useRef(null)
  const brushCursorRef  = useRef(null)

  // Resize stage to container
  useEffect(() => {
    function measure() {
      if (!containerRef.current) return
      setStageSize({
        width:  containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      })
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  const mapW = map?.width  || 1600
  const mapH = map?.height || 900

  // Redraw the terrain node when the paint engine replaces canvas content
  // (initial load, undo, redo) — the canvas element reference never changes.
  useEffect(() => {
    terrainNodeRef.current?.getLayer()?.batchDraw()
  }, [painter?.version])

  // Hide the brush cursor when leaving the terrain/eraser tools
  useEffect(() => {
    const isBrushTool = activeTool === TOOL_TYPES.TERRAIN || activeTool === TOOL_TYPES.ERASER
    if (!isBrushTool && brushCursorRef.current) {
      brushCursorRef.current.visible(false)
      brushCursorRef.current.getLayer()?.batchDraw()
    }
  }, [activeTool])

  // World-space position from stage event
  function stagePos(e) {
    const stage = e.target.getStage()
    const p     = stage.getPointerPosition()
    return {
      x: (p.x - pos.x) / scale,
      y: (p.y - pos.y) / scale,
    }
  }

  // ── Zoom ────────────────────────────────────────────────────────────────────
  function handleWheel(e) {
    e.evt.preventDefault()
    const stage  = e.target.getStage()
    const oldScale = scale
    const pointer  = stage.getPointerPosition()
    const delta    = e.evt.deltaY > 0 ? 0.9 : 1.1
    const newScale = Math.min(Math.max(oldScale * delta, 0.2), 5)
    const mousePointTo = {
      x: (pointer.x - pos.x) / oldScale,
      y: (pointer.y - pos.y) / oldScale,
    }
    setScale(newScale)
    setPos({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    })
  }

  // ── Eraser sweep: delete objects the brush circle passes over ───────────────
  // Deletes at most one object per collection per call — each delete rebuilds
  // that collection from current state, so batching within one event would
  // resurrect earlier deletions from a stale array.
  function eraseObjectsAt(x, y, r) {
    if (!map) return

    const hitPath = (map.paths || []).find(p => {
      const pts = p.points || []
      for (let i = 0; i < pts.length - 1; i += 2) {
        if (Math.hypot(pts[i] - x, pts[i + 1] - y) < r) return true
      }
      return false
    })
    if (hitPath) onDeletePath(hitPath.id)

    const hitStamp = (map.stamps || []).find(s =>
      Math.hypot(s.x - x, s.y - y) < r + 22 * (s.scale || 1)
    )
    if (hitStamp) onDeleteStamp(hitStamp.id)

    const hitLabel = (map.labels || []).find(l => {
      const halfW = ((l.text?.length || 4) * (l.fontSize || 14) * 0.6) / 2
      return Math.hypot(l.x + halfW - x, l.y - y) < r + halfW * 0.6
    })
    if (hitLabel) onDeleteLabel(hitLabel.id)

    const hitBorder = (map.factionBorders || []).find(b => {
      const pts = b.points || []
      for (let i = 0; i < pts.length - 1; i += 2) {
        if (Math.hypot(pts[i] - x, pts[i + 1] - y) < r) return true
      }
      return false
    })
    if (hitBorder) onDeleteFactionBorder(hitBorder.id)

    // Pins are deliberately NOT sweep-erased — they carry lore links and
    // scene pins. Deleting a pin stays an explicit click.
  }

  // ── Mouse events ─────────────────────────────────────────────────────────────
  function handleMouseDown(e) {
    // Eraser starts a sweep stroke no matter what's under the cursor:
    // dragging erases painted terrain AND any object the brush passes over.
    // (A simple click on an object still deletes it via the object's own
    // click handler.)
    if (activeTool === TOOL_TYPES.ERASER) {
      onSelect(null)
      const { x, y } = stagePos(e)
      painting.current = true
      if (painter?.canvas) {
        painter.strokeStart()
        painter.paint(x, y, { id: 'erase' }, brushSize || 40)
        terrainNodeRef.current?.getLayer()?.batchDraw()
      }
      eraseObjectsAt(x, y, brushSize || 40)
      return
    }

    const isStage      = e.target === e.target.getStage()
    const isBackground = e.target.name() === 'background'
    if (!isStage && !isBackground) {
      return // clicked on an interactive shape — let it handle itself
    }
    onSelect(null)
    const { x, y } = stagePos(e)

    if (activeTool === TOOL_TYPES.TERRAIN && painter) {
      painting.current = true
      painter.strokeStart()
      painter.paint(x, y, terrainBrush, brushSize || 40)
      terrainNodeRef.current?.getLayer()?.batchDraw()
      return
    }

    if (activeTool === TOOL_TYPES.PEN || activeTool === TOOL_TYPES.RIVER || activeTool === TOOL_TYPES.ROAD) {
      setDrawing(true)
      setCurrentPath([x, y])
    }

    if (activeTool === TOOL_TYPES.PIN) {
      onAddPin({ x, y, name: 'New Location', type: 'town' })
    }

    if (STAMP_TYPES.includes(activeTool)) {
      onAddStamp({ x, y, type: activeTool, scale: 1 })
    }

    if (activeTool === TOOL_TYPES.LABEL) {
      setLabelDraft({ x, y })
      setLabelInput('')
    }

    if (activeTool === TOOL_TYPES.FACTION) {
      if (!factionDraft) {
        setFactionDraft({ points: [[x, y]], color: activeColor })
      } else {
        setFactionDraft(prev => ({ ...prev, points: [...prev.points, [x, y]] }))
      }
    }
  }

  function handleMouseMove(e) {
    // Terrain/eraser brush cursor follows the pointer (imperative — avoids re-renders)
    const isBrushTool = activeTool === TOOL_TYPES.TERRAIN || activeTool === TOOL_TYPES.ERASER
    if (isBrushTool && brushCursorRef.current) {
      const { x, y } = stagePos(e)
      brushCursorRef.current.position({ x, y })
      brushCursorRef.current.visible(true)
      if (painting.current && painter) {
        const brush = activeTool === TOOL_TYPES.ERASER ? { id: 'erase' } : terrainBrush
        painter.paint(x, y, brush, brushSize || 40)
      }
      if (painting.current && activeTool === TOOL_TYPES.ERASER) {
        eraseObjectsAt(x, y, brushSize || 40)
      }
      brushCursorRef.current.getLayer()?.batchDraw()
      terrainNodeRef.current?.getLayer()?.batchDraw()
      return
    }

    if (!drawing) return
    const { x, y } = stagePos(e)
    setCurrentPath(prev => [...prev, x, y])
  }

  function handleMouseUp() {
    if (painting.current && painter) {
      painting.current = false
      const dataUrl = painter.strokeEnd()
      if (dataUrl) onTerrainCommit?.(dataUrl)
      return
    }

    if (drawing && currentPath.length >= 4) {
      const pathColors = {
        [TOOL_TYPES.PEN]:   activeColor || (map?.style === 'schematic' ? '#3a9fd5' : '#5a3a1a'),
        [TOOL_TYPES.RIVER]: '#4a90d9',
        [TOOL_TYPES.ROAD]:  '#8b6914',
      }
      onAddPath({
        points:      currentPath,
        type:        activeTool,
        color:       pathColors[activeTool] || activeColor || '#5a3a1a',
        strokeWidth: strokeWidth || (activeTool === TOOL_TYPES.RIVER ? 2 : activeTool === TOOL_TYPES.ROAD ? 2 : 1.5),
        dash:        activeTool === TOOL_TYPES.ROAD ? [6, 3] : undefined,
      })
    }
    setDrawing(false)
    setCurrentPath([])
  }

  // Double-click: finish faction polygon
  function handleDblClick(e) {
    if (activeTool === TOOL_TYPES.FACTION && factionDraft?.points?.length >= 3) {
      onAddFactionBorder({
        points: factionDraft.points,
        color:  factionDraft.color || activeColor || '#ff6b35',
        name:   'New Territory',
      })
      setFactionDraft(null)
    }
  }

  // ── Path color by style/type ──────────────────────────────────────────────
  function pathColor(path) {
    if (path.color) return path.color
    if (path.type === 'river') return '#4a90d9'
    if (path.type === 'road')  return '#8b6914'
    return map?.style === 'schematic' ? '#3a9fd5' : '#5a3a1a'
  }

  function pathDash(path) {
    if (path.dash) return path.dash
    if (path.type === 'road') return [6, 3]
    return undefined
  }

  // ── Label input submit ────────────────────────────────────────────────────
  function submitLabel(e) {
    e.preventDefault()
    if (labelDraft && labelInput.trim()) {
      onAddLabel({ x: labelDraft.x, y: labelDraft.y, text: labelInput.trim(), fontSize: 16, color: activeColor || (map?.style === 'parchment' ? '#3a2010' : '#e0e0e0') })
    }
    setLabelDraft(null)
    setLabelInput('')
  }

  // ── Cursor style ──────────────────────────────────────────────────────────
  const cursors = {
    [TOOL_TYPES.SELECT]:  'default',
    [TOOL_TYPES.TERRAIN]: 'crosshair',
    [TOOL_TYPES.PEN]:     'crosshair',
    [TOOL_TYPES.RIVER]:   'crosshair',
    [TOOL_TYPES.ROAD]:    'crosshair',
    [TOOL_TYPES.PIN]:     'cell',
    [TOOL_TYPES.FACTION]: 'crosshair',
    [TOOL_TYPES.LABEL]:   'text',
    [TOOL_TYPES.ERASER]:  'pointer',
  }
  const cursor = STAMP_TYPES.includes(activeTool) ? 'copy' : (cursors[activeTool] || 'default')

  return (
    <div ref={containerRef} className="flex-1 overflow-hidden relative" style={{ cursor }}>

      {/* Faction polygon hint */}
      {activeTool === TOOL_TYPES.FACTION && factionDraft && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 bg-axiom-surface/90 border border-axiom-border rounded-full text-xs text-slate-400">
          Click to add points · Double-click to close territory
        </div>
      )}

      {/* Label input overlay */}
      {labelDraft && (
        <form
          onSubmit={submitLabel}
          style={{
            position: 'absolute',
            left: labelDraft.x * scale + pos.x,
            top:  labelDraft.y * scale + pos.y,
            zIndex: 20,
          }}
        >
          <input
            autoFocus
            value={labelInput}
            onChange={e => setLabelInput(e.target.value)}
            onBlur={submitLabel}
            placeholder="Label text…"
            className="bg-axiom-surface border border-gold-500/40 text-slate-200 text-sm px-2 py-1 rounded outline-none shadow-lg min-w-[120px]"
          />
        </form>
      )}

      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        scaleX={scale}
        scaleY={scale}
        x={pos.x}
        y={pos.y}
        draggable={activeTool === TOOL_TYPES.SELECT}
        onDragEnd={e => {
          if (e.target === e.target.getStage()) setPos({ x: e.target.x(), y: e.target.y() })
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
        onDblClick={handleDblClick}
      >
        {/* Layer 0: Background + Paths (merged — background renders first) */}
        <Layer>
          {/* Background */}
          {(map?.backgroundUrl || map?.backgroundData) ? (
            <BackgroundImage
              src={map.backgroundUrl || map.backgroundData}
              width={mapW}
              height={mapH}
            />
          ) : (
            <Rect
              name="background"
              width={mapW}
              height={mapH}
              fill={
                map?.style === 'parchment' ? '#e8d5a3' :
                map?.style === 'fantasy'   ? '#1a3a2a' :
                map?.style === 'schematic' ? '#0a1628' :
                '#f0f4f8'
              }
            />
          )}

          {/* Painted terrain (offscreen canvas from the terrain paint engine) */}
          {painter?.canvas && (
            <KonvaImage
              ref={terrainNodeRef}
              image={painter.canvas}
              width={mapW}
              height={mapH}
              x={0}
              y={0}
              listening={false}
            />
          )}

          {/* Paths (coastlines, rivers, roads) */}
          {(map?.paths || []).map(path => (
            <Line
              key={path.id}
              points={path.points}
              stroke={pathColor(path)}
              strokeWidth={path.strokeWidth || 1.5}
              tension={path.type === 'river' ? 0.5 : 0.2}
              dash={pathDash(path)}
              lineCap="round"
              lineJoin="round"
              opacity={0.85}
              hitStrokeWidth={14}
              onClick={() => {
                if (activeTool === TOOL_TYPES.ERASER) onDeletePath(path.id)
                else onSelect(path.id)
              }}
            />
          ))}

          {/* In-progress drawing */}
          {drawing && currentPath.length >= 4 && (
            <Line
              points={currentPath}
              stroke={activeColor || '#5a3a1a'}
              strokeWidth={strokeWidth || 1.5}
              tension={0.3}
              lineCap="round"
              opacity={0.7}
            />
          )}
        </Layer>

        {/* Layer 1: Faction borders */}
        <Layer>
          {(map?.factionBorders || []).map(border => (
            <FactionBorder
              key={border.id}
              border={border}
              isSelected={selectedId === border.id}
              onClick={() => {
                if (activeTool === TOOL_TYPES.ERASER) onDeleteFactionBorder(border.id)
                else onSelect(border.id)
              }}
            />
          ))}

          {/* Draft faction polygon */}
          {factionDraft?.points?.length >= 2 && (
            <Line
              points={factionDraft.points.flatMap(([x, y]) => [x, y])}
              stroke={factionDraft.color || activeColor || '#ff6b35'}
              strokeWidth={1.5}
              dash={[6, 3]}
              opacity={0.7}
            />
          )}
        </Layer>

        {/* Layer 2: Terrain stamps + Labels (merged — stamps render under labels) */}
        <Layer>
          {/* Stamps */}
          {(map?.stamps || []).map(stamp => (
            <MapStamp
              key={stamp.id}
              stamp={stamp}
              isSelected={selectedId === stamp.id}
              mapStyle={map?.style}
              onClick={() => {
                if (activeTool === TOOL_TYPES.ERASER) onDeleteStamp(stamp.id)
                else onSelect(stamp.id)
              }}
              onDragEnd={(x, y) => onUpdateStamp?.(stamp.id, { x, y })}
            />
          ))}

          {/* Labels */}
          {(map?.labels || []).map(label => (
            <MapLabel
              key={label.id}
              label={label}
              isSelected={selectedId === label.id}
              onClick={() => {
                if (activeTool === TOOL_TYPES.ERASER) onDeleteLabel(label.id)
                else onSelect(label.id)
              }}
              onDragEnd={(x, y) => onUpdateLabel(label.id, { x, y })}
            />
          ))}
        </Layer>

        {/* Layer 3: Location pins */}
        <Layer>
          {(map?.pins || []).map(pin => (
            <LocationPin
              key={pin.id}
              pin={pin}
              isSelected={selectedId === pin.id}
              mapStyle={map?.style}
              onClick={() => {
                if (activeTool === TOOL_TYPES.ERASER) {
                  onDeletePin(pin.id)
                } else {
                  onSelect(pin.id)
                  onPinClick?.(pin)
                }
              }}
              onRightClick={(e) => {
                e.evt.preventDefault()
                onPinContextMenu?.(pin, e.evt)
              }}
              onDragEnd={(x, y) => onUpdatePin(pin.id, { x, y })}
            />
          ))}

          {/* Terrain/eraser brush cursor (positioned imperatively on mousemove) */}
          {(activeTool === TOOL_TYPES.TERRAIN || activeTool === TOOL_TYPES.ERASER) && (
            <Circle
              ref={brushCursorRef}
              radius={brushSize || 40}
              stroke={activeTool === TOOL_TYPES.ERASER ? 'rgba(255,120,120,0.9)' : 'rgba(255,255,255,0.8)'}
              strokeWidth={1.5 / scale}
              dash={[6 / scale, 4 / scale]}
              listening={false}
              visible={false}
            />
          )}
        </Layer>
      </Stage>
    </div>
  )
}
