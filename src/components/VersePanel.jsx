import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { detectReferences } from '../lib/verseDetector'
import { useBibleReady, useVerseSegments } from '../hooks/useVerseSegments'
import { refKey, buildCopyText } from '../lib/verseCardHelpers'
import VerseCardBody from './VerseCardBody'

const EASE = [0.2, 0, 0, 1]

export default function VersePanel({ text, cursorPos, onNeedImport, onActiveChange }) {
  const bibleReady = useBibleReady()
  const [activeRef, setActiveRef] = useState(null)
  const [closedKey, setClosedKey] = useState(null)
  const { segmentTexts, footnotes } = useVerseSegments(activeRef, bibleReady)

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
    navigator.clipboard?.writeText(buildCopyText(activeRef, segmentTexts))
  }

  return (
    <AnimatePresence>
      {activeRef && (
        <>
          {/* Fondo semitransparente para oscurecer el contenido detrás */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="fixed inset-0 z-40 bg-black/10 dark:bg-black/30"
            onClick={handleClose}
          />

          {/* Panel flotante */}
          <motion.aside
            key={refKey(activeRef)}
            initial={{ x: '100%', opacity: 0, scale: 0.95 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: '100%', opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="fixed top-1/2 -translate-y-1/2 right-4 z-50 w-[85vw] sm:w-[420px] max-w-[460px] max-h-[85vh] bg-parchment/92 dark:bg-night-surface/92 backdrop-blur-xl rounded-2xl shadow-2xl border border-ink/10 dark:border-night-text/10 overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <VerseCardBody
              activeRef={activeRef}
              segmentTexts={segmentTexts}
              footnotes={footnotes}
              bibleReady={bibleReady}
              onNeedImport={onNeedImport}
              onCopy={handleCopy}
              onClose={handleClose}
            />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
