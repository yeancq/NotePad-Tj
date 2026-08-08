import { accentPalettes } from '../data/accentPalettes'

const themeOptions = [
  { id: 'light', label: 'Claro', icon: '☀️' },
  { id: 'dark', label: 'Oscuro', icon: '🌙' },
  { id: 'system', label: 'Sistema', icon: '📱' },
]

export default function Settings({ themeMode, setThemeMode, accentId, setAccentId, onBack }) {
  return (
    <div className="min-h-screen bg-parchment dark:bg-night paper-texture text-ink dark:text-night-text flex flex-col">
      <header className="sticky top-0 z-20 bg-parchment/90 dark:bg-night/90 backdrop-blur-sm border-b border-ink/10 dark:border-night-text/10 px-4 md:px-8 py-3 flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-ink/5 dark:hover:bg-night-text/10"
          aria-label="Volver"
        >
          ←
        </button>
        <h1 className="font-display text-lg">Configuración</h1>
      </header>

      <main className="flex-1 px-4 md:px-8 py-6 max-w-xl mx-auto w-full">
        <section className="bg-white/70 dark:bg-night-surface border border-ink/10 dark:border-night-text/10 rounded-xl p-5 mb-5">
          <div className="grid grid-cols-3 gap-3 mb-6">
            {themeOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setThemeMode(opt.id)}
                className={`flex flex-col items-center justify-center gap-1.5 py-4 rounded-xl border-2 transition-colors
                  ${
                    themeMode === opt.id
                      ? 'border-leather bg-leather/10 text-leather dark:border-gilt-soft dark:bg-gilt-soft/10 dark:text-gilt-soft'
                      : 'border-ink/10 dark:border-night-text/10 text-ink-soft dark:text-night-text/50 hover:bg-ink/5 dark:hover:bg-night-text/5'
                  }`}
              >
                <span className="text-xl">{opt.icon}</span>
                <span className="text-sm font-medium">{opt.label}</span>
              </button>
            ))}
          </div>

          <p className="text-center text-sm font-medium text-ink-soft dark:text-night-text/50 mb-3">
            Color de acento
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            {accentPalettes.map((p) => (
              <button
                key={p.id}
                onClick={() => setAccentId(p.id)}
                title={p.name}
                aria-label={p.name}
                className="w-11 h-11 rounded-full flex items-center justify-center transition-transform hover:scale-105"
                style={{ backgroundColor: p.base }}
              >
                {accentId === p.id && <span className="text-white text-lg">✓</span>}
              </button>
            ))}
          </div>
        </section>

        <p className="text-xs text-ink-soft/60 dark:text-night-text/40 px-1">
          Estas preferencias se guardan en este dispositivo.
        </p>
      </main>
    </div>
  )
}
