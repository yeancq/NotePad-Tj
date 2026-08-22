// FILE: src/lib/verseCardHelpers.js
//
// Utilidades compartidas entre VersePanel.jsx y SpeakerMode.jsx para el
// manejo de la referencia bíblica activa (tarjeta de versículo). Antes esta
// lógica estaba duplicada de forma idéntica en ambos componentes.

/**
 * Genera una clave única y estable para una referencia detectada. Se usa
 * como `key` de animación (Framer Motion) y para comparar "es la misma
 * referencia" al decidir si hay que abrir o cerrar la tarjeta.
 */
export function refKey(ref) {
  return ref ? `${ref.start}:${ref.end}:${ref.raw}` : null
}

/**
 * Arma el texto que se copia al portapapeles a partir de la referencia
 * activa y los textos de cada segmento.
 *
 * Solo repetimos la etiqueta de versículo (verseLabel) por segmento cuando
 * hay más de uno (ej. "Mateo 24:15; 8:6"), porque con un solo segmento esa
 * referencia ya está en activeRef.label — agregarla de nuevo la duplicaba
 * (ej. "Isaías 48:17,18  48:17,18 17 Esto es...").
 */
export function buildCopyText(activeRef, segmentTexts) {
  if (!activeRef) return ''
  const body = segmentTexts
    .map((s) => (segmentTexts.length > 1 ? `${s.verseLabel} ${s.text}` : s.text))
    .join(' ')
  return `${activeRef.label}  ${body}`
}
