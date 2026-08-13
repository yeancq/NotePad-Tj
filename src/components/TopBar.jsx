export default function TopBar({ search, onSearch, dark, onToggleDark, onOpenSidebar, onGoHome, showBack, greeting }) {
  return (
    <header className="sticky top-0 z-20 bg-theme/90 backdrop-blur-sm border-b border-theme px-4 md:px-8 py-4">
      <div className="flex items-center gap-3 mb-4">
        {showBack ? (
          <button
            onClick={onGoHome}
            className="w-9 h-9 flex items-center justify-center rounded-full text-theme hover:bg-ink/5 dark:hover:bg-night-text/10"
            aria-label="Volver al inicio"
          >
            ←
          </button>
        ) : (
          <button
            onClick={onOpenSidebar}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-full text-theme hover:bg-ink/5 dark:hover:bg-night-text/10"
            aria-label="Abrir menú"
          >
            ☰
          </button>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-display text-lg md:text-xl text-theme tracking-tight truncate">
            NotePad TJ
          </p>
          <p className="text-xs text-muted mt-0.5">
            {greeting}
          </p>
        </div>
        <button
          onClick={onToggleDark}
          className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full
                     text-theme hover:bg-ink/5 dark:hover:bg-night-text/10 transition-colors"
          aria-label="Cambiar modo oscuro"
        >
          {dark ? '☀️' : '🌙'}
        </button>
      </div>
      <div className="relative max-w-md">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/50 text-sm">
          ⌕
        </span>
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          type="text"
          placeholder="Buscar en tus notas…"
          className="w-full bg-surface border border-theme
                     rounded-full pl-9 pr-4 py-2.5 text-sm text-theme
                     placeholder:text-muted/50
                     focus:outline-none focus:ring-2 focus:ring-accent/60 transition-shadow"
        />
      </div>
    </header>
  )
}
