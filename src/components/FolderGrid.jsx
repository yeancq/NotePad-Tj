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
          className="flex flex-col items-start gap-3 p-5 rounded-2xl text-left bg-primary text-surface
                     hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200"
        >
          <span className="text-2xl">📚</span>
          <span>
            <span className="block font-display text-base">Todas las notas</span>
            <span className="block text-xs text-surface/70 mt-0.5">
              {counts.all} {counts.all === 1 ? 'nota' : 'notas'}
            </span>
          </span>
        </button>

        <button
          onClick={() => onSelect('pinned')}
          className="flex flex-col items-start gap-3 p-5 rounded-2xl text-left
                     bg-surface border border-theme shadow-card
                     hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200"
        >
          <span className="text-2xl">📌</span>
          <span>
            <span className="block font-display text-base text-theme">Fijadas</span>
            <span className="block text-xs text-muted mt-0.5">
              {counts.pinned} {counts.pinned === 1 ? 'nota' : 'notas'}
            </span>
          </span>
        </button>
      </div>

      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">
          Carpetas
        </p>
        <p className="text-[11px] text-muted/60">
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
        className="text-xs text-muted hover:text-accent transition-colors"
      >
        🗑️ Papelera {counts.trash > 0 ? `(${counts.trash})` : ''}
      </button>
    </div>
  )
}
