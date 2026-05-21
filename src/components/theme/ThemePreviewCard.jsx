/**
 * ThemePreviewCard
 *
 * A single selectable theme card inside ThemeSelector.
 * Shows: thumbnail image, name, description, accent dot, active state ring.
 */

import React from 'react'
import { Check } from 'lucide-react'

export default function ThemePreviewCard({ theme, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left group transition-all duration-200 focus:outline-none"
      title={theme.name}
    >
      <div
        className="relative rounded-xl overflow-hidden transition-all duration-200"
        style={{
          // Active state: accent-colored ring
          boxShadow: isActive
            ? `0 0 0 2px rgba(${theme.accentRgb},1), 0 0 12px rgba(${theme.accentRgb},0.3)`
            : '0 0 0 1px rgba(255,255,255,0.07)',
        }}
      >
        {/* Thumbnail */}
        <div
          className="h-20 w-full relative overflow-hidden"
          style={{
            background: theme.image
              ? `url(${theme.image}) center/cover no-repeat`
              : theme.cssBackground || 'linear-gradient(135deg, #0d0d2b 0%, #141430 100%)',
          }}
        >
          {/* Darkening overlay */}
          <div
            className="absolute inset-0 transition-opacity duration-200"
            style={{
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.5))',
              opacity: isActive ? 0.4 : 0.6,
            }}
          />

          {/* Active checkmark badge */}
          {isActive && (
            <div
              className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
              style={{
                background: `rgba(${theme.accentRgb},1)`,
                boxShadow: `0 0 8px rgba(${theme.accentRgb},0.6)`,
              }}
            >
              <Check className="w-3 h-3 text-white" strokeWidth={3} />
            </div>
          )}

          {/* Accent dot + name overlay on image */}
          <div className="absolute bottom-2 left-2.5 flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{
                background: `rgba(${theme.accentRgb},1)`,
                boxShadow: `0 0 6px rgba(${theme.accentRgb},0.8)`,
              }}
            />
            <span className="text-[11px] font-semibold text-white/90 tracking-wide drop-shadow-md">
              {theme.name}
            </span>
          </div>
        </div>

        {/* Description */}
        <div
          className="px-2.5 py-2"
          style={{ background: 'rgba(10,12,20,0.92)' }}
        >
          <p className="text-[10px] leading-relaxed"
            style={{ color: isActive ? `rgba(${theme.accentRgb},0.9)` : 'rgba(180,180,200,0.65)' }}
          >
            {theme.description}
          </p>
        </div>
      </div>
    </button>
  )
}
