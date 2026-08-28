import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'

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

// Tinta oscura fija para el texto resaltado: los 3 colores de resaltado
// (amarillo/verde/azul) son pasteles claros pensados para leerse con texto
// oscuro encima, igual que un marcador real sobre papel — por eso el texto
// dentro de un resaltado siempre usa esta tinta oscura, sin importar si la
// app está en modo claro u oscuro.
const HIGHLIGHT_TEXT_COLOR = '#241f1c'

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
 * queden siempre visibles al hacer scroll en notas largas.
 *
 * Los botones de negrita/cursiva/subrayado/resaltado y los de
 * deshacer/rehacer actúan a través de `editorRef` (los métodos expuestos
 * por RichEditor más abajo), en vez de llamar a document.execCommand
 * directamente — así cada acción queda sincronizada con el estado de React
 * (NoteEditor.body) al instante, sin depender de que el usuario escriba
 * algo después para que el cambio "se note".
 */
export function RichEditorToolbar({
  heading,
  onHeadingChange,
  disabled,
  editorRef,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) {
  return (
    <div
      className={`flex items-center gap-1 flex-wrap ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
    >
      <ToolButton onClick={onUndo} label="Deshacer" disabled={disabled || !canUndo}>
        <span className="text-[15px] leading-none">↶</span>
      </ToolButton>
      <ToolButton onClick={onRedo} label="Rehacer" disabled={disabled || !canRedo}>
        <span className="text-[15px] leading-none">↷</span>
      </ToolButton>

      <span className="w-px h-5 bg-ink/10 dark:bg-night-text/15 mx-1" />

      <ToolButton onClick={() => editorRef.current?.runCommand('bold')} label="Negrita">
        <strong>B</strong>
      </ToolButton>
      <ToolButton onClick={() => editorRef.current?.runCommand('italic')} label="Cursiva">
        <em>I</em>
      </ToolButton>
      <ToolButton onClick={() => editorRef.current?.runCommand('underline')} label="Subrayado">
        <span className="underline">U</span>
      </ToolButton>

      <span className="w-px h-5 bg-ink/10 dark:bg-night-text/15 mx-1" />

      {HIGHLIGHTS.map((h) => (
        <button
          key={h.id}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editorRef.current?.applyHighlight(h.color)}
          title={`Resaltar en ${h.label.toLowerCase()}`}
          aria-label={`Resaltar en ${h.label.toLowerCase()}`}
          className="w-6 h-6 rounded-full border border-ink/10 dark:border-night-text/20 shrink-0"
          style={{ backgroundColor: h.color }}
        />
      ))}
      <ToolButton onClick={() => editorRef.current?.applyHighlight('transparent')} label="Quitar resaltado">
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
 * Área de texto editable. Expone varios métodos mediante ref para que
 * NoteEditor (a través de la barra de herramientas y de sus propios botones
 * de deshacer/rehacer) pueda manipular el contenido y mantenerlo
 * sincronizado con el estado de React:
 *
 * - applyHeading(value): cambia el bloque de encabezado del párrafo actual.
 * - runCommand(command, value): ejecuta un comando de formato (bold,
 *   italic, underline...) y sincroniza el resultado hacia React.
 * - applyHighlight(color): aplica/quita resaltado, ajusta el color del
 *   texto para que siga siendo legible, y sincroniza.
 * - setHtml(html): reemplaza todo el contenido (usado por deshacer/rehacer)
 *   y sincroniza — a diferencia de la carga inicial del prop `html`, que
 *   solo ocurre una vez, este método se puede llamar en cualquier momento.
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

  useImperativeHandle(ref, () => ({
    applyHeading(value) {
      exec('formatBlock', value === 'P' ? 'P' : value)
      handleInput()
    },
    runCommand(command, value = null) {
      exec(command, value)
      handleInput()
    },
    applyHighlight(color) {
      highlight(color)
      // Justo después de aplicar/quitar el fondo, la selección del
      // navegador sigue activa sobre ese mismo texto — encadenamos
      // "foreColor" sobre esa selección (mismo patrón que ya usan bold/
      // italic al combinarse entre sí) para que el color del texto quede
      // sincronizado con el del fondo:
      // - Al resaltar: tinta oscura fija (como un marcador real).
      // - Al quitar el resaltado: la variable --color-editor-text, que seguirá
      //   automáticamente el tema claro/oscuro incluso si el usuario lo
      //   cambia más adelante (en vez de quedar con un color fijo).
      if (color === 'transparent') {
        exec('foreColor', 'var(--color-editor-text)')
      } else {
        exec('foreColor', HIGHLIGHT_TEXT_COLOR)
      }
      handleInput()
    },
    setHtml(newHtml) {
      if (!editorRef.current) return
      editorRef.current.innerHTML = newHtml || ''
      handleInput()
    },
  }))

  return (
    <div
      ref={editorRef}
      contentEditable={!disabled}
      suppressContentEditableWarning
      onInput={handleInput}
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
      className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm
                 text-ink-soft dark:text-night-text/70 transition-colors
                 ${disabled ? 'opacity-30 pointer-events-none' : 'hover:bg-ink/5 dark:hover:bg-night-text/10'}`}
    >
      {children}
    </button>
  )
}
