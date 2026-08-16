import { motion } from 'framer-motion'

/**
 * Procesa el texto del versículo para extraer notas al pie
 * Devuelve: { mainText, footnotes: [{ marker, text }] }
 */
function processVerseText(text) {
  if (!text) return { mainText: '', footnotes: [] }

  // Buscar notas al pie con formato: * [texto] (jw.org)
  const bracketRegex = /\*\s*\[([^\]]+)\]/g
  let match
  let footnoteIndex = 1
  const bracketMatches = []

  while ((match = bracketRegex.exec(text)) !== null) {
    bracketMatches.push({
      marker: `*${footnoteIndex}`,
      text: match[1].trim(),
      index: match.index,
      length: match[0].length
    })
    footnoteIndex++
  }

  // Si no hay notas con corchetes, buscar notas con asterisco + palabra
  // (pero solo si no son parte de una palabra)
  if (bracketMatches.length === 0) {
    const simpleRegex = /\*\s*([a-zA-ZáéíóúñÑÁÉÍÓÚ\s]+)/g
    while ((match = simpleRegex.exec(text)) !== null) {
      const afterStar = match[1].trim()
      if (afterStar.length > 1 && !/^\d+$/.test(afterStar)) {
        // Verificar que no sea parte de una palabra
        const before = text.substring(0, match.index)
        if (before.length > 0 && /[a-zA-ZáéíóúñÑÁÉÍÓÚ]/.test(before[before.length - 1])) {
          continue
        }
        bracketMatches.push({
          marker: `*${footnoteIndex}`,
          text: afterStar,
          index: match.index,
          length: match[0].length
        })
        footnoteIndex++
      }
    }
  }

  // Construir el texto principal con marcadores
  let mainText = text
  if (bracketMatches.length > 0) {
    // Ordenar de atrás hacia adelante para no afectar índices
    const sortedMatches = [...bracketMatches].sort((a, b) => b.index - a.index)
    for (const note of sortedMatches) {
      const before = mainText.substring(0, note.index)
      const after = mainText.substring(note.index + note.length)
      mainText = before + note.marker + after
    }
    // Limpiar espacios dobles
    mainText = mainText.replace(/\s{2,}/g, ' ').trim()
  }

  const footnotes = bracketMatches.map(n => ({ marker: n.marker, text: n.text }))

  return { mainText, footnotes }
}

export default function VerseCardBody({ activeRef, segmentTexts, bibleReady, onNeedImport, onCopy, onClose }) {
  return (
    <>
      <div className="flex items-center gap-1.5 px-3.5 md:px-5 pt-4 pb-3 border-b border-ink/[0.06] dark:border-night-text/[0.06]">
        <p className="flex-1 font-display font-medium text-ink dark:text-night-text text-[13px] md:text-[15px] tracking-tight truncate">
          {activeRef.label}
        </p>
        <IconButton onClick={onCopy} label="Copiar">
          ⧉
        </IconButton>
        <IconButton onClick={onClose} label="Cerrar">
          ✕
        </IconButton>
      </div>

      <div className="px-3.5 md:px-5 py-4 flex-1 overflow-y-auto">
        {!bibleReady ? (
          <p className="text-sm text-ink-soft dark:text-night-text/60">
            Aún no has importado tu Biblia.{' '}
            <button onClick={onNeedImport} className="text-leather dark:text-gilt-soft underline underline-offset-2">
              Importarla ahora
            </button>
          </p>
        ) : segmentTexts.length === 0 ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="text-sm text-ink-soft/60 dark:text-night-text/30"
          >
            Buscando…
          </motion.p>
        ) : (
          <div className="space-y-3">
            {segmentTexts.map((s, i) => {
              // Limpiar el texto: eliminar posibles corchetes numéricos sobrantes
              let rawText = s.text || ''
              // Si el texto comienza con [número], lo eliminamos (ya tenemos verseLabel)
              rawText = rawText.replace(/^\[\s*\d+\s*\]\s*/, '')
              
              const { mainText, footnotes } = processVerseText(rawText)
              return (
                <div key={i}>
                  <p className="text-[14px] md:text-[15px] leading-[1.75] text-ink/90 dark:text-night-text/90">
                    <span className="text-[11px] md:text-[12px] font-medium text-ink-soft/60 dark:text-night-text/40 align-super mr-0.5">
                      {s.verseLabel}
                    </span>
                    {mainText ? (
                      <span dangerouslySetInnerHTML={{ 
                        __html: mainText
                          // Resaltar marcadores (*1, *2, etc.) en azul y superíndice
                          .replace(/\*(\d+)/g, '<sup class="text-[10px] md:text-[11px] text-accent font-medium cursor-help">*$1</sup>')
                      }} />
                    ) : (
                      <em className="text-ink-soft/50 dark:text-night-text/30 not-italic">no encontrado</em>
                    )}
                  </p>
                  {footnotes.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-ink/[0.06] dark:border-night-text/[0.06] space-y-0.5">
                      {footnotes.map((note, idx) => (
                        <p key={idx} className="text-[11px] md:text-[12px] text-ink-soft/70 dark:text-night-text/50">
                          <sup className="text-accent font-medium">*{note.marker.replace('*', '')}</sup>{' '}
                          <span className="italic">{note.text}</span>
                        </p>
                      ))}
                    </div>
                  )}
                  {i < segmentTexts.length - 1 && <div className="h-2" />}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}

function IconButton({ onClick, label, children }) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="w-8 h-8 flex items-center justify-center rounded-full text-[13px]
                 text-ink-soft/50 dark:text-night-text/40
                 hover:text-ink dark:hover:text-night-text
                 hover:bg-ink/5 dark:hover:bg-night-text/10
                 transition-colors duration-300"
    >
      {children}
    </button>
  )
}
