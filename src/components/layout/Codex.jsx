/**
 * Codex — Axiom's built-in help system.
 * Full visual guide with SVG illustrations for every feature.
 */
import React, { useState } from 'react'
import {
  X, BookOpen, Feather, Users, GitBranch, Clock,
  Zap, Map, LayoutGrid, HelpCircle, Layers, AlertCircle, ClipboardCheck,
} from 'lucide-react'

// ─── SVG Illustrations ────────────────────────────────────────────────────────

function IllustrationScenes() {
  return (
    <svg viewBox="0 0 500 210" className="w-full rounded-xl border border-white/5">
      <rect width="500" height="210" rx="8" fill="#0d1420"/>
      {/* Sidebar */}
      <rect x="0" y="0" width="125" height="210" rx="8" fill="#111827"/>
      <rect x="10" y="14" width="55" height="2.5" rx="1" fill="#374151"/>
      {/* Chapter 1 */}
      <rect x="8" y="26" width="109" height="14" rx="2" fill="#1f2937"/>
      <rect x="13" y="31" width="5" height="3" rx="1" fill="#c9a84c" opacity="0.5"/>
      <rect x="22" y="32" width="55" height="2" rx="1" fill="#4b5563"/>
      {/* Scene active */}
      <rect x="14" y="44" width="103" height="12" rx="2" fill="#c9a84c" opacity="0.12"/>
      <rect x="22" y="48" width="3" height="3" rx="1.5" fill="#2dd4bf"/>
      <rect x="29" y="49" width="50" height="2" rx="1" fill="#c9a84c" opacity="0.7"/>
      {/* Scene 2 */}
      <rect x="22" y="61" width="3" height="3" rx="1.5" fill="#c9a84c"/>
      <rect x="29" y="62" width="45" height="2" rx="1" fill="#4b5563"/>
      {/* Scene 3 */}
      <rect x="22" y="74" width="3" height="3" rx="1.5" fill="#374151"/>
      <rect x="29" y="75" width="52" height="2" rx="1" fill="#374151"/>
      {/* Chapter 2 */}
      <rect x="8" y="90" width="109" height="14" rx="2" fill="#1f2937"/>
      <rect x="13" y="95" width="5" height="3" rx="1" fill="#c9a84c" opacity="0.5"/>
      <rect x="22" y="96" width="48" height="2" rx="1" fill="#4b5563"/>
      <rect x="22" y="110" width="3" height="3" rx="1.5" fill="#374151"/>
      <rect x="29" y="111" width="44" height="2" rx="1" fill="#374151"/>
      <rect x="22" y="123" width="3" height="3" rx="1.5" fill="#374151"/>
      <rect x="29" y="124" width="55" height="2" rx="1" fill="#374151"/>
      {/* Sidebar bottom legend */}
      <rect x="10" y="195" width="8" height="2" rx="1" fill="#2dd4bf"/>
      <rect x="22" y="195" width="18" height="2" rx="1" fill="#374151"/>
      <rect x="46" y="195" width="8" height="2" rx="1" fill="#c9a84c"/>
      <rect x="58" y="195" width="20" height="2" rx="1" fill="#374151"/>

      {/* Divider */}
      <rect x="125" y="0" width="1" height="210" fill="#1f2937"/>

      {/* Editor area */}
      {/* Toolbar */}
      <rect x="126" y="0" width="374" height="24" fill="#111827"/>
      <rect x="135" y="9" width="12" height="6" rx="2" fill="#1f2937"/>
      <rect x="151" y="9" width="12" height="6" rx="2" fill="#1f2937"/>
      <rect x="167" y="9" width="12" height="6" rx="2" fill="#1f2937"/>
      <rect x="185" y="9" width="20" height="6" rx="2" fill="#1f2937"/>
      <rect x="460" y="9" width="32" height="6" rx="2" fill="#c9a84c" opacity="0.3"/>

      {/* Tab bar */}
      <rect x="126" y="24" width="374" height="22" fill="#0d1420"/>
      <rect x="138" y="33" width="22" height="2" rx="1" fill="#c9a84c"/>
      <rect x="138" y="44" width="22" height="1.5" rx="0.5" fill="#c9a84c"/>
      <rect x="170" y="33" width="28" height="2" rx="1" fill="#374151"/>
      <rect x="207" y="33" width="22" height="2" rx="1" fill="#374151"/>

      {/* Scene title */}
      <rect x="150" y="58" width="160" height="7" rx="2" fill="#e5e7eb" opacity="0.75"/>

      {/* Body text lines */}
      <rect x="150" y="76" width="300" height="2.5" rx="1" fill="#1f2937"/>
      <rect x="150" y="83" width="275" height="2.5" rx="1" fill="#1f2937"/>
      <rect x="150" y="90" width="290" height="2.5" rx="1" fill="#1f2937"/>
      <rect x="150" y="97" width="250" height="2.5" rx="1" fill="#1f2937"/>
      <rect x="150" y="110" width="300" height="2.5" rx="1" fill="#1f2937"/>
      <rect x="150" y="117" width="260" height="2.5" rx="1" fill="#1f2937"/>
      <rect x="150" y="124" width="285" height="2.5" rx="1" fill="#1f2937"/>
      <rect x="150" y="131" width="240" height="2.5" rx="1" fill="#1f2937"/>
      <rect x="150" y="144" width="295" height="2.5" rx="1" fill="#1f2937"/>
      <rect x="150" y="151" width="270" height="2.5" rx="1" fill="#1f2937"/>

      {/* Status bar */}
      <rect x="126" y="188" width="374" height="22" fill="#111827"/>
      <rect x="138" y="196" width="45" height="2" rx="1" fill="#374151"/>
      <rect x="430" y="196" width="30" height="2" rx="1" fill="#374151"/>
      <rect x="465" y="196" width="25" height="2" rx="1" fill="#2dd4bf" opacity="0.6"/>
    </svg>
  )
}

