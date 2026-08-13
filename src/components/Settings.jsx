import { useState, useEffect, useRef } from 'react'
import { accentPalettes } from '../data/accentPalettes'

const themeOptions = [
  { id: 'light', label: 'Claro', icon: '☀️' },
  { id: 'dark', label: 'Oscuro', icon: '🌙' },
  { id: 'system', label: 'Sistema', icon: '📱' },
]

export default function Settings({
  themeMode,
  setThemeMode,
  accentId,
  setAccentId,
  onBack,
  onExport,
  onImport,
}) {
  const [version, setVersion] = useState('Cargando...')
  const [isChecking, setIsChecking] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const fileInputRef = useRef(null)

  const fetchVersion = async (showUpdate = false) => {
    try {
      setIsChecking(true)
      const response = await fetch(
        'https://raw.githubusercontent.com/yeancq/NotePad-Tj/main/public/version.json?t=' + Date.now()
      )
      if (response.ok) {
        const data = await response.json()
        setVersion(data.version)

        if (showUpdate) {
          const savedVersion = localStorage.getItem('appVersion')
          if (savedVersion && savedVersion !== data.version) {
            localStorage.setItem('appVersion', data.version)
            setTimeout(() => window.location.reload(), 500)
          }
        }
      } else {
        setVersion('1.0.0')
      }
    } catch (error) {
      console.warn('Error obteniendo versión:', error)
      setVersion('1.0.0')
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    fetchVersion()
  }, [])

  const handleCheckForUpdate = () => {
    fetchVersion(true)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      onImport?.(file)
      e.target.value = ''
    }
  }

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

      <main className="flex-1 px-4 md:px-8 py-6 max-w-xl mx-auto w-full flex flex-col">
        <div className="flex-1">
          {/* Tema */}
          <section className="bg-white/70 dark:bg-night-surface border border-ink/10 dark:border-night-text/10 rounded-xl p-5 mb-4">
            <p className="text-sm font-medium text-ink-soft dark:text-night-text/50 mb-3 text-center">
              Tema
            </p>
            <div className="grid grid-cols-3 gap-3">
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
          </section>

          {/* Color de acento */}
          <section className="bg-white/70 dark:bg-night-surface border border-ink/10 dark:border-night-text/10 rounded-xl p-5 mb-4">
            <p className="text-sm font-medium text-ink-soft dark:text-night-text/50 mb-3 text-center">
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

          {/* 💾 RESPALDO DE DATOS */}
          <section className="bg-white/70 dark:bg-night-surface border border-ink/10 dark:border-night-text/10 rounded-xl p-5 mb-4">
            <p className="text-sm font-medium text-ink-soft dark:text-night-text/50 mb-3 text-center">
              💾 Respaldo de datos
            </p>
            <div className="flex gap-3">
              <button
                onClick={onExport}
                className="flex-1 py-2.5 rounded-xl bg-leather/15 text-leather dark:bg-gilt-soft/15 dark:text-gilt-soft text-sm font-medium hover:bg-leather/25 dark:hover:bg-gilt-soft/25 transition-colors"
              >
                📤 Exportar respaldo
              </button>
              <button
                onClick={handleImportClick}
                className="flex-1 py-2.5 rounded-xl bg-ink/5 dark:bg-night-text/5 text-ink-soft dark:text-night-text/60 text-sm font-medium hover:bg-ink/10 dark:hover:bg-night-text/10 transition-colors"
              >
                📥 Importar respaldo
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                className="hidden"
              />
            </div>
            <p className="text-xs text-ink-soft/50 dark:text-night-text/40 mt-2 text-center">
              Guarda una copia de seguridad de todas tus notas y carpetas.
            </p>
          </section>

          {/* 📖 Cómo funciona NotePad TJ */}
          <section className="bg-white/70 dark:bg-night-surface border border-ink/10 dark:border-night-text/10 rounded-xl p-5 mb-4">
            <button
              onClick={() => setAboutOpen(!aboutOpen)}
              className="w-full flex items-center justify-between text-left"
            >
              <span className="text-sm font-medium text-ink-soft dark:text-night-text/50">
                📖 Cómo funciona NotePad TJ
              </span>
              <span className="text-ink-soft/40 dark:text-night-text/30 text-sm">
                {aboutOpen ? '▲' : '▼'}
              </span>
            </button>

            {aboutOpen && (
              <div className="mt-4 text-sm text-ink-soft/80 dark:text-night-text/70 space-y-4 border-t border-ink/10 dark:border-night-text/10 pt-4">
                <div>
                  <p>
                    <strong className="text-ink dark:text-night-text">NotePad TJ</strong> es una aplicación de notas
                    diseñada especialmente para el estudio bíblico, reuniones de congregación y predicación.
                    Todo se guarda en tu dispositivo, sin necesidad de internet ni servidores externos.
                  </p>
                </div>

                <div>
                  <p className="font-medium text-ink dark:text-night-text text-xs uppercase tracking-wider mb-1.5">
                    📂 Organización
                  </p>
                  <p>
                    Crea <strong>carpetas y subcarpetas</strong> para organizar tus notas por tema,
                    reunión o programa. Mantén todo en orden con un sistema de jerarquía simple e intuitivo.
                  </p>
                </div>

                <div>
                  <p className="font-medium text-ink dark:text-night-text text-xs uppercase tracking-wider mb-1.5">
                    📖 Referencias bíblicas
                  </p>
                  <p>
                    Escribe una cita bíblica (ej.{' '}
                    <span className="font-mono text-xs bg-ink/5 dark:bg-night-text/10 px-1.5 py-0.5 rounded">
                      Filipenses 4:6, 7
                    </span>
                    ) y la app detectará automáticamente la referencia. Si has importado la Biblia (TNM),
                    verás el texto completo en un panel flotante.
                  </p>
                </div>

                <div className="bg-ink/5 dark:bg-night-text/5 rounded-lg p-3 border-l-2 border-leather dark:border-gilt-soft">
                  <p className="font-medium text-ink dark:text-night-text text-xs uppercase tracking-wider mb-1.5">
                    📥 Importar la Biblia (TNM)
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Ve a <strong className="text-ink dark:text-night-text">jw.org</strong></li>
                    <li>Busca <strong>"Publicaciones"</strong> → <strong>"La Biblia"</strong> → <strong>"Descargar"</strong></li>
                    <li>Selecciona el formato <strong className="text-ink dark:text-night-text">EPUB</strong></li>
                    <li>Elige <strong>Español</strong> y descarga el archivo <span className="font-mono text-xs bg-ink/5 dark:bg-night-text/10 px-1.5 py-0.5 rounded">.epub</span></li>
                    <li>En la app: <strong>menú lateral (☰)</strong> → <strong>"📖 Importar Biblia (TNM)"</strong></li>
                    <li>Selecciona el archivo <span className="font-mono text-xs bg-ink/5 dark:bg-night-text/10 px-1.5 py-0.5 rounded">.epub</span></li>
                  </ol>
                </div>

                <div className="bg-ink/5 dark:bg-night-text/5 rounded-lg p-3 border-l-2 border-leather dark:border-gilt-soft">
                  <p className="font-medium text-ink dark:text-night-text text-xs uppercase tracking-wider mb-1.5">
                    🎟️ Importar programas de asamblea
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Descarga el programa desde <strong className="text-ink dark:text-night-text">jw.org</strong> en formato <strong className="text-ink dark:text-night-text">.rtf</strong></li>
                    <li>En la app: <strong>menú lateral (☰)</strong> → <strong>"🎟️ Importar programa"</strong></li>
                    <li>Selecciona el archivo <span className="font-mono text-xs bg-ink/5 dark:bg-night-text/10 px-1.5 py-0.5 rounded">.rtf</span></li>
                  </ol>
                </div>

                <div className="bg-ink/5 dark:bg-night-text/5 rounded-lg p-3 border-l-2 border-leather dark:border-gilt-soft">
                  <p className="font-medium text-ink dark:text-night-text text-xs uppercase tracking-wider mb-1.5">
                    📄 Importar bosquejos
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Prepara tu bosquejo en formato <strong className="text-ink dark:text-night-text">.docx</strong></li>
                    <li>En la app: toca el botón <strong>"+"</strong> (flotante) → <strong>"📄 Importar bosquejo"</strong></li>
                    <li>Selecciona el archivo <span className="font-mono text-xs bg-ink/5 dark:bg-night-text/10 px-1.5 py-0.5 rounded">.docx</span></li>
                  </ol>
                </div>

                <div>
                  <p className="font-medium text-ink dark:text-night-text text-xs uppercase tracking-wider mb-1.5">
                    💾 Respaldo de datos
                  </p>
                  <p>
                    En la sección <strong>"Respaldo de datos"</strong> de esta misma pantalla puedes:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-xs mt-1">
                    <li>
                      <strong>📤 Exportar respaldo:</strong> Guarda un archivo{' '}
                      <span className="font-mono text-xs bg-ink/5 dark:bg-night-text/10 px-1.5 py-0.5 rounded">.json</span> con todas tus notas y carpetas.
                    </li>
                    <li>
                      <strong>📥 Importar respaldo:</strong> Carga un archivo{' '}
                      <span className="font-mono text-xs bg-ink/5 dark:bg-night-text/10 px-1.5 py-0.5 rounded">.json</span> para restaurar tus datos en otro dispositivo.
                    </li>
                  </ul>
                </div>

                <div>
                  <p className="font-medium text-ink dark:text-night-text text-xs uppercase tracking-wider mb-1.5">
                    💾 Almacenamiento local
                  </p>
                  <p>
                    Todos tus datos se guardan <strong>exclusivamente en tu dispositivo</strong>.
                    <strong> No se envían a ningún servidor.</strong> Tus notas son completamente privadas.
                  </p>
                </div>

                <div className="pt-2 text-xs text-ink-soft/40 dark:text-night-text/30 border-t border-ink/10 dark:border-night-text/10 mt-2">
                  <p>Desarrollada por <strong className="text-ink-soft/60 dark:text-night-text/40">yeancq</strong></p>
                  <p className="mt-0.5">Hecha con React, Vite, Tailwind ❤️</p>
                </div>
              </div>
            )}
          </section>

          <p className="text-xs text-ink-soft/60 dark:text-night-text/40 px-1">
            Estas preferencias se guardan en este dispositivo.
          </p>
        </div>

        {/* Versión */}
        <div className="mt-8 pt-4 border-t border-ink/10 dark:border-night-text/10">
          <div className="flex items-center justify-center gap-3">
            <p className="text-center text-xs text-ink-soft/40 dark:text-night-text/30 font-mono tracking-wide">
              Versión {version}
            </p>
            <button
              onClick={handleCheckForUpdate}
              disabled={isChecking}
              className={`text-[10px] px-2 py-1 rounded-full transition-colors
                ${
                  isChecking
                    ? 'text-ink-soft/30 dark:text-night-text/20 cursor-not-allowed'
                    : 'text-leather/60 dark:text-gilt-soft/60 hover:text-leather dark:hover:text-gilt-soft hover:bg-leather/10 dark:hover:bg-gilt-soft/10'
                }`}
            >
              {isChecking ? '🔄' : '↻'}
            </button>
          </div>
          {isChecking && (
            <p className="text-center text-[10px] text-ink-soft/40 dark:text-night-text/30 mt-1">Verificando...</p>
          )}
        </div>
      </main>
    </div>
  )
}
