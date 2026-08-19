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
  // Ordenar por longitud descendente para que coincida primero la más larga
  entries.sort((a, b) => b[0].length - a[0].length)
  return entries
})()

const bookPattern = bookLookup.map(([n]) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')

// Un "segmento" es "capítulo:versículo(s)", ej. "24:15" o "4:6, 7" o "13:4-8"
// Soporta guion largo (–) y guion normal (-), además de comas con/sin espacios
const SEGMENT = `\\d{1,3}\\s*:\\s*\\d{1,3}(?:\\s*[-,–]\\s*\\d{1,3})*(?:\\s*,\\s*\\d{1,3}(?:\\s*[-,–]\\s*\\d{1,3})*)*`

// Una referencia completa: Libro + segmento (";" segmento)*
// Ej: "Mateo 24:15; 8:6" (mismo libro, dos capítulos distintos)
// 🔧 Ahora soporta mejor los límites de palabra y puntuación
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
 * 🔧 Ahora soporta guiones largos (–) y normaliza espacios.
 */
function expandVerses(str) {
  const verses = []
  // Normalizar: reemplazar guiones largos por normales, limpiar espacios extra
  const cleaned = str.replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim()
  
  cleaned.split(',').forEach((part) => {
    const trimmed = part.trim()
    // Soporta rangos con guion
    const range = trimmed.split('-').map((n) => parseInt(n.trim(), 10))
    if (range.length === 2 && !Number.isNaN(range[0]) && !Number.isNaN(range[1])) {
      for (let v = range[0]; v <= range[1] && v - range[0] < 30; v++) verses.push(v)
    } else if (!Number.isNaN(range[0])) {
      verses.push(range[0])
    }
  })
  return verses
}

/**
 * Detecta referencias bíblicas en un texto, agrupando segmentos del mismo
 * libro escritos juntos y separados por ";" (ej. "Mateo 24:15; 8:6").
 * Devuelve un array de:
 * {
 *   book, bookName, raw, label, start, end,
 *   segments: [{ chapter, verses, verseLabel }]
 * }
 * 
 * 🔧 Mejorado: ahora limpia el texto antes de detectar para evitar
 * que caracteres como puntos o paréntesis interfieran.
 */
export function detectReferences(text) {
  if (!text) return []
  const results = []
  let match

  // 🔧 Limpiar el texto para la detección: reemplazar guiones largos
  // y caracteres problemáticos que puedan interferir.
  // Pero debemos mantener el offset original para devolver posiciones correctas.
  // Para eso, procesamos el texto original pero normalizamos solo para la coincidencia.
  const cleanText = text.replace(/[–—]/g, '-')

  REFERENCE_REGEX.lastIndex = 0
  
  // Buscar en el texto limpio pero con la misma estructura del original
  let matchClean
  const tempRegex = new RegExp(REFERENCE_REGEX.source, 'gi')
  
  while ((matchClean = tempRegex.exec(cleanText)) !== null) {
    // Ahora encontrar la misma coincidencia en el texto original
    // para obtener las posiciones correctas
    const originalMatch = findMatchInOriginal(text, matchClean[0])
    if (!originalMatch) continue
    
    const [raw, bookRaw, segmentsRaw] = originalMatch
    const book = normalizeMatchToBook(bookRaw)
    if (!book) continue

    const segments = []
    // 🔧 Soporte para separadores ; o , entre segmentos
    segmentsRaw.split(/[;,]/).forEach((segStr) => {
      const trimmed = segStr.trim()
      if (!trimmed) return
      const [chapterRaw, versesRaw] = trimmed.split(':')
      if (!versesRaw) return
      const chapter = parseInt(chapterRaw.trim(), 10)
      if (Number.isNaN(chapter) || chapter < 1 || chapter > book.chapters) return
      const verses = expandVerses(versesRaw)
      if (verses.length === 0) return
      segments.push({
        chapter,
        verses,
        verseLabel: `${chapter}:${versesRaw.replace(/\s+/g, '')}`,
      })
    })
    if (segments.length === 0) continue

    const label = `${book.name} ${segments.map((s) => s.verseLabel).join('; ')}`

    results.push({
      book: book.id,
      bookName: book.name,
      raw: raw.trim(),
      label,
      start: originalMatch.index,
      end: originalMatch.index + raw.length,
      segments,
    })
  }

  return results
}

/**
 * 🔧 Función auxiliar: encuentra una coincidencia en el texto original
 * basada en el texto normalizado de la coincidencia.
 */
function findMatchInOriginal(originalText, normalizedMatch) {
  // Intentar encontrar la coincidencia normalizada en el original
  // con una búsqueda flexible que ignore guiones largos
  const normalizedOriginal = originalText.replace(/[–—]/g, '-')
  const index = normalizedOriginal.indexOf(normalizedMatch)
  
  if (index === -1) {
    // Si no se encuentra, buscar con más flexibilidad (ignorando espacios extra)
    const cleanMatch = normalizedMatch.replace(/\s+/g, '\\s+')
    const regex = new RegExp(cleanMatch, 'i')
    const match = regex.exec(originalText)
    if (match) {
      return {
        raw: match[0],
        bookRaw: match[1] || '',
        segmentsRaw: match[2] || '',
        index: match.index
      }
    }
    return null
  }
  
  // Extraer el texto original de la posición encontrada
  const raw = originalText.slice(index, index + normalizedMatch.length)
  const matchParts = normalizedMatch.match(new RegExp(`^(${bookLookup.map(([n]) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\.?\\s+(${SEGMENT}(?:\\s*[;,]\\s*${SEGMENT})*)`, 'i'))
  
  if (!matchParts) return null
  
  return {
    raw,
    bookRaw: matchParts[1],
    segmentsRaw: matchParts[2],
    index
  }
}
