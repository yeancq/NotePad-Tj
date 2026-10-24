// Detecta, leyendo el texto del PDF, en qué página empieza cada artículo de
// La Atalaya. Los artículos de estudio se reconocen por la línea de fechas
// de la semana que traen en su primera página (ej. "19-25 DE OCTUBRE DE 2026"
// o "26 DE OCTUBRE-1 DE NOVIEMBRE DE 2026"). La portada y el índice del PDF
// usan otro formato de fechas ("5 DE OCTUBRE A 1 DE NOVIEMBRE", "del 5 al
// 11 de octubre"), así que no se confunden con un artículo.
//
// Se guarda en IndexedDB con un número de versión: si algún día se mejora
// esta detección, basta con subir TOC_VERSION para que los PDF ya
// importados se vuelvan a analizar.
export const TOC_VERSION = 1

/**
 * Limpia un artefacto típico de la extracción de texto de algunos PDF: la
 * tilde (´) o la virgulilla (˜) sueltas, separadas de su letra por un
 * espacio ("Jehov ´á", "ense ˜ña"). Quitarlas deja la palabra legible.
 */
export function cleanPdfText(str) {
  return (str || '').replace(/\s?[´˜]/g, '')
}

// Para comparar: sin tildes, en mayúsculas y con espacios simples.
function norm(str) {
  return cleanPdfText(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
}

const MONTHS =
  'ENERO|FEBRERO|MARZO|ABRIL|MAYO|JUNIO|JULIO|AGOSTO|SEPTIEMBRE|SETIEMBRE|OCTUBRE|NOVIEMBRE|DICIEMBRE'

// "26 DE OCTUBRE-1 DE NOVIEMBRE DE 2026" (la semana cruza de mes)
const RANGE_CROSS = new RegExp(
  `\\b(\\d{1,2}) DE (${MONTHS}) ?[-–—] ?(\\d{1,2}) DE (${MONTHS}) DE (\\d{4})`
)
// "5-11 DE OCTUBRE DE 2026"
const RANGE_SAME = new RegExp(`\\b(\\d{1,2}) ?[-–—] ?(\\d{1,2}) DE (${MONTHS}) DE (\\d{4})`)

const lower = (s) => s.toLowerCase()

/**
 * El título del artículo es el texto de mayor tamaño de su primera página.
 * Es una mejor aproximación: si no sale algo razonable, se deja vacío.
 */
function guessTitle(items) {
  const sized = items.filter((i) => i.str.trim() && i.height > 0)
  if (sized.length === 0) return ''
  const max = Math.max(...sized.map((i) => i.height))
  const big = sized.filter((i) => i.height >= max * 0.9)
  const title = cleanPdfText(big.map((i) => i.str).join(' '))
    .replace(/\s+/g, ' ')
    .trim()
  if (title.length < 8 || title.length > 140 || !title.includes(' ')) return ''
  return title
}

/**
 * Recorre todas las páginas del PDF (ya abierto con pdf.js) y devuelve una
 * lista [{ kind, label, title, page }] en el orden del documento.
 */
export async function extractToc(pdf) {
  const result = []
  const seen = new Set()

  for (let p = 1; p <= pdf.numPages; p++) {
    let items
    try {
      const page = await pdf.getPage(p)
      const content = await page.getTextContent()
      items = content.items.filter((it) => typeof it.str === 'string')
    } catch {
      continue
    }

    const text = norm(items.map((i) => i.str).join(' '))
    let entry = null
    let m

    if ((m = text.match(RANGE_CROSS))) {
      entry = {
        kind: 'study',
        label: `${m[1]} de ${lower(m[2])} – ${m[3]} de ${lower(m[4])}`,
      }
    } else if ((m = text.match(RANGE_SAME))) {
      entry = { kind: 'study', label: `${m[1]}–${m[2]} de ${lower(m[3])}` }
    } else if (/RELATADA POR/.test(text)) {
      entry = { kind: 'bio', label: 'Biografía' }
    } else if (/LO SABIAS\?/.test(text) && !/EN ESTE NUMERO/.test(text)) {
      // El índice impreso del PDF (última página) también nombra
      // "¿Lo sabías?", por eso se excluye la página que dice "EN ESTE NÚMERO".
      entry = { kind: 'extra', label: '¿Lo sabías?' }
    }

    if (!entry) continue
    const key = `${entry.kind}:${entry.label}`
    if (seen.has(key)) continue
    seen.add(key)

    result.push({ ...entry, title: guessTitle(items), page: p })
  }

  return result
}
