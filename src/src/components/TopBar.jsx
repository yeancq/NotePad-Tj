export default function TopBar({ search, onSearch, dark, onToggleDark, onOpenSidebar, greeting }) {
  return (
    <header className="sticky top-0 z-20 bg-parchment/90 dark:bg-night/90 backdrop-blur-sm border-b border-ink/10 dark:border-night-text/10">
      <div className="px-4 md:px-8 py-4 flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-full text-ink dark:text-night-text hover:bg-ink/5 dark:hover:bg-night-text/10"
          aria-label="Abrir carpetas"
        >
          ☰
        </button>

        <div className="flex-1 min-w-0">
          <p className="hidden md:block text-xs text-ink-soft dark:text-night-text/50 mb-0.5">
            {greeting}
          </p>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/50 dark:text-night-text/40 text-sm">
              ⌕
            </span>
            <input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              type="text"
              placeholder="Buscar notas o versículos…"
              className="w-full max-w-md bg-white/60 dark:bg-night-surface-2 border border-ink/10 dark:border-night-text/10
                         rounded-full pl-9 pr-4 py-2 text-sm text-ink dark:text-night-text
                         placeholder:text-ink-soft/50 dark:placeholder:text-night-text/30
                         focus:outline-none focus:ring-2 focus:ring-gilt/60 transition-shadow"
            />
          </div>
        </div>

        <button
          onClick={onToggleDark}
          className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full
                     text-ink dark:text-night-text hover:bg-ink/5 dark:hover:bg-night-text/10 transition-colors"
          aria-label="Cambiar modo oscuro"
          title="Modo oscuro"
        >
          {dark ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  )
}
