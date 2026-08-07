import { useEffect, useRef, useState } from 'react'
import { importBibleEpub, getBibleMeta, deleteBibleData } from '../lib/epubBible'

export default function ImportBible({ onBack, onImported }) {
  const [meta, setMeta] = useState(null)
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [error, setError] = useState(null)
  const fileRef = useRef(null)

  useEffect(() => {
    getBibleMeta().then(setMeta)
  }, [])

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setImporting(true)
    setProgress({ done: 0, total: 0 })
    try {
      const result = await importBibleEpub(file, (done, total) => setProgress({ done, total }))
      setMeta(result)
      onImported?.()
    } catch (err) {
      console.error(err)
      setError(
        'No se pudo leer el archivo. Confirma que sea el .epub de la Traducción del Nuevo Mundo descargado de jw.org.'
      )
    } finally {
      setImporting(false)
    }
  }

  const handleDelete = async () => {
    await deleteBibleData()
    setMeta(null)
  }

  const percent = progress.total ? Math.round((progress.done / progress.total) * 100) : 0

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
        <h1 className="font-display text-lg">Importar Biblia</h1>
      </header>

      <main className="flex-1 px-4 md:px-8 py-6 max-w-xl mx-auto w-full">
        {meta ? (
          <div className="bg-white/70 dark:bg-night-surface border border-ink/10 dark:border-night-text/10 rounded-xl p-5 mb-5">
            <p className="text-sm text-sage dark:text-sage-soft font-medium mb-1">✓ Biblia importada</p>
            <p className="text-sm text-ink-soft dark:text-night-text/60">
              {meta.imported} de {meta.totalChapters} capítulos guardados localmente
              {meta.missingCount > 0 && ` (${meta.missingCount} no encontrados)`}.
            </p>
            <p className="text-xs text-ink-soft/70 dark:text-night-text/40 mt-2">
              Importada el {new Date(meta.importedAt).toLocaleDateString('es')}
            </p>
            <button
              onClick={handleDelete}
              className="mt-4 text-xs text-leather hover:underline"
            >
              Borrar y volver a importar
            </button>
          </div>
        ) : (
          <div className="bg-white/70 dark:bg-night-surface border border-ink/10 dark:border-night-text/10 rounded-xl p-5 mb-5">
            <p className="text-sm text-ink-soft dark:text-night-text/60 mb-3">
              Para mostrar los versículos que mencionas en tus notas, primero necesitas importar
              tu propia copia de la Biblia. Descarga el <strong>EPUB de la Traducción del Nuevo
              Mundo en español</strong> desde jw.org (Publicaciones → La Biblia → Descargar → EPUB)
              y selecciónalo aquí. Todo se procesa y guarda en tu dispositivo — no se sube a
              ningún servidor.
            </p>
          </div>
        )}

        {importing ? (
          <div>
            <p className="text-sm mb-2">Importando… {percent}%</p>
            <div className="h-2 rounded-full bg-ink/10 dark:bg-night-text/10 overflow-hidden">
              <div
                className="h-full bg-leather transition-all duration-150"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="text-xs text-ink-soft/70 dark:text-night-text/40 mt-2">
              {progress.done} / {progress.total} capítulos — esto puede tardar un minuto.
            </p>
          </div>
        ) : (
          <>
            <input
              ref={fileRef}
              type="file"
              accept=".epub"
              onChange={handleFile}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="px-5 py-2.5 rounded-full bg-leather text-parchment text-sm font-medium hover:bg-leather-deep transition-colors"
            >
              {meta ? 'Reimportar EPUB' : 'Seleccionar archivo .epub'}
            </button>
          </>
        )}

        {error && <p className="text-sm text-leather mt-3">{error}</p>}
      </main>
    </div>
  )
}
