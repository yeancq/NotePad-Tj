import { bibleBooks } from '../data/bibleBooks'

function normalize(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar acentos
}

// Construye, una sola vez, la lista de (abreviatura normalizada -> libro),
// ordenada por longitud descendente para que "1 corintios" gane sobre "1 co".
const bookLookup = (() => {
  const entries = []
  bibleBooks.forEach((book) => {
    const names = [book.name, ...book.abbrevs]
    names.forEach((n) => entries.push([normalize(n), book]))
  })
  entries.sort((a, b) => b[0].length - a[0].length)
  return entries
})()

const bookPattern = bookLookup.map(([n]) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')

// Un "segmento" es "capítulo:versículo(s)", ej. "24:15" o "4:6, 7" o "13:4-8"
// 🔧 Soporte para guion largo (–) y guion normal (-)
const SEGMENT = `\\d{1,3}\\s*:\\s*\\d{1,3}(?:\\s*[-,–]\\s*\\d{1,3})*(?:\\s*,\\s*\\d{1,3}(?:\\s*[-,–]\\s*\\d{1,3})*)*`

// Una referencia completa: Libro + segmento (";" segmento)*
const REFERENCE_REGEX = new RegExp(
  `\\b(${bookPattern})\\.?\\s+(${SEGMENT}(?:\\s*[;,]\\s*${SEGMENT})*)`,
  'gi'
)

function normalizeMatchToBook(matchedText) {
  const norm = normalize(matchedText.trim())
  const found = bookLookup.find(([n]) => n === norm)
  return found ? found[1] : null
}

/**
 * Expande "6, 7" o "4-8" en una lista de números de versículo.
 * 🔧 Soporte para guiones largos (– y —)
 */
function expandVerses(str) {
  const verses = []
  // Normalizar: reemplazar guiones largos por normales
  const cleaned = str.replace(/[–—]/g, '-').trim()
  
  cleaned.split(',').forEach((part) => {
    const range = part.trim().split('-').map((n) => parseInt(n.trim(), 10))
    if (range.length === 2 && !Number.isNaN(range[0]) && !Number.isNaN(range[1])) {
      for (let v = range[0]; v <= range[1] && v - range[0] < 30; v++) verses.push(v)
    } else if (!Number.isNaN(range[0])) {
      verses.push(range[0])
    }
  })
  return verses
}

/**
 * Detecta referencias bíblicas en un texto.
 */
export function detectReferences(text) {
  if (!text) return []
  const results = []
  let match

  // 🔧 Limpiar solo para la detección, pero devolver posiciones del original
  const cleanText = text.replace(/[–—]/g, '-')
  
  // Usar el regex directamente sobre el texto limpio
  const regex = new RegExp(REFERENCE_REGEX.source, 'gi')
  let cleanMatch
  
  while ((cleanMatch = regex.exec(cleanText)) !== null) {
    const [rawClean, bookRaw, segmentsRaw] = cleanMatch
    const book = normalizeMatchToBook(bookRaw)
    if (!book) continue

    // Encontrar la posición en el texto original
    // Buscamos el texto normalizado en el original
    const searchText = rawClean.replace(/[–—]/g, '-')
    let startIndex = text.indexOf(searchText)
    
    // Si no lo encuentra, probar con el texto original tal cual
    if (startIndex === -1) {
      startIndex = text.indexOf(rawClean)
    }
    
    // Si aún no lo encuentra, usar la posición del match limpio
    // (puede haber pequeñas diferencias, pero es mejor que nada)
    if (startIndex === -1) {
      startIndex = cleanMatch.index
    }

    const segments = []
    // Soporte para separadores ; o ,
    segmentsRaw.split(/[;,]/).forEach((segStr) => {
      const trimmed = segStr.trim()
      if (!trimmed) return
      const parts = trimmed.split(':')
      if (parts.length < 2) return
      const chapter = parseInt(parts[0].trim(), 10)
      if (Number.isNaN(chapter) || chapter < 1 || chapter > book.chapters) return
      const verses = expandVerses(parts.slice(1).join(':'))
      if (verses.length === 0) return
      segments.push({
        chapter,
        verses,
        verseLabel: `${chapter}:${parts.slice(1).join(':').replace(/\s+/g, '')}`,
      })
    })
    if (segments.length === 0) continue

    const label = `${book.name} ${segments.map((s) => s.verseLabel).join('; ')}`

    results.push({
      book: book.id,
      bookName: book.name,
      raw: rawClean.trim(),
      label,
      start: startIndex,
      end: startIndex + rawClean.length,
      segments,
    })
  }

  return results
}
