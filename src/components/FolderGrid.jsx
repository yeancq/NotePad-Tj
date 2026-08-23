import { Library, Pin, Trash2 } from 'lucide-react'
import FolderCard from './FolderCard'

export default function FolderGrid({ folders, counts, onSelect, onEditFolder, onDeleteFolder }) {
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
          <Library className="w-6 h-6" strokeWidth={1.75} />
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
          <Pin className="w-6 h-6 text-leather dark:text-gilt-soft" strokeWidth={1.75} />
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
          ⋮ para opciones
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 mb-6">
        {folderCards.map((c) => (
          <FolderCard
            key={c.id}
            folder={{ id: c.id, name: c.name, icon: c.icon }}
            noteCount={c.count}
            onOpen={() => onSelect(c.id)}
            onEdit={() => onEditFolder(c.id)}
            onDelete={() => onDeleteFolder?.(c.id)}
          />
        ))}
      </div>

      <button
        onClick={() => onSelect('trash')}
        className="text-xs text-ink-soft/60 dark:text-night-text/40 hover:text-leather dark:hover:text-gilt-soft transition-colors flex items-center gap-1.5"
      >
        <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
        Papelera {counts.trash > 0 ? `(${counts.trash})` : ''}
      </button>
    </div>
  )
}
