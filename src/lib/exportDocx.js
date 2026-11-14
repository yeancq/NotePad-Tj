import JSZip from 'jszip'
import { ensureHtml } from './htmlUtils'

// ══════════════════════════════════════════════════════════════════════════
// Exportar una nota a .docx
// ══════════════════════════════════════════════════════════════════════════
//
// Un .docx es un .zip con archivos XML. Como JSZip ya es dependencia del
// proyecto (la usan docxToHtml.js y epubBible.js), el documento se arma "a
// mano" con él — sin agregar librerías nuevas ni tocar package.json.
//
// El proceso va en 3 fases:
//   1. parseHtml():    recorre el HTML de la nota y lo convierte en una lista
//                      de párrafos (modelo intermedio, sin XML todavía).
//   2. loadImages():   descarga/decodifica las imágenes (asíncrono) y calcula
//                      su tamaño en el documento.
//   3. buildDocx():    serializa todo a XML de Word y lo empaqueta con JSZip.
//
// Qué se conserva: título, negrita, cursiva, subrayado, tachado, resaltados
// (el color exacto), encabezados 1-3, alineación (izquierda/centro/derecha/
// justificado), listas con viñetas y numeradas (también anidadas), sangrías
// (las de notas importadas desde .docx, `indent-1..3`) e imágenes.
//
// Qué NO se conserva a propósito: color del texto (en modo oscuro el texto
// claro quedaría invisible sobre la hoja blanca de Word), fuentes y tamaños
// propios, enlaces, y los versículos detectados (son botones que la app
// agrega al mostrar la nota, no forman parte del texto guardado).

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

const EMU_PER_PX = 9525 // 1 px CSS (96 dpi) = 9525 EMU
const MAX_IMG_W = 5700000 // ≈ 15.8 cm: ancho útil de una hoja A4 con márgenes de 2.5 cm
const MAX_IMG_H = 7800000 // ≈ 21.7 cm: que una imagen nunca ocupe más que una página
const MAX_CANVAS_SIDE = 4096 // límite al convertir formatos raros (webp, svg…) a PNG
const IMAGE_FETCH_TIMEOUT_MS = 10000

const INDENT_TWIPS = 283 // mismo valor por nivel que usa docxToHtml.js al importar
const LIST_STEP_TWIPS = 720 // sangría por nivel de lista
const BULLET_NUM_ID = 1 // todas las listas con viñetas comparten esta numeración

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'TEMPLATE', 'HEAD', 'TITLE', 'META', 'LINK'])

// Etiquetas que se tratan como bloque (cada una abre su propio párrafo).
// Las tablas se aplanan: cada celda queda como párrafo(s) normal(es).
const BLOCK_TAGS = new Set([
  'P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'PRE',
  'SECTION', 'ARTICLE', 'HEADER', 'FOOTER', 'MAIN', 'NAV', 'ASIDE', 'FIGURE',
  'FIGCAPTION', 'FORM', 'DL', 'DT', 'DD',
  'TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TR', 'TD', 'TH',
])

const HEADING_STYLE = {
  H1: 'Heading1',
  H2: 'Heading2',
  H3: 'Heading3',
  H4: 'Heading3',
  H5: 'Heading3',
  H6: 'Heading3',
}

// ── Utilidades de texto / XML ──────────────────────────────────────────────

/** Quita caracteres de control que no son válidos en XML 1.0. */
function cleanXmlText(s) {
  let out = ''
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i)
    if (c === 9 || c === 10 || c === 13 || c >= 32) out += s[i]
  }
  return out
}

