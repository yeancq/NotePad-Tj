import { detectReferences } from './verseDetector'

let refCounter = 0

/**
 * Fusiona elementos <strong> adyacentes en un solo elemento.
 * Esto resuelve el problema de referencias bíblicas partidas
 * al importar desde DOCX.
 */
function mergeAdjacentStrong(container) {
  const strongs = container.querySelectorAll('strong')
  const toRemove = new Set()

  strongs.forEach((el) => {
    // Si este elemento ya fue marcado para eliminar, saltar
    if (toRemove.has(el)) return

    let current = el
    let next = el.nextElementSibling

    // Buscar siguientes elementos <strong> consecutivos
    while (next && next.tagName === 'STRONG' && !toRemove.has(next)) {
      // Unir el contenido del siguiente al actual
      const range = document.createRange()
      range.selectNodeContents(next)
      current.appendChild(range.extractContents())

      // Marcar el siguiente para eliminar
      toRemove.add(next)
      next = next.nextElementSibling
    }
  })

  // Eliminar los elementos fusionados
  toRemove.forEach((el) => el.remove())
}

/**
 * Recorre los nodos de texto de un fragmento HTML ya parseado y envuelve las
 * referencias bíblicas detectadas en <button data-ref-id="..."> conservando
 * el resto del formato (negrita, cursiva, resaltado, etc.) intacto.
 * Devuelve { html, refsById } para poder resolver el clic después.
 */
export function linkifyHtml(html) {
  const container = document.createElement('div')
  container.innerHTML = html

  // 🔧 PASO 1: Fusionar <strong> adyacentes para que las referencias
  // bíblicas no queden partidas al importar desde DOCX.
  mergeAdjacentStrong(container)

  const refsById = {}

  const textNodes = []
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
  let node
  while ((node = walker.nextNode())) textNodes.push(node)

  textNodes.forEach((textNode) => {
    const text = textNode.textContent
    const refs = detectReferences(text)
    if (refs.length === 0) return

    const frag = document.createDocumentFragment()
    let cursor = 0
    refs.forEach((r) => {
      if (r.start > cursor) frag.appendChild(document.createTextNode(text.slice(cursor, r.start)))
      const id = `ref-${refCounter++}`
      refsById[id] = r
      const btn = document.createElement('button')
      btn.setAttribute('data-ref-id', id)
      btn.className =
        'text-leather dark:text-gilt-soft underline decoration-dotted underline-offset-2 font-medium'
      btn.textContent = r.raw
      frag.appendChild(btn)
      cursor = r.end
    })
    if (cursor < text.length) frag.appendChild(document.createTextNode(text.slice(cursor)))

    textNode.parentNode.replaceChild(frag, textNode)
  })

  return { html: container.innerHTML, refsById }
}
