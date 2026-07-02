import React from 'react'
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Highlighter, Quote, AlignLeft, AlignCenter, AlignRight,
  Heading1, Heading2, Heading3, List, ListOrdered, Minus,
  Undo2, Redo2, Wand2,
} from 'lucide-react'

function ToolbarBtn({ onClick, active, disabled, title, children }) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick() }}
      disabled={disabled}
      title={title}
      className={`
        p-1.5 rounded text-sm transition-all duration-100 flex-shrink-0
        ${active
          ? 'bg-gold-500/20 text-gold-400'
          : 'text-slate-500 hover:text-slate-200 hover:bg-axiom-surface2'
        }
        disabled:opacity-30 disabled:cursor-not-allowed
      `}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="w-px h-4 bg-axiom-border mx-0.5 self-center flex-shrink-0" />
}

export default function EditorToolbar({ editor, onToggleComposer, composerActive }) {
  if (!editor) return null

  const groups = [
    // History
    [
      { icon: <Undo2 className="w-3.5 h-3.5" />, title: 'Undo', action: () => editor.chain().focus().undo().run(), active: false, disabled: !editor.can().undo() },
      { icon: <Redo2 className="w-3.5 h-3.5" />, title: 'Redo', action: () => editor.chain().focus().redo().run(), active: false, disabled: !editor.can().redo() },
    ],
    // Marks
    [
      { icon: <Bold          className="w-3.5 h-3.5" />, title: 'Bold (Ctrl+B)',      action: () => editor.chain().focus().toggleBold().run(),          active: editor.isActive('bold')          },
      { icon: <Italic        className="w-3.5 h-3.5" />, title: 'Italic (Ctrl+I)',    action: () => editor.chain().focus().toggleItalic().run(),        active: editor.isActive('italic')        },
      { icon: <UnderlineIcon className="w-3.5 h-3.5" />, title: 'Underline (Ctrl+U)', action: () => editor.chain().focus().toggleUnderline().run(),     active: editor.isActive('underline')     },
      { icon: <Strikethrough className="w-3.5 h-3.5" />, title: 'Strikethrough',      action: () => editor.chain().focus().toggleStrike().run(),        active: editor.isActive('strike')        },
      { icon: <Highlighter   className="w-3.5 h-3.5" />, title: 'Highlight',          action: () => editor.chain().focus().toggleHighlight().run(),     active: editor.isActive('highlight')     },
    ],
    // Headings
    [
      { icon: <Heading1 className="w-3.5 h-3.5" />, title: 'Heading 1', action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), active: editor.isActive('heading', { level: 1 }) },
      { icon: <Heading2 className="w-3.5 h-3.5" />, title: 'Heading 2', action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive('heading', { level: 2 }) },
      { icon: <Heading3 className="w-3.5 h-3.5" />, title: 'Heading 3', action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive('heading', { level: 3 }) },
    ],
    // Lists + quote + rule
    [
      { icon: <List         className="w-3.5 h-3.5" />, title: 'Bullet list',    action: () => editor.chain().focus().toggleBulletList().run(),    active: editor.isActive('bulletList')  },
      { icon: <ListOrdered  className="w-3.5 h-3.5" />, title: 'Numbered list',  action: () => editor.chain().focus().toggleOrderedList().run(),   active: editor.isActive('orderedList') },
      { icon: <Quote        className="w-3.5 h-3.5" />, title: 'Blockquote',     action: () => editor.chain().focus().toggleBlockquote().run(),    active: editor.isActive('blockquote')  },
      { icon: <Minus        className="w-3.5 h-3.5" />, title: 'Divider line',   action: () => editor.chain().focus().setHorizontalRule().run(),   active: false                          },
    ],
    // Alignment
    [
      { icon: <AlignLeft   className="w-3.5 h-3.5" />, title: 'Align left',   action: () => editor.chain().focus().setTextAlign('left').run(),   active: editor.isActive({ textAlign: 'left' })   },
      { icon: <AlignCenter className="w-3.5 h-3.5" />, title: 'Align center', action: () => editor.chain().focus().setTextAlign('center').run(), active: editor.isActive({ textAlign: 'center' }) },
      { icon: <AlignRight  className="w-3.5 h-3.5" />, title: 'Align right',  action: () => editor.chain().focus().setTextAlign('right').run(),  active: editor.isActive({ textAlign: 'right' })  },
    ],
  ]

  return (
    // Mobile: one horizontally-scrollable row (never wraps or clips), Compose
    // pinned at the right edge. Desktop (sm+): wraps as before.
    <div className="flex items-center gap-0.5 flex-nowrap sm:flex-wrap overflow-x-auto sm:overflow-x-visible px-2 sm:px-4 py-2 border-b border-axiom-border bg-axiom-surface/80 backdrop-blur-sm flex-shrink-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {groups.map((group, gi) => (
        <React.Fragment key={gi}>
          {gi > 0 && <Divider />}
          {group.map((btn, bi) => (
            <ToolbarBtn
              key={bi}
              onClick={btn.action}
              active={btn.active}
              disabled={btn.disabled}
              title={btn.title}
            >
              {btn.icon}
            </ToolbarBtn>
          ))}
        </React.Fragment>
      ))}
      {/* Spacer + Compose button */}
      {onToggleComposer && (
        <>
          <div className="flex-1 min-w-[8px]" />
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); onToggleComposer() }}
            title="Composer Mode"
            className={`
              sticky right-0 flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-all duration-100
              bg-axiom-surface shadow-[-8px_0_8px_-4px_rgba(0,0,0,0.4)] sm:shadow-none
              ${composerActive
                ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-axiom-surface2 border border-axiom-border sm:border-transparent'
              }
            `}
          >
            <Wand2 className="w-3.5 h-3.5" />
            Compose
          </button>
        </>
      )}
    </div>
  )
}
