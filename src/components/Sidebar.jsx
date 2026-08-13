import { BookOpen, Calendar, Settings } from 'lucide-react'

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
          bg-theme-dim
          border-r border-theme
          transition-transform duration-300 ease-out
          ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          flex flex-col
        `}
      >
        <div className="px-5 pt-6 pb-4">
          <p className="font-display text-2xl text-theme tracking-tight">
            NotePad TJ
          </p>
          <p className="text-xs text-muted mt-0.5">
            Estudio, reuniones y predicación
          </p>
        </div>

        <nav className="px-3 space-y-1 border-b border-theme pb-4 mb-2">
          <SidebarAction icon={<BookOpen className="w-4 h-4" />} label="Importar Biblia (TNM)" onClick={onOpenImport} />
          <SidebarAction icon={<Calendar className="w-4 h-4" />} label="Importar programa" onClick={onOpenImportProgram} />
          <SidebarAction icon={<Settings className="w-4 h-4" />} label="Configuración" onClick={onOpenSettings} />
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
                 text-soft hover:bg-ink/5 dark:hover:bg-night-text/5 transition-colors"
    >
      <span className="text-base leading-none">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
    </button>
  )
}
