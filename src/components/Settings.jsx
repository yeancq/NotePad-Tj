import { useEffect, useRef, useState } from 'react'
import { accentPalettes } from '../data/accentPalettes'
import { exportBackup, readBackupFile, applyBackup } from '../lib/backup'

const themeOptions = [
  { id: 'light', label: 'Claro', icon: '☀️' },
  { id: 'dark', label: 'Oscuro', icon: '🌙' },
  { id: 'system', label: 'Sistema', icon: '📱' },
]

// Guía con las explicaciones de la app
const guideSections = [
  {
    title: '📝 Notas y Notas Rápidas',
    content:
      'Crea y organiza tus ideas al instante.
NotePad TJ te permite escribir notas de estudio con un editor enriquecido (negrita, cursiva, subrayado, resaltado de colores y encabezados). Puedes fijar las notas importantes para tenerlas siempre a mano y moverlas a la papelera cuando ya no las necesites (con opción de restaurarlas o eliminarlas definitivamente). Además, el auto-guardado integrado garantiza que nunca pierdas tu trabajo, incluso si cierras la aplicación sin guardar manualmente..',
  },
  {
    title: '📁 Carpetas y Organización',
    content:
      'Estructura tu estudio como un cuaderno físico.
Organiza tus notas en carpetas y subcarpetas personalizadas (por ejemplo: "Estudio personal", "Reuniones", "Predicación", "Asambleas"). Puedes crear nuevas carpetas desde el botón flotante (FAB) o editarlas con un toque prolongado (en móvil) o desde el menú de opciones. Cada carpeta muestra el número de notas que contiene, y puedes mover notas entre carpetas arrastrándolas o usando el menú contextual..',
  },
  {
    title: '📖 Formato y Biblia',
    content:
      'Escribe con estilo y referencia bíblica automática.
El editor enriquecido te permite dar formato a tu texto (negrita, cursiva, subrayado, resaltado en varios colores y encabezados). Pero la joya de la corona es el reconocimiento automático de referencias bíblicas: cuando escribes algo como "Mateo 24:14" o "Filipenses 4:6, 7", la aplicación lo detecta y te muestra el texto real de la Traducción del Nuevo Mundo en un panel flotante. Solo necesitas importar tu propia copia del EPUB desde jw.org una sola vez; todo se procesa y guarda en tu dispositivo..',
  },
  {
    title: '💾 Respaldos y Privacidad',
    content:
      'Tus datos, solo tuyos.
Todas tus notas, carpetas y preferencias se guardan exclusivamente en tu dispositivo (usando localStorage e IndexedDB). Nadie más tiene acceso a ellas. Para mayor seguridad, la aplicación incluye un sistema de respaldo y restauración que te permite exportar un archivo .json con todas tus notas y carpetas (ideal para hacer una copia de seguridad periódica o transferir tus datos a otro dispositivo). Al importar un respaldo, puedes elegir entre agregar (fusionar con tus notas actuales) o reemplazar (sobrescribir todo)..',
  },
  {
    title: '📲 Instalación como PWA',
    content:
      'Una app nativa sin necesidad de descargarla de la tienda.
NotePad TJ es una aplicación web progresiva (PWA). Esto significa que, desde el navegador de tu teléfono, puedes añadirla a la pantalla de inicio (en Chrome, selecciona "Añadir a pantalla de inicio"; en Safari, "Añadir a la pantalla de inicio"). Una vez instalada, se comporta como una aplicación nativa: tiene su propio ícono, se abre en pantalla completa, funciona sin conexión a internet y se actualiza automáticamente cuando hay una nueva versión disponible..',
  },
]