function xmlEscape(s) {
  return cleanXmlText(String(s))
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Caracteres invisibles que verseDetector.js / htmlUtils.js ya identificaron
// como problemáticos: aquí solo ensuciarían el documento.
const INVISIBLE_CHARS = /​|‌|‍|⁠|﻿|­/g

// ── Colores CSS → hex de 6 dígitos (para el sombreado de los resaltados) ──

function toHex2(n) {
  return Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0').toUpperCase()
}

/** Devuelve 'RRGGBB' o null si es transparente / no reconocido. */
function parseCssColor(value) {
  const c = (value || '').trim().toLowerCase()
  if (!c || c === 'transparent' || c === 'initial' || c === 'inherit' || c === 'none') return null

  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/.exec(c)
  if (hex) {
    const h = hex[1]
    return (h.length === 3 ? h.replace(/./g, (ch) => ch + ch) : h).toUpperCase()
  }

  const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?\s*\)$/.exec(c)
  if (rgb) {
    if (rgb[4] !== undefined) {
      const a = rgb[4].endsWith('%') ? parseFloat(rgb[4]) / 100 : parseFloat(rgb[4])
      if (!(a > 0)) return null // alfa 0 = transparente
    }
    return toHex2(rgb[1]) + toHex2(rgb[2]) + toHex2(rgb[3])
  }
  return null
}

// ── Lectura de estilos del HTML ────────────────────────────────────────────

/** 'center' | 'right' | 'both' | 'left' | null (sin alineación propia). */
function getAlign(node) {
  const v = ((node.style && node.style.textAlign) || node.getAttribute('align') || '')
    .trim()
    .toLowerCase()
  if (v === 'center') return 'center'
  if (v === 'right' || v === 'end') return 'right'
  if (v === 'justify') return 'both'
  if (v === 'left' || v === 'start') return 'left'
  return null
}

function cssLengthToTwips(v) {
  const m = /^(-?[\d.]+)(px|pt|em|rem)?$/.exec((v || '').trim())
  if (!m) return 0
  const n = parseFloat(m[1])
  if (!(n > 0)) return 0
  if (m[2] === 'pt') return n * 20
  if (m[2] === 'em' || m[2] === 'rem') return n * 220 // 1em ≈ 11 pt
  return n * 15 // px (o sin unidad)
}

/** Sangría propia de un bloque: clase indent-N (notas importadas) o margen. */
function indentOf(node) {
  let t = 0
  const m = /(?:^|\s)indent-(\d)(?:\s|$)/.exec(node.getAttribute('class') || '')
  if (m) t += parseInt(m[1], 10) * INDENT_TWIPS
  if (node.style) {
    t += cssLengthToTwips(node.style.marginLeft)
    t += cssLengthToTwips(node.style.paddingLeft)
  }
  return Math.round(t)
}

/** Formato en línea heredado: aplica etiqueta + estilos inline del elemento. */
function applyInline(node, tag, fmt) {
  const f = { ...fmt }
  if (tag === 'B' || tag === 'STRONG') f.b = true
  else if (tag === 'I' || tag === 'EM' || tag === 'CITE' || tag === 'DFN') f.i = true
  else if (tag === 'U' || tag === 'INS') f.u = true
  else if (tag === 'S' || tag === 'STRIKE' || tag === 'DEL') f.s = true
  else if (tag === 'MARK') f.shade = 'FDE68A'

  const st = node.style
  if (st) {
    if (st.fontWeight) {
      const w = st.fontWeight.toLowerCase()
      f.b = w === 'bold' || w === 'bolder' || parseInt(w, 10) >= 600
    }
    if (st.fontStyle) {
      const s = st.fontStyle.toLowerCase()
      f.i = s === 'italic' || s === 'oblique'
    }
    // El subrayado/tachado CSS no se puede "cancelar" desde un hijo, así que
    // solo se enciende, nunca se apaga.
    const td = (st.textDecorationLine || st.textDecoration || '').toLowerCase()
    if (td.includes('underline')) f.u = true
    if (td.includes('line-through')) f.s = true
    // "transparent" (el botón "Quitar resaltado") apaga el resaltado heredado.
    if (st.backgroundColor) f.shade = parseCssColor(st.backgroundColor)
  }
  return f
}

