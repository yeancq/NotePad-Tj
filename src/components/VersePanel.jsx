import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { detectReferences } from '../lib/verseDetector'
import { useBibleReady, useVerseSegments } from '../hooks/useVerseSegments'
import VerseCardBody from './VerseCardBody'

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
  const bibleReady = useBibleReady()
  const [activeRef, setActiveRef] = useState(null)
  const [closedKey, setClosedKey] = useState(null)
  const segmentTexts = useVerseSegments(activeRef, bibleReady)

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
          <VerseCardBody
            activeRef={activeRef}
            segmentTexts={segmentTexts}
            bibleReady={bibleReady}
            onNeedImport={onNeedImport}
            onCopy={handleCopy}
            onClose={handleClose}
          />
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
