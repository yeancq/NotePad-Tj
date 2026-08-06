import { rtfToText } from './rtfToText'

// Encabezados de sesión conocidos (sin hora, marcan un cambio de bloque).
const SESSION_HEADERS = new Set([
  'mañana', 'tarde', 'sesión de la mañana', 'sesión de la tarde',
  'viernes', 'sábado', 'domingo',
])

/**
 * Parsea el texto plano de un programa (ya convertido de RTF) en:
 * { title, items: [{ time, title, session, bullets: [] }] }
 */
function parseProgramText(text) {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  const title = lines[0] || 'Programa de asamblea'
  const items = []
  let currentSession = null
  let lastItem = null

  const timeLine = /^(\d{1,2}:\d{2})\s+(.+)$/
  const bulletLine = /^[•·-]\s*(.+)$/

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]

    // Dejar de procesar en la sección de preguntas de repaso (no son discursos).
    if (/^anota las respuestas/i.test(line)) break

    const bulletMatch = line.match(bulletLine)
    if (bulletMatch && lastItem) {
      lastItem.bullets.push(bulletMatch[1].trim())
      continue
    }

    const timeMatch = line.match(timeLine)
    if (timeMatch) {
      lastItem = {
        time: timeMatch[1],
        title: timeMatch[2].trim(),
        session: currentSession,
        bullets: [],
      }
      items.push(lastItem)
      continue
    }

    if (SESSION_HEADERS.has(line.toLowerCase())) {
      currentSession = line
      continue
    }
  }

  return { title, items }
}

export function parseProgramRtf(rtfString) {
  const text = rtfToText(rtfString)
  return parseProgramText(text)
}

// Se exporta también para poder darle soporte más adelante a otros formatos
// (ej. si el archivo viniera como .txt ya extraído de un .zip).
export { parseProgramText }