function fmtKey(f) {
  return `${f.b ? 1 : 0}${f.i ? 1 : 0}${f.u ? 1 : 0}${f.s ? 1 : 0}${f.shade || ''}`
}

// ── Fase 1: HTML → párrafos ────────────────────────────────────────────────
//
// Modelo de párrafo:
//   { runs: [ {t:'text', text, fmt} | {t:'br'} | {t:'img', src, alt} ],
//     style, align, indent, li, listFirst }
//
// "Estado" de un contenedor (la raíz de la nota, o un bloque): guarda el
// párrafo implícito abierto (`cur`) al que se van agregando texto y formato
// en línea hasta que aparece un bloque o termina el contenedor.

function createState(isRoot) {
  return { cur: null, isRoot }
}

function ensureCur(st, ctx) {
  if (!st.cur) {
    st.cur = {
      runs: [],
      style: ctx.style || null,
      align: ctx.align || null,
      indent: ctx.indent || 0,
      li: ctx.li || null,
      listFirst: false,
    }
  }
  return st.cur
}

function trimParagraph(p) {
  const texts = p.runs.filter((r) => r.t === 'text')
  if (texts.length) {
    const first = texts[0]
    const last = texts[texts.length - 1]
    first.text = first.text.replace(/^ +/, '')
    last.text = last.text.replace(/ +$/, '')
  }
  p.runs = p.runs.filter((r) => r.t !== 'text' || r.text !== '')
}

/** Cierra el párrafo abierto y lo agrega al documento. */
function flushCur(st, doc) {
  const p = st.cur
  if (!p) return
  st.cur = null
  // Dentro de un bloque HTML, un <br> final es solo el marcador de la línea
  // vacía (<div><br></div>), no un salto extra.
  if (!st.isRoot && p.runs.length && p.runs[p.runs.length - 1].t === 'br') p.runs.pop()
  trimParagraph(p)
  pushParagraph(p, doc)
}

function pushParagraph(p, doc) {
  if (p.li) {
    // Solo el primer párrafo de cada <li> lleva la viñeta/número.
    p.listFirst = !p.li.used
    p.li.used = true
  }
  doc.paras.push(p)
}

function pushText(st, ctx, text, fmt) {
  const cur = ensureCur(st, ctx)
  const last = cur.runs[cur.runs.length - 1]
  if (last && last.t === 'text' && fmtKey(last.fmt) === fmtKey(fmt)) last.text += text
  else cur.runs.push({ t: 'text', text, fmt })
}

function blockContext(node, tag, ctx) {
  let ind = indentOf(node)
  if (tag === 'BLOCKQUOTE' && !ind) ind = 720
  return {
    ...ctx,
    align: getAlign(node) || ctx.align,
    indent: (ctx.indent || 0) + ind,
    style: HEADING_STYLE[tag] || ctx.style,
  }
}

function walkChildren(node, fmt, ctx, st, doc) {
  Array.from(node.childNodes).forEach((child) => walkNode(child, fmt, ctx, st, doc))
}

