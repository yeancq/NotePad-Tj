import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { detectReferences } from '../lib/verseDetector'
import { useBibleReady, useVerseSegments } from '../hooks/useVerseSegments'
import VerseCardBody from './VerseCardBody'

const EASE = [0.2, 0, 0, 1]

function refKey(ref) {
  return ref ? `${ref.start}:${ref.end}:${ref.raw}` : null
}

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
          className="fixed top-16 right-4 z-50
                     w-[42%] sm:w-[38%] max-w-[380px] min-w-0
                     bg-parchment/90 dark:bg-night-surface/90 backdrop-blur-md
                     border border-ink/[0.06] dark:border-night-text/[0.06]
                     rounded-2xl shadow-2xl overflow-hidden flex flex-col"
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
