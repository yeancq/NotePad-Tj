import { motion } from 'framer-motion'

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
          <div className="space-y-4">
            {segmentTexts.map((s, i) => {
              // Tomar el texto tal cual viene de la base de datos
              const rawText = s.text || ''
              
              // Dividir el texto en partes: texto principal y notas al pie
              // Las notas al pie suelen estar al final, precedidas por "—" o "●"
              const parts = rawText.split(/\s*[—●]\s*/)
              const mainText = parts[0] || rawText
              const footnotes = parts.slice(1)

              return (
                <div key={i}>
                  <p className="text-[14px] md:text-[15px] leading-[1.75] text-ink/90 dark:text-night-text/90">
                    <span className="text-[11px] md:text-[12px] font-medium text-ink-soft/60 dark:text-night-text/40 align-super mr-0.5">
                      {s.verseLabel}
                    </span>
                    {mainText || (
                      <em className="text-ink-soft/50 dark:text-night-text/30 not-italic">no encontrado</em>
                    )}
                  </p>
                  
                  {/* Mostrar notas al pie si existen */}
                  {footnotes.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-ink/[0.06] dark:border-night-text/[0.06] space-y-0.5">
                      {footnotes.map((note, idx) => (
                        <p key={idx} className="text-[11px] md:text-[12px] text-ink-soft/70 dark:text-night-text/50">
                          <span className="italic">{note.trim()}</span>
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