function IllustrationCharacters() {
  const cards = [
    { x: 14,  role: '#c9a84c', name: 80, tag: '#c9a84c', tagW: 52 },
    { x: 126, role: '#ef4444', name: 70, tag: '#ef4444', tagW: 48 },
    { x: 238, role: '#7c5cbf', name: 85, tag: '#7c5cbf', tagW: 58 },
    { x: 350, role: '#2dd4bf', name: 65, tag: '#2dd4bf', tagW: 55 },
  ]
  return (
    <svg viewBox="0 0 478 200" className="w-full rounded-xl border border-white/5">
      <rect width="478" height="200" rx="8" fill="#0d1420"/>
      {/* Header bar */}
      <rect x="0" y="0" width="478" height="26" rx="8" fill="#111827"/>
      <rect x="14" y="10" width="70" height="3" rx="1" fill="#374151"/>
      <rect x="370" y="8" width="52" height="10" rx="3" fill="#c9a84c" opacity="0.15"/>
      <rect x="376" y="12" width="40" height="2" rx="1" fill="#c9a84c"/>

      {cards.map((c, i) => (
        <g key={i}>
          <rect x={c.x} y="38" width="100" height="142" rx="6" fill="#111827"/>
          {/* Avatar circle */}
          <circle cx={c.x + 50} cy="75" r="22" fill="#1f2937"/>
          <circle cx={c.x + 50} cy="75" r="22" fill="none" stroke={c.role} strokeWidth="1.5" opacity="0.4"/>
          <rect x={c.x + 40} y="70" width="20" height="2.5" rx="1" fill={c.role} opacity="0.7"/>
          <rect x={c.x + 43} y="75" width="14" height="2.5" rx="1" fill={c.role} opacity="0.5"/>
          {/* Role badge */}
          <rect x={c.x + (100 - c.tagW) / 2} y="104" width={c.tagW} height="10" rx="3" fill={c.tag} opacity="0.12"/>
          <rect x={c.x + (100 - c.tagW) / 2 + 6} y="107" width={c.tagW - 12} height="2" rx="1" fill={c.tag} opacity="0.7"/>
          {/* Name */}
          <rect x={c.x + (100 - c.name) / 2} y="120" width={c.name} height="3" rx="1" fill="#e5e7eb" opacity="0.6"/>
          {/* Stats */}
          <rect x={c.x + 14} y="132" width="28" height="2" rx="1" fill="#374151"/>
          <rect x={c.x + 58} y="132" width="28" height="2" rx="1" fill="#374151"/>
          <rect x={c.x + 14} y="140" width="72" height="2" rx="1" fill="#1f2937"/>
          <rect x={c.x + 14} y="148" width="60" height="2" rx="1" fill="#1f2937"/>
          <rect x={c.x + 14} y="156" width="66" height="2" rx="1" fill="#1f2937"/>
          {/* View button */}
          <rect x={c.x + 14} y="166" width="72" height="8" rx="2" fill="#1f2937"/>
          <rect x={c.x + 28} y="169" width="44" height="2" rx="1" fill="#4b5563"/>
        </g>
      ))}
    </svg>
  )
}

function IllustrationLore() {
  const entries = [
    { y: 44,  color: '#c9a84c', cat: 'Location',   title: 100, body: 220, body2: 180 },
    { y: 108, color: '#2dd4bf', cat: 'Magic',       title: 80,  body: 200, body2: 160 },
    { y: 172, color: '#7c5cbf', cat: 'History',     title: 90,  body: 210, body2: 170 },
  ]
  return (
    <svg viewBox="0 0 478 230" className="w-full rounded-xl border border-white/5">
      <rect width="478" height="230" rx="8" fill="#0d1420"/>
      {/* Header */}
      <rect x="0" y="0" width="478" height="34" rx="8" fill="#111827"/>
      <rect x="14" y="10" width="55" height="3" rx="1" fill="#374151"/>
      <rect x="14" y="17" width="85" height="2" rx="1" fill="#1f2937"/>
      {/* Tab bar */}
      <rect x="330" y="8" width="38" height="16" rx="3" fill="#c9a84c" opacity="0.12"/>
      <rect x="338" y="14" width="22" height="2" rx="1" fill="#c9a84c"/>
      <rect x="374" y="8" width="38" height="16" rx="3" fill="transparent"/>
      <rect x="380" y="14" width="26" height="2" rx="1" fill="#374151"/>
      {/* Filter chips */}
      <rect x="14" y="42" width="44" height="10" rx="3" fill="#374151"/>
      <rect x="20" y="45" width="32" height="2" rx="1" fill="#6b7280"/>
      <rect x="64" y="42" width="52" height="10" rx="3" fill="#c9a84c" opacity="0.15"/>
      <rect x="70" y="45" width="40" height="2" rx="1" fill="#c9a84c"/>

      {entries.map((e, i) => (
        <g key={i}>
          <rect x="14" y={e.y + 14} width="450" height="52" rx="5" fill="#111827"/>
          <rect x="22" y={e.y + 20} width="52" height="10" rx="3" fill={e.color} opacity="0.15"/>
          <rect x="28" y={e.y + 23} width="40" height="2" rx="1" fill={e.color} opacity="0.8"/>
          <rect x="82" y={e.y + 20} width={e.title} height="3" rx="1" fill="#e5e7eb" opacity="0.7"/>
          <rect x="22" y={e.y + 37} width={e.body} height="2" rx="1" fill="#374151"/>
          <rect x="22" y={e.y + 43} width={e.body2} height="2" rx="1" fill="#374151"/>
          {/* Locked icon */}
          <rect x="432" y={e.y + 24} width="24" height="14" rx="3" fill={i === 0 ? '#ef4444' : '#1f2937'} opacity={i === 0 ? 0.15 : 1}/>
          <rect x="437" y={e.y + 28} width="14" height="2" rx="1" fill={i === 0 ? '#ef4444' : '#374151'} opacity={i === 0 ? 0.8 : 1}/>
        </g>
      ))}
    </svg>
  )
}

