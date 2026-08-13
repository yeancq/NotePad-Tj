import { useEffect, useRef, useState } from 'react'

const HIGHLIGHTS = [
  { id: 'yellow', color: '#fde68a', label: 'Amarillo' },
  { id: 'green', color: '#bbf7d0', label: 'Verde' },
  { id: 'blue', color: '#bfdbfe', label: 'Azul' },
]

const HEADINGS = [
  { value: 'P', label: 'Normal' },
  { value: 'H1', label: 'Encabezado 1' },
  { value: 'H2', label: 'Encabezado 2' },
  { value: 'H3', label: 'Encabezado 3' },
]

function exec(command, value = null) {
  document.execCommand(command, false, value)
}

/** hiliteColor no funciona en todos los navegadores; backColor es el respaldo. */
function highlight(color) {
  try {
    const ok = document.execCommand('hiliteColor', false, color)
    if (!ok) exec('backColor', color)
  } catch {
    exec('backColor', color)
  }
}

export default function RichEditor({ html, onChange, onCursorChange, placeholder, disabled }) {
  const ref = useRef(null)
  const [heading, setHeading] = useState('P')
  const initialized = useRef(false)

  // ============================================================
  // Cargar el contenido inicial UNA SOLA VEZ
  // ============================================================
  useEffect(() => {
    if (ref.current && !initialized.current) {
      ref.current.innerHTML = html || ''
      initialized.current = true
      
      // 🔥 Forzar la detección de citas después de cargar el contenido
      // (con un pequeño retraso para asegurar que el DOM esté listo)
      setTimeout(() => {
        if (ref.current) {
          reportCursor()
        }
      }, 50)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html]) // Solo se ejecuta cuando cambia el html (al abrir la nota)

  // ============================================================
  // Cálculo del texto plano y posición del cursor
  // ============================================================
  const getTextAndOffset = () => {
    const el = ref.current
    if (!el) return { text: '', offset: 0 }

    const sel = window.getSelection()
    const focusNode = sel && el.contains(sel.focusNode) ? sel.focusNode : null
    const focusOffset = sel ? sel.focusOffset : 0

    const blocks = el.childNodes.length ? Array.from(el.childNodes) : []
    let text = ''
    let offset = null

    blocks.forEach((block, i) => {
      if (i > 0) text += '\n'
      const blockRange = document.createRange()
      blockRange.selectNodeContents(block)
      const blockText = blockRange.toString()

      if (offset === null && focusNode && (block === focusNode || block.contains?.(focusNode))) {
        try {
          const preRange = document.createRange()
          preRange.selectNodeContents(block)
          preRange.setEnd(focusNode, focusOffset)
          offset = text.length + preRange.toString().length
        } catch {
          offset = text.length
        }
      }
      text += blockText
    })

    if (offset === null) offset = text.length
    return { text, offset }
  }

  const reportCursor = () => {
    const { text, offset } = getTextAndOffset()
    onCursorChange?.(text, offset)
  }

  // ============================================================
  // Detectar cambios de cursor (selectionchange)
  // ============================================================
  useEffect(() => {
    const handler = () => {
      if (ref.current && ref.current.contains(document.activeElement)) {
        reportCursor()
      }
    }
    document.addEventListener('selectionchange', handler)
    return () => document.removeEventListener('selectionchange', handler)
  }, [])

  // ============================================================
  // Manejar cambios de contenido
  // ============================================================
  const handleInput = () => {
    onChange?.(ref.current.innerHTML)
    reportCursor()
  }

  const applyHeading = (value) => {
    setHeading(value)
    exec('formatBlock', value === 'P' ? 'P' : value)
    handleInput()
  }

  // ============================================================
  // Renderizado
  // ============================================================
  return (
    <div className={disabled ? 'opacity-60 pointer-events-none' : ''}>
      <div className="flex items-center gap-1 flex-wrap mb-3 pb-3 border-b border-ink/10 dark:border-night-text/10">
        <ToolButton onClick={() => exec('bold')} label="Negrita">
          <strong>B</strong>
        </ToolButton>
        <ToolButton onClick={() => exec('italic')} label="Cursiva">
          <em>I</em>
        </ToolButton>
        <ToolButton onClick={() => exec('underline')} label="Subrayado">
          <span className="underline">U</span>
        </ToolButton>

        <span className="w-px h-5 bg-ink/10 dark:bg-night-text/15 mx-1" />

        {HIGHLIGHTS.map((h) => (
          <button
            key={h.id}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => highlight(h.color)}
            title={`Resaltar en ${h.label.toLowerCase()}`}
            aria-label={`Resaltar en ${h.label.toLowerCase()}`}
            className="w-6 h-6 rounded-full border border-ink/10 dark:border-night-text/20 shrink-0"
            style={{ backgroundColor: h.color }}
          />
        ))}
        <ToolButton onClick={() => highlight('transparent')} label="Quitar resaltado">
          <span className="text-[11px]">✕</span>
        </ToolButton>

        <span className="w-px h-5 bg-ink/10 dark:bg-night-text/15 mx-1" />

        <select
          value={heading}
          onChange={(e) => applyHeading(e.target.value)}
          className="text-xs bg-transparent border border-ink/15 dark:border-night-text/15 rounded-full px-2 py-1
                     text-ink dark:text-night-text focus:outline-none"
        >
          {HEADINGS.map((h) => (
            <option key={h.value} value={h.value}>
              {h.label}
            </option>
          ))}
        </select>
      </div>

      <div
        ref={ref}
        contentEditable={!disabled}
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder={placeholder}
        className="rich-editor min-h-[240px] outline-none text-ink dark:text-night-text leading-relaxed
                   [&_h1]:font-display [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:mb-2
                   [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-2
                   [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-1
                   [&_p]:mb-3"
      />
    </div>
  )
}

function ToolButton({ onClick, label, children }) {
  return (
    <button
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={label}
      aria-label={label}
      className="w-8 h-8 flex items-center justify-center rounded-lg text-sm
                 text-ink-soft dark:text-night-text/70 hover:bg-ink/5 dark:hover:bg-night-text/10 transition-colors"
    >
      {children}
    </button>
  )
}
