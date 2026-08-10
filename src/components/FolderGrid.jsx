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

      <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft/60 dark:text-night-text/40 mb-3">
        Carpetas
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 mb-6">
        {folderCards.map((c) => (
          <FolderCard key={c.id} card={c} onClick={() => onSelect(c.id)} onEdit={() => onEditFolder(c.id)} />
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

function FolderCard({ card, onClick, onEdit }) {
  return (
    <div
      className="group relative flex flex-col items-start gap-3 p-4 rounded-xl
                 bg-white/70 dark:bg-night-surface border border-ink/10 dark:border-night-text/10
                 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
    >
      <button onClick={onClick} className="flex flex-col items-start gap-3 w-full text-left">
        <span className="text-2xl">{card.icon}</span>
        <span className="w-full">
          <span className="block font-display text-[15px] text-ink dark:text-night-text truncate pr-5">
            {card.name}
          </span>
          <span className="block text-xs text-ink-soft/60 dark:text-night-text/40 mt-0.5">
            {card.count} {card.count === 1 ? 'nota' : 'notas'}
          </span>
        </span>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onEdit()
        }}
        className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full
                   text-ink-soft/40 dark:text-night-text/30 opacity-0 group-hover:opacity-100
                   hover:bg-ink/5 dark:hover:bg-night-text/10 transition-opacity text-xs"
        aria-label="Editar carpeta"
        title="Editar carpeta"
      >
        ✏️
      </button>
    </div>
  )
}
