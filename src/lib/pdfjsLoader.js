// Carga pdf.js solo cuando se necesita (al entrar a la sección Atalaya),
// para no engordar el arranque normal de la app. Se usa la versión
// "legacy" de pdf.js, que funciona también en navegadores móviles algo
// más antiguos.
let pdfjsPromise = null

export function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      const [lib, worker] = await Promise.all([
        import('pdfjs-dist/legacy/build/pdf.mjs'),
        import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'),
      ])
      lib.GlobalWorkerOptions.workerSrc = worker.default
      return lib
    })().catch((err) => {
      // Si falla (por ejemplo sin conexión la primera vez), permitir reintentar.
      pdfjsPromise = null
      throw err
    })
  }
  return pdfjsPromise
}
