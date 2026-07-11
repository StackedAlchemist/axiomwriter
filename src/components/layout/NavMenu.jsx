import React, { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Lock } from 'lucide-react'

/**
 * Luxury dropdown for the project command bar.
 * Portals to body so it never clips under overflow containers.
 */
export default function NavMenu({
  label,
  icon: Icon,
  items = [],
  active = false,
  badge = null,
  align = 'left',
  className = '',
  title,
}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos]   = useState({ top: 0, left: 0 })
  const btnRef = useRef(null)
  const menuId = useRef(`navmenu-${Math.random().toString(36).slice(2, 9)}`).current

  const place = useCallback(() => {
    if (!btnRef.current) return
    const r = btnRef.current.getBoundingClientRect()
    const menuWidth = 260
    let left = align === 'right' ? r.right - menuWidth : r.left
    left = Math.max(8, Math.min(left, window.innerWidth - menuWidth - 8))
    setPos({ top: r.bottom + 6, left })
  }, [align])

  const toggle = () => {
    if (open) { setOpen(false); return }
    place()
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    function onOut(e) {
      if (btnRef.current?.contains(e.target)) return
      if (e.target.closest?.(`[data-nav-menu="${menuId}"]`)) return
      setOpen(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    function onScroll() { setOpen(false) }
    document.addEventListener('mousedown', onOut)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    return () => {
      document.removeEventListener('mousedown', onOut)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
  }, [open, menuId])

  const hasActiveChild = items.some(i => i.active)

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        title={title || label}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`
          nav-menu-trigger group
          ${open || active || hasActiveChild ? 'is-active' : ''}
          ${className}
        `}
      >
        {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0 opacity-80" />}
        <span className="truncate">{label}</span>
        {badge != null && (
          <span className="nav-menu-badge">{badge}</span>
        )}
        <ChevronDown
          className={`w-3 h-3 flex-shrink-0 opacity-50 transition-transform duration-200 ${open ? 'rotate-180 opacity-90' : ''}`}
        />
      </button>

      {open && createPortal(
        <div
          data-nav-menu={menuId}
          role="menu"
          className="nav-menu-panel animate-fade-in"
          style={{ top: pos.top, left: pos.left }}
        >
          <div className="nav-menu-panel-inner">
            {items.map((item, idx) => {
              if (item.divider) {
                return <div key={`d-${idx}`} className="nav-menu-divider" role="separator" />
              }
              if (item.section) {
                return (
                  <p key={`s-${idx}`} className="nav-menu-section">
                    {item.section}
                  </p>
                )
              }
              const ItemIcon = item.icon
              return (
                <button
                  key={item.id || item.label}
                  type="button"
                  role="menuitem"
                  disabled={item.disabled}
                  onClick={() => {
                    if (item.disabled) return
                    item.onClick?.()
                    setOpen(false)
                  }}
                  className={`nav-menu-item ${item.active ? 'is-active' : ''} ${item.disabled ? 'is-disabled' : ''}`}
                >
                  {ItemIcon && (
                    <span
                      className="nav-menu-item-icon"
                      style={item.accentRgb ? {
                        background: `rgba(${item.accentRgb},0.12)`,
                        color: `rgba(${item.accentRgb},0.95)`,
                      } : undefined}
                    >
                      <ItemIcon className="w-3.5 h-3.5" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1 text-left">
                    <span className="nav-menu-item-label">
                      {item.label}
                      {item.locked && (
                        <Lock className="w-2.5 h-2.5 text-gold-500/70 ml-1 inline-block align-middle" />
                      )}
                    </span>
                    {item.description && (
                      <span className="nav-menu-item-desc">{item.description}</span>
                    )}
                  </span>
                  {item.meta != null && (
                    <span className="nav-menu-item-meta">{item.meta}</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