function IllustrationLoreGaps() {
  return (
    <svg viewBox="0 0 478 210" className="w-full rounded-xl border border-white/5">
      <rect width="478" height="210" rx="8" fill="#0d1420"/>
      {/* Editor area */}
      <rect x="14" y="14" width="280" height="182" rx="6" fill="#111827"/>
      {/* Text paragraph */}
      <rect x="28" y="30" width="220" height="2.5" rx="1" fill="#374151"/>
      <rect x="28" y="38" width="200" height="2.5" rx="1" fill="#374151"/>
      <rect x="28" y="46" width="235" height="2.5" rx="1" fill="#374151"/>
      {/* Highlighted word (gap) */}
      <rect x="28" y="58" width="100" height="2.5" rx="1" fill="#374151"/>
      <rect x="130" y="55" width="52" height="9" rx="2" fill="#c9a84c" opacity="0.2"/>
      <rect x="132" y="58" width="48" height="2.5" rx="1" fill="#c9a84c" opacity="0.9"/>
      <rect x="186" y="58" width="80" height="2.5" rx="1" fill="#374151"/>
      <rect x="28" y="70" width="215" height="2.5" rx="1" fill="#374151"/>
      <rect x="28" y="78" width="195" height="2.5" rx="1" fill="#374151"/>
      {/* More text */}
      <rect x="28" y="92" width="225" height="2.5" rx="1" fill="#374151"/>
      <rect x="28" y="100" width="210" height="2.5" rx="1" fill="#374151"/>
      <rect x="28" y="108" width="200" height="2.5" rx="1" fill="#374151"/>

      {/* Popover card */}
      <rect x="160" y="118" width="172" height="70" rx="6" fill="#1f2937"/>
      <rect x="160" y="118" width="172" height="70" rx="6" fill="none" stroke="#c9a84c" strokeWidth="0.75" opacity="0.4"/>
      {/* Arrow up */}
      <polygon points="210,118 218,108 226,118" fill="#1f2937"/>
      <line x1="210" y1="118" x2="218" y2="108" stroke="#c9a84c" strokeWidth="0.75" opacity="0.4"/>
      <line x1="218" y1="108" x2="226" y2="118" stroke="#c9a84c" strokeWidth="0.75" opacity="0.4"/>
      {/* Popover content */}
      <rect x="172" y="128" width="70" height="2.5" rx="1" fill="#6b7280"/>
      <rect x="172" y="128" width="30" height="2.5" rx="1" fill="#c9a84c" opacity="0.8"/>
      <rect x="172" y="135" width="140" height="2" rx="1" fill="#4b5563"/>
      <rect x="172" y="141" width="120" height="2" rx="1" fill="#4b5563"/>
      {/* Add to Lore button */}
      <rect x="172" y="151" width="95" height="14" rx="3" fill="#c9a84c" opacity="0.85"/>
      <rect x="180" y="156" width="79" height="2" rx="1" fill="#0d1420"/>
      {/* Dismiss */}
      <rect x="274" y="151" width="46" height="14" rx="3" fill="#1f2937"/>
      <rect x="280" y="156" width="34" height="2" rx="1" fill="#4b5563"/>

      {/* Gaps list panel */}
      <rect x="308" y="14" width="156" height="182" rx="6" fill="#111827"/>
      <rect x="318" y="24" width="55" height="2.5" rx="1" fill="#374151"/>
      <rect x="318" y="32" width="85" height="2" rx="1" fill="#1f2937"/>
      {/* Gap items */}
      {[0,1,2,3].map(i => (
        <g key={i}>
          <rect x="318" y={48 + i * 32} width="136" height="24" rx="4" fill="#1f2937"/>
          <rect x="326" y={54 + i * 32} width={[60,50,70,45][i]} height="2.5" rx="1" fill="#e5e7eb" opacity="0.6"/>
          <rect x="326" y={61 + i * 32} width={[90,80,100,70][i]} height="2" rx="1" fill="#374151"/>
          <rect x={318 + 136 - 30} y={52 + i * 32} width="22" height="8" rx="2" fill="#c9a84c" opacity="0.12"/>
          <rect x={318 + 136 - 26} y={55 + i * 32} width="14" height="2" rx="1" fill="#c9a84c" opacity="0.7"/>
        </g>
      ))}
    </svg>
  )
}

function IllustrationThreads() {
  const threads = [
    { color: '#c9a84c', type: 'mystery',   title: 130, scenes: 8,  status: 'active'  },
    { color: '#2dd4bf', type: 'promise',   title: 110, scenes: 5,  status: 'active'  },
    { color: '#ef4444', type: 'conflict',  title: 150, scenes: 12, status: 'dormant' },
    { color: '#7c5cbf', type: 'character', title: 90,  scenes: 3,  status: 'active'  },
  ]
  return (
    <svg viewBox="0 0 478 220" className="w-full rounded-xl border border-white/5">
      <rect width="478" height="220" rx="8" fill="#0d1420"/>
      <rect x="0" y="0" width="478" height="30" rx="8" fill="#111827"/>
      <rect x="14" y="12" width="65" height="3" rx="1" fill="#374151"/>
      <rect x="370" y="8" width="90" height="15" rx="4" fill="#c9a84c" opacity="0.12"/>
      <rect x="376" y="13" width="78" height="2.5" rx="1" fill="#c9a84c"/>

      {threads.map((t, i) => (
        <g key={i}>
          <rect x="14" y={44 + i * 42} width="450" height="34" rx="5" fill="#111827"/>
          {/* Color bar */}
          <rect x="14" y={44 + i * 42} width="4" height="34" rx="2" fill={t.color} opacity="0.7"/>
          {/* Type badge */}
          <rect x="26" y={50 + i * 42} width="50" height="10" rx="3" fill={t.color} opacity="0.12"/>
          <rect x="32" y={53 + i * 42} width="38" height="2" rx="1" fill={t.color} opacity="0.7"/>
          {/* Title */}
          <rect x="84" y={50 + i * 42} width={t.title} height="3.5" rx="1" fill="#e5e7eb" opacity="0.75"/>
          {/* Scenes count */}
          <rect x="84" y={59 + i * 42} width={40} height="2" rx="1" fill="#4b5563"/>
          {/* Status badge */}
          <rect x={400} y={50 + i * 42} width={t.status === 'dormant' ? 48 : 42} height="10" rx="3"
            fill={t.status === 'dormant' ? '#ef444420' : '#1f2937'}/>
          <rect x={406} y={53 + i * 42} width={t.status === 'dormant' ? 36 : 30} height="2" rx="1"
            fill={t.status === 'dormant' ? '#ef4444' : '#374151'} opacity="0.8"/>
        </g>
      ))}

      {/* Scene dots at the bottom */}
      <rect x="14" y="214" width="450" height="1" fill="#1f2937"/>
    </svg>
  )
}

function IllustrationTimeline() {
  const chars  = ['Lyra', 'Edran', 'Mira', 'Cael']
  const colors = ['#c9a84c', '#ef4444', '#2dd4bf', '#7c5cbf']
  const scenes = 10
  const colW   = 40
  const rowH   = 30
  const offX   = 70
  const offY   = 40
  // Which char POVs which scene (null = blank)
  const grid = [
    [1,1,0,0,1,0,1,0,1,0],
    [0,0,1,0,0,1,0,0,0,1],
    [0,1,0,1,0,0,0,1,0,0],
    [0,0,0,0,0,1,0,0,1,0],
  ]
  return (
    <svg viewBox="0 0 478 200" className="w-full rounded-xl border border-white/5">
      <rect width="478" height="200" rx="8" fill="#0d1420"/>
      {/* Header */}
      <rect x="0" y="0" width="478" height="30" rx="8" fill="#111827"/>
      <rect x="14" y="13" width="55" height="3" rx="1" fill="#374151"/>
      {/* Scene column headers */}
      {Array.from({ length: scenes }, (_, j) => (
        <g key={j}>
          <rect x={offX + j * colW + 4} y={offY - 16} width={colW - 8} height="10" rx="2" fill="#1f2937"/>
          <rect x={offX + j * colW + 10} y={offY - 13} width={colW - 20} height="2" rx="1" fill="#374151"/>
        </g>
      ))}
      {/* Character rows */}
      {chars.map((char, i) => (
        <g key={i}>
          {/* Char label */}
          <rect x="8" y={offY + i * rowH + 4} width={offX - 12} height={rowH - 8} rx="3" fill="#1f2937"/>
          <rect x="12" y={offY + i * rowH + 10} width={offX - 20} height="2" rx="1" fill={colors[i]} opacity="0.7"/>
          {/* Scene cells */}
          {Array.from({ length: scenes }, (_, j) => (
            grid[i][j] ? (
              <rect key={j}
                x={offX + j * colW + 4}
                y={offY + i * rowH + 4}
                width={colW - 8}
                height={rowH - 8}
                rx="3"
                fill={colors[i]}
                opacity={0.6 + j * 0.03}
              />
            ) : (
              <rect key={j}
                x={offX + j * colW + 4}
                y={offY + i * rowH + 4}
                width={colW - 8}
                height={rowH - 8}
                rx="3"
                fill="#1f2937"
                opacity="0.3"
              />
            )
          ))}
        </g>
      ))}
      {/* Bottom label */}
      <rect x="14" y="184" width="80" height="2" rx="1" fill="#1f2937"/>
      <rect x="14" y="190" width="60" height="2" rx="1" fill="#1f2937"/>
    </svg>
  )
}

