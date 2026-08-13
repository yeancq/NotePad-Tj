import { useRef, useState } from 'react'
import { MoreHorizontal, Edit2, Trash2 } from 'lucide-react'

const LONG_PRESS_MS = 480

export default function FolderCard({ folder, noteCount, onOpen, onEdit, onDelete }) {
  const timerRef = useRef(null)
  const longPressedRef = useRef(false)
  const [showMenu, setShowMenu] = useState(false)

  const startPress = () => {
    longPressedRef.current = false
    timerRef.current = setTimeout(() => {
      longPressedRef.current = true
      if (navigator.vibrate) navigator.vibrate(12)
      onEdit?.()
    }, LONG_PRESS_MS)
  }

  const cancelPress = () => {
    clearTimeout(timerRef.current)
  }

  const handleClick = () => {
    if (longPressedRef.current) {
      longPressedRef.current = false
      return
    }
    onOpen?.()
  }

  const handleEdit = (e) => {
    e.stopPropagation()
    setShowMenu(false)
    onEdit?.()
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    setShowMenu(false)
    if (window.confirm(`¿Eliminar la carpeta "${folder.name}" y todo su contenido?`)) {
      onDelete?.()
    }
  }

  return (
    <div className="relative group">
      <button
        onClick={handleClick}
        onPointerDown={startPress}
        onPointerUp={cancelPress}
        onPointerLeave={cancelPress}
        onPointerCancel={cancelPress}
        onContextMenu={(e) => e.preventDefault()}
        className="w-full flex flex-col items-start gap-3 p-4 rounded-xl text-left select-none
                   bg-surface border border-theme shadow-card
                   hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.97] transition-all duration-150"
        style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
      >
        <div className="w-full flex items-start justify-between">
          <span className="text-2xl">{folder.icon || '📁'}</span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(!showMenu)
            }}
            className="text-sm opacity-0 group-hover:opacity-100 transition-opacity
                       text-muted hover:text-theme p-1 rounded-md hover:bg-ink/5 dark:hover:bg-night-text/10"
            title="Opciones"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
        <span className="w-full">
          <span className="block font-display text-[15px] text-theme truncate">{folder.name}</span>
          <span className="block text-xs text-muted mt-0.5">
            {noteCount} {noteCount === 1 ? 'nota' : 'notas'}
          </span>
        </span>
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(false)
            }}
          />
          <div
            className="absolute right-0 top-full mt-1 w-48 bg-surface
                       rounded-lg shadow-lg border border-theme p-1.5 z-20"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleEdit}
              className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-ink/5 dark:hover:bg-night-text/10 
                         text-theme flex items-center gap-2 transition-colors"
            >
              <Edit2 className="w-4 h-4" /> Editar carpeta
            </button>
            <button
              onClick={handleDelete}
              className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 
                         text-red-600 dark:text-red-400 flex items-center gap-2 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Eliminar carpeta
            </button>
          </div>
        </>
      )}
    </div>
  )
}
