import { detectReferences } from './verseDetector'

let refCounter = 0

/**
 * Recorre los bloques de un fragmento HTML ya parseado y envuelve las
 * referencias bíblicas detectadas en <button data-ref-id="..."> conservando
 * el resto del formato (negrita, cursiva, resaltado, etc.) intacto, incluso
 * cuando la referencia está distribuida en múltiples nodos de texto (p.ej.
 * corridas separadas en documentos importados desde .docx).
 * Devuelve { html, refsById } para poder resolver el clic después.
 */
export function linkifyHtml(html) {
  const container = document.createElement('div')
  container.innerHTML = html
  const refsById = {}

  // Recopilar elementos de bloque para procesar cada uno de forma holística.
  // Así, aunque "Miqueas " y "4:1-4" estén en nodos distintos dentro del mismo
  // párrafo, el texto completo del bloque sí contiene la referencia entera.
  const BLOCK_TAGS = new Set(['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI'])
  const blocks = []

  function collectBlocks(el) {
    if (BLOCK_TAGS.has(el.tagName?.toUpperCase())) {
      blocks.push(el)
    } else {
      for (const child of Array.from(el.children)) {
        collectBlocks(child)
      }
    }
  }

  for (const child of Array.from(container.children)) {
    collectBlocks(child)
  }

  // Si no hay elementos de bloque (contenido plano o solo inline),
  // procesar el contenedor completo como un único bloque.
  if (blocks.length === 0) blocks.push(container)

  for (const block of blocks) {
    _processBlock(block, refsById)
  }

  return { html: container.innerHTML, refsById }
}

/**
 * Procesa un elemento de bloque: detecta referencias en su texto completo
 * y las envuelve en botones usando el Range API, soportando referencias
 * distribuidas entre múltiples nodos de texto.
 */
function _processBlock(blockEl, refsById) {
  // 1. Mapear todos los nodos de texto con sus desplazamientos acumulados
  const textParts = []
  let offset = 0

  const walker = document.createTreeWalker(blockEl, NodeFilter.SHOW_TEXT)
  let node
  while ((node = walker.nextNode())) {
    const len = node.textContent.length
    if (len > 0) {
      textParts.push({ node, start: offset, end: offset + len })
      offset += len
    }
  }

  if (textParts.length === 0) return

  // 2. Detectar referencias en el texto completo del bloque concatenado
  const fullText = textParts.map((p) => p.node.textContent).join('')
  const refs = detectReferences(fullText)
  if (refs.length === 0) return

  // 3. Procesar de atrás hacia adelante para mantener válidos los desplazamientos
  const sortedRefs = [...refs].sort((a, b) => b.start - a.start)

  for (const ref of sortedRefs) {
    const id = `ref-${refCounter++}`
    refsById[id] = ref

    // Nodos de texto que se superponen con esta referencia
    const overlapping = textParts.filter((p) => p.start < ref.end && p.end > ref.start)

    if (overlapping.length === 0) {
      delete refsById[id]
      continue
    }

    const first = overlapping[0]
    const last = overlapping[overlapping.length - 1]
    const firstLocalStart = ref.start - first.start
    const lastLocalEnd = ref.end - last.start

    const btn = document.createElement('button')
    btn.setAttribute('data-ref-id', id)
    btn.className =
      'text-leather dark:text-gilt-soft underline decoration-dotted underline-offset-2 font-medium'
    btn.textContent = ref.raw

    try {
      // El Range API maneja correctamente tanto el caso de un solo nodo
      // como el de múltiples nodos de texto repartidos en distintos elementos.
      const range = document.createRange()
      range.setStart(first.node, firstLocalStart)
      range.setEnd(last.node, lastLocalEnd)
      range.deleteContents()
      range.insertNode(btn)
    } catch {
      // Si la manipulación del rango falla, omitir esta referencia
      delete refsById[id]
      continue
    }

    // Eliminar las partes procesadas del mapa (ya no son nodos de texto válidos)
    for (const part of overlapping) {
      const idx = textParts.indexOf(part)
      if (idx !== -1) textParts.splice(idx, 1)
    }
  }
}