function walkNode(node, fmt, ctx, st, doc) {
  if (node.nodeType === 3) {
    // Texto: se colapsa el espacio en blanco como haría el navegador.
    const raw = node.nodeValue.replace(INVISIBLE_CHARS, '').replace(/[ \t\r\n\f]+/g, ' ')
    if (!raw) return
    if (!st.cur && raw === ' ') return // espacio suelto entre bloques
    pushText(st, ctx, raw, fmt)
    return
  }
  if (node.nodeType !== 1) return

  const tag = node.tagName.toUpperCase()
  if (SKIP_TAGS.has(tag)) return

  if (tag === 'BR') {
    if (st.isRoot) {
      // En la raíz (notas antiguas: línea<br>línea) cada <br> separa párrafos;
      // dos seguidos dejan una línea vacía.
      if (st.cur) flushCur(st, doc)
      else pushParagraph({ ...newEmptyParagraph(ctx) }, doc)
    } else {
      ensureCur(st, ctx).runs.push({ t: 'br' })
    }
    return
  }

  if (tag === 'IMG') {
    const src = (node.getAttribute('src') || '').trim()
    if (!src) return
    // En el editor las imágenes son display:block: ocupan su propia línea.
    flushCur(st, doc)
    doc.imageSrcs.add(src)
    const base = ctx.li ? (ctx.li.ilvl + 1) * LIST_STEP_TWIPS : 0
    pushParagraph(
      {
        runs: [{ t: 'img', src, alt: node.getAttribute('alt') || '' }],
        style: null,
        align: null,
        indent: base + (ctx.indent || 0),
        li: null,
        listFirst: false,
      },
      doc
    )
    return
  }

  if (tag === 'UL' || tag === 'OL') {
    flushCur(st, doc)
    walkList(node, tag, fmt, ctx, doc)
    return
  }

  if (BLOCK_TAGS.has(tag)) {
    flushCur(st, doc)
    const ctx2 = blockContext(node, tag, ctx)
    const inner = createState(false)
    walkChildren(node, applyInline(node, tag, fmt), ctx2, inner, doc)
    flushCur(inner, doc)
    return
  }

  // Cualquier otro elemento (b, i, u, span, font, a, mark…): formato en línea.
  walkChildren(node, applyInline(node, tag, fmt), ctx, st, doc)
}

function newEmptyParagraph(ctx) {
  return {
    runs: [],
    style: ctx.style || null,
    align: ctx.align || null,
    indent: ctx.indent || 0,
    li: ctx.li || null,
    listFirst: false,
  }
}

function walkList(node, tag, fmt, ctx, doc) {
  const depth = ctx.listDepth || 0
  const ilvl = Math.min(depth, 8)
  let numId = BULLET_NUM_ID
  if (tag === 'OL') {
    // Cada <ol> recibe su propia numeración, para que empiece en 1 (o en su
    // atributo start) en vez de continuar la cuenta de otra lista.
    const start = parseInt(node.getAttribute('start'), 10)
    numId = doc.orderedNums.length + 2
    doc.orderedNums.push({ numId, ilvl, start: Number.isFinite(start) ? start : 1 })
  }

  const listCtx = {
    ...ctx,
    listDepth: depth + 1,
    align: getAlign(node) || ctx.align,
    li: null,
  }
  const stray = createState(false)

  Array.from(node.childNodes).forEach((child) => {
    if (child.nodeType === 1 && child.tagName.toUpperCase() === 'LI') {
      flushCur(stray, doc)
      const li = { numId, ilvl, used: false }
      const liCtx = { ...listCtx, li, align: getAlign(child) || listCtx.align }
      const inner = createState(false)
      walkChildren(child, fmt, liCtx, inner, doc)
      flushCur(inner, doc)
      // <li> vacío: igual se muestra su viñeta.
      if (!li.used) pushParagraph(newEmptyParagraph(liCtx), doc)
    } else {
      walkNode(child, fmt, listCtx, stray, doc)
    }
  })
  flushCur(stray, doc)
}

function parseHtml(html) {
  const tpl = document.createElement('template') // contenido "inerte": no carga imágenes
  tpl.innerHTML = ensureHtml(html || '')
  const doc = { paras: [], orderedNums: [], imageSrcs: new Set() }
  const root = createState(true)
  const baseCtx = { style: null, align: null, indent: 0, li: null, listDepth: 0 }
  walkChildren(tpl.content, { b: false, i: false, u: false, s: false, shade: null }, baseCtx, root, doc)
  flushCur(root, doc)
  return doc
}

// ── Fase 2: imágenes ───────────────────────────────────────────────────────

function base64ToBytes(b64) {
  const bin = atob(b64) // atob ignora saltos de línea / espacios
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

/** Detecta el formato real por los primeros bytes (no confía en el "mime"). */
function sniffExt(b) {
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'png'
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpeg'
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) return 'gif'
  return null
}

