import { detectReferences } from './verseDetector'

let refCounter = 0

/**
 * Recorre los bloques de un fragmento HTML ya parseado y envuelve las
 * referencias bíblicas detectadas en <button data-ref-id="..."> conservando
 * el resto del formato (negrita, cursiva, resaltado, etc.) intacto, incluso
 * cuando la referencia está distribuida en múltiples nodos de texto (p.ej.
 * corridas separadas en documentos importados desde .docx, o texto pegado
 * desde otra app con resaltados/formatos propios).
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
 * y las envuelve en botones, recortando únicamente los nodos de texto en
 * los bordes de cada referencia con Text.splitText().
 *
 * NOTA: a propósito NO se usa un único Range que abarque del primer al
 * último nodo (range.setStart/setEnd + deleteContents + insertNode). Ese
 * enfoque puede fallar silenciosamente cuando la referencia queda repartida
 * entre nodos que viven dentro de envoltorios de formato distintos
 * (negrita, resaltado de color, contenido pegado desde otra app), dejando
 * la referencia como texto plano sin aviso de error. Recortar nodo por
 * nodo con splitText() evita ese problema por completo.
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

    try {
      const first = overlapping[0]
      const last = overlapping[overlapping.length - 1]
      const sameNode = first === last
      // Guardamos el final ORIGINAL del último nodo antes de tocar nada,
      // porque lo necesitamos después para re-registrar el sobrante final.
      const originalLastEnd = last.end

      let firstNode = first.node
      const firstLocalStart = ref.start - first.start
      if (firstLocalStart > 0) {
        // splitText devuelve el nodo NUEVO con el texto posterior al offset;
        // ese es el que nos interesa (donde empieza la referencia). El nodo
        // ORIGINAL queda truncado en el DOM con el texto previo intacto.
        firstNode = firstNode.splitText(firstLocalStart)
      }

      let lastNode = sameNode ? firstNode : last.node
      const lastLocalEnd = sameNode
        ? ref.end - first.start - firstLocalStart
        : ref.end - last.start

      // Si sobra texto después del final de la referencia, splitText()
      // separa ese sobrante en un nodo nuevo que hay que seguir rastreando
      // (puede contener OTRA referencia todavía sin procesar).
      let trailingNode = null
      if (lastLocalEnd < lastNode.textContent.length) {
        trailingNode = lastNode.splitText(lastLocalEnd)
      }

      const matchedNodes = sameNode
        ? [firstNode]
        : [firstNode, ...overlapping.slice(1, -1).map((p) => p.node), lastNode]

      const btn = document.createElement('button')
      btn.setAttribute('data-ref-id', id)
      btn.className =
        'text-leather dark:text-gilt-soft underline decoration-dotted underline-offset-2 font-medium'
      btn.textContent = ref.raw

      matchedNodes[0].parentNode.insertBefore(btn, matchedNodes[0])
      matchedNodes.forEach((n) => n.parentNode && n.parentNode.removeChild(n))

      // Actualizar textParts: quitar lo que se acaba de consumir, pero
      // conservar (con sus límites correctos) cualquier texto sobrante en
      // los bordes — ese sobrante puede contener OTRA referencia todavía
      // sin procesar (p. ej. dos referencias seguidas en un mismo nodo de
      // texto, como "Sal 55:22; Isa 41:10, 13", sin ningún cambio de
      // formato entre ellas). Sin esto, esa segunda referencia quedaba
      // "invisible" para el resto del procesamiento aunque el nodo con su
      // texto siguiera intacto en el DOM.
      for (const part of overlapping) {
        const idx = textParts.indexOf(part)
        if (idx !== -1) textParts.splice(idx, 1)
      }
      if (firstLocalStart > 0) {
        textParts.push({ node: first.node, start: first.start, end: first.start + firstLocalStart })
      }
      if (trailingNode) {
        textParts.push({ node: trailingNode, start: ref.end, end: originalLastEnd })
      }
      // Reordenar por posición para que la próxima referencia (que siempre
      // tiene un start menor, porque procesamos de derecha a izquierda)
      // siga viendo "primero" y "último" en el orden correcto del documento.
      textParts.sort((a, b) => a.start - b.start)
    } catch {
      // Si la manipulación del DOM falla por algún motivo inesperado,
      // omitir esta referencia y dejar el texto tal cual.
      delete refsById[id]
    }
  }
}