function IllustrationComposer() {
  return (
    <svg viewBox="0 0 478 220" className="w-full rounded-xl border border-white/5">
      <rect width="478" height="220" rx="8" fill="#0d1420"/>
      {/* Left: editor */}
      <rect x="0" y="0" width="220" height="220" rx="8" fill="#111827"/>
      <rect x="14" y="14" width="80" height="5" rx="1" fill="#e5e7eb" opacity="0.6"/>
      {[0,1,2,3,4,5,6,7].map(i => (
        <rect key={i} x="14" y={30 + i * 11} width={[180,160,190,140,175,155,185,130][i]} height="2.5" rx="1" fill="#1f2937"/>
      ))}
      {/* Highlight selection */}
      <rect x="14" y="124" width="192" height="22" rx="2" fill="#2dd4bf" opacity="0.08"/>
      <rect x="14" y="128" width="180" height="2.5" rx="1" fill="#2dd4bf" opacity="0.5"/>
      <rect x="14" y="135" width="160" height="2.5" rx="1" fill="#2dd4bf" opacity="0.5"/>
      {/* Composer trigger button */}
      <rect x="160" y="205" width="48" height="12" rx="3" fill="#c9a84c" opacity="0.85"/>
      <rect x="168" y="209" width="32" height="2" rx="1" fill="#0d1420"/>

      {/* Divider */}
      <rect x="220" y="0" width="1" height="220" fill="#1f2937"/>

      {/* Right: composer panel */}
      <rect x="221" y="0" width="257" height="220" rx="8" fill="#0d1420"/>
      <rect x="221" y="0" width="257" height="28" rx="8" fill="#111827"/>
      <rect x="233" y="10" width="70" height="3" rx="1" fill="#374151"/>
      <rect x="440" y="8" width="28" height="12" rx="3" fill="#1f2937"/>

      {/* Intent form */}
      <rect x="233" y="36" width="40" height="2" rx="1" fill="#4b5563"/>
      <rect x="233" y="42" width="233" height="18" rx="3" fill="#111827"/>
      <rect x="239" y="48" width="160" height="2" rx="1" fill="#1f2937"/>

      <rect x="233" y="68" width="40" height="2" rx="1" fill="#4b5563"/>
      <rect x="233" y="74" width="110" height="14" rx="3" fill="#111827"/>
      <rect x="239" y="79" width="80" height="2" rx="1" fill="#1f2937"/>

      <rect x="233" y="96" width="60" height="2" rx="1" fill="#4b5563"/>
      <rect x="233" y="102" width="233" height="28" rx="3" fill="#111827"/>
      <rect x="239" y="108" width="180" height="2" rx="1" fill="#1f2937"/>
      <rect x="239" y="114" width="140" height="2" rx="1" fill="#1f2937"/>

      {/* Generate button */}
      <rect x="233" y="138" width="233" height="18" rx="4" fill="#c9a84c" opacity="0.85"/>
      <rect x="300" y="144" width="100" height="3" rx="1" fill="#0d1420"/>

      {/* Draft A / B cards */}
      <rect x="233" y="164" width="112" height="46" rx="4" fill="#111827"/>
      <rect x="239" y="170" width="25" height="2.5" rx="1" fill="#c9a84c" opacity="0.7"/>
      <rect x="239" y="177" width="98" height="2" rx="1" fill="#374151"/>
      <rect x="239" y="183" width="88" height="2" rx="1" fill="#374151"/>
      <rect x="239" y="189" width="94" height="2" rx="1" fill="#374151"/>
      <rect x="239" y="200" width="50" height="8" rx="2" fill="#c9a84c" opacity="0.12"/>
      <rect x="245" y="203" width="38" height="2" rx="1" fill="#c9a84c"/>

      <rect x="353" y="164" width="113" height="46" rx="4" fill="#111827"/>
      <rect x="359" y="170" width="25" height="2.5" rx="1" fill="#2dd4bf" opacity="0.7"/>
      <rect x="359" y="177" width="98" height="2" rx="1" fill="#374151"/>
      <rect x="359" y="183" width="80" height="2" rx="1" fill="#374151"/>
      <rect x="359" y="189" width="92" height="2" rx="1" fill="#374151"/>
      <rect x="359" y="200" width="50" height="8" rx="2" fill="#2dd4bf" opacity="0.12"/>
      <rect x="365" y="203" width="38" height="2" rx="1" fill="#2dd4bf"/>
    </svg>
  )
}

