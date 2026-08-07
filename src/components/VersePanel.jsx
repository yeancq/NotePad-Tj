import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { detectReferences } from '../lib/verseDetector'
import { getVerseText, isBibleImported } from '../lib/epubBible'

// Curva "emphasized" de Material Design 3: entra rápido, se asienta despacio.
const EASE = [0.2, 0, 0, 1]

function refKey(ref) {
  return ref ? `${ref.start}:${ref.end}:${ref.raw}` : null
}

/**
 * Panel lateral fijo (siempre a la derecha del texto, en cualquier tamaño de
 * pantalla) que muestra el versículo bajo el cursor. No es un overlay: es una
 * columna más de la fila del editor, así que el texto de la nota se acomoda
 * a su lado en vez de quedar tapado.
 */
export default function VersePanel({ text, cursorPos, onNeedImport, onActiveChange }) {
  const [bibleReady, setBibleReady] = useState(true)
  const [activeRef, setActiveRef] = useState(null)
  const [closedKey, setClosedKey] = useState(null)
  const [segmentTexts, setSegmentTexts] = useState([])

  useEffect(() => {
    isBibleImported().then(setBibleReady)
  }, [])

  useEffect(() => {
    const refs = detectReferences(text)
    const found = refs.find((r) => cursorPos >= r.start && cursorPos <= r.end)

    if (!found) {
      setActiveRef(null)
      setClosedKey(null)
      onActiveChange?.(false)
      return
    }

    const key = refKey(found)
    const next = key === closedKey ? null : found
    setActiveRef(next)
    onActiveChange?.(Boolean(next))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, cursorPos])

  useEffect(() => {
    if (!activeRef || !bibleReady) {
      setSegmentTexts([])
      return
    }
    let cancelled = false
    ;(async () => {
      const results = []
      for (const seg of activeRef.segments) {
        const parts = await Promise.all(
          seg.verses.map((v) => getVerseText(activeRef.book, seg.chapter, v))
        )
        results.push({ verseLabel: seg.verseLabel, text: parts.filter(Boolean).join(' ') })
      }
      if (!cancelled) setSegmentTexts(results)
    })()
    return () => {
      cancelled = true
    }
  }, [activeRef, bibleReady])

  const handleClose = () => {
    if (activeRef) setClosedKey(refKey(activeRef))
    setActiveRef(null)
    onActiveChange?.(false)
  }

  const handleCopy = () => {
    if (!activeRef) return
    const body = segmentTexts.map((s) => `${s.verseLabel} ${s.text}`).join(' ')
    navigator.clipboard?.writeText(`${activeRef.label}  ${body}`)
  }

  return (
    <AnimatePresence>
      {activeRef && (
        <motion.aside
          key={refKey(activeRef)}
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="w-[42%] sm:w-[38%] max-w-[380px] min-w-0 shrink-0 flex flex-col
                     bg-parchment/90 dark:bg-night-surface/90 backdrop-blur-md
                     border-l border-ink/[0.06] dark:border-night-text/[0.06]"
        >
          <div className="flex items-center gap-1.5 px-3.5 md:px-5 pt-4 pb-3 border-b border-ink/[0.06] dark:border-night-text/[0.06]">
            <p className="flex-1 font-display font-medium text-ink dark:text-night-text text-[13px] md:text-[15px] tracking-tight truncate">
              {activeRef.label}
            </p>
            <IconButton onClick={handleCopy} label="Copiar">
              ⧉
            </IconButton>
            <IconButton onClick={handleClose} label="Cerrar">
              ✕
            </IconButton>
          </div>

          <div className="px-3.5 md:px-5 py-4 flex-1 overflow-y-auto">
            {!bibleReady ? (
              <p className="text-sm text-ink-soft dark:text-night-text/60">
                Aún no has importado tu Biblia.{' '}
                <button onClick={onNeedImport} className="text-leather dark:text-gilt-soft underline underline-offset-2">
                  Importarla ahora
                </button>
              </p>
            ) : segmentTexts.length === 0 ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="text-sm text-ink-soft/60 dark:text-night-text/30"
              >
                Buscando…
              </motion.p>
            ) : (
              <p className="text-[14px] md:text-[15px] leading-[1.75] text-ink/90 dark:text-night-text/90">
                {segmentTexts.map((s, i) => (
                  <span key={i}>
                    <span className="text-[11px] md:text-[12px] font-medium text-ink-soft/60 dark:text-night-text/40 align-super mr-0.5">
                      {s.verseLabel}
                    </span>
                    {s.text || (
                      <em className="text-ink-soft/50 dark:text-night-text/30 not-italic">no encontrado</em>
                    )}
                    {i < segmentTexts.length - 1 ? '  ' : ''}
                  </span>
                ))}
              </p>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}

function IconButton({ onClick, label, children }) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="w-8 h-8 flex items-center justify-center rounded-full text-[13px]
                 text-ink-soft/50 dark:text-night-text/40
                 hover:text-ink dark:hover:text-night-text
                 hover:bg-ink/5 dark:hover:bg-night-text/10
                 transition-colors duration-300"
    >
      {children}
    </button>
  )
}
