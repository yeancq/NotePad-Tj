import { useEffect, useRef, useState } from 'react'
import PdfViewer from './PdfViewer'
import { listPdfs, addPdf, removePdf } from '../lib/atalayaStore'
import { loadPdfjs } from '../lib/pdfjsLoader'
import { useBackHandler } from '../hooks/useBackHandler'

function formatSize(bytes) {
  const mb = bytes / 1048576
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}

export default function AtalayaSection({ onBack }) {
  const [items, setItems] = useState(null)
  const [openEntry, setOpenEntry] = useState(null)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState(null)
  const fileRef = useRef(null)

  // El botón "atrás" del móvil cierra primero el visor y, si no hay
  // ninguno abierto, esta sección (eso último lo maneja App.jsx).
  useBackHandler(Boolean(openEntry), () => setOpenEntry(null))

  useEffect(() => {
    listPdfs().then(setItems)
  }, [])

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError(null)
    setImporting(true)
    try {
      const buffer = await file.arrayBuffer()
      const pdfjs = await loadPdfjs()
      // Se abre una vez solo para validar que es un PDF legible y contar
      // sus páginas (con una copia del buffer, porque pdf.js se queda con
      // el que recibe).
      const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer.slice(0)) }).promise
      const numPages = doc.numPages
      doc.destroy()

      const name = file.name.replace(/\.pdf$/i, '')
      const entry = await addPdf(name, buffer, numPages)
      setItems((prev) => [entry, ...(prev || [])])
    } catch (err) {
      console.error(err)
      setError('No se pudo leer el archivo. Confirma que sea un PDF válido.')
    } finally {
      setImporting(false)
    }
  }

  const handleRemove = async (entry) => {
    if (!window.confirm(`¿Eliminar "${entry.name}" de este dispositivo?`)) return
    await removePdf(entry.id)
    setItems((prev) => (prev || []).filter((p) => p.id !== entry.id))
  }

  if (openEntry) {
    return <PdfViewer entry={openEntry} onBack={() => setOpenEntry(null)} />
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
        <h1 className="font-display text-lg">La Atalaya</h1>
      </header>

      <main className="flex-1 px-4 md:px-8 py-6 max-w-xl mx-auto w-full">
        <div className="bg-white/70 dark:bg-night-surface border border-ink/10 dark:border-night-text/10 rounded-xl p-5 mb-5">
          <p className="text-sm text-ink-soft dark:text-night-text/60">
            Importa el <strong>PDF de La Atalaya</strong> del mes (descargado de jw.org) para
            prepararlo aquí. El archivo se guarda solo en tu dispositivo.
          </p>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFile}
          className="hidden"
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={importing}
          className="px-5 py-2.5 rounded-full bg-leather text-parchment text-sm font-medium hover:bg-leather-deep transition-colors disabled:opacity-40"
        >
          {importing ? 'Importando…' : 'Importar PDF'}
        </button>
        {error && <p className="text-sm text-leather mt-3">{error}</p>}

        <div className="mt-6 space-y-2.5">
          {items === null ? null : items.length === 0 ? (
            <p className="text-sm text-ink-soft/60 dark:text-night-text/40">
              Todavía no has importado ningún PDF.
            </p>
          ) : (
            items.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-2 bg-white/70 dark:bg-night-surface border border-ink/10 dark:border-night-text/10 rounded-xl pl-4 pr-2 py-3"
              >
                <button onClick={() => setOpenEntry(entry)} className="flex-1 min-w-0 text-left">
                  <p className="font-display text-[15px] truncate">{entry.name}</p>
                  <p className="text-xs text-ink-soft/60 dark:text-night-text/40 mt-0.5">
                    {entry.numPages} páginas · {formatSize(entry.size)}
                  </p>
                </button>
                <button
                  onClick={() => handleRemove(entry)}
                  className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-ink-soft/50 dark:text-night-text/40 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors"
                  aria-label={`Eliminar ${entry.name}`}
                  title="Eliminar"
                >
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