export default function Settings({ themeMode, setThemeMode, accentId, setAccentId, onBack }) {
  const [status, setStatus] = useState(null)
  const [pendingImport, setPendingImport] = useState(null)
  const [openGuideIndex, setOpenGuideIndex] = useState(null)
  const fileRef = useRef(null)

  const [appVersion, setAppVersion] = useState(null)
  const [appVersionDate, setAppVersionDate] = useState(null)

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}version.json?t=${Date.now()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return
        setAppVersion(data.version)
        if (data.updated) setAppVersionDate(new Date(data.updated))
      })
      .catch(() => {})
  }, [])

  const handleExport = () => {
    const { notesCount, foldersCount } = exportBackup()
    setStatus({
      type: 'ok',
      text: `Respaldo descargado: ${notesCount} notas, ${foldersCount} carpetas.`,
    })
  }

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setStatus(null)
    try {
      const data = await readBackupFile(file)
      setPendingImport(data)
    } catch (err) {
      setStatus({ type: 'error', text: err.message })
    }
  }

  const confirmImport = (mode) => {
    applyBackup(pendingImport, mode)
    setPendingImport(null)
    setStatus({ type: 'ok', text: 'Respaldo importado. Recargando…' })
    setTimeout(() => window.location.reload(), 800)
  }

  const toggleGuide = (index) => {
    setOpenGuideIndex(openGuideIndex === index ? null : index)
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

      <main className="flex-1 px-4 md:px-8 py-6 max-w-xl mx-auto w-full">
        {/* Apariencia */}
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

        <p className="text-xs text-ink-soft/60 dark:text-night-text/40 px-1 mb-5">
          Estas preferencias se guardan en este dispositivo.
        </p>

        {/* Respaldo de notas */}
        <section className="bg-white/70 dark:bg-night-surface border border-ink/10 dark:border-night-text/10 rounded-xl p-5 mb-5">
          <h2 className="font-display text-base mb-1">Respaldo de notas</h2>
          <p className="text-xs text-ink-soft/70 dark:text-night-text/40 mb-4">
            Tus notas solo existen en este dispositivo. Descarga un respaldo de vez en cuando, o
            antes de cambiar de celular.
          </p>

          <div className="flex flex-wrap gap-2.5 mb-3">
            <button
              onClick={handleExport}
              className="px-4 py-2 rounded-full bg-leather text-parchment text-sm font-medium hover:bg-leather-deep transition-colors"
            >
              Exportar respaldo
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFile}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="px-4 py-2 rounded-full border border-ink/15 dark:border-night-text/15 text-sm text-ink dark:text-night-text hover:bg-ink/5 dark:hover:bg-night-text/10 transition-colors"
            >
              Importar respaldo
            </button>
          </div>

          {status && (
            <p className={`text-sm ${status.type === 'error' ? 'text-leather' : 'text-sage'}`}>
              {status.text}
            </p>
          )}
        </section>

        {/* Nueva Sección: Cómo funciona NotePad TJ */}
        <section className="bg-white/70 dark:bg-night-surface border border-ink/10 dark:border-night-text/10 rounded-xl p-5 mb-8">
          <h2 className="font-display text-base mb-1">Cómo funciona NotePad TJ</h2>
          <p className="text-xs text-ink-soft/70 dark:text-night-text/40 mb-4">
            Guía rápida sobre las funciones principales de la aplicación.
          </p>

          <div className="space-y-2">
            {guideSections.map((item, index) => (
              <div
                key={index}
                className="border border-ink/10 dark:border-night-text/10 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => toggleGuide(index)}
                  className="w-full flex items-center justify-between p-3 text-left text-sm font-medium text-ink dark:text-night-text bg-ink/5 dark:bg-night-text/5 hover:bg-ink/10 dark:hover:bg-night-text/10 transition-colors"
                >
                  <span>{item.title}</span>
                  <span className="text-xs opacity-60 ml-2">
                    {openGuideIndex === index ? '▲' : '▼'}
                  </span>
                </button>

                {openGuideIndex === index && (
                  <div className="p-3 text-xs text-ink-soft dark:text-night-text/70 bg-white/50 dark:bg-night-surface/50 leading-relaxed border-t border-ink/5 dark:border-night-text/5">
                    {item.content}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Versión de la app */}
        <div className="text-center pb-8">
          <p className="text-xs font-medium text-ink-soft/50 dark:text-night-text/40">
            NotePad TJ{appVersion ? ` — v${appVersion}` : ''}
          </p>
          {appVersionDate && (
            <p className="text-[11px] text-ink-soft/40 dark:text-night-text/30 mt-0.5">
              Actualizado el{' '}
              {appVersionDate.toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>
      </main>

      {/* Modal de confirmación de importación */}
      {pendingImport && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-ink/30 dark:bg-black/50 px-4"
          onClick={() => setPendingImport(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-parchment dark:bg-night-surface rounded-2xl shadow-xl p-5"
          >
            <h2 className="font-display text-lg mb-2">Importar respaldo</h2>
            <p className="text-sm text-ink-soft dark:text-night-text/60 mb-5">
              Este archivo tiene {pendingImport.notes.length} notas y {pendingImport.folders.length}{' '}
              carpetas. ¿Cómo quieres importarlo?
            </p>
            <div className="space-y-2">
              <button
                onClick={() => confirmImport('merge')}
                className="w-full px-4 py-2.5 rounded-xl bg-leather text-parchment text-sm font-medium hover:bg-leather-deep transition-colors text-left"
              >
                Agregar a lo que ya tengo
                <span className="block text-xs text-parchment/70 font-normal mt-0.5">
                  Mantiene tus notas actuales y suma las del respaldo
                </span>
              </button>
              <button
                onClick={() => confirmImport('replace')}
                className="w-full px-4 py-2.5 rounded-xl border border-leather/30 text-leather dark:text-gilt-soft text-sm font-medium hover:bg-leather/5 transition-colors text-left"
              >
                Reemplazar todo
                <span className="block text-xs opacity-70 font-normal mt-0.5">
                  Borra tus notas actuales y deja solo las del respaldo
                </span>
              </button>
              <button
                onClick={() => setPendingImport(null)}
                className="w-full px-4 py-2 rounded-xl text-sm text-ink-soft dark:text-night-text/60 hover:bg-ink/5 dark:hover:bg-night-text/10 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
