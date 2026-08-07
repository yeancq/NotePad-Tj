export default function Sidebar({ folders, activeFolder, onSelect, counts, open, onClose, onOpenImport, onOpenImportProgram }) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-40 w-64 shrink-0
          bg-parchment-dim dark:bg-night-surface
          border-r border-ink/10 dark:border-night-text/10
          transition-transform duration-300 ease-out
          ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          flex flex-col
        `}
      >
        <div className="px-5 pt-6 pb-4">
          <p className="font-display text-2xl text-ink dark:text-night-text tracking-tight">
            Cuaderno
          </p>
          <p className="text-xs text-ink-soft dark:text-night-text/60 mt-0.5">
            Estudio, reuniones y predicación
          </p>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 space-y-1">
          <FolderTab
            label="Todas las notas"
            icon="📚"
            active={activeFolder === null}
            count={counts.all}
            onClick={() => onSelect(null)}
          />
          <FolderTab
            label="Fijadas"
            icon="🔖"
            active={activeFolder === 'pinned'}
            count={counts.pinned}
            onClick={() => onSelect('pinned')}
          />

          <p className="px-3 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-soft/70 dark:text-night-text/40">
            Carpetas
          </p>
          {folders
            .filter((f) => !f.parentId)
            .map((f) => {
              const children = folders.filter((c) => c.parentId === f.id)
              const childCount = children.reduce((sum, c) => sum + (counts[c.id] ?? 0), 0)
              return (
                <div key={f.id}>
                  <FolderTab
                    label={f.name}
                    icon={f.icon}
                    active={activeFolder === f.id}
                    count={(counts[f.id] ?? 0) + childCount}
                    onClick={() => onSelect(f.id)}
                  />
                  {children.length > 0 && (
                    <div className="ml-4 border-l border-ink/10 dark:border-night-text/10 pl-2 space-y-1 mt-1 mb-1">
                      {children.map((c) => (
                        <FolderTab
                          key={c.id}
                          label={c.name}
                          icon={c.icon}
                          active={activeFolder === c.id}
                          count={counts[c.id] ?? 0}
                          onClick={() => onSelect(c.id)}
                          compact
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

          <FolderTab
            label="Papelera"
            icon="🗑️"
            active={activeFolder === 'trash'}
            count={counts.trash}
            onClick={() => onSelect('trash')}
            muted
          />
        </nav>

        <div className="px-5 py-4 border-t border-ink/10 dark:border-night-text/10">
          <button
            onClick={onOpenImport}
            className="w-full text-left text-xs text-ink-soft dark:text-night-text/60 hover:text-leather dark:hover:text-gilt-soft transition-colors"
          >
            📖 Importar Biblia (TNM)
          </button>
          <button
            onClick={onOpenImportProgram}
            className="w-full text-left text-xs text-ink-soft dark:text-night-text/60 hover:text-leather dark:hover:text-gilt-soft transition-colors mt-2"
          >
            🎟️ Importar programa
          </button>
        </div>
      </aside>
    </>
  )
}

function FolderTab({ label, icon, active, count, onClick, muted, compact }) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-2.5 rounded-lg text-left
        transition-colors relative
        ${compact ? 'px-2.5 py-1.5 text-[13px]' : 'px-3 py-2 text-sm'}
        ${
          active
            ? 'bg-leather text-parchment dark:bg-leather-deep dark:text-night-text shadow-sm'
            : muted
            ? 'text-ink-soft/60 dark:text-night-text/40 hover:bg-ink/5 dark:hover:bg-night-text/5'
            : 'text-ink-soft dark:text-night-text/70 hover:bg-ink/5 dark:hover:bg-night-text/5'
        }
      `}
    >
      {active && (
        <span className="absolute -right-3 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-l-full bg-gilt" />
      )}
      <span className={compact ? 'text-sm leading-none' : 'text-base leading-none'}>{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {count > 0 && (
        <span
          className={`text-[11px] tabular-nums ${
            active ? 'text-parchment/70' : 'text-ink-soft/50 dark:text-night-text/40'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  )
}
