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
//
// v2: la comparación ignora TODOS los espacios (algunos PDF parten el texto
// en trozos, sobre todo en mayúsculas con letra espaciada) y acepta más
// variantes de guion.
export const TOC_VERSION = 2

/**
 * Limpia un artefacto típico de la extracción de texto de algunos PDF: la
 * tilde (´) o la virgulilla (˜) sueltas, separadas de su letra por un
 * espacio ("Jehov ´á", "ense ˜ña"). Quitarlas deja la palabra legible.
 */
export function cleanPdfText(str) {
  return (str || '').replace(/\s?[´˜]/g, '')
}

// Para comparar: sin tildes, en mayúsculas y SIN ningún espacio ni carácter
// invisible. Así da igual cómo haya troceado el PDF el texto.
function normCompact(str) {
  return cleanPdfText(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s\u200B\u200C\u200D\u2060\uFEFF\u00AD]+/g, '')
    .toUpperCase()
}

const MONTHS =
  'ENERO|FEBRERO|MARZO|ABRIL|MAYO|JUNIO|JULIO|AGOSTO|SEPTIEMBRE|SETIEMBRE|OCTUBRE|NOVIEMBRE|DICIEMBRE'

// Guion normal, guion largo, raya, guion tipográfico, de no separación,
// figura y signo menos.
const DASH = '[-\\u2010\\u2011\\u2012\\u2013\\u2014\\u2212]'

// "26DEOCTUBRE-1DENOVIEMBRE" (la semana cruza de mes)
const RANGE_CROSS = new RegExp(`(\\d{1,2})DE(${MONTHS})${DASH}(\\d{1,2})DE(${MONTHS})`)
// "5-11DEOCTUBRE"
const RANGE_SAME = new RegExp(`(\\d{1,2})${DASH}(\\d{1,2})DE(${MONTHS})`)

const lower = (s) => s.toLowerCase()

/**
 * El título del artículo es el texto de mayor tamaño de su primera página.
 * Es una aproximación: si no sale algo razonable, se deja vacío.
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

    const text = normCompact(items.map((i) => i.str).join(''))
    let entry = null
    let m

    if ((m = text.match(RANGE_CROSS))) {
      entry = {
        kind: 'study',
        label: `${m[1]} de ${lower(m[2])} – ${m[3]} de ${lower(m[4])}`,
      }
    } else if ((m = text.match(RANGE_SAME))) {
      entry = { kind: 'study', label: `${m[1]}–${m[2]} de ${lower(m[3])}` }
    } else if (text.includes('RELATADAPOR')) {
      entry = { kind: 'bio', label: 'Biografía' }
    } else if (text.includes('LOSABIAS?') && !text.includes('ENESTENUMERO')) {
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

/**
 * Diagnóstico: devuelve el texto "crudo" que pdf.js lee de una página
 * (cada trozo con su tamaño de letra), para poder ver por qué no se
 * reconoce algo. Se copia al portapapeles desde el visor.
 */
export async function dumpPageText(pdf, pageNumber) {
  const page = await pdf.getPage(pageNumber)
  const content = await page.getTextContent()
  const items = content.items.filter((i) => typeof i.str === 'string' && i.str !== '')
  const lines = items
    .slice(0, 90)
    .map((i) => `${JSON.stringify(i.str)} h=${Math.round(i.height * 10) / 10}`)
  return `Página ${pageNumber} — ${items.length} trozos de texto\n${lines.join('\n')}`
}
