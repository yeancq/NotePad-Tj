import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBibleReady, useVerseSegments } from '../hooks/useVerseSegments'
import { linkifyHtml } from '../lib/linkifyHtml'
import { detectReferences } from '../lib/verseDetector'
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
 * Obtiene el texto plano y la posición del cursor/clic dentro del contenedor.
 * Similar a getTextAndOffset en RichEditor.
 */
function getTextAndOffsetFromContainer(container, node, offset) {
  if (!container) return { text: '', offset: 0 }

  // Si no se proporcionan nodo/offset, usar la selección actual
  if (!node) {
    const sel = window.getSelection()
    if (sel && container.contains(sel.focusNode)) {
      node = sel.focusNode
      offset = sel.focusOffset
    } else {
      return { text: container.textContent || '', offset: 0 }
    }
  }

  // Recorrer nodos hijos (bloques) y construir el texto plano con saltos de línea
  const blocks = container.childNodes.length ? Array.from(container.childNodes) : []
  let text = ''
  let targetOffset = null

  blocks.forEach((block, i) => {
    if (i > 0) text += '\n'
    const blockRange = document.createRange()
    blockRange.selectNodeContents(block)
    const blockText = blockRange.toString()

    if (targetOffset === null && node && (block === node || block.contains?.(node))) {
      try {
        const preRange = document.createRange()
        preRange.selectNodeContents(block)
        preRange.setEnd(node, offset)
        targetOffset = text.length + preRange.toString().length
      } catch {
        targetOffset = text.length
      }
    }
    text += blockText
  })

  if (targetOffset === null) targetOffset = text.length
  return { text, offset: targetOffset }
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

  const linked = useMemo(() => linkifyHtml(note.body || ''), [note.body])
  const contentRef = useRef(null)
  const [lastClickPos, setLastClickPos] = useState(null)

  // Manejar clics en el contenido (para enlaces entre notas y citas bíblicas)
  const handleContentClick = (e) => {
    // 1. Verificar si se hizo clic en un enlace entre notas (data-ref-id)
    const btn = e.target.closest('[data-ref-id]')
    if (btn) {
      const ref = linked.refsById[btn.getAttribute('data-ref-id')]
      if (ref) {
        setActiveRef((cur) => (refKey(cur) === refKey(ref) ? null : ref))
        return
      }
    }

    // 2. Si no es un enlace entre notas, verificar si hay una cita bíblica en la posición del clic
    const { node, offset } = (() => {
      const sel = window.getSelection()
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0)
        // Si el clic fue en el contenedor o dentro, obtener nodo y offset
        if (contentRef.current && contentRef.current.contains(range.commonAncestorContainer)) {
          return { node: range.startContainer, offset: range.startOffset }
        }
      }
      return { node: null, offset: 0 }
    })()

    if (node && contentRef.current) {
      const { text, offset: clickOffset } = getTextAndOffsetFromContainer(
        contentRef.current,
        node,
        offset
      )
      // Detectar referencias en todo el texto
      const refs = detectReferences(text)
      // Buscar la referencia que contiene la posición del clic
      const found = refs.find((r) => clickOffset >= r.start && clickOffset <= r.end)
      if (found) {
        setActiveRef((cur) => (refKey(cur) === refKey(found) ? null : found))
        return
      }
    }

    // Si no se encontró nada, cerrar el panel (si estaba abierto)
    if (activeRef) setActiveRef(null)
  }

  // Cerrar el panel al hacer clic fuera del contenido
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (contentRef.current && !contentRef.current.contains(e.target)) {
        setActiveRef(null)
      }
    }
    document.addEventListener('click', handleOutsideClick)
    return () => document.removeEventListener('click', handleOutsideClick)
  }, [])

  return (
    <div className="fixed inset-0 z-50 bg-parchment dark:bg-night paper-texture text-ink dark:text-night-text flex flex-col">
      <div className="flex-1 overflow-y-auto px-6 md:px-16 py-10 pb-32">
        <div className="max-w-2xl mx-auto" style={{ fontSize: `${fontScale}%` }}>
          <h1 className="font-display text-3xl md:text-4xl font-semibold mb-8 leading-tight">
            {note.title}
          </h1>
          <div
            ref={contentRef}
            onClick={handleContentClick}
            className="speaker-content leading-relaxed cursor-pointer
                       [&_button]:text-leather [&_button]:dark:text-gilt-soft
                       [&_h1]:font-display [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:mb-2
                       [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-2
                       [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-1
                       [&_p]:mb-3"
            dangerouslySetInnerHTML={{ __html: linked.html }}
          />
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