/** Devuelve { bytes, mime } (mime puede venir vacío) o null si no se pudo leer. */
async function fetchImageBytes(src) {
  if (/^data:/i.test(src)) {
    const comma = src.indexOf(',')
    if (comma < 0) return null
    const meta = src.slice(5, comma)
    const data = src.slice(comma + 1)
    const mime = meta.split(';')[0].trim().toLowerCase()
    if (/;base64/i.test(meta)) return { bytes: base64ToBytes(data), mime }
    return { bytes: new TextEncoder().encode(decodeURIComponent(data)), mime }
  }
  // Imagen enlazada desde la web: puede fallar por CORS o por estar sin
  // conexión; en ese caso la imagen se omite (ver loadImages).
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), IMAGE_FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(src, { signal: ctrl.signal })
    if (!res.ok) return null
    const mime = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase()
    return { bytes: new Uint8Array(await res.arrayBuffer()), mime }
  } finally {
    clearTimeout(timer)
  }
}

/** Un SVG no tiene "firma" binaria: se reconoce por su texto inicial. */
function looksLikeSvg(bytes) {
  const head = new TextDecoder().decode(bytes.subarray(0, 512)).toLowerCase()
  return head.includes('<svg')
}

function loadImageElement(bytes, mime) {
  return new Promise((resolve, reject) => {
    // El navegador solo decodifica un SVG si el Blob declara su tipo MIME;
    // los formatos de mapa de bits (png, jpeg, webp…) los reconoce por contenido.
    const type = looksLikeSvg(bytes) ? 'image/svg+xml' : mime || ''
    const url = URL.createObjectURL(new Blob([bytes], { type }))
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('No se pudo decodificar la imagen'))
    }
    img.src = url
  })
}

async function toPngBytes(img, w, h) {
  const scale = Math.min(1, MAX_CANVAS_SIDE / Math.max(w, h))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(w * scale))
  canvas.height = Math.max(1, Math.round(h * scale))
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('No se pudo convertir la imagen a PNG')
  return new Uint8Array(await blob.arrayBuffer())
}

/**
 * Prepara cada imagen única de la nota. Devuelve un Map src → datos listos
 * para el documento. Una imagen que falla (sin conexión, CORS, formato raro)
 * simplemente no entra al Map: en su lugar se escribe un texto "[imagen]".
 */
async function loadImages(srcs) {
  const result = new Map()
  let n = 0
  for (const src of srcs) {
    try {
      const fetched = await fetchImageBytes(src)
      if (!fetched || !fetched.bytes.length) continue
      const { bytes, mime } = fetched
      const img = await loadImageElement(bytes, mime)
      const w = img.naturalWidth || 300
      const h = img.naturalHeight || 150

      let ext = sniffExt(bytes)
      let data = bytes
      if (!ext) {
        // webp, svg, bmp, avif…: Word no los lee de forma fiable → PNG.
        data = await toPngBytes(img, w, h)
        ext = 'png'
      }

      let cx = w * EMU_PER_PX
      let cy = h * EMU_PER_PX
      const k = Math.min(1, MAX_IMG_W / cx, MAX_IMG_H / cy)
      cx = Math.max(1, Math.round(cx * k))
      cy = Math.max(1, Math.round(cy * k))

      n += 1
      result.set(src, { n, rId: `rIdImg${n}`, ext, data, cx, cy, file: `image${n}.${ext}` })
    } catch (err) {
      console.warn('Exportar .docx: imagen omitida', err)
    }
  }
  return result
}

// ── Fase 3: XML de Word ────────────────────────────────────────────────────

function runPropsXml(fmt) {
  // Orden exigido por el esquema de Word: b, i, strike, u, shd.
  let x = ''
  if (fmt.b) x += '<w:b/><w:bCs/>'
  if (fmt.i) x += '<w:i/><w:iCs/>'
  if (fmt.s) x += '<w:strike/>'
  if (fmt.u) x += '<w:u w:val="single"/>'
  if (fmt.shade) x += `<w:shd w:val="clear" w:color="auto" w:fill="${fmt.shade}"/>`
  return x ? `<w:rPr>${x}</w:rPr>` : ''
}

