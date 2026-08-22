/**
 * Extrae el texto de cada versículo de un archivo de capítulo XHTML del EPUB.
 * También extrae las notas al pie del capítulo.
 * Devuelve { verses, footnotes } donde:
 *   - verses: array donde el índice = número de versículo (índice 0 sin usar)
 *   - footnotes: array de strings con el texto de cada nota al pie
 */
export function parseChapterXhtml(xhtmlText) {
  const doc = new DOMParser().parseFromString(xhtmlText, 'text/html')
  const body = doc.body
  if (!body) return { verses: [], footnotes: [] }

  // ── Extraer notas al pie (ANTES del walker de versículos) ───────────────
  const footnotes = []
  // Selector primario: párrafos dentro de .groupFootnote (formato JW.org EPUB)
  body.querySelectorAll('.groupFootnote p').forEach((p) => {
    const text = p.textContent.replace(/\s+/g, ' ').trim()
    if (text) footnotes.push(text)
  })
  // Fallback: cualquier aside que no sea navegación ni numeración de páginas
  if (footnotes.length === 0) {
    body.querySelectorAll('aside').forEach((aside) => {
      const cls = aside.className || ''
      if (cls.includes('navigation') || cls.includes('pageNum')) return
      aside.querySelectorAll('p').forEach((p) => {
        const text = p.textContent.replace(/\s+/g, ' ').trim()
        if (text) footnotes.push(text)
      })
    })
  }

  // ── Extraer versículos ──────────────────────────────────────────────────
  // Recorremos TEXTO y ELEMENTOS. Esto es necesario porque los versículos en
  // formato poético (ej. Isaías, Salmos) suelen partir cada línea con un
  // <br> u otro elemento de "salto de línea" que NO tiene texto propio. Si
  // solo camináramos por nodos de texto (como antes), esos saltos se
  // saltaban sin dejar ningún espacio en el string final, uniendo palabras
  // de líneas distintas (ej. "Dios,el que te enseña" en vez de
  // "Dios, el que te enseña").
  const LINE_BREAK_TAGS = new Set(['BR'])

  const walker = doc.createTreeWalker(body, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT)
  const verses = {}
  let currentVerse = null
  let node

  const shouldSkip = (el) => {
    while (el) {
      if (el.tagName === 'ASIDE') return true
      const cls = el.className || ''
      if (
        cls.includes('w_navigation') ||
        cls.includes('pageNum') ||
        cls.includes('groupFootnote')
      ) {
        return true
      }
      el = el.parentElement
    }
    return false
  }

  while ((node = walker.nextNode())) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      // Elemento de salto de línea (poesía): insertamos un espacio para que
      // la línea siguiente no quede pegada a la anterior. El .replace(/\s+/g)
      // final se encarga de colapsar espacios de más si ya había uno.
      if (LINE_BREAK_TAGS.has(node.tagName) && !shouldSkip(node) && currentVerse !== null) {
        verses[currentVerse] = (verses[currentVerse] || '') + ' '
      }
      continue
    }

    const el = node.parentElement
    if (shouldSkip(el)) continue

    const verseId = findPrecedingVerseId(node, body)
    if (verseId !== null) currentVerse = verseId

    if (currentVerse === null) continue

    const text = node.textContent
    if (!text) continue
    verses[currentVerse] = (verses[currentVerse] || '') + text
  }

  const result = []
  Object.keys(verses).forEach((v) => {
    result[Number(v)] = verses[v].replace(/\s+/g, ' ').trim()
  })

  return { verses: result, footnotes }
}

const markerCache = new WeakMap()
function findPrecedingVerseId(textNode, body) {
  let markers = markerCache.get(body)
  if (!markers) {
    markers = []
    const all = body.querySelectorAll('[id^="chapter"]')
    all.forEach((elm) => {
      const m = elm.id.match(/^chapter(\d+)_verse(\d+)$/)
      if (m) markers.push({ el: elm, verse: Number(m[2]) })
    })
    markerCache.set(body, markers)
  }
  if (markers.length === 0) return null

  let result = null
  for (const m of markers) {
    const cmp = m.el.compareDocumentPosition(textNode)
    if (cmp & Node.DOCUMENT_POSITION_FOLLOWING) {
      result = m.verse
    } else {
      break
    }
  }
  return result
}
