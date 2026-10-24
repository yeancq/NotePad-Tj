import { useCallback, useEffect, useRef, useState } from 'react'
import { getPdfData } from '../lib/atalayaStore'
import { loadPdfjs } from '../lib/pdfjsLoader'

const GAP = 12 // separación entre páginas (px) y margen superior
const SIDE = 16 // margen total a los lados al 100% de zoom (px)
const MIN_ZOOM = 1
const MAX_ZOOM = 3
const ZOOM_STEP = 0.25
const MAX_CANVAS_PIXELS = 8_000_000 // tope por página, para no agotar la memoria del móvil

export default function PdfViewer({ entry, onBack }) {
  const [pdf, setPdf] = useState(null)
  const [ratios, setRatios] = useState([])
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [zoom, setZoom] = useState(1)
  const [scrollEl, setScrollEl] = useState(null)
  const [boxWidth, setBoxWidth] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const rafRef = useRef(0)

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
        y += ratios[i] * pageWidth + GAP
        if (mid < y) {
          found = i + 1
          break
        }
      }
      setCurrentPage(found)
    })
  }, [scrollEl, ratios, pageWidth])

  useEffect(() => () => cancelAnimationFrame(rafRef.current), [])

  const goToPage = () => {
    if (!scrollEl || ratios.length === 0) return
    const answer = window.prompt(`Ir a la página (1-${ratios.length})`, String(currentPage))
    const n = parseInt(answer, 10)
    if (Number.isNaN(n) || n < 1 || n > ratios.length) return
    let top = GAP
    for (let i = 0; i < n - 1; i++) top += ratios[i] * pageWidth + GAP
    scrollEl.scrollTo({ top: top - GAP, behavior: 'auto' })
  }

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
            <button
              onClick={goToPage}
              className="text-[11px] text-ink-soft/70 dark:text-night-text/50 underline decoration-dotted underline-offset-2"
            >
              Página {currentPage} / {ratios.length}
            </button>
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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Una página del PDF. Reserva siempre su tamaño real (para que el scroll
 * no salte) pero solo dibuja el contenido mientras está cerca de la
 * pantalla; al alejarse libera el lienzo para no llenar la memoria del
 * móvil con un PDF de 30+ páginas.
 */
function PdfPage({ pdf, pageNumber, width, ratio, root }) {
  const holderRef = useRef(null)
  const canvasRef = useRef(null)
  const [visible, setVisible] = useState(false)

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
    if (!canvas) return

    if (!visible) {
      canvas.width = 0
      canvas.height = 0
      return
    }

    let cancelled = false
    let task = null

    ;(async () => {
      try {
        const page = await pdf.getPage(pageNumber)
        if (cancelled) return

        const base = page.getViewport({ scale: 1 })
        const cssScale = width / base.width
        let outputScale = Math.min(window.devicePixelRatio || 1, 2)

        const w = base.width * cssScale * outputScale
        const h = base.height * cssScale * outputScale
        if (w * h > MAX_CANVAS_PIXELS) {
          outputScale *= Math.sqrt(MAX_CANVAS_PIXELS / (w * h))
        }

        const viewport = page.getViewport({ scale: cssScale * outputScale })
        canvas.width = Math.floor(viewport.width)
        canvas.height = Math.floor(viewport.height)

        const ctx = canvas.getContext('2d')
        task = page.render({ canvasContext: ctx, canvas, viewport })
        await task.promise
      } catch (err) {
        if (err?.name !== 'RenderingCancelledException') console.error(err)
      }
    })()

    return () => {
      cancelled = true
      if (task) task.cancel()
    }
  }, [visible, width, pdf, pageNumber])

  return (
    <div
      ref={holderRef}
      className="relative bg-white shadow-md shrink-0"
      style={{ width, height: Math.round(width * ratio) }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  )
}