function IllustrationLayouts() {
  const layouts = [
    { id: 'linear',    label: 'Linear',      color: '#c9a84c' },
    { id: 'grid',      label: 'Scene Grid',  color: '#2dd4bf' },
    { id: 'threads',   label: 'Threads',     color: '#7c5cbf' },
    { id: 'corkboard', label: 'Corkboard',   color: '#c9a84c' },
    { id: 'timeline',  label: 'Timeline',    color: '#ef4444' },
  ]
  return (
    <svg viewBox="0 0 478 120" className="w-full rounded-xl border border-white/5">
      <rect width="478" height="120" rx="8" fill="#0d1420"/>
      {layouts.map((l, i) => {
        const x = 14 + i * 92
        return (
          <g key={l.id}>
            <rect x={x} y="10" width="82" height="80" rx="6" fill="#111827"/>
            <rect x={x} y="10" width="82" height="80" rx="6" fill="none" stroke={l.color} strokeWidth="1" opacity={i === 0 ? 0.6 : 0.2}/>
            {/* Thumbnail graphic */}
            {l.id === 'linear' && <>
              <rect x={x+8}  y="20" width="22" height="54" rx="2" fill={l.color} opacity="0.15"/>
              <rect x={x+34} y="20" width="40" height="54" rx="2" fill="#1f2937"/>
              <rect x={x+38} y="27" width="28" height="2" rx="1" fill="#4b5563"/>
              <rect x={x+38} y="33" width="22" height="1.5" rx="1" fill="#374151"/>
              <rect x={x+38} y="38" width="26" height="1.5" rx="1" fill="#374151"/>
              <rect x={x+38} y="43" width="20" height="1.5" rx="1" fill="#374151"/>
            </>}
            {l.id === 'grid' && <>
              <rect x={x+8}  y="20" width="66" height="8" rx="2" fill={l.color} opacity="0.2"/>
              {[0,1,2].map(r => [0,1,2].map(c => (
                <rect key={`${r}${c}`} x={x+8+c*22} y={32+r*14} width="18" height="10" rx="1"
                  fill={(r+c)%3===0 ? l.color : '#1f2937'} opacity={(r+c)%3===0 ? 0.4 : 1}/>
              )))}
            </>}
            {l.id === 'threads' && <>
              <rect x={x+8}  y="20" width="14" height="54" rx="2" fill={l.color} opacity="0.15"/>
              {[0,1,2,3].map(r => <>
                <rect key={`a${r}`} x={x+26} y={22+r*14} width="16" height="10" rx="2" fill={l.color} opacity={0.4-r*0.08}/>
                <rect key={`b${r}`} x={x+46} y={22+r*14} width="16" height="10" rx="2" fill="#1f2937"/>
              </>)}
            </>}
            {l.id === 'corkboard' && <>
              {[0,1].map(r => [0,1,2].map(c => (
                <rect key={`${r}${c}`} x={x+8+c*24} y={20+r*28} width="20" height="22" rx="2"
                  fill={(r*3+c)%2===0 ? l.color : '#1f2937'} opacity={(r*3+c)%2===0 ? 0.25 : 1}/>
              )))}
            </>}
            {l.id === 'timeline' && <>
              <rect x={x+8} y="20" width="66" height="6" rx="1" fill="#1f2937"/>
              {[0,1,2].map(r => [0,1,2,3].map(c => (
                <rect key={`${r}${c}`} x={x+8+c*17} y={30+r*16} width="13" height="10" rx="1"
                  fill={(r===0&&c<2)||(r===1&&c===2)||(r===2&&c===0) ? l.color : '#1f2937'}
                  opacity={(r===0&&c<2)||(r===1&&c===2)||(r===2&&c===0) ? 0.55 : 1}/>
              )))}
            </>}
            {/* Label */}
            <rect x={x + (82 - 50) / 2} y="97" width="50" height="10" rx="3"
              fill={i===0 ? l.color : 'transparent'} opacity={i===0 ? 0.15 : 1}/>
            <rect x={x + (82 - 36) / 2} y="100" width="36" height="2" rx="1"
              fill={i===0 ? l.color : '#374151'} opacity={i===0 ? 0.9 : 1}/>
          </g>
        )
      })}
    </svg>
  )
}

function IllustrationStructure() {
  return (
    <svg viewBox="0 0 478 200" className="w-full rounded-xl border border-white/5">
      <rect width="478" height="200" rx="8" fill="#0d1420"/>
      {/* Score card */}
      <rect x="14" y="14" width="140" height="172" rx="6" fill="#111827"/>
      <rect x="26" y="24" width="60" height="2.5" rx="1" fill="#374151"/>
      {/* Score gauge */}
      <circle cx="84" cy="88" r="44" fill="none" stroke="#1f2937" strokeWidth="8"/>
      <circle cx="84" cy="88" r="44" fill="none" stroke="#2dd4bf" strokeWidth="8"
        strokeDasharray="220 277" strokeDashoffset="69" strokeLinecap="round"/>
      <rect x="68" y="82" width="32" height="9" rx="2" fill="none"/>
      <text x="84" y="93" textAnchor="middle" fill="#2dd4bf" fontSize="18" fontWeight="bold" fontFamily="monospace">87</text>
      <rect x="60" y="104" width="48" height="2" rx="1" fill="#374151"/>
      {/* Metric bars */}
      {[
        { label: 'Pacing',   w: 100, color: '#2dd4bf' },
        { label: 'POV',      w: 116, color: '#c9a84c' },
        { label: 'Balance',  w: 88,  color: '#2dd4bf' },
      ].map((m, i) => (
        <g key={i}>
          <rect x="26" y={130 + i * 16} width={50} height="2" rx="1" fill="#374151"/>
          <rect x="80" y={128 + i * 16} width={80} height="5" rx="2" fill="#1f2937"/>
          <rect x="80" y={128 + i * 16} width={m.w * 0.7} height="5" rx="2" fill={m.color} opacity="0.5"/>
        </g>
      ))}

      {/* Findings panel */}
      <rect x="166" y="14" width="298" height="172" rx="6" fill="#111827"/>
      <rect x="178" y="24" width="70" height="2.5" rx="1" fill="#374151"/>
      {[
        { color: '#c9a84c', title: 140, body: 220, severity: 'warning' },
        { color: '#ef4444', title: 120, body: 200, severity: 'error'   },
        { color: '#2dd4bf', title: 150, body: 230, severity: 'info'    },
      ].map((f, i) => (
        <g key={i}>
          <rect x="178" y={36 + i * 48} width="274" height="40" rx="4" fill="#1f2937"/>
          <rect x="178" y={36 + i * 48} width="3" height="40" rx="1.5" fill={f.color} opacity="0.7"/>
          <rect x="188" y={44 + i * 48} width={f.title} height="3" rx="1" fill="#e5e7eb" opacity="0.65"/>
          <rect x="188" y={52 + i * 48} width={f.body > 240 ? 240 : f.body} height="2" rx="1" fill="#374151"/>
          <rect x="188" y={58 + i * 48} width={f.body > 240 ? 200 : f.body - 30} height="2" rx="1" fill="#374151"/>
          <rect x={178 + 274 - 50} y={42 + i * 48} width="42" height="10" rx="3"
            fill={f.color} opacity="0.12"/>
          <rect x={178 + 274 - 44} y={45 + i * 48} width="30" height="2" rx="1"
            fill={f.color} opacity="0.7"/>
        </g>
      ))}
    </svg>
  )
}