function textRunXml(text, fmt) {
  return `<w:r>${runPropsXml(fmt)}<w:t xml:space="preserve">${xmlEscape(text)}</w:t></w:r>`
}

function imageRunXml(img, alt, drawingId) {
  const name = xmlEscape(img.file)
  return (
    '<w:r><w:drawing>' +
    `<wp:inline distT="0" distB="0" distL="0" distR="0">` +
    `<wp:extent cx="${img.cx}" cy="${img.cy}"/>` +
    `<wp:docPr id="${drawingId}" name="Imagen ${drawingId}" descr="${xmlEscape(alt)}"/>` +
    '<wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr>' +
    '<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
    '<pic:pic>' +
    `<pic:nvPicPr><pic:cNvPr id="${drawingId}" name="${name}"/><pic:cNvPicPr/></pic:nvPicPr>` +
    `<pic:blipFill><a:blip r:embed="${img.rId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
    `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${img.cx}" cy="${img.cy}"/></a:xfrm>` +
    '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>' +
    '</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>'
  )
}

function paragraphXml(p, images, counter) {
  // Orden de hijos de <w:pPr> exigido por el esquema: pStyle, numPr, spacing, ind, jc.
  let pPr = ''
  if (p.style) pPr += `<w:pStyle w:val="${p.style}"/>`

  const extra = Math.min(p.indent || 0, 7000)
  if (p.li) {
    const left = (p.li.ilvl + 1) * LIST_STEP_TWIPS + extra
    if (p.listFirst) {
      pPr += `<w:numPr><w:ilvl w:val="${p.li.ilvl}"/><w:numId w:val="${p.li.numId}"/></w:numPr>`
      pPr += '<w:spacing w:after="60"/>'
      if (extra) pPr += `<w:ind w:left="${left}" w:hanging="360"/>`
    } else {
      pPr += `<w:spacing w:after="60"/><w:ind w:left="${left}"/>`
    }
  } else if (extra) {
    pPr += `<w:ind w:left="${extra}"/>`
  }
  if (p.align) pPr += `<w:jc w:val="${p.align}"/>`

  const runs = p.runs
    .map((r) => {
      if (r.t === 'br') return '<w:r><w:br/></w:r>'
      if (r.t === 'text') return textRunXml(r.text, r.fmt)
      const img = images.get(r.src)
      if (!img) return textRunXml(r.alt ? `[${r.alt}]` : '[imagen no disponible]', {})
      counter.id += 1
      return imageRunXml(img, r.alt, counter.id)
    })
    .join('')

  return `<w:p>${pPr ? `<w:pPr>${pPr}</w:pPr>` : ''}${runs}</w:p>`
}

const XML_HEAD = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
const NS_W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'

function documentXml(title, doc, images) {
  const counter = { id: 0 }
  const titleP = `<w:p><w:pPr><w:pStyle w:val="Title"/></w:pPr>${textRunXml(title, {})}</w:p>`
  const body = doc.paras.map((p) => paragraphXml(p, images, counter)).join('')
  return (
    XML_HEAD +
    `<w:document xmlns:w="${NS_W}"` +
    ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"' +
    ' xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"' +
    ' xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"' +
    ' xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
    `<w:body>${titleP}${body}` +
    // Hoja A4 con márgenes de 2.5 cm.
    '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>' +
    '<w:pgMar w:top="1417" w:right="1417" w:bottom="1417" w:left="1417" w:header="708" w:footer="708" w:gutter="0"/>' +
    '</w:sectPr></w:body></w:document>'
  )
}

