import { useRef } from 'react'

const LONG_PRESS_MS = 480

export default function FolderGrid({ folders, counts, onSelect, onEditFolder }) {
  const topLevel = folders.filter((f) => !f.parentId)

  const folderCards = topLevel.map((f) => {
    const children = folders.filter((c) => c.parentId === f.id)
    const childCount = children.reduce((sum, c) => sum + (counts[c.id] ?? 0), 0)
    return {
      id: f.id,
      name: f.name,
      icon: f.icon,
      count: (counts[f.id] ?? 0) + childCount,
    }
  })

  return (
    <div className="max-w-4xl">
      <div className="grid grid-cols-2 gap-3.5 mb-7">
        <button
          onClick={() => onSelect(null)}
          className="flex flex-col items-start gap-3 p-5 rounded-2xl text-left bg-leather text-parchment
                     hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200"
        >
          <span className="text-2xl">📚</span>
          <span>
            <span className="block font-display text-base">Todas las notas</span>
            <span className="block text-xs text-parchment/70 mt-0.5">
              {counts.all} {counts.all === 1 ? 'nota' : 'notas'}
            </span>
          </span>
        </button>

        <button
          onClick={() => onSelect('pinned')}
          className="flex flex-col items-start gap-3 p-5 rounded-2xl text-left
                     bg-white/70 dark:bg-night-surface border border-ink/10 dark:border-night-text/10
                     hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
        >
          <span className="text-2xl">📌</span>
          <span>
            <span className="block font-display text-base text-ink dark:text-night-text">Fijadas</span>
            <span className="block text-xs text-ink-soft/60 dark:text-night-text/40 mt-0.5">
              {counts.pinned} {counts.pinned === 1 ? 'nota' : 'notas'}
            </span>
          </span>
        </button>
      </div>

      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft/60 dark:text-night-text/40">
          Carpetas
        </p>
        <p className="text-[11px] text-ink-soft/40 dark:text-night-text/30">
          Mantén presionada una carpeta para editarla
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 mb-6">
        {folderCards.map((c) => (
          <FolderCard
            key={c.id}
            card={c}
            onOpen={() => onSelect(c.id)}
            onEdit={() => onEditFolder(c.id)}
          />
        ))}
      </div>

      <button
        onClick={() => onSelect('trash')}
        className="text-xs text-ink-soft/60 dark:text-night-text/40 hover:text-leather dark:hover:text-gilt-soft transition-colors"
      >
        🗑️ Papelera {counts.trash > 0 ? `(${counts.trash})` : ''}
      </button>
    </div>
  )
}

function FolderCard({ card, onOpen, onEdit }) {
  const timerRef = useRef(null)
  const longPressedRef = useRef(false)

  const startPress = () => {
    longPressedRef.current = false
    timerRef.current = setTimeout(() => {
      longPressedRef.current = true
      if (navigator.vibrate) navigator.vibrate(12)
      onEdit()
    }, LONG_PRESS_MS)
  }

  const cancelPress = () => {
    clearTimeout(timerRef.current)
  }

  const handleClick = () => {
    // Si el press largo ya disparó la edición, no abrimos la carpeta también.
    if (longPressedRef.current) {
      longPressedRef.current = false
      return
    }
    onOpen()
  }

  return (
    <button
      onClick={handleClick}
      onPointerDown={startPress}
      onPointerUp={cancelPress}
      onPointerLeave={cancelPress}
      onPointerCancel={cancelPress}
      onContextMenu={(e) => e.preventDefault()}
      className="group relative flex flex-col items-start gap-3 p-4 rounded-xl text-left select-none
                 bg-white/70 dark:bg-night-surface border border-ink/10 dark:border-night-text/10
                 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.97] transition-all duration-150"
      style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
    >
      <span className="text-2xl">{card.icon}</span>
      <span className="w-full">
        <span className="block font-display text-[15px] text-ink dark:text-night-text truncate">
          {card.name}
        </span>
        <span className="block text-xs text-ink-soft/60 dark:text-night-text/40 mt-0.5">
          {card.count} {card.count === 1 ? 'nota' : 'notas'}
        </span>
      </span>
      <span className="hidden md:flex absolute top-3 right-3 w-6 h-6 items-center justify-center rounded-full
                        text-ink-soft/40 dark:text-night-text/30 opacity-0 group-hover:opacity-100
                        transition-opacity text-xs pointer-events-none">
        ✏️
      </span>
    </button>
  )
}
