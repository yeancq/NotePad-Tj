import { useState, useEffect, useRef } from 'react'
import { accentPalettes } from '../data/accentPalettes'
import { Sun, Moon, Smartphone, Palette, Download, Upload, RefreshCw } from 'lucide-react'

const themeOptions = [
  { id: 'light', label: 'Claro', icon: Sun },
  { id: 'dark', label: 'Oscuro', icon: Moon },
  { id: 'system', label: 'Sistema', icon: Smartphone },
]

const visualThemes = [
  { id: 'warm', label: 'Cálido', icon: '☀️', description: 'Tonos tierra y beige' },
  { id: 'marine', label: 'Azul Marino', icon: '🌊', description: 'Profesional y moderno' },
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
  const [visualTheme, setVisualTheme] = useState(() => {
    return localStorage.getItem('visualTheme') || 'warm'
  })
  const fileInputRef = useRef(null)

  useEffect(() => {
    const html = document.documentElement
    html.removeAttribute('data-theme')
    if (themeMode === 'dark') {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
    if (visualTheme === 'marine') {
      if (themeMode === 'dark') {
        html.setAttribute('data-theme', 'marine-dark')
      } else {
        html.setAttribute('data-theme', 'marine')
      }
    } else {
      if (themeMode === 'dark') {
        html.setAttribute('data-theme', 'dark')
      } else {
        html.removeAttribute('data-theme')
      }
    }
    localStorage.setItem('visualTheme', visualTheme)
  }, [visualTheme, themeMode])

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
    <div className="min-h-screen bg-theme text-theme flex flex-col">
      <header className="sticky top-0 z-20 bg-theme/90 backdrop-blur-sm border-b border-theme px-4 md:px-8 py-3 flex items-center gap-3">
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
          {/* Modo de color */}
          <section className="bg-surface border border-theme rounded-xl p-5 mb-4 shadow-card">
            <p className="text-sm font-medium text-soft mb-3 text-center">Modo de color</p>
            <div className="grid grid-cols-3 gap-3">
              {themeOptions.map((opt) => {
                const Icon = opt.icon
                return (
                  <button
                    key={opt.id}
                    onClick={() => setThemeMode(opt.id)}
                    className={`flex flex-col items-center justify-center gap-1.5 py-4 rounded-xl border-2 transition-colors
                      ${
                        themeMode === opt.id
                          ? 'border-primary bg-primary-soft text-primary-text'
                          : 'border-theme text-soft hover:bg-ink/5 dark:hover:bg-night-text/5'
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{opt.label}</span>
                  </button>
                )
              })}
            </div>
          </section>

          {/* Estilo visual */}
          <section className="bg-surface border border-theme rounded-xl p-5 mb-4 shadow-card">
            <p className="text-sm font-medium text-soft mb-3 text-center">Estilo visual</p>
            <div className="grid grid-cols-2 gap-3">
              {visualThemes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setVisualTheme(theme.id)}
                  className={`flex flex-col items-center justify-center gap-1.5 py-4 rounded-xl border-2 transition-colors
                    ${
                      visualTheme === theme.id
                        ? 'border-primary bg-primary-soft text-primary-text'
                        : 'border-theme text-soft hover:bg-ink/5 dark:hover:bg-night-text/5'
                    }`}
                >
                  <span className="text-xl">{theme.icon}</span>
                  <span className="text-sm font-medium">{theme.label}</span>
                  <span className="text-xs text-muted">{theme.description}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Color de acento */}
          <section className="bg-surface border border-theme rounded-xl p-5 mb-4 shadow-card">
            <p className="text-sm font-medium text-soft mb-3 text-center">Color de acento</p>
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

          {/* Respaldo */}
          <section className="bg-surface border border-theme rounded-xl p-5 mb-4 shadow-card">
            <p className="text-sm font-medium text-soft mb-3 text-center">💾 Respaldo de datos</p>
            <div className="flex gap-3">
              <button
                onClick={onExport}
                className="flex-1 py-2.5 rounded-xl bg-accent/15 text-accent text-sm font-medium hover:bg-accent/25 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Exportar respaldo
              </button>
              <button
                onClick={handleImportClick}
                className="flex-1 py-2.5 rounded-xl bg-ink/5 dark:bg-night-text/5 text-soft text-sm font-medium hover:bg-ink/10 dark:hover:bg-night-text/10 transition-colors flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Importar respaldo
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                className="hidden"
              />
            </div>
            <p className="text-xs text-muted mt-2 text-center">
              Guarda una copia de seguridad de todas tus notas y carpetas.
            </p>
          </section>

          {/* Cómo funciona NotePad TJ */}
          <section className="bg-surface border border-theme rounded-xl p-5 mb-4 shadow-card">
            <button
              onClick={() => setAboutOpen(!aboutOpen)}
              className="w-full flex items-center justify-between text-left"
            >
              <span className="text-sm font-medium text-soft">📖 Cómo funciona NotePad TJ</span>
              <span className="text-muted text-sm">{aboutOpen ? '▲' : '▼'}</span>
            </button>

            {aboutOpen && (
              <div className="mt-4 text-sm text-soft space-y-4 border-t border-theme pt-4">
                <div>
                  <p>
                    <strong className="text-theme">NotePad TJ</strong> es una aplicación de notas
                    diseñada especialmente para el estudio bíblico, reuniones de congregación y predicación.
                    Todo se guarda en tu dispositivo, sin necesidad de internet ni servidores externos.
                  </p>
                </div>
                {/* Resto del contenido ya lo tenías, puedes mantenerlo igual */}
                <div className="pt-2 text-xs text-muted border-t border-theme mt-2">
                  <p>Desarrollada por <strong className="text-soft">yeancq</strong></p>
                  <p className="mt-0.5">Hecha con React, Vite, Tailwind ❤️</p>
                </div>
              </div>
            )}
          </section>

          <p className="text-xs text-muted px-1">
            Estas preferencias se guardan en este dispositivo.
          </p>
        </div>

        {/* Versión */}
        <div className="mt-8 pt-4 border-t border-theme">
          <div className="flex items-center justify-center gap-3">
            <p className="text-center text-xs text-muted font-mono tracking-wide">Versión {version}</p>
            <button
              onClick={handleCheckForUpdate}
              disabled={isChecking}
              className={`text-[10px] px-2 py-1 rounded-full transition-colors flex items-center gap-1
                ${isChecking
                  ? 'text-muted cursor-not-allowed'
                  : 'text-accent hover:text-accent/80 hover:bg-accent/10'
                }`}
            >
              <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} />
            </button>
          </div>
          {isChecking && <p className="text-center text-[10px] text-muted mt-1">Verificando...</p>}
        </div>
      </main>
    </div>
  )
}