function IllustrationPath() {
  const steps = [
    { label: 'Create your first project', done: true  },
    { label: 'Write your first scene',    done: true  },
    { label: 'Add a character',           done: true  },
    { label: 'Create a lore entry',       done: false },
    { label: 'Track a plot thread',       done: false },
    { label: 'Try Composer Mode',         done: false },
  ]
  return (
    <svg viewBox="0 0 478 190" className="w-full rounded-xl border border-white/5">
      <rect width="478" height="190" rx="8" fill="#0d1420"/>
      <rect x="0" y="0" width="478" height="28" rx="8" fill="#111827"/>
      <rect x="14" y="11" width="70" height="3" rx="1" fill="#374151"/>
      <rect x="350" y="8" width="115" height="14" rx="3" fill="#1f2937"/>
      <rect x="360" y="13" width="95" height="2" rx="1" fill="#374151"/>
      {/* Progress bar */}
      <rect x="14" y="36" width="450" height="6" rx="3" fill="#1f2937"/>
      <rect x="14" y="36" width="150" height="6" rx="3" fill="#c9a84c" opacity="0.6"/>
      <rect x="156" y="33" width="20" height="12" rx="3" fill="#0d1420"/>
      <rect x="160" y="38" width="12" height="2" rx="1" fill="#c9a84c"/>

      {/* Steps */}
      {steps.map((s, i) => (
        <g key={i}>
          {/* Connector line */}
          {i < steps.length - 1 && (
            <rect x={38} y={73 + i * 22} width="2" height="18" rx="1"
              fill={s.done ? '#c9a84c' : '#1f2937'} opacity="0.5"/>
          )}
          {/* Circle */}
          <circle cx="39" cy={66 + i * 22} r="8"
            fill={s.done ? '#c9a84c' : '#111827'}
            stroke={s.done ? '#c9a84c' : '#374151'}
            strokeWidth="1.5"
            opacity={s.done ? 0.85 : 0.6}
          />
          {s.done && <text x="39" y={70 + i * 22} textAnchor="middle" fill="#0d1420" fontSize="8" fontWeight="bold">✓</text>}
          {/* Label */}
          <rect x="58" y={63 + i * 22} width={s.done ? 140 : 130} height="3" rx="1"
            fill={s.done ? '#e5e7eb' : '#374151'} opacity={s.done ? 0.75 : 0.5}/>
          {s.done && <rect x="206" y="63" width="32" height="8" rx="2" fill="#c9a84c" opacity="0.12"/>}
        </g>
      ))}
    </svg>
  )
}

function IllustrationTroubleshooting() {
  const items = [
    { icon: '⚡', color: '#c9a84c', w: 160 },
    { icon: '🤖', color: '#2dd4bf', w: 140 },
    { icon: '👤', color: '#7c5cbf', w: 150 },
    { icon: '🕸',  color: '#ef4444', w: 130 },
  ]
  return (
    <svg viewBox="0 0 478 180" className="w-full rounded-xl border border-white/5">
      <rect width="478" height="180" rx="8" fill="#0d1420"/>
      <rect x="0" y="0" width="478" height="28" rx="8" fill="#111827"/>
      <rect x="14" y="11" width="85" height="3" rx="1" fill="#374151"/>
      {items.map((item, i) => (
        <g key={i}>
          <rect x="14" y={38 + i * 34} width="450" height="26" rx="5" fill="#111827"/>
          <rect x="22" y={44 + i * 34} width="16" height="14" rx="3" fill={item.color} opacity="0.15"/>
          <rect x="26" y={49 + i * 34} width="8" height="3" rx="1" fill={item.color} opacity="0.6"/>
          <rect x="46" y={44 + i * 34} width={item.w} height="3" rx="1" fill="#e5e7eb" opacity="0.6"/>
          <rect x="46" y={51 + i * 34} width={item.w + 60} height="2" rx="1" fill="#374151"/>
          <rect x="46" y={57 + i * 34} width={item.w + 30} height="2" rx="1" fill="#374151"/>
        </g>
      ))}
      {/* Feedback Hub callout */}
      <rect x="14" y="174" width="450" height="2" rx="1" fill="#1f2937"/>
    </svg>
  )
}

// ─── Page definitions ─────────────────────────────────────────────────────────

