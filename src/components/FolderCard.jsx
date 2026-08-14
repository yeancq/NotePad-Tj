import { useRef, useState } from 'react'

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
                   bg-white/70 dark:bg-night-surface border border-ink/10 dark:border-night-text/10
                   hover:-translate-y-0.5 hover:shadow-md active:scale-[0.97] transition-all duration-150"
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
                       text-ink-soft/40 dark:text-night-text/30 hover:text-ink dark:hover:text-night-text
                       p-1 rounded-md hover:bg-ink/5 dark:hover:bg-night-text/10"
            title="Opciones"
          >
            ⋮
          </button>
        </div>
        <span className="w-full">
          <span className="block font-display text-[15px] text-ink dark:text-night-text truncate">
            {folder.name}
          </span>
          <span className="block text-xs text-ink-soft/60 dark:text-night-text/40 mt-0.5">
            {noteCount} {noteCount === 1 ? 'nota' : 'notas'}
          </span>
        </span>
      </button>

      {/* Menú contextual */}
      {showMenu && (
        <>
          {/* Fondo para cerrar al hacer clic fuera */}
          <div
            className="fixed inset-0 z-10"
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(false)
            }}
          />
          <div
            className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-night-surface-2 
                       rounded-lg shadow-xl border border-ink/10 dark:border-night-text/10 p-1.5 z-20"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleEdit}
              className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-ink/5 dark:hover:bg-night-text/10 
                         text-ink dark:text-night-text flex items-center gap-2 transition-colors"
            >
              <span>✏️</span> Editar carpeta
            </button>
            <button
              onClick={handleDelete}
              className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 
                         text-red-600 dark:text-red-400 flex items-center gap-2 transition-colors"
            >
              <span>🗑️</span> Eliminar carpeta
            </button>
          </div>
        </>
      )}
    </div>
  )
}
