export default function Sidebar({ open, onClose, onOpenImport, onOpenImportProgram, onOpenSettings }) {
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
            NotePad TJ
          </p>
          <p className="text-xs text-ink-soft dark:text-night-text/60 mt-0.5">
            Estudio, reuniones y predicación
          </p>
        </div>

        <nav className="px-3 space-y-1 border-b border-ink/10 dark:border-night-text/10 pb-4 mb-2">
          <SidebarAction icon="📖" label="Importar Biblia (TNM)" onClick={onOpenImport} />
          <SidebarAction icon="🎟️" label="Importar programa" onClick={onOpenImportProgram} />
          <SidebarAction icon="⚙️" label="Configuración" onClick={onOpenSettings} />
        </nav>

        <div className="flex-1" />
      </aside>
    </>
  )
}

function SidebarAction({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left
                 text-ink-soft dark:text-night-text/70 hover:bg-ink/5 dark:hover:bg-night-text/5 transition-colors"
    >
      <span className="text-base leading-none">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
    </button>
  )
}
