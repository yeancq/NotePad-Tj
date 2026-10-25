import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import VerseCardBody from './VerseCardBody'
import './pdfTextLayer.css'
import { getPdfData, getToc, saveToc } from '../lib/atalayaStore'
import { loadPdfjs } from '../lib/pdfjsLoader'
import { dumpPageText, extractToc, TOC_VERSION } from '../lib/pdfToc'
import { findPdfReferences, hitTestRef } from '../lib/pdfRefs'
import { isBibleImported } from '../lib/epubBible'
import { buildCopyText } from '../lib/verseCardHelpers'
import { useVerseSegments } from '../hooks/useVerseSegments'

const EASE = [0.2, 0, 0, 1]
const GAP = 12 // separación entre páginas (px) y margen superior
const SIDE = 16 // margen total a los lados al 100% de zoom (px)
const MIN_ZOOM = 1
const MAX_ZOOM = 3
const ZOOM_STEP = 0.25
const MAX_CANVAS_PIXELS = 8_000_000 // tope por página, para no agotar la memoria del móvil

export default function PdfViewer({ entry, onBack, onNeedImport, bibleTick = 0 }) {
  const [pdf, setPdf] = useState(null)
  const [ratios, setRatios] = useState([])
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [zoom, setZoom] = useState(1)
  const [scrollEl, setScrollEl] = useState(null)
  const [boxWidth, setBoxWidth] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [toc, setToc] = useState(null) // null = buscando, [] = no se detectó nada
  const [showIndex, setShowIndex] = useState(true) // se muestra al abrir el PDF
  const [diagMsg, setDiagMsg] = useState('')
  const [activeRef, setActiveRef] = useState(null)
  const [bibleReady, setBibleReady] = useState(true)
  const rafRef = useRef(0)

  const { segmentTexts, footnotes } = useVerseSegments(activeRef, bibleReady)

  // ¿Está importada la Biblia? Se vuelve a comprobar al regresar de importarla
  // (bibleTick cambia), porque este visor sigue abierto mientras tanto.
  useEffect(() => {
    let cancelled = false
    isBibleImported().then((v) => {
      if (!cancelled) setBibleReady(v)
    })
    return () => {
      cancelled = true
    }
  }, [bibleTick])

  // Tocar una cita la abre; tocarla otra vez la cierra.
  const handleOpenRef = useCallback((ref) => {
    setActiveRef((cur) => (cur && cur._key === ref._key ? null : ref))
  }, [])

  // Carga del documento desde IndexedDB y medida de todas las páginas.
  useEffect(() => {
    let cancelled = false
    let doc = null

    ;(async () => {
      try {
        const data = await getPdfData(entry.id)
        if (!data) throw new Error('PDF no encontrado en el dispositivo')
        const pdfjs = await loadPdfjs()
        // slice(0): pdf.js "se queda" con el buffer que recibe, así que le
        // pasamos una copia y el original sigue intacto en IndexedDB.
        doc = await pdfjs.getDocument({ data: new Uint8Array(data.slice(0)) }).promise
        if (cancelled) {
          doc.destroy()
          return
        }
        const r = await Promise.all(
          Array.from({ length: doc.numPages }, async (_, i) => {
            const page = await doc.getPage(i + 1)
            const v = page.getViewport({ scale: 1 })
            return v.height / v.width
          })
        )
        if (cancelled) return
        setPdf(doc)
        setRatios(r)
        setStatus('ready')
      } catch (err) {
        console.error(err)
        if (!cancelled) setStatus('error')
      }
    })()

    return () => {
      cancelled = true
      if (doc) doc.destroy()
    }
  }, [entry.id])

  // Índice de artículos: se calcula una sola vez por PDF y se guarda.
  useEffect(() => {
    if (!pdf) return
    let cancelled = false

    ;(async () => {
      try {
        const cached = await getToc(entry.id)
        if (cached && cached.v === TOC_VERSION) {
          if (!cancelled) setToc(cached.items)
          return
        }
        const items = await extractToc(pdf)
        if (cancelled) return
        setToc(items)
        await saveToc(entry.id, { v: TOC_VERSION, items })
      } catch (err) {
        console.error(err)
        if (!cancelled) setToc([])
      }
    })()

    return () => {
      cancelled = true
    }
  }, [pdf, entry.id])

  // Ancho disponible (cambia al girar el móvil).
  useEffect(() => {
    if (!scrollEl) return
    const update = () => setBoxWidth(scrollEl.clientWidth)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(scrollEl)
    return () => ro.disconnect()
  }, [scrollEl])

  const pageWidth = boxWidth > 0 ? Math.round((boxWidth - SIDE) * zoom) : 0

  // Página visible (la que está en el centro de la pantalla).
  const handleScroll = useCallback(() => {
    if (!scrollEl || ratios.length === 0 || pageWidth === 0) return
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      const mid = scrollEl.scrollTop + scrollEl.clientHeight / 2
      let y = GAP
      let found = ratios.length
      for (let i = 0; i < ratios.length; i++) {
        y += Math.round(ratios[i] * pageWidth) + GAP
        if (mid < y) {
          found = i + 1
          break
        }
      }
      setCurrentPage(found)
    })
  }, [scrollEl, ratios, pageWidth])

  useEffect(() => () => cancelAnimationFrame(rafRef.current), [])

  const scrollToPage = useCallback(
    (n) => {
      if (!scrollEl || ratios.length === 0 || pageWidth === 0) return
      const target = Math.min(Math.max(1, n), ratios.length)
      let top = 0
      for (let i = 0; i < target - 1; i++) top += Math.round(ratios[i] * pageWidth) + GAP
      scrollEl.scrollTo({ top, behavior: 'auto' })
    },
    [scrollEl, ratios, pageWidth]
  )

  const goToPage = () => {
    if (ratios.length === 0) return
    const answer = window.prompt(`Ir a la página (1-${ratios.length})`, String(currentPage))
    const n = parseInt(answer, 10)
    if (Number.isNaN(n) || n < 1 || n > ratios.length) return
    scrollToPage(n)
  }

  const openIndexItem = (item) => {
    scrollToPage(item.page)
    setShowIndex(false)
  }

  // Copia al portapapeles el texto crudo de la página actual, para poder
  // diagnosticar por qué no se detectaron los artículos.
  const copyDiagnostic = async () => {
    if (!pdf) return
    try {
      const text = await dumpPageText(pdf, currentPage)
      await navigator.clipboard.writeText(text)
      setDiagMsg(`Copiado el texto de la página ${currentPage}. Pégalo en el chat.`)
    } catch (err) {
      console.error(err)
      setDiagMsg('No se pudo copiar.')
    }
  }

  // Artículo en el que estamos: el último del índice que empieza en esta
  // página o antes.
  const currentTocIndex = useMemo(() => {
    if (!toc || toc.length === 0) return -1
    let idx = -1
    toc.forEach((item, i) => {
      if (item.page <= currentPage) idx = i
    })
    return idx
  }, [toc, currentPage])

  const changeZoom = (delta) => {
    setZoom((z) => {
      const next = Math.round((z + delta) * 100) / 100
      return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next))
    })
  }

  return (
    <div className="h-dvh flex flex-col bg-parchment dark:bg-night text-ink dark:text-night-text overflow-hidden">
      <header className="shrink-0 z-20 bg-parchment/90 dark:bg-night/90 backdrop-blur-sm border-b border-ink/10 dark:border-night-text/10 px-3 py-2.5 flex items-center gap-2">
        <button
          onClick={onBack}
          className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full hover:bg-ink/5 dark:hover:bg-night-text/10"
          aria-label="Volver"
        >
          ←
        </button>

        <div className="flex-1 min-w-0">
          <p className="font-display text-sm truncate leading-tight">{entry.name}</p>
          {status === 'ready' && (
            <div className="flex items-center gap-3 mt-0.5">
              <button
                onClick={goToPage}
                className="text-[11px] text-ink-soft/70 dark:text-night-text/50 underline decoration-dotted underline-offset-2"
              >
                Página {currentPage} / {ratios.length}
              </button>
              <button
                onClick={() => setShowIndex((s) => !s)}
                className="text-[11px] font-medium text-leather dark:text-gilt-soft"
              >
                Índice {showIndex ? '▴' : '▾'}
              </button>
            </div>
          )}
        </div>

        <div className="shrink-0 flex items-center gap-0.5">
          <button
            onClick={() => changeZoom(-ZOOM_STEP)}
            disabled={zoom <= MIN_ZOOM}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-ink/5 dark:hover:bg-night-text/10 disabled:opacity-30"
            aria-label="Reducir zoom"
          >
            −
          </button>
          <button
            onClick={() => setZoom(1)}
            className="w-11 text-center text-xs tabular-nums text-ink-soft dark:text-night-text/60"
            aria-label="Ajustar al ancho"
            title="Ajustar al ancho"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={() => changeZoom(ZOOM_STEP)}
            disabled={zoom >= MAX_ZOOM}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-ink/5 dark:hover:bg-night-text/10 disabled:opacity-30"
            aria-label="Aumentar zoom"
          >
            +
          </button>
        </div>
      </header>

      {status === 'ready' && showIndex && (
        <div className="shrink-0 z-10 max-h-[42vh] overflow-y-auto bg-parchment dark:bg-night border-b border-ink/10 dark:border-night-text/10 px-2 py-2">
          {toc === null ? (
            <p className="text-xs text-ink-soft/60 dark:text-night-text/40 px-3 py-2">
              Buscando artículos…
            </p>
          ) : toc.length === 0 ? (
            <div className="px-3 py-2">
              <p className="text-xs text-ink-soft/70 dark:text-night-text/50 leading-relaxed">
                No pude detectar los artículos en este PDF. Puedes saltar tocando “Página X / N”.
              </p>
              <button
                onClick={copyDiagnostic}
                className="mt-2 text-xs px-3 py-1.5 rounded-full border border-ink/15 dark:border-night-text/15 text-ink dark:text-night-text hover:bg-ink/5 dark:hover:bg-night-text/10 transition-colors"
              >
                Copiar texto de la página {currentPage} (diagnóstico)
              </button>
              {diagMsg && (
                <p className="text-[11px] text-ink-soft/60 dark:text-night-text/40 mt-1.5">
                  {diagMsg}
                </p>
              )}
            </div>
          ) : (
            toc.map((item, i) => (
              <button
                key={`${item.kind}-${item.page}`}
                onClick={() => openIndexItem(item)}
                className={`w-full text-left px-3 py-2 rounded-lg flex items-start gap-3 transition-colors ${
                  i === currentTocIndex
                    ? 'bg-leather/10 dark:bg-gilt-soft/10'
                    : 'hover:bg-ink/5 dark:hover:bg-night-text/5'
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-medium">{item.label}</span>
                  {item.title && (
                    <span className="block text-xs text-ink-soft/70 dark:text-night-text/50 leading-snug mt-0.5">
                      {item.title}
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-[11px] tabular-nums text-ink-soft/50 dark:text-night-text/40 pt-0.5">
                  pág. {item.page}
                </span>
              </button>
            ))
          )}
        </div>
      )}

      <div
        ref={setScrollEl}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-auto bg-ink/5 dark:bg-night-surface"
      >
        {status === 'loading' && (
          <p className="text-sm text-ink-soft dark:text-night-text/60 text-center py-16">
            Abriendo PDF…
          </p>
        )}

        {status === 'error' && (
          <p className="text-sm text-leather text-center py-16 px-6">
            No se pudo abrir este PDF. Prueba a eliminarlo de la lista e importarlo de nuevo.
          </p>
        )}

        {status === 'ready' && pdf && scrollEl && pageWidth > 0 && (
          <div className="flex flex-col items-center gap-3 py-3 w-fit min-w-full">
            {ratios.map((ratio, i) => (
              <PdfPage
                key={i}
                pdf={pdf}
                pageNumber={i + 1}
                width={pageWidth}
                ratio={ratio}
                root={scrollEl}
                onOpenRef={handleOpenRef}
              />
            ))}
          </div>
        )}
      </div>

      {/* Tarjeta del versículo (la misma del modo orador) */}
      <AnimatePresence>
        {activeRef && (
          <motion.div
            key={activeRef._key}
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="fixed inset-x-0 bottom-4 z-30 flex justify-center px-3"
          >
            <div className="w-full max-w-xl max-h-[45vh] flex flex-col bg-parchment/95 dark:bg-night-surface/95 backdrop-blur-md border border-ink/10 dark:border-night-text/10 rounded-2xl shadow-2xl overflow-hidden">
              <VerseCardBody
                activeRef={activeRef}
                segmentTexts={segmentTexts}
                footnotes={footnotes}
                bibleReady={bibleReady}
                onNeedImport={onNeedImport}
                onCopy={() => {
                  navigator.clipboard?.writeText(buildCopyText(activeRef, segmentTexts))
                }}
                onClose={() => setActiveRef(null)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * Una página del PDF. Reserva siempre su tamaño real (para que el scroll
 * no salte) pero solo dibuja el contenido mientras está cerca de la
 * pantalla; al alejarse libera el lienzo y la capa de texto para no llenar
 * la memoria del móvil con un PDF de 30+ páginas.
 *
 * Capas, de abajo hacia arriba: imagen de la página (canvas) → texto
 * invisible seleccionable → marcas de las citas bíblicas detectadas.
 */
function PdfPage({ pdf, pageNumber, width, ratio, root, onOpenRef }) {
  const holderRef = useRef(null)
  const canvasRef = useRef(null)
  const textRef = useRef(null)
  const [visible, setVisible] = useState(false)
  const [refRects, setRefRects] = useState([])

  useEffect(() => {
    const el = holderRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { root, rootMargin: '150% 0px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [root])

  useEffect(() => {
    const canvas = canvasRef.current
    const textEl = textRef.current
    if (!canvas || !textEl) return

    if (!visible) {
      canvas.width = 0
      canvas.height = 0
      textEl.replaceChildren()
      setRefRects((r) => (r.length ? [] : r))
      return
    }

    let cancelled = false
    let task = null
    let textLayer = null

    ;(async () => {
      try {
        const [page, pdfjs] = await Promise.all([pdf.getPage(pageNumber), loadPdfjs()])
        if (cancelled) return

        const base = page.getViewport({ scale: 1 })
        const cssScale = width / base.width
        let outputScale = Math.min(window.devicePixelRatio || 1, 2)

        const w = base.width * cssScale * outputScale
        const h = base.height * cssScale * outputScale
        if (w * h > MAX_CANVAS_PIXELS) {
          outputScale *= Math.sqrt(MAX_CANVAS_PIXELS / (w * h))
        }

        // 1) Imagen de la página
        const viewport = page.getViewport({ scale: cssScale * outputScale })
        canvas.width = Math.floor(viewport.width)
        canvas.height = Math.floor(viewport.height)
        const ctx = canvas.getContext('2d')
        task = page.render({ canvasContext: ctx, canvas, viewport })

        // 2) Texto seleccionable (si falla, la página se sigue viendo bien)
        const textPromise = (async () => {
          try {
            textEl.replaceChildren()
            textEl.style.setProperty('--scale-factor', String(cssScale))
            textEl.style.setProperty('--total-scale-factor', String(cssScale))
            textEl.style.setProperty('--user-unit', '1')
            textEl.style.setProperty('--scale-round-x', '1px')
            textEl.style.setProperty('--scale-round-y', '1px')
            textLayer = new pdfjs.TextLayer({
              textContentSource: page.streamTextContent(),
              container: textEl,
              viewport: page.getViewport({ scale: cssScale }),
            })
            await textLayer.render()
            return true
          } catch (err) {
            if (err?.name !== 'AbortException' && err?.name !== 'RenderingCancelledException') {
              console.error('Capa de texto:', err)
            }
            return false
          }
        })()

        const [, textOk] = await Promise.all([task.promise, textPromise])
        if (cancelled || !textOk) return

        // 3) Citas bíblicas
        try {
          setRefRects(findPdfReferences(textEl, holderRef.current, pageNumber))
        } catch (err) {
          console.error('Citas:', err)
        }
      } catch (err) {
        if (err?.name !== 'RenderingCancelledException') console.error(err)
      }
    })()

    return () => {
      cancelled = true
      if (task) task.cancel()
      if (textLayer) textLayer.cancel()
    }
  }, [visible, width, pdf, pageNumber])

  // Un toque sobre una cita la abre. Si hay texto seleccionado (el usuario
  // acaba de mantener pulsado), se ignora el toque.
  const handleClick = (e) => {
    if (refRects.length === 0) return
    const sel = window.getSelection()
    if (sel && !sel.isCollapsed && sel.toString().trim()) return
    const box = holderRef.current.getBoundingClientRect()
    const hit = hitTestRef(refRects, e.clientX - box.left, e.clientY - box.top)
    if (hit) onOpenRef(hit)
  }

  return (
    <div
      ref={holderRef}
      onClick={handleClick}
      className="relative bg-white shadow-md shrink-0"
      style={{ width, height: Math.round(width * ratio) }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <div ref={textRef} className="textLayer pdf-text-layer" />
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 2 }}>
        {refRects.map(({ ref, rects }) =>
          rects.map((r, i) => (
            <div
              key={`${ref._key}-${i}`}
              className="pdf-ref-mark"
              style={{ left: r.x, top: r.y, width: r.w, height: r.h }}
            />
          ))
        )}
      </div>
    </div>
  )
              }
