import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import { Undo2, Redo2 } from 'lucide-react'
import { sanitizePastedHtml, escapeHtml } from '../lib/htmlUtils'

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

/**
 * Barra de herramientas del editor enriquecido.
 *
 * Se separó del área editable (más abajo) para que NoteEditor pueda
 * colocarla, junto con el título, dentro de una franja `sticky` y así
 * queden siempre visibles al hacer scroll en notas largas. Los botones de
 * negrita/cursiva/subrayado/resaltado siguen actuando directo sobre
 * `document.execCommand` (no dependen de ninguna referencia local); el
 * cambio de encabezado se delega al padre, que lo aplica sobre el editor
 * a través de `editorRef` (ver RichEditor más abajo).
 *
 * Deshacer/rehacer (onUndo/onRedo/canUndo/canRedo) vienen controlados por
 * NoteEditor.jsx, que mantiene el historial de "fotos" del cuerpo de la
 * nota — aquí solo se dibujan los botones y se reflejan como
 * habilitados/deshabilitados según canUndo/canRedo.
 */
export function RichEditorToolbar({
  heading,
  onHeadingChange,
  disabled,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) {
  return (
    <div
      className={`flex items-center gap-1 flex-wrap ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
    >
      <ToolButton onClick={onUndo} label="Deshacer" disabled={!canUndo}>
        <Undo2 className="w-4 h-4" strokeWidth={2} />
      </ToolButton>
      <ToolButton onClick={onRedo} label="Rehacer" disabled={!canRedo}>
        <Redo2 className="w-4 h-4" strokeWidth={2} />
      </ToolButton>

      <span className="w-px h-5 bg-ink/10 dark:bg-night-text/15 mx-1" />

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
        onChange={(e) => onHeadingChange(e.target.value)}
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
  )
}

/**
 * Área de texto editable. Expone mediante ref:
 * - applyHeading(value): cambia el bloque de encabezado del párrafo actual.
 * - setHtml(html): reemplaza el contenido completo (usado por
 *   deshacer/rehacer en NoteEditor.jsx) y dispara el mismo camino que una
 *   edición normal (onChange + reporte de cursor), para que el resto de la
 *   app (autoguardado, detector de versículos) quede sincronizado.
 */
const RichEditor = forwardRef(function RichEditor(
  { html, onChange, onCursorChange, placeholder, disabled },
  ref
) {
  const editorRef = useRef(null)
  const initialized = useRef(false)

  // Cargar el contenido inicial una sola vez (no en cada re-render, para no
  // pelear con el cursor del usuario mientras escribe).
  useEffect(() => {
    if (editorRef.current && !initialized.current) {
      editorRef.current.innerHTML = html || ''
      initialized.current = true
    }
  }, [html])

  /**
   * Calcula el texto plano y la posición del cursor con el MISMO método
   * (recorriendo los bloques de nivel superior y uniéndolos con "\n"), para
   * que ambos valores queden alineados sin importar cuántos párrafos haya.
   */
  const getTextAndOffset = () => {
    const el = editorRef.current
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

  // selectionchange es la única señal 100% confiable de "el cursor ya se
  // movió de verdad" — a diferencia de click/keyup, que a veces se disparan
  // justo ANTES de que el navegador termine de reubicar el cursor (sobre
  // todo al tocar la pantalla en celular), dejando la lectura desfasada un
  // párrafo.
  useEffect(() => {
    const handler = () => {
      if (editorRef.current && editorRef.current.contains(document.activeElement)) {
        reportCursor()
      }
    }
    document.addEventListener('selectionchange', handler)
    return () => document.removeEventListener('selectionchange', handler)
  })

  const handleInput = () => {
    onChange?.(editorRef.current.innerHTML)
    reportCursor()
  }

  // Pegar contenido desde otra app (Word, WhatsApp, una página web, o
  // incluso otra nota de esta misma app) trae HTML "sucio": estilos en
  // línea, spans de formato ajenos, tablas, enlaces, y espacios/caracteres
  // invisibles (NBSP, ancho cero) que ya nos mordieron una vez en el
  // detector de referencias bíblicas. sanitizePastedHtml() reconstruye ese
  // HTML dejando solo negrita/cursiva/subrayado/párrafos/encabezados/listas
  // y los 3 resaltados propios de la app; todo lo demás se descarta
  // conservando solo el texto. Si el portapapeles no trae HTML (solo texto
  // plano), se convierte a párrafos igual que ensureHtml().
  const handlePaste = (e) => {
    e.preventDefault()
    const clipboard = e.clipboardData
    const html = clipboard?.getData('text/html')
    let insertHtml

    if (html) {
      insertHtml = sanitizePastedHtml(html)
    } else {
      const text = clipboard?.getData('text/plain') || ''
      insertHtml = text
        .split('\n')
        .map((line) => (line ? escapeHtml(line) : '<br>'))
        .join('<br>')
    }

    document.execCommand('insertHTML', false, insertHtml)
  }

  useImperativeHandle(ref, () => ({
    applyHeading(value) {
      exec('formatBlock', value === 'P' ? 'P' : value)
      handleInput()
    },
    setHtml(newHtml) {
      if (!editorRef.current) return
      editorRef.current.innerHTML = newHtml || ''
      // Mismo camino que una edición normal: sincroniza el estado `body`
      // en NoteEditor (onChange) y reporta la nueva posición de cursor
      // para el detector de versículos.
      handleInput()
    },
  }))

  return (
    <div
      ref={editorRef}
      contentEditable={!disabled}
      suppressContentEditableWarning
      onInput={handleInput}
      onPaste={handlePaste}
      data-placeholder={placeholder}
      className={`rich-editor min-h-[240px] outline-none text-ink dark:text-night-text leading-relaxed
                 [&_h1]:font-display [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:mb-2
                 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-2
                 [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-1
                 [&_p]:mb-3 ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
    />
  )
})

export default RichEditor

function ToolButton({ onClick, label, children, disabled }) {
  return (
    <button
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className="w-8 h-8 flex items-center justify-center rounded-lg text-sm
                 text-ink-soft dark:text-night-text/70 hover:bg-ink/5 dark:hover:bg-night-text/10 transition-colors
                 disabled:opacity-30 disabled:pointer-events-none"
    >
      {children}
    </button>
  )
}
