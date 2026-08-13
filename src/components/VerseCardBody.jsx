import { motion } from 'framer-motion'

/**
 * Limpia el texto de caracteres de espacio no estándar y espacios dobles.
 * Reemplaza todos los caracteres Unicode que son espacios pero no el espacio normal.
 */
function cleanText(text) {
  if (!text) return text

  // Lista de caracteres de espacio problemáticos:
  // \u00A0 = espacio no rompible
  // \u200B = espacio de ancho cero
  // \u202F = espacio estrecho
  // \u2009 = espacio fino
  // \u200A = espacio muy fino
  // \u205F = espacio medio
  // \u3000 = espacio ideográfico
  const problemSpaces = /[\u00A0\u200B\u202F\u2009\u200A\u205F\u3000]/g

  // Reemplazar todos por espacio normal
  let cleaned = text.replace(problemSpaces, ' ')

  // Eliminar espacios dobles o múltiples
  cleaned = cleaned.replace(/\s{2,}/g, ' ')

  // Recortar espacios al inicio y final
  return cleaned.trim()
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
          <p className="text-[14px] md:text-[15px] leading-[1.75] text-ink/90 dark:text-night-text/90">
            {segmentTexts.map((s, i) => (
              <span key={i}>
                <span className="text-[11px] md:text-[12px] font-medium text-ink-soft/60 dark:text-night-text/40 align-super mr-0.5">
                  {s.verseLabel}
                </span>
                {s.text ? (
                  <span>{cleanText(s.text)}</span>
                ) : (
                  <em className="text-ink-soft/50 dark:text-night-text/30 not-italic">no encontrado</em>
                )}
                {i < segmentTexts.length - 1 ? '  ' : ''}
              </span>
            ))}
          </p>
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
