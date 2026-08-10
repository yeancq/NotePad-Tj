import { useRef, useState } from 'react'
import { docxToHtml } from '../lib/docxToHtml'

export default function ImportOutline({ onBack, onCreateNote }) {
  const [preview, setPreview] = useState(null)
  const [title, setTitle] = useState('')
  const [error, setError] = useState(null)
  const fileRef = useRef(null)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    try {
      const result = await docxToHtml(file)
      setPreview(result.html)
      setTitle(result.title)
    } catch (err) {
      console.error(err)
      setError('No se pudo leer el archivo. Confirma que sea un .docx válido.')
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
        <h1 className="font-display text-lg">Importar bosquejo</h1>
      </header>

      <main className="flex-1 px-4 md:px-8 py-6 max-w-2xl mx-auto w-full">
        {!preview ? (
          <>
            <div className="bg-white/70 dark:bg-night-surface border border-ink/10 dark:border-night-text/10 rounded-xl p-5 mb-5">
              <p className="text-sm text-ink-soft dark:text-night-text/60">
                Selecciona el archivo <strong>.docx</strong> del bosquejo. Se va a crear una nota
                nueva en <strong>Bosquejos Públicos</strong>, conservando negrita, cursiva y sangría.
              </p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFile}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="px-5 py-2.5 rounded-full bg-leather text-parchment text-sm font-medium hover:bg-leather-deep transition-colors"
            >
              Seleccionar archivo .docx
            </button>
            {error && <p className="text-sm text-leather mt-3">{error}</p>}
          </>
        ) : (
          <>
            <label className="block text-xs font-medium uppercase tracking-wide text-ink-soft/60 dark:text-night-text/40 mb-1.5">
              Título de la nota
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full font-display text-lg bg-transparent border-b border-ink/15 dark:border-night-text/15
                         focus:outline-none focus:border-leather dark:focus:border-gilt-soft pb-1.5 mb-5"
            />

            <p className="text-xs font-medium uppercase tracking-wide text-ink-soft/60 dark:text-night-text/40 mb-2">
              Vista previa
            </p>
            <div
              className="bg-white/70 dark:bg-night-surface border border-ink/10 dark:border-night-text/10 rounded-xl p-5 mb-5
                         max-h-[45vh] overflow-y-auto text-sm leading-relaxed
                         [&_h3]:font-display [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mb-1
                         [&_p]:mb-2.5"
              dangerouslySetInnerHTML={{ __html: preview }}
            />

            <div className="flex gap-3">
              <button
                onClick={() => onCreateNote(title, preview)}
                className="px-5 py-2.5 rounded-full bg-leather text-parchment text-sm font-medium hover:bg-leather-deep transition-colors"
              >
                Crear nota
              </button>
              <button
                onClick={() => {
                  setPreview(null)
                  setTitle('')
                }}
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