function stylesXml() {
  const heading = (id, name, size, before) =>
    `<w:style w:type="paragraph" w:styleId="${id}"><w:name w:val="${name}"/>` +
    '<w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:uiPriority w:val="9"/><w:qFormat/>' +
    `<w:pPr><w:keepNext/><w:keepLines/><w:spacing w:before="${before}" w:after="120"/>` +
    `<w:outlineLvl w:val="${id === 'Heading1' ? 0 : id === 'Heading2' ? 1 : 2}"/></w:pPr>` +
    `<w:rPr><w:b/><w:bCs/><w:sz w:val="${size}"/><w:szCs w:val="${size}"/></w:rPr></w:style>`

  return (
    XML_HEAD +
    `<w:styles xmlns:w="${NS_W}">` +
    '<w:docDefaults><w:rPrDefault><w:rPr>' +
    '<w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Calibri" w:cs="Calibri"/>' +
    '<w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="es-ES" w:eastAsia="es-ES" w:bidi="ar-SA"/>' +
    '</w:rPr></w:rPrDefault>' +
    '<w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="264" w:lineRule="auto"/></w:pPr></w:pPrDefault>' +
    '</w:docDefaults>' +
    '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>' +
    '<w:style w:type="character" w:default="1" w:styleId="DefaultParagraphFont">' +
    '<w:name w:val="Default Paragraph Font"/><w:uiPriority w:val="1"/><w:semiHidden/><w:unhideWhenUsed/></w:style>' +
    '<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/>' +
    '<w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:uiPriority w:val="10"/><w:qFormat/>' +
    '<w:pPr><w:spacing w:after="240" w:line="240" w:lineRule="auto"/></w:pPr>' +
    '<w:rPr><w:b/><w:bCs/><w:sz w:val="44"/><w:szCs w:val="44"/></w:rPr></w:style>' +
    heading('Heading1', 'heading 1', 36, 280) +
    heading('Heading2', 'heading 2', 30, 240) +
    heading('Heading3', 'heading 3', 26, 200) +
    '</w:styles>'
  )
}

function numberingXml(orderedNums) {
  const bullets = ['•', '◦', '▪']
  const decimals = ['decimal', 'lowerLetter', 'lowerRoman']

  const levels = (kind) =>
    Array.from({ length: 9 }, (_, i) => {
      const left = LIST_STEP_TWIPS * (i + 1)
      const numFmt = kind === 'bullet' ? 'bullet' : decimals[i % 3]
      const text = kind === 'bullet' ? bullets[i % 3] : `%${i + 1}.`
      const font =
        kind === 'bullet'
          ? '<w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial" w:hint="default"/></w:rPr>'
          : ''
      return (
        `<w:lvl w:ilvl="${i}"><w:start w:val="1"/><w:numFmt w:val="${numFmt}"/>` +
        `<w:lvlText w:val="${text}"/><w:lvlJc w:val="left"/>` +
        `<w:pPr><w:ind w:left="${left}" w:hanging="360"/></w:pPr>${font}</w:lvl>`
      )
    }).join('')

  // Primero TODAS las <w:abstractNum>, después TODAS las <w:num> (lo exige Word).
  const nums =
    `<w:num w:numId="${BULLET_NUM_ID}"><w:abstractNumId w:val="0"/></w:num>` +
    orderedNums
      .map(
        (n) =>
          `<w:num w:numId="${n.numId}"><w:abstractNumId w:val="1"/>` +
          `<w:lvlOverride w:ilvl="${n.ilvl}"><w:startOverride w:val="${n.start}"/></w:lvlOverride></w:num>`
      )
      .join('')

  return (
    XML_HEAD +
    `<w:numbering xmlns:w="${NS_W}">` +
    `<w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="hybridMultilevel"/>${levels('bullet')}</w:abstractNum>` +
    `<w:abstractNum w:abstractNumId="1"><w:multiLevelType w:val="hybridMultilevel"/>${levels('decimal')}</w:abstractNum>` +
    nums +
    '</w:numbering>'
  )
}

