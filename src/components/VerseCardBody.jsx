// FILE: src/components/VerseCardBody.jsx
import { motion } from 'framer-motion'

const BLUE = '#2f6fed'

export default function VerseCardBody({
  activeRef,
  segmentTexts,
  footnotes = [],
  bibleReady,
  onNeedImport,
  onCopy,
  onClose,
}) {
  return (
    <>
      {/* Encabezado: referencia + botones */}
      <div className="flex items-center gap-1.5 px-3.5 md:px-5 pt-4 pb-3 border-b border-ink/[0.06] dark:border-night-text/[0.06]">
        <p
          className="flex-1 font-display font-medium text-[13px] md:text-[15px] tracking-tight truncate"
          style={{ color: BLUE }}
        >
          {activeRef.label}
        </p>
        <IconButton onClick={onCopy} label="Copiar">⧉</IconButton>
        <IconButton onClick={onClose} label="Cerrar">✕</IconButton>
      </div>

      {/* Contenido */}
      <div className="px-3.5 md:px-5 py-4 flex-1 overflow-y-auto">
        {!bibleReady ? (
          <p className="text-sm text-ink-soft dark:text-night-text/60">
            Aún no has importado tu Biblia.{' '}
            <button
              onClick={onNeedImport}
              className="underline underline-offset-2"
              style={{ color: BLUE }}
            >
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
          <>
            {/* Textos de versículos */}
            <div className="space-y-3">
              {segmentTexts.map((s, i) => {
                const fullText = (s.text || '').replace(
                  /(\*|†|‡|§|‖|¶)/g,
                  `<sup style="font-size:0.65em;color:${BLUE};font-weight:700;margin-left:1px;">$1</sup>`
                )
                return (
                  <div key={i}>
                    <p className="text-[14px] md:text-[15px] leading-[1.75] text-ink/90 dark:text-night-text/90">
                      {segmentTexts.length > 1 && (
                        <span className="text-[11px] md:text-[12px] font-medium text-ink-soft/60 dark:text-night-text/40 align-super mr-0.5">
                          {s.verseLabel}
                        </span>
                      )}
                      <span dangerouslySetInnerHTML={{ __html: fullText }} />
                    </p>
                    {i < segmentTexts.length - 1 && <div className="h-2" />}
                  </div>
                )
              })}
            </div>

            {/* Notas al pie */}
            {footnotes.length > 0 && (
              <div className="mt-4 pt-3 border-t border-ink/[0.07] dark:border-night-text/[0.07]">
                <div className="space-y-2">
                  {footnotes.map((fn, i) => {
                    const fixedText = fn
                      .replace(/([\*†‡])\s*(\[)/g, '$1 $2')
                      .replace(/\]\s*([^\s\]])/g, '] $1')
                      .replace(/,([^\s"»\d])/g, ', $1')
                      .replace(/\.([A-ZÁÉÍÓÚÑ"«])/g, '. $1')

                    const formatted = fixedText.replace(
                      /^([\*†‡])/,
                      `<span style="color:${BLUE};font-weight:700;">$1</span>`
                    )
                    return (
                      <p
                        key={i}
                        className="text-[11px] md:text-[12px] text-ink-soft/65 dark:text-night-text/45 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: formatted }}
                      />
                    )
                  })}
                </div>
              </div>
            )}
          </>
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
      className="w-8 h-8 flex items-center justify-center rounded-full text-[13px] text-ink-soft/50 dark:text-night-text/40 hover:text-ink dark:hover:text-night-text hover:bg-ink/5 dark:hover:bg-night-text/10 transition-colors duration-300"
    >
      {children}
    </button>
  )
}