const PAGES = [
  {
    id: 'scenes',
    icon: Feather,
    label: 'Writing Scenes',
    illustration: IllustrationScenes,
    what: 'The scene editor is the heart of Axiom. Each scene has a title, content, status, and a full definition layer. The editor is split into three tabs: Write (your prose), Details (scene metadata), and Notes (private reminders).',
    why: 'Breaking your manuscript into scenes lets Axiom track structure, word count, draft status, and narrative threads — giving you full visibility into the shape of your story.',
    how: [
      'Select a scene from the left sidebar to open it in the editor.',
      'Write in the Write tab — Axiom auto-saves every 30 seconds and whenever you pause.',
      'Double-click any scene title in the sidebar to rename it inline.',
      'Switch to the Details tab to set Summary, Location, Characters Involved, Scene Purpose, Conflict, and Outcome.',
      'Use the Notes tab for private reminders, continuity checks, or ideas that don\'t belong in the prose.',
      'The status bar at the bottom always shows live word count, POV character, and save status.',
      'Highlight any text to get AI refinement options (tone, dialogue, pacing) without leaving the editor.',
    ],
    expect: 'Word count updates live as you type. Status (Planned → Drafted → Revised → Locked) is reflected in the sidebar dot color, timeline layout, and corkboard cards. Auto-save runs silently in the background — you\'ll only see "Saving…" briefly.',
  },
  {
    id: 'characters',
    icon: Users,
    label: 'Characters',
    illustration: IllustrationCharacters,
    what: 'The Characters section is a full cast database for each project. Every character has a role, Voice DNA profile, relationship map, physical description, and scene history. Characters feed directly into AI tools.',
    why: 'Centralizing your cast lets Axiom track who appears in which scenes, surface dormant character arcs, and use each character\'s unique voice when generating dialogue in Composer Mode.',
    how: [
      'Navigate to Characters from the project toolbar.',
      'Create characters manually, or use "Import from Manuscript" to detect names already in your writing.',
      'Set a Role (Protagonist, Antagonist, Supporting, Minor) — this controls display order in the Timeline layout.',
      'Fill in Voice DNA: speech patterns, vocabulary, verbal tics. The AI uses this for realistic dialogue generation.',
      'Use the Relationship Map to record how characters connect to each other.',
      'Assign characters to scenes using the Details tab in the scene editor.',
      'The Character Quick-Reference panel (Characters button in the toolbar) lets you check character details while writing without leaving the editor.',
    ],
    expect: 'Characters assigned as POV in scenes appear as rows in the Timeline layout. The Momentum Engine monitors character arcs and will surface alerts if a protagonist hasn\'t appeared in several scenes.',
  },
  {
    id: 'lore',
    icon: BookOpen,
    label: 'Lore Bible',
    illustration: IllustrationLore,
    what: 'The Lore Bible is your world-building database. Each entry has a title, category (Location, Faction, Magic, History, Rule, Other), a flexibility setting, and rich content. Entries are injected into AI prompts as living context.',
    why: 'Without a Lore Bible, AI tools generate generic or inconsistent content. With it, Composer Mode, scene generation, and refinement tools all "know" your world — your magic system, geography, politics, and history become hard constraints.',
    how: [
      'Navigate to Lore Bible from the project toolbar.',
      'Create entries for anything that defines your world: places, magic systems, factions, historical events, rules of nature.',
      'Set Flexibility to Locked if the AI must never contradict this entry (e.g. "Magic requires blood sacrifice").',
      'Set Flexibility to Flexible if the AI can expand on or interpret it (e.g. general setting descriptions).',
      'Use the Gaps tab to see world-building questions raised by your writing that don\'t yet have answers.',
      'Click any highlighted term in the editor to jump directly to its lore entry or create a new one.',
    ],
    expect: 'Locked lore acts as a hard constraint — if you write something that contradicts it, the lore gap system will flag it. The more complete your Lore Bible, the more consistent your AI-assisted writing will be.',
  },
  {
    id: 'lore-gaps',
    icon: AlertCircle,
    label: 'Lore Gaps',
    illustration: IllustrationLoreGaps,
    what: 'Lore Gaps are world-building questions your writing raises that don\'t yet have answers in the Lore Bible. When you write a proper noun, place name, or concept with no lore entry, it appears highlighted in the editor and queued in the Gaps list.',
    why: 'Gaps surface implicit world-building before it hardens into inconsistency. They\'re a signal that something in your story needs a canonical answer — catching it early prevents plot holes.',
    how: [
      'Write naturally — Axiom scans your prose and highlights unresolved terms in gold.',
      'Click a highlighted term to see the gap popover, which shows the term and lets you act immediately.',
      'Click "Add to Lore Bible" to create an entry for that term without leaving the editor.',
      'Click Dismiss if the term is intentionally undefined or unimportant.',
      'Open Lore Bible → Gaps tab to see all unresolved gaps across the project.',
      'Resolve a gap by creating a lore entry with the same title — the highlight disappears automatically.',
    ],
    expect: 'Gaps are non-blocking — they\'re suggestions, not errors. You can write freely and resolve gaps in batches during revision. The system re-scans after every save.',
  },
  {
    id: 'threads',
    icon: GitBranch,
    label: 'Plot Threads',
    illustration: IllustrationThreads,
    what: 'Plot Threads are named narrative forces — mysteries, promises, conflicts, or character arcs — that run through your story across multiple scenes. Each thread has a type, status, linked scenes, linked characters, and linked lore.',
    why: 'Most fiction problems come from threads that are started and forgotten. Axiom tracks which threads have appeared recently and which are going dormant, so you can weave them intentionally rather than accidentally dropping them.',
    how: [
      'Go to Plot Threads from the project toolbar.',
      'Create threads for any ongoing story force: "Who killed the merchant?", "Lyra\'s trust in Edran", "The war in the north".',
      'Set a type: Mystery (unanswered question), Promise (setup awaiting payoff), Conflict (active opposition), Character (personal arc).',
      'Link threads to scenes via the Details tab in the scene editor.',
      'Link threads to characters and lore entries from the thread detail panel.',
      'Axiom auto-detects new threads from scene content after each save — you\'ll be prompted to track them.',
    ],
    expect: 'A thread turns red and triggers an alert in the Pause Detection Bar if it hasn\'t appeared in 7+ scenes. The Thread Dashboard shows all threads with their scene history as a visual timeline. Resolve threads by marking them Complete or Dropped.',
  },
  {
    id: 'timeline',
    icon: Clock,
    label: 'Timeline',
    illustration: IllustrationTimeline,
    what: 'The Timeline layout maps your characters (rows) against your scenes (columns). Each colored block means that character is the POV for that scene. Block opacity reflects draft status — planned scenes are faint, locked scenes are solid.',
    why: 'It makes character distribution instantly visible. You can see at a glance who dominates the story, who disappears for long stretches, and whether your POV rotation feels balanced.',
    how: [
      'Switch to Timeline using the layout selector in the top toolbar.',
      'Set POV characters for scenes using the Details tab in the scene editor.',
      'Characters are sorted by role: Protagonist → Antagonist → Supporting → Minor.',
      'Block color matches the character\'s role color (gold = protagonist, red = antagonist, etc.).',
      'Click any block to open that scene in the editor.',
      'Scenes with no POV assigned appear in a "No POV" row at the bottom.',
    ],
    expect: 'Up to 12 characters are shown. Characters without any POV scenes are hidden to keep the view clean. The timeline updates automatically whenever you save a scene with a changed POV.',
  },
  {
    id: 'composer',
    icon: Zap,
    label: 'Composer Mode',
    illustration: IllustrationComposer,
    what: 'Composer Mode is an AI co-writing panel that generates two alternative scene drafts based on your intent. It\'s designed to break writer\'s block and explore directions — not to replace your voice. It uses your Voice DNA, locked lore, and scene context.',
    why: 'The blank page problem is real. Composer gives you two concrete starting points that you can accept, edit, or use as inspiration. Having two drafts side-by-side forces a creative decision rather than passive acceptance.',
    how: [
      'Open a scene and click the Composer button (lightning bolt) in the editor toolbar.',
      'Fill in the Scene Intent: what must happen, who is the POV character, what\'s the emotional tone, what is the goal and obstacle.',
      'Optionally select characters to include — their Voice DNA profiles are injected into the prompt.',
      'Click Generate — Axiom produces Draft A and Draft B simultaneously.',
      'Read both drafts. Click Accept on whichever feels right, or use them purely as inspiration.',
      'Accepted text is inserted at your cursor position in the editor.',
      'The Composer also has a Chat mode for brainstorming without generating a full draft.',
    ],
    expect: 'Drafts respect your locked lore as hard constraints. Voice DNA makes character dialogue feel distinct. Generation takes 10–30 seconds depending on scene length. Nothing is inserted automatically — you always choose.',
  },
  {
    id: 'layouts',
    icon: LayoutGrid,
    label: 'Layouts',
    illustration: IllustrationLayouts,
    what: 'Axiom has five layout views for your project. Each gives you a different lens on the same underlying data — your scenes, characters, and threads. You can switch freely at any time without losing anything.',
    why: 'Different phases of writing need different views. Drafting needs the linear editor. Revision needs the corkboard. Structural review needs the scene grid. Planning needs the timeline. Having all five means you\'re never forced into the wrong perspective.',
    how: [
      'Click the layout selector (top-left of the project toolbar, shows the current layout name) to see all five options.',
      'Linear — the main writing editor with sidebar, scene editor, and composer.',
      'Scene Grid — a spreadsheet view of all scenes with status, word count, POV, and summary.',
      'Threads — shows which scenes belong to each plot thread, grouped by thread type.',
      'Corkboard — scene cards arranged by chapter, each showing title, status, and summary.',
      'Timeline — character × scene matrix (see the Timeline section for details).',
      'Clicking any scene in a non-linear layout opens it in the Linear editor.',
    ],
    expect: 'Your layout preference is saved per project. All layout views are read from the same Firestore data — changing scene status in the corkboard is immediately reflected in the linear sidebar.',
  },
  {
    id: 'structure',
    icon: ClipboardCheck,
    label: 'Structure Check',
    illustration: IllustrationStructure,
    what: 'The Structure button runs a developmental edit scan — an AI-powered analysis that evaluates your manuscript\'s structural health. It produces a health score (0–100) and a list of findings with specific suggestions.',
    why: 'Structural problems (uneven pacing, POV drift, chapter length imbalances, dropped arcs) are hard to spot when you\'re inside the writing. The structure check gives you an outside view before you reach a human editor.',
    how: [
      'Click Structure in the project toolbar to run a manual scan.',
      'The scan also runs automatically after each scene save in the background.',
      'A health score appears next to the Structure button — green (85+), gold (60–84), red (below 60).',
      'Structural findings appear in the Pause Detection Bar when you stop typing.',
      'Click "View Details" on any finding to see the full diagnosis and suggested fix.',
      'Click Dismiss to clear a finding, or "Never check this" to permanently suppress that check type.',
    ],
    expect: 'The scanner checks: scene pacing, POV consistency, chapter length balance, unresolved thread dormancy, structural arc shape, and dialogue density. Findings are suggestions — they don\'t block saving or publishing.',
  },
  {
    id: 'axiom-path',
    icon: Layers,
    label: 'Axiom Path',
    illustration: IllustrationPath,
    what: 'The Axiom Path is an optional guided onboarding that introduces Axiom\'s features progressively as you hit milestones in your writing — not all at once.',
    why: 'Axiom has a lot of features. Showing them all on day one causes overwhelm. The Path surfaces each feature at the moment it becomes relevant, so the learning curve feels natural.',
    how: [
      'The Path activates automatically when you create your first project.',
      'Milestones: first project → first scene → first character → first lore entry → first thread → first AI use.',
      'Each milestone triggers a short in-context tip or prompt.',
      'You can skip or dismiss any tip at any time — the feature is available regardless.',
      'Re-enter or reset the Path from Settings → Guidance.',
      'Completing all milestones earns an "Axiom Initiate" badge on your profile.',
    ],
    expect: 'The Path is non-blocking. Every feature in Axiom is fully accessible from day one, whether or not you\'re following the Path. It\'s a guide, not a gate.',
  },
  {
    id: 'troubleshooting',
    icon: HelpCircle,
    label: 'Troubleshooting',
    illustration: IllustrationTroubleshooting,
    what: 'Common issues and how to resolve them. If your issue isn\'t listed here, use the Feedback Hub (the chat bubble button, bottom-right of the screen) to report it directly.',
    why: '',
    how: [
      'Content not saving? Check your internet connection. Axiom requires an active connection to sync to Firestore. A "Save failed" indicator appears in the editor status bar if a save attempt fails.',
      'AI features not responding? Verify your Anthropic API key is set in Settings → API Keys. The key must start with "sk-ant-".',
      'Characters not appearing in Timeline? Characters must be assigned as POV in at least one scene. Set POV in the scene\'s Details tab.',
      'Threads not updating automatically? Thread detection runs after each scene save. Wait a moment, then check the Plot Threads page.',
      'App shows outdated content after an update? Hard-refresh the page (Ctrl+Shift+R or Cmd+Shift+R). Axiom detects stale cached bundles and prompts you to reload.',
      'Layout dropdown not visible? It may be off-screen on very small viewports. Try scrolling the top toolbar.',
      'Still stuck? Open the Feedback Hub (bottom-right button) and file a bug report. Include what you were doing and what happened.',
    ],
    expect: '',
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function Codex({ onClose }) {
  const [activeId, setActiveId] = useState('scenes')
  const active = PAGES.find(p => p.id === activeId) || PAGES[0]
  const Icon = active.icon
  const Illustration = active.illustration

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-axiom-surface border border-axiom-border rounded-2xl shadow-2xl w-full max-w-4xl"
        style={{ height: '85vh', display: 'grid', gridTemplateColumns: '200px 1fr', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >

        {/* Sidebar nav */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: '1px solid var(--axiom-border)', background: 'var(--axiom-bg)' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--axiom-border)', flexShrink: 0 }}>
            <p className="font-serif text-base font-semibold" style={{ color: 'var(--axiom-text)' }}>Codex</p>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--axiom-muted)' }}>Axiom Knowledge Base</p>
          </div>
          <nav style={{ flex: 1, overflowY: 'auto' }}>
            {PAGES.map(page => {
              const PageIcon = page.icon
              const isActive = activeId === page.id
              return (
                <button
                  key={page.id}
                  onClick={() => setActiveId(page.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 16px', textAlign: 'left', cursor: 'pointer',
                    borderRight: isActive ? '2px solid #c9a84c' : '2px solid transparent',
                    background: isActive ? 'rgba(201,168,76,0.08)' : 'transparent',
                    color: isActive ? '#c9a84c' : 'var(--axiom-muted)',
                    transition: 'background 0.15s, color 0.15s',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--axiom-surface2)' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                >
                  <PageIcon style={{ width: 14, height: 14, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{page.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content area */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--axiom-surface)' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--axiom-border)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon style={{ width: 16, height: 16, color: '#c9a84c' }} />
              </div>
              <h2 className="font-serif text-lg font-semibold" style={{ color: 'var(--axiom-text)' }}>{active.label}</h2>
            </div>
            <button
              onClick={onClose}
              style={{ padding: 6, borderRadius: 8, color: 'var(--axiom-muted)', cursor: 'pointer', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center' }}
              title="Close"
            >
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>

          {/* Scrollable body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

            {Illustration && <Illustration />}

            {active.what && (
              <Section title="What is this?">
                <p className="text-sm leading-relaxed" style={{ color: 'var(--axiom-muted)' }}>{active.what}</p>
              </Section>
            )}

            {active.why && (
              <Section title="Why use it?">
                <p className="text-sm leading-relaxed" style={{ color: 'var(--axiom-muted)' }}>{active.why}</p>
              </Section>
            )}

            {active.how?.length > 0 && (
              <Section title="How to use it">
                <ol style={{ display: 'flex', flexDirection: 'column', gap: 12, listStyle: 'none', padding: 0, margin: 0 }}>
                  {active.how.map((step, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <span style={{
                        width: 20, height: 20, borderRadius: '50%',
                        background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)',
                        color: '#c9a84c', fontSize: 10, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, marginTop: 2,
                      }}>
                        {i + 1}
                      </span>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--axiom-muted)' }}>{step}</p>
                    </li>
                  ))}
                </ol>
              </Section>
            )}

            {active.expect && (
              <Section title="What to expect">
                <p className="text-sm leading-relaxed" style={{ color: 'var(--axiom-muted)' }}>{active.expect}</p>
              </Section>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider mb-2.5" style={{ color: 'var(--axiom-muted)' }}>{title}</p>
      {children}
    </div>
  )
}