function settingsXml() {
  return (
    XML_HEAD +
    `<w:settings xmlns:w="${NS_W}"><w:zoom w:percent="100"/><w:defaultTabStop w:val="708"/>` +
    '<w:compat><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat>' +
    '</w:settings>'
  )
}

function coreXml(title) {
  const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z')
  return (
    XML_HEAD +
    '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"' +
    ' xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/"' +
    ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
    `<dc:title>${xmlEscape(title)}</dc:title><dc:creator>NotePad TJ</dc:creator>` +
    `<dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created>` +
    `<dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified>` +
    '</cp:coreProperties>'
  )
}

const CONTENT_TYPES_XML =
  XML_HEAD +
  '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
  '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
  '<Default Extension="xml" ContentType="application/xml"/>' +
  '<Default Extension="png" ContentType="image/png"/>' +
  '<Default Extension="jpeg" ContentType="image/jpeg"/>' +
  '<Default Extension="gif" ContentType="image/gif"/>' +
  '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
  '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
  '<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>' +
  '<Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>' +
  '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>' +
  '</Types>'

const ROOT_RELS_XML =
  XML_HEAD +
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
  '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
  '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>' +
  '</Relationships>'

function documentRelsXml(images) {
  const R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
  const imgRels = Array.from(images.values())
    .map((img) => `<Relationship Id="${img.rId}" Type="${R}/image" Target="media/${img.file}"/>`)
    .join('')
  return (
    XML_HEAD +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    `<Relationship Id="rId1" Type="${R}/styles" Target="styles.xml"/>` +
    `<Relationship Id="rId2" Type="${R}/numbering" Target="numbering.xml"/>` +
    `<Relationship Id="rId3" Type="${R}/settings" Target="settings.xml"/>` +
    imgRels +
    '</Relationships>'
  )
}

// ── API pública ────────────────────────────────────────────────────────────

/** Genera el .docx (Blob) de una nota. No descarga nada; útil para pruebas. */
export async function buildDocxBlob({ title, html }) {
  const safeTitle = (title || '').trim() || 'Sin título'
  const doc = parseHtml(html)
  const images = await loadImages(doc.imageSrcs)

  const zip = new JSZip()
  // [Content_Types].xml va primero por convención del formato OPC.
  zip.file('[Content_Types].xml', CONTENT_TYPES_XML)
  zip.file('_rels/.rels', ROOT_RELS_XML)
  zip.file('docProps/core.xml', coreXml(safeTitle))
  zip.file('word/document.xml', documentXml(safeTitle, doc, images))
  zip.file('word/styles.xml', stylesXml())
  zip.file('word/numbering.xml', numberingXml(doc.orderedNums))
  zip.file('word/settings.xml', settingsXml())
  zip.file('word/_rels/document.xml.rels', documentRelsXml(images))
  images.forEach((img) => zip.file(`word/media/${img.file}`, img.data))

  return zip.generateAsync({ type: 'blob', mimeType: DOCX_MIME, compression: 'DEFLATE' })
}

/** Nombre de archivo seguro a partir del título de la nota. */
export function docxFileName(title) {
  const clean = (title || '')
    .split('')
    .filter((ch) => ch.charCodeAt(0) >= 32)
    .join('')
    .replace(/[\\/:*?"<>|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[. ]+$/, '')
    .slice(0, 80)
    .trim()
  return `${clean || 'Nota'}.docx`
}

/**
 * Exporta la nota y dispara la descarga del .docx (mismo mecanismo que el
 * respaldo en backup.js). Devuelve el nombre del archivo generado.
 */
export async function exportNoteToDocx({ title, html }) {
  const blob = await buildDocxBlob({ title, html })
  const fileName = docxFileName(title)

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Se libera con retraso: algunos navegadores móviles aún están leyendo el
  // blob justo después del clic.
  setTimeout(() => URL.revokeObjectURL(url), 15000)

  return fileName
}
