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

function escapeHtml(str) {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}
