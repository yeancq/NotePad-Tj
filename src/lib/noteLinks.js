const LINK_REGEX = /\[\[([^\[\]]+)\]\]/g

/**
 * Busca patrones [[Título]] en el texto y los resuelve contra la lista de notas
 * (comparación insensible a mayúsculas/acentos). Devuelve, en orden de aparición
 * y sin duplicados, las notas enlazadas que sí existen.
 */
export function resolveLinkedNotes(text, allNotes) {
  if (!text) return []
  const seen = new Set()
  const results = []
  let match

  LINK_REGEX.lastIndex = 0
  while ((match = LINK_REGEX.exec(text)) !== null) {
    const title = match[1].trim().toLowerCase()
    if (!title || seen.has(title)) continue
    const note = allNotes.find((n) => n.title.trim().toLowerCase() === title)
    if (!note) continue
    seen.add(title)
    results.push(note)
  }

  return results
}

/**
 * Inserta un enlace [[Título]] en el texto, en la posición del cursor,
 * devolviendo el nuevo texto y la nueva posición del cursor (justo después del enlace).
 */
export function insertNoteLink(text, cursorPos, noteTitle) {
  const token = `[[${noteTitle}]]`
  const before = text.slice(0, cursorPos)
  const after = text.slice(cursorPos)
  // Un espacio de separación si hace falta, para no pegar el enlace a la palabra anterior/siguiente.
  const prefix = before && !/\s$/.test(before) ? ' ' : ''
  const suffix = after && !/^\s/.test(after) ? ' ' : ''
  const newText = before + prefix + token + suffix + after
  const newCursor = before.length + prefix.length + token.length + suffix.length
  return { text: newText, cursorPos: newCursor }
}
