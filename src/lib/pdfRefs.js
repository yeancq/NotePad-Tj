import { detectReferences } from './verseDetector'
import { refKey } from './verseCardHelpers'

/**
 * Quita las tildes/virgulillas sueltas que algunos PDF dejan separadas de
 * su letra ("Jehov ´á"), pero recordando para cada letra que se conserva
 * en qué posición estaba en el texto original. Así se puede convertir una
 * posición del texto "limpio" de vuelta a una posición real dentro del nodo.
 */
function cleanWithMap(str) {
  let out = ''
  const map = []
  for (let i = 0; i < str.length; i++) {
    const ch = str[i]
    if (ch === '´' || ch === '˜') continue
    if (/\s/.test(ch) && (str[i + 1] === '´' || str[i + 1] === '˜')) continue
    out += ch
    map.push(i)
  }
  return { out, map }
}

/**
 * Junta el texto de todos los nodos de la capa de texto, con su posición.
 *
 * Este PDF trocea el texto en fragmentos muy pequeños ("Filem" "." " 4" ","
 * " 5"...), y los espacios reales ya vienen DENTRO de esos fragmentos. Por
 * eso, en modo normal (spaced = false) los fragmentos se unen tal cual y solo
 * se añade un espacio en los saltos de línea (los <br> de la capa de texto).
 * En modo spaced = true se añade además un espacio entre fragmentos que no
 * traen ninguno, por si en alguna página hiciera falta.
 */
function collectText(container, spaced) {
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT
  )
  const parts = []
  let text = ''
  let node

  const addSpace = () => {
    if (text && !/\s$/.test(text)) text += ' '
  }

  while ((node = walker.nextNode())) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.tagName === 'BR') addSpace()
      continue
    }
    const raw = node.textContent
    if (!raw) continue
    const { out, map } = cleanWithMap(raw)
    if (!out) continue
    if (spaced && text && !/\s$/.test(text) && !/^\s/.test(out)) text += ' '
    parts.push({ node, start: text.length, end: text.length + out.length, map })
    text += out
  }
  return { text, parts }
}

function rangeForRef(parts, ref) {
  const first = parts.find((p) => ref.start >= p.start && ref.start < p.end)
  const last = parts.find((p) => ref.end - 1 >= p.start && ref.end - 1 < p.end)
  if (!first || !last) return null
  try {
    const range = document.createRange()
    range.setStart(first.node, first.map[ref.start - first.start])
    range.setEnd(last.node, last.map[ref.end - 1 - last.start] + 1)
    return range
  } catch {
    return null
  }
}

function refsFromPass(container, box, pageNumber, spaced) {
  const { text, parts } = collectText(container, spaced)
  if (!text) return []

  const refs = detectReferences(text)
  const result = []

  for (const ref of refs) {
    const range = rangeForRef(parts, ref)
    if (!range) continue
    const rects = Array.from(range.getClientRects())
      .filter((r) => r.width > 1 && r.height > 1)
      .map((r) => ({
        x: r.left - box.left,
        y: r.top - box.top,
        w: r.width,
        h: r.height,
      }))
    if (rects.length === 0) continue
    result.push({
      // _key distingue la misma cita en páginas distintas.
      ref: { ...ref, _page: pageNumber, _key: `${pageNumber}:${refKey(ref)}` },
      rects,
    })
  }
  return result
}

function overlaps(a, b) {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
}

/**
 * Busca citas bíblicas en la capa de texto de UNA página y devuelve, para
 * cada una, la cita (con la forma que espera la tarjeta de versículo) y los
 * rectángulos donde se dibuja, en px relativos a la esquina de la página.
 */
export function findPdfReferences(container, holder, pageNumber) {
  const box = holder.getBoundingClientRect()

  // Pasada 1: fragmentos unidos tal cual. Pasada 2: con espacios añadidos
  // entre fragmentos. Lo que encuentre la segunda y se superponga con algo
  // ya encontrado se descarta.
  const result = refsFromPass(container, box, pageNumber, false)
  for (const item of refsFromPass(container, box, pageNumber, true)) {
    const first = item.rects[0]
    const duplicated = result.some((o) => o.rects.some((r) => overlaps(r, first)))
    if (!duplicated) result.push(item)
  }

  return result
}

/** ¿Hay alguna cita bajo el punto (x, y)? (con un margen para el dedo) */
export function hitTestRef(refRects, x, y, pad = 6) {
  for (const item of refRects) {
    for (const r of item.rects) {
      if (x >= r.x - pad && x <= r.x + r.w + pad && y >= r.y - pad && y <= r.y + r.h + pad) {
        return item.ref
      }
    }
  }
  return null
}

/**
 * Diagnóstico: resume qué texto lee la capa de una página y qué citas
 * encuentra con cada método. Se copia al portapapeles desde el visor.
 */
export function debugPdfReferences(container, pageNumber) {
  const lines = [`Página ${pageNumber}`]
  for (const spaced of [false, true]) {
    const { text, parts } = collectText(container, spaced)
    const refs = detectReferences(text)
    lines.push(
      `--- ${spaced ? 'CON' : 'SIN'} espacios añadidos: ${parts.length} trozos, ${text.length} letras, ${refs.length} citas`
    )
    lines.push(refs.length ? `Citas: ${refs.map((r) => r.label).join(' | ')}` : 'Citas: ninguna')
    lines.push(`Texto (primeras 500 letras): ${JSON.stringify(text.slice(0, 500))}`)
  }
  return lines.join('\n')
}
