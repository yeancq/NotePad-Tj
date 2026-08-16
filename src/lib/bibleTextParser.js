/**
 * Extrae el texto de cada versículo de un archivo de capítulo XHTML del EPUB.
 * Usa DOMParser + TreeWalker para caminar los nodos de texto en orden.
 * CONSERVA TODOS LOS TEXTOS, incluyendo números de versículo y notas al pie.
 * Devuelve un array donde el índice = número de versículo (índice 0 sin usar).
 */
export function parseChapterXhtml(xhtmlText) {
  const doc = new DOMParser().parseFromString(xhtmlText, 'text/html')
  const body = doc.body
  if (!body) return []

  const walker = doc.createTreeWalker(body, NodeFilter.SHOW_TEXT)
  const verses = {}
  let currentVerse = null
  let node

  const shouldSkip = (el) => {
    while (el) {
      // Solo omitir elementos de navegación y notas al pie COMPLETAS
      // (pero conservamos el texto de los números de versículo y las notas)
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
    verses[currentVerse] = (verses[currentVerse] || '') + text
  }

  const result = []
  Object.keys(verses).forEach((v) => {
    result[Number(v)] = verses[v].replace(/\s+/g, ' ').trim()
  })
  return result
}

// Cachea, por nodo raíz recorrido, la lista de marcadores de versículo en orden documental,
// y para un nodo de texto dado encuentra el último marcador que lo precede.
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
