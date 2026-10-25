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

/** Junta el texto de todos los nodos de la capa de texto, con su posición. */
function collectText(container) {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
  const parts = []
  let text = ''
  let node
  while ((node = walker.nextNode())) {
    const raw = node.textContent
    if (!raw) continue
    const { out, map } = cleanWithMap(raw)
    if (!out) continue
    // Los trozos de texto del PDF vienen separados; entre dos trozos sin
    // espacio se pone uno, para que "Mateo" + "24:15" no queden pegados.
    if (text && !/\s$/.test(text) && !/^\s/.test(out)) text += ' '
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

/**
 * Busca citas bíblicas en la capa de texto de UNA página y devuelve, para
 * cada una, la cita (con la forma que espera la tarjeta de versículo) y los
 * rectángulos donde se dibuja, en px relativos a la esquina de la página.
 */
export function findPdfReferences(container, holder, pageNumber) {
  const { text, parts } = collectText(container)
  if (!text) return []

  const refs = detectReferences(text)
  if (refs.length === 0) return []

  const box = holder.getBoundingClientRect()
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
