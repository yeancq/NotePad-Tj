import { useRef, useState } from 'react'
import { parseProgramRtf } from '../lib/programParser'

// Puntos del programa que normalmente no necesitan una nota propia
// (música, canciones, oraciones) — se dejan desmarcados por defecto.
const FILLER_PATTERN = /^(música|canción\b.*|oración)$/i

export default function ImportProgram({ onBack, onCreateNotes }) {
  const [parsed, setParsed] = useState(null)
  const [folderName, setFolderName] = useState('')
  const [checked, setChecked] = useState({})
  const [error, setError] = useState(null)
  const fileRef = useRef(null)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    try {
      const rtfText = await file.text()
      const result = parseProgramRtf(rtfText)
      if (!result.items.length) {
        setError('No se detectó ningún punto del programa en este archivo. Confirma que sea un .rtf de programa de asamblea o congreso.')
        return
      }
      setParsed(result)
      setFolderName(result.title)
      const initialChecked = {}
      result.items.forEach((item, i) => {
        initialChecked[i] = !FILLER_PATTERN.test(item.title)
      })
      setChecked(initialChecked)
    } catch (err) {
      console.error(err)
      setError('No se pudo leer el archivo. Confirma que sea un .rtf válido.')
    }
  }

  const toggle = (i) => setChecked((c) => ({ ...c, [i]: !c[i] }))

  const selectedCount = Object.values(checked).filter(Boolean).length

  const handleCreate = () => {
    const selectedItems = parsed.items.filter((_, i) => checked[i])
    onCreateNotes(folderName, selectedItems)
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
        <h1 className="font-display text-lg">Importar programa</h1>
      </header>

      <main className="flex-1 px-4 md:px-8 py-6 max-w-xl mx-auto w-full">
        {!parsed ? (
          <>
            <div className="bg-white/70 dark:bg-night-surface border border-ink/10 dark:border-night-text/10 rounded-xl p-5 mb-5">
              <p className="text-sm text-ink-soft dark:text-night-text/60">
                Selecciona el archivo <strong>.rtf</strong> del programa de tu asamblea o congreso.
                Se va a crear una nota por cada punto del programa, ya lista para que anotes ahí
                lo que se diga en cada discurso.
              </p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".rtf,application/rtf,text/rtf,application/msword,application/octet-stream"
              onChange={handleFile}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="px-5 py-2.5 rounded-full bg-leather text-parchment text-sm font-medium hover:bg-leather-deep transition-colors"
            >
              Seleccionar archivo .rtf
            </button>
            {error && <p className="text-sm text-leather mt-3">{error}</p>}
          </>
        ) : (
          <>
            <label className="block text-xs font-medium uppercase tracking-wide text-ink-soft/60 dark:text-night-text/40 mb-1.5">
              Nombre de la carpeta
            </label>
            <input
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className="w-full font-display text-lg bg-transparent border-b border-ink/15 dark:border-night-text/15
                         focus:outline-none focus:border-leather dark:focus:border-gilt-soft pb-1.5 mb-1"
            />
            <p className="text-xs text-ink-soft/60 dark:text-night-text/40 mb-4">
              Se creará como subcarpeta dentro de "Asambleas".
            </p>
            <p className="text-sm text-ink-soft dark:text-night-text/50 mb-4">
              Elige qué puntos quieres convertir en notas. Ya desmarqué música, canciones y
              oraciones, pero puedes ajustarlo.
            </p>

            <div className="space-y-1.5 mb-6 max-h-[50vh] overflow-y-auto">
              {parsed.items.map((item, i) => (
                <label
                  key={i}
                  className="flex items-start gap-3 px-3 py-2 rounded-lg hover:bg-ink/5 dark:hover:bg-night-text/5 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(checked[i])}
                    onChange={() => toggle(i)}
                    className="mt-1 accent-leather"
                  />
                  <span className="text-sm">
                    <span className="text-ink-soft dark:text-night-text/40 tabular-nums">{item.time}</span>{' '}
                    <span className="text-ink dark:text-night-text">{item.title}</span>
                    {item.bullets.length > 0 && (
                      <span className="block text-xs text-ink-soft/70 dark:text-night-text/40 mt-0.5">
                        {item.bullets.join(' · ')}
                      </span>
                    )}
                  </span>
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCreate}
                disabled={selectedCount === 0}
                className="px-5 py-2.5 rounded-full bg-leather text-parchment text-sm font-medium
                           hover:bg-leather-deep transition-colors disabled:opacity-40"
              >
                Crear {selectedCount} {selectedCount === 1 ? 'nota' : 'notas'}
              </button>
              <button
                onClick={() => setParsed(null)}
                className="px-5 py-2.5 rounded-full text-sm text-ink-soft dark:text-night-text/60 hover:bg-ink/5 dark:hover:bg-night-text/10 transition-colors"
              >
                Elegir otro archivo
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
