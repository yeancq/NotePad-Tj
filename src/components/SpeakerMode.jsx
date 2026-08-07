import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { detectReferences } from '../lib/verseDetector'
import { useBibleReady, useVerseSegments } from '../hooks/useVerseSegments'
import VerseCardBody from './VerseCardBody'

const EASE = [0.2, 0, 0, 1]

function refKey(ref) {
  return ref ? `${ref.start}:${ref.end}:${ref.raw}` : null
}

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/**
 * Divide una línea de texto en fragmentos planos + referencias bíblicas
 * tocables, según lo que detectReferences encuentre en esa línea.
 */
function splitLineWithRefs(line) {
  const refs = detectReferences(line)
  if (refs.length === 0) return [{ type: 'text', value: line }]
  const parts = []
  let cursor = 0
  refs.forEach((r) => {
    if (r.start > cursor) parts.push({ type: 'text', value: line.slice(cursor, r.start) })
    parts.push({ type: 'ref', ref: r })
    cursor = r.end
  })
  if (cursor < line.length) parts.push({ type: 'text', value: line.slice(cursor) })
  return parts
}

export default function SpeakerMode({ note, onClose, onNeedImport }) {
  const bibleReady = useBibleReady()
  const [activeRef, setActiveRef] = useState(null)
  const segmentTexts = useVerseSegments(activeRef, bibleReady)

  const [fontScale, setFontScale] = useState(100)
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [running])

  const lines = (note.body || '').split('\n')

  return (
    <div className="fixed inset-0 z-50 bg-parchment dark:bg-night paper-texture text-ink dark:text-night-text flex flex-col">
      <div className="flex-1 overflow-y-auto px-6 md:px-16 py-10 pb-32">
        <div className="max-w-2xl mx-auto" style={{ fontSize: `${fontScale}%` }}>
          <h1 className="font-display text-3xl md:text-4xl font-semibold mb-8 leading-tight">
            {note.title}
          </h1>
          {lines.map((line, i) => {
            if (!line.trim()) return <div key={i} className="h-4" />
            const bullet = line.trim().startsWith('•')
            const content = bullet ? line.trim().slice(1).trim() : line
            const parts = splitLineWithRefs(content)
            return (
              <p key={i} className={`mb-3 leading-relaxed ${bullet ? 'pl-5' : ''}`}>
                {bullet && <span className="mr-2 text-gilt">•</span>}
                {parts.map((p, j) =>
                  p.type === 'text' ? (
                    <span key={j}>{p.value}</span>
                  ) : (
                    <button
                      key={j}
                      onClick={() => setActiveRef((cur) => (refKey(cur) === refKey(p.ref) ? null : p.ref))}
                      className="text-leather dark:text-gilt-soft underline decoration-dotted underline-offset-2
                                 font-medium hover:decoration-solid transition-all"
                    >
                      {p.value}
                    </button>
                  )
                )}
              </p>
            )
          })}
        </div>
      </div>

      <AnimatePresence>
        {activeRef && (
          <motion.div
            key={refKey(activeRef)}
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="fixed inset-x-0 bottom-24 z-30 flex justify-center px-3"
          >
            <div className="w-full max-w-xl max-h-[40vh] flex flex-col bg-parchment/95 dark:bg-night-surface/95
                             backdrop-blur-md border border-ink/10 dark:border-night-text/10 rounded-2xl shadow-2xl overflow-hidden">
              <VerseCardBody
                activeRef={activeRef}
                segmentTexts={segmentTexts}
                bibleReady={bibleReady}
                onNeedImport={onNeedImport}
                onCopy={() => {
                  const body = segmentTexts.map((s) => `${s.verseLabel} ${s.text}`).join(' ')
                  navigator.clipboard?.writeText(`${activeRef.label}  ${body}`)
                }}
                onClose={() => setActiveRef(null)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SpeakerIsland
        seconds={seconds}
        running={running}
        onToggleRun={() => setRunning((r) => !r)}
        onReset={() => {
          setRunning(false)
          setSeconds(0)
        }}
        fontScale={fontScale}
        onZoom={(delta) => setFontScale((f) => Math.min(180, Math.max(70, f + delta)))}
        onClose={onClose}
      />
    </div>
  )
}

/**
 * La "isla" flotante: cronómetro + zoom de texto + cerrar. Se puede arrastrar
 * libremente por la pantalla (con Framer Motion drag), como en TheoPad.
 */
function SpeakerIsland({ seconds, running, onToggleRun, onReset, fontScale, onZoom, onClose }) {
  const constraintsRef = useRef(null)

  return (
    <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-40">
      <motion.div
        drag
        dragConstraints={constraintsRef}
        dragMomentum={false}
        dragElastic={0.05}
        initial={{ y: 0 }}
        className="pointer-events-auto absolute bottom-6 left-1/2 -translate-x-1/2
                   flex items-center gap-1 pl-2 pr-1.5 py-1.5 rounded-full
                   bg-ink dark:bg-night-surface-2 text-parchment dark:text-night-text
                   shadow-xl cursor-grab active:cursor-grabbing select-none"
      >
        <button
          onClick={onToggleRun}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          aria-label={running ? 'Pausar' : 'Iniciar'}
        >
          {running ? '⏸' : '▶'}
        </button>
        <span className="tabular-nums text-sm font-medium w-12 text-center">{formatTime(seconds)}</span>
        <button
          onClick={onReset}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-sm"
          aria-label="Reiniciar"
        >
          ↻
        </button>

        <span className="w-px h-5 bg-white/15 mx-0.5" />

        <button
          onClick={() => onZoom(-10)}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          aria-label="Reducir texto"
        >
          −
        </button>
        <span className="text-xs tabular-nums w-10 text-center text-parchment/70 dark:text-night-text/60">
          {fontScale}%
        </span>
        <button
          onClick={() => onZoom(10)}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          aria-label="Aumentar texto"
        >
          +
        </button>

        <span className="w-px h-5 bg-white/15 mx-0.5" />

        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full text-red-400 hover:bg-red-400/10 transition-colors"
          aria-label="Salir del modo orador"
        >
          ✕
        </button>
      </motion.div>
    </div>
  )
}
