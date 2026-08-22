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
  // IMPORTANTE: en poesía (Isaías, Salmos, etc.) cada línea del verso viene
  // en su PROPIA etiqueta <p> separada, ej:
  //   <p class="p1471 sz">"Yo, Jehová, soy tu Dios,</p>
  //   <p class="p1471 sz">el que te enseña por tu propio bien,...</p>
  // Sin ningún <br> entre ellas. Si solo concatenamos el texto de cada nodo
  // sin más, el final de un <p> queda pegado directo al inicio del
  // siguiente ("Dios,el que enseña"). Por eso hay que detectar cuándo el
  // texto pertenece a un bloque (<p>/<li>/etc.) distinto al anterior y
  // forzar un espacio ahí — pase o no pase también el número de verso.
  const BLOCK_TAGS = new Set(['P', 'DIV', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'])

  function closestBlock(el) {
    while (el && !BLOCK_TAGS.has(el.tagName)) el = el.parentElement
    return el
  }

  const walker = doc.createTreeWalker(body, NodeFilter.SHOW_TEXT)
  const verses = {}
  let currentVerse = null
  let lastBlock = null
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
    const el = node.parentElement
    if (shouldSkip(el)) continue

    const verseId = findPrecedingVerseId(node, body)
    if (verseId !== null) currentVerse = verseId

    if (currentVerse === null) continue

    const text = node.textContent
    if (!text) continue

    const block = closestBlock(el)
    // Si este texto viene de un bloque distinto al del texto anterior
    // (y ya había algo escrito para este verso), insertamos un espacio
    // antes de pegar el nuevo texto, para separar líneas de poesía que
    // vienen en <p> separados sin <br> entre ellos.
    if (block !== lastBlock && verses[currentVerse]) {
      verses[currentVerse] += ' '
    }
    lastBlock = block

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
