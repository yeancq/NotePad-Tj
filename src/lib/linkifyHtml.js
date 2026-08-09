import { detectReferences } from './verseDetector'

let refCounter = 0

/**
 * Recorre los nodos de texto de un fragmento HTML ya parseado y envuelve las
 * referencias bíblicas detectadas en <button data-ref-id="..."> conservando
 * el resto del formato (negrita, cursiva, resaltado, etc.) intacto.
 * Devuelve { html, refsById } para poder resolver el clic después.
 */
export function linkifyHtml(html) {
  const container = document.createElement('div')
  container.innerHTML = html
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
