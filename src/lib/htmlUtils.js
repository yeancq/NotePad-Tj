/** Extrae el texto visible de un fragmento HTML (sin etiquetas). */
export function stripHtml(html) {
  if (!html) return ''
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent || ''
}

/**
 * Las notas antiguas guardaban texto plano con saltos de línea reales.
 * Si el contenido no parece HTML (no tiene ninguna etiqueta), lo convierte
 * a párrafos con <br> para que se vea igual dentro del editor enriquecido.
 */
export function ensureHtml(content) {
  if (!content) return ''
  if (/<[a-z][\s\S]*>/i.test(content)) return content
  return content
    .split('\n')
    .map((line) => (line ? escapeHtml(line) : '<br>'))
    .join('<br>')
}

export function escapeHtml(str) {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

// ══════════════════════════════════════════════════════════════════════════
// Sanitización de HTML pegado (Word, WhatsApp, páginas web, etc.)
// ══════════════════════════════════════════════════════════════════════════
//
// Al pegar contenido copiado de otra app, el navegador entrega el HTML tal
// cual venía en el portapapeles: estilos en línea de Word (mso-*), spans
// con fuentes y colores, tablas, enlaces, e incluso <script>/<style> en
// contenido copiado de páginas web. Además, ese HTML suele traer espacios
// "raros" (NBSP, caracteres de ancho cero) — el mismo tipo de carácter que
// causó el bug del detector de referencias bíblicas.
//
// sanitizePastedHtml() reconstruye el HTML desde cero usando solo una lista
// blanca de etiquetas (negrita, cursiva, subrayado, párrafos, encabezados,
// listas, imágenes), descartando cualquier atributo (style, class, onclick,
// etc.). La única excepción es el resaltado de color: si un <span> trae uno
// de los 3 colores que la propia app usa para resaltar texto, se conserva —
// así copiar/pegar texto resaltado entre notas de NotePad TJ sigue
// funcionando.

// Caracteres invisibles y NBSP que verseDetector.js ya identificó como
// problemáticos en texto pegado desde jw.org / Meeting Workbook.
const PASTE_INVISIBLE_CHARS = /[\u200B\u200C\u200D\u2060\uFEFF\u00AD]/g
const PASTE_NBSP = /\u00A0/g

function cleanPastedText(text) {
  return text.replace(PASTE_INVISIBLE_CHARS, '').replace(PASTE_NBSP, ' ')
}

// Etiquetas de formato en línea que sí queremos conservar.
const INLINE_TAG_MAP = { B: 'strong', STRONG: 'strong', I: 'em', EM: 'em', U: 'u' }

// Etiquetas de bloque que sí queremos conservar. DIV se trata como P: la
// mayoría de apps (Gmail, WhatsApp Web, Google Docs) usan <div> por línea
// en vez de <p>.
const BLOCK_TAG_MAP = { P: 'p', DIV: 'p', H1: 'h1', H2: 'h2', H3: 'h3', UL: 'ul', OL: 'ol', LI: 'li' }

// Colores de resaltado propios de RichEditor.jsx (ver HIGHLIGHTS). Se
// comparan en dos formatos porque, al leer child.style.backgroundColor de
// un elemento ya parseado, el navegador normaliza el valor a rgb(...).
const HIGHLIGHT_HEXES = ['#fde68a', '#bbf7d0', '#bfdbfe']
function hexToRgbNoSpaces(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgb(${r},${g},${b})`
}
const ALLOWED_HIGHLIGHT_VALUES = new Set([
  ...HIGHLIGHT_HEXES.map((h) => h.toLowerCase()),
  ...HIGHLIGHT_HEXES.map(hexToRgbNoSpaces),
])
function normalizeColorValue(v) {
  return (v || '').trim().toLowerCase().replace(/\s+/g, '')
}

// Esquemas de src permitidos para <img>: "data:image/..." (el caso normal
// al pegar una imagen copiada, ej. de una captura de pantalla o desde otra
// app) y http/https (una imagen enlazada desde la web). Cualquier otro
// esquema (javascript:, data:text/html, etc.) se descarta por seguridad —
// sin esto, un <img src="javascript:..."> pegado desde una página
// maliciosa podría ejecutar código dentro del editor.
function isSafeImageSrc(src) {
  if (!src) return false
  const trimmed = src.trim()
  return (
    /^data:image\//i.test(trimmed) ||
    /^https?:\/\//i.test(trimmed)
  )
}

/**
 * Copia recursivamente los hijos de sourceNode dentro de targetNode,
 * reconstruyendo solo las etiquetas permitidas y descartando todo lo demás
 * (atributos, spans de formato ajenos, tablas, enlaces, etc. — de esos
 * últimos se conserva únicamente su texto interno).
 */
function sanitizeChildren(sourceNode, targetNode) {
  Array.from(sourceNode.childNodes).forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = cleanPastedText(child.textContent)
      if (text) targetNode.appendChild(document.createTextNode(text))
      return
    }

    // Los comentarios HTML (nodeType 8) y cualquier otro tipo de nodo que
    // no sea texto ni elemento se ignoran automáticamente aquí.
    if (child.nodeType !== Node.ELEMENT_NODE) return

    const tag = child.tagName

    // <script> y <style> se descartan por completo (sin recursión), para
    // no filtrar su contenido como si fuera texto normal.
    if (tag === 'SCRIPT' || tag === 'STYLE') return

    if (tag === 'BR') {
      targetNode.appendChild(document.createElement('br'))
      return
    }

    // <img> es una etiqueta "vacía" (no tiene texto ni hijos que rescatar
    // si se descarta), así que antes de este cambio caía en la rama
    // genérica de "descartar etiqueta mas conservar contenido" y
    // desaparecía sin dejar rastro. Aquí se reconstruye conservando
    // ÚNICAMENTE src (validado) y alt — nunca width/height/style pegados,
    // para que el tamaño en pantalla lo controle siempre el CSS del editor
    // (ver .rich-editor img en index.css) y no una imagen con un ancho fijo
    // heredado de Word/WhatsApp que se vea desproporcionada o desborde la
    // pantalla en móvil.
    if (tag === 'IMG') {
      const src = child.getAttribute('src')
      if (isSafeImageSrc(src)) {
        const img = document.createElement('img')
        img.setAttribute('src', src.trim())
        const alt = child.getAttribute('alt')
        if (alt) img.setAttribute('alt', alt)
        targetNode.appendChild(img)
      }
      return
    }

    if (INLINE_TAG_MAP[tag]) {
      const el = document.createElement(INLINE_TAG_MAP[tag])
      sanitizeChildren(child, el)
      if (el.childNodes.length) targetNode.appendChild(el)
      return
    }

    if (BLOCK_TAG_MAP[tag]) {
      const el = document.createElement(BLOCK_TAG_MAP[tag])
      sanitizeChildren(child, el)
      if (el.childNodes.length) targetNode.appendChild(el)
      return
    }

    if (tag === 'SPAN' || tag === 'FONT') {
      const bg = normalizeColorValue(child.style && child.style.backgroundColor)
      if (bg && ALLOWED_HIGHLIGHT_VALUES.has(bg)) {
        const el = document.createElement('span')
        el.style.backgroundColor = child.style.backgroundColor
        sanitizeChildren(child, el)
        if (el.childNodes.length) targetNode.appendChild(el)
        return
      }
      // span/font sin resaltado reconocido: se descarta la etiqueta pero
      // se conserva su contenido (texto y formato interno, si lo tiene).
      sanitizeChildren(child, targetNode)
      return
    }

    // Cualquier otra etiqueta (a, table, tr, td, div raro, etc.): se
    // descarta la etiqueta pero se conserva su contenido de texto/formato.
    sanitizeChildren(child, targetNode)
  })
}

/**
 * Limpia HTML pegado desde otra app (Word, WhatsApp, una página web, u
 * otra nota de NotePad TJ) dejando solo negrita, cursiva, subrayado,
 * párrafos, encabezados, listas, imágenes y resaltados propios de la app —
 * sin estilos, clases, tablas, enlaces ni espacios/caracteres invisibles
 * ajenos.
 */
export function sanitizePastedHtml(html) {
  const template = document.createElement('template')
  template.innerHTML = html
  const out = document.createElement('div')
  sanitizeChildren(template.content, out)
  return out.innerHTML
}
