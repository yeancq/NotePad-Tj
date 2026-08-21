import { bibleBooks } from '../data/bibleBooks'

// Caracteres invisibles que a veces vienen en texto copiado de jw.org o de
// Meeting Workbook (p. ej. un espacio de ancho cero después de "48:" para
// controlar el salto de línea al justificar el texto). Se sustituyen por un
// espacio normal — nunca se eliminan — para que \s en las expresiones
// regulares los reconozca sin desalinear los índices start/end respecto al
// texto original.
const INVISIBLE_CHARS = /[\u200B\u200C\u200D\u2060\uFEFF\u00AD]/g

function normalize(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar acentos
    .replace(INVISIBLE_CHARS, ' ') // caracteres invisibles → espacio normal
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
const SEGMENT = `\\d{1,3}\\s*:\\s*\\d{1,3}(?:\\s*[-,]\\s*\\d{1,3})*`

// Una referencia completa: Libro + segmento (";" segmento)*
// Ej: "Mateo 24:15; 8:6" (mismo libro, dos capítulos distintos)
const REFERENCE_REGEX = new RegExp(
  `\\b(${bookPattern})\\.?\\s+(${SEGMENT}(?:\\s*;\\s*${SEGMENT})*)`,
  'gi'
)

function normalizeMatchToBook(matchedText) {
  const norm = normalize(matchedText.trim())
  const found = bookLookup.find(([n]) => n === norm)
  return found ? found[1] : null
}

/**
 * Expande "6, 7" o "4-8" en una lista de números de versículo.
 */
function expandVerses(str) {
  const verses = []
  str.split(',').forEach((part) => {
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
 * Detecta referencias bíblicas en un texto, agrupando segmentos del mismo
 * libro escritos juntos y separados por ";" (ej. "Mateo 24:15; 8:6").
 *
 * Normaliza el texto de entrada antes de aplicar el regex para soportar
 * abreviaturas con tilde (Gál → gal, Éx → ex, Nú → nu, 1Pe → 1pe...) y para
 * tolerar caracteres invisibles (espacios de ancho cero, etc.) que a veces
 * vienen en texto copiado de otras apps.
 * Los índices start/end se conservan porque tanto quitar diacríticos NFD
 * como sustituir caracteres invisibles por un espacio no cambian la
 * longitud del string en strings NFC de español estándar.
 */
export function detectReferences(text) {
  if (!text) return []

  // Normalizar el texto de entrada: quita tildes, caracteres invisibles y
  // convierte a minúsculas, así "Gál 5:22" coincide con el patrón "gal" ya
  // registrado en bookLookup, y "48:​17" (con espacio de ancho cero) coincide
  // igual que "48:17".
  const normalizedText = normalize(text)

  const results = []
  let match

  REFERENCE_REGEX.lastIndex = 0
  while ((match = REFERENCE_REGEX.exec(normalizedText)) !== null) {
    const [rawNorm, bookRaw, segmentsRaw] = match
    const book = normalizeMatchToBook(bookRaw)
    if (!book) continue

    const segments = []
    segmentsRaw.split(';').forEach((segStr) => {
      const [chapterRaw, versesRaw] = segStr.split(':')
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

    // Extraer el raw del texto ORIGINAL para conservar tildes, mayúsculas y
    // los caracteres invisibles tal como el usuario los escribió/pegó (ej.
    // "Gál 5:22" en vez de "gal 5:22").
    const rawOriginal = text.slice(match.index, match.index + rawNorm.length).trim()

    results.push({
      book: book.id,
      bookName: book.name,
      raw: rawOriginal,
      label,
      start: match.index,
      end: match.index + rawNorm.length,
      segments,
    })
  }

  return results
}
