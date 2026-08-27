import { useState, useEffect, useRef } from 'react'
import VersePanel from './VersePanel'
import SpeakerMode from './SpeakerMode'
import SpeakerIcon from './SpeakerIcon'
import RichEditor, { RichEditorToolbar } from './RichEditor'
import NoteLinkDialog from './NoteLinkDialog'
import { ensureHtml } from '../lib/htmlUtils'
import { useBackHandler } from '../hooks/useBackHandler'

// Cuántas "fotos" del contenido guardamos como máximo en el historial de
// deshacer/rehacer. Cada nota mantiene su propio historial en memoria
// (se reinicia al cerrar la nota, ya que NoteEditor se desmonta por
// completo — ver key={openNote.id} en App.jsx), así que un límite generoso
// no representa un riesgo real de memoria en una sesión de estudio típica.
const MAX_HISTORY = 50

// Cuánto esperar sin cambios antes de guardar una nueva "foto" del cuerpo
// en el historial. Agrupa así ráfagas de escritura en un solo paso de
// deshacer, en vez de un paso por cada letra tecleada.
const HISTORY_DEBOUNCE_MS = 600

export default function NoteEditor({
  note,
  folders,
  allNotes = [],
  onBack,
  onSave,
  onTrash,
  onRestore,
  onDeleteForever,
  onNeedImport,
  onLink,
  onUnlink,
  onOpenNote,
}) {
  const [title, setTitle] = useState(note.title)
  const [body, setBody] = useState(() => ensureHtml(note.body))
  const [plainText, setPlainText] = useState('')
  const [folder, setFolder] = useState(note.folder)
  const [tags, setTags] = useState(note.tags || [])
  const [tagInput, setTagInput] = useState('')
  const [cursorPos, setCursorPos] = useState(0)
  const [hasActiveVerse, setHasActiveVerse] = useState(false)
  const [showSpeaker, setShowSpeaker] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [heading, setHeading] = useState('P')

  const autoSaveTimer = useRef(null)
  const richEditorRef = useRef(null)

  // ── Historial de deshacer/rehacer (solo para el cuerpo de la nota) ──────
  // historyRef es la fuente de verdad (mutable, síncrona) — evita bugs de
  // "estado obsoleto" si el usuario toca deshacer/rehacer varias veces muy
  // rápido. historyTick solo existe para forzar un re-render y así
  // actualizar si los botones deben verse habilitados o no.
  const historyRef = useRef({ list: [ensureHtml(note.body)], index: 0 })
  const historyTimer = useRef(null)
  const skipHistoryPush = useRef(false)
  const [historyTick, setHistoryTick] = useState(0)

  const canUndo = historyRef.current.index > 0
  const canRedo = historyRef.current.index < historyRef.current.list.length - 1

  // Cada vez que el cuerpo cambia (por escribir o por un botón de formato),
  // se agenda guardar una "foto" nueva tras una pausa. Si el cambio vino de
  // deshacer/rehacer (skipHistoryPush), no se vuelve a guardar — si no, el
  // historial nunca podría avanzar hacia adelante (rehacer).
  useEffect(() => {
    if (skipHistoryPush.current) {
      skipHistoryPush.current = false
      return
    }
    if (historyTimer.current) clearTimeout(historyTimer.current)
    historyTimer.current = setTimeout(() => {
      const h = historyRef.current
      if (h.list[h.index] === body) return
      const trimmed = h.list.slice(0, h.index + 1)
      let list = [...trimmed, body]
      if (list.length > MAX_HISTORY) list = list.slice(list.length - MAX_HISTORY)
      historyRef.current = { list, index: list.length - 1 }
      setHistoryTick((t) => t + 1)
    }, HISTORY_DEBOUNCE_MS)
    return () => {
      if (historyTimer.current) clearTimeout(historyTimer.current)
    }
  }, [body])

  const jumpHistory = (newIndex) => {
    const h = historyRef.current
    if (newIndex < 0 || newIndex > h.list.length - 1) return
    if (historyTimer.current) clearTimeout(historyTimer.current)
    historyRef.current = { ...h, index: newIndex }
    skipHistoryPush.current = true
    richEditorRef.current?.setHtml(h.list[newIndex])
    setHistoryTick((t) => t + 1)
  }

  const handleUndo = () => jumpHistory(historyRef.current.index - 1)
  const handleRedo = () => jumpHistory(historyRef.current.index + 1)
  // ──────────────────────────────────────────────────────────────────────

  // Comparación simple de arrays de etiquetas para saber si cambiaron
  // (se usa en "dirty" en vez de comparar por referencia, que siempre da
  // distinto porque tags es un array nuevo cada vez que se agrega/quita).
  const tagsEqual = (a, b) => a.length === b.length && a.every((t, i) => t === b[i])

  const dirty =
    title !== note.title ||
    body !== note.body ||
    folder !== note.folder ||
    !tagsEqual(tags, note.tags || [])

  const handleSave = () => {
    if (!dirty) return
    setSaving(true)
    onSave({ ...note, title: title.trim() || 'Sin título', body, folder, tags })
    setTimeout(() => setSaving(false), 300)
  }

  useEffect(() => {
    if (dirty) {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current)
      }
      autoSaveTimer.current = setTimeout(() => {
        handleSave()
      }, 1000)
    }
    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current)
      }
    }
  }, [title, body, folder, tags])

  useBackHandler(showSpeaker, () => setShowSpeaker(false))

  const handleBack = () => {
    if (dirty) {
      handleSave()
    }
    setTimeout(() => onBack(), 100)
  }

  const handleOpenLinked = (id) => {
    if (dirty) handleSave()
    setTimeout(() => onOpenNote?.(id), 100)
  }

  const handleHeadingChange = (value) => {
    setHeading(value)
    richEditorRef.current?.applyHeading(value)
  }

  // ── Etiquetas ────────────────────────────────────────────────────────────
  // Limpia el texto escrito (quita espacios sobrantes, pasa a minúsculas y
  // elimina un "#" inicial si el usuario lo escribió por costumbre) y evita
  // duplicados antes de agregarla a la lista.
  const addTag = (raw) => {
    const clean = raw.trim().toLowerCase().replace(/^#+/, '')
    if (!clean) return
    setTags((prev) => (prev.includes(clean) ? prev : [...prev, clean]))
    setTagInput('')
  }

  const removeTag = (tag) => {
    setTags((prev) => prev.filter((t) => t !== tag))
  }

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(tagInput)
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      // Con el campo vacío, Backspace borra la última etiqueta — patrón
      // común en inputs de chips (Gmail, etc.).
      removeTag(tags[tags.length - 1])
    }
  }

  const handleTagBlur = () => {
    // En móvil no siempre hay una tecla "Enter" clara en el teclado, así
    // que si el usuario escribe una etiqueta y toca fuera del campo sin
    // presionar Enter, igual se agrega.
    addTag(tagInput)
  }
  // ────────────────────────────────────────────────────────────────────────

  const linkedNotes = (note.linkedNoteIds || [])
    .map((id) => allNotes.find((n) => n.id === id))
    .filter((n) => n && !n.trashed)

  return (
    <div className="flex-1 min-w-0 flex flex-col h-dvh overflow-x-hidden">
      <header className="sticky top-0 z-20 bg-parchment/90 dark:bg-night/90 backdrop-blur-sm border-b border-ink/10 dark:border-night-text/10 px-3 sm:px-4 md:px-8 py-3 flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={handleBack}
          className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-ink dark:text-night-text hover:bg-ink/5 dark:hover:bg-night-text/10"
          aria-label="Volver"
        >
          ←
        </button>

        <select
          value={folder}
          onChange={(e) => setFolder(e.target.value)}
          className="min-w-0 max-w-[38vw] sm:max-w-[220px] truncate text-sm bg-transparent border border-ink/15 dark:border-night-text/15 rounded-full px-3 py-1.5 text-ink dark:text-night-text focus:outline-none focus:ring-2 focus:ring-gilt/60"
        >
          {folders
            .filter((f) => !f.parentId)
            .map((f) => (
              <FolderOptionGroup key={f.id} folder={f} folders={folders} />
            ))}
        </select>

        <div className="flex-1 min-w-0" />

        {!note.trashed && (
          <button
            onClick={() => setShowSpeaker(true)}
            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-ink-soft dark:text-night-text/60 hover:bg-ink/5 dark:hover:bg-night-text/10"
            title="Modo orador"
            aria-label="Modo orador"
          >
            <SpeakerIcon className="w-[18px] h-[18px]" />
          </button>
        )}

        {saving && (
          <span className="text-xs text-ink-soft/50 dark:text-night-text/30">Guardando...</span>
        )}

        {note.trashed ? (
          <>
            <button
              onClick={() => onRestore(note.id)}
              className="shrink-0 text-sm px-3 py-1.5 rounded-full bg-sage/15 text-sage hover:bg-sage/25 transition-colors"
            >
              Restaurar
            </button>
            <button
              onClick={() => onDeleteForever(note.id)}
              className="shrink-0 text-sm px-3 py-1.5 rounded-full text-leather hover:bg-leather/10 transition-colors"
            >
              Eliminar
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onTrash(note.id)}
              className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-ink-soft dark:text-night-text/60 hover:bg-ink/5 dark:hover:bg-night-text/10"
              title="Mover a la papelera"
            >
              🗑️
            </button>
            <button
              onClick={handleSave}
              disabled={!dirty}
              className="shrink-0 text-sm px-4 py-1.5 rounded-full bg-leather text-parchment disabled:opacity-40 disabled:cursor-default hover:bg-leather-deep transition-colors"
            >
              Guardar
            </button>
          </>
        )}
      </header>

      <div className="flex-1 min-h-0 min-w-0 overflow-y-auto px-4 md:px-8 pb-24">
        <div className="max-w-3xl w-full mx-auto">
          {/* Título y barra de herramientas: van dentro de una franja
              `sticky` que arranca justo en el borde superior del área con
              scroll (top-0) y trae su propio padding-top (en vez de que ese
              espacio esté en el contenedor), así su fondo cubre toda la
              zona y no se alcanza a ver el texto de atrás al hacer scroll. */}
          <div className="sticky top-0 z-10 bg-parchment/95 dark:bg-night/95 backdrop-blur-sm pt-6 pb-3 border-b border-ink/10 dark:border-night-text/10">
            {note.trashed && (
              <div className="mb-4 text-sm px-3 py-2 rounded-lg bg-leather/10 text-leather dark:text-gilt-soft">
                Esta nota está en la papelera. Restáurala para poder editarla.
              </div>
            )}
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={note.trashed}
              placeholder="Título de la nota"
              className="w-full font-display text-2xl md:text-3xl bg-transparent focus:outline-none text-ink dark:text-night-text placeholder:text-ink-soft/40 mb-3 disabled:opacity-60"
            />
            <RichEditorToolbar
              heading={heading}
              onHeadingChange={handleHeadingChange}
              disabled={note.trashed}
              editorRef={richEditorRef}
              onUndo={handleUndo}
              onRedo={handleRedo}
              canUndo={canUndo}
              canRedo={canRedo}
            />
          </div>

          <div className="mt-3">
            <RichEditor
              ref={richEditorRef}
              html={body}
              onChange={setBody}
              onCursorChange={(text, offset) => {
                setPlainText(text)
                setCursorPos(offset)
              }}
              disabled={note.trashed}
              placeholder="Escribe aquí… (ej. Filipenses 4:6, 7)"
            />
          </div>

          {!note.trashed && (
            <div className="mt-10 pt-6 border-t border-ink/10 dark:border-night-text/10 space-y-8">
              {/* Etiquetas */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-soft/60 dark:text-night-text/40 mb-3">
                  Etiquetas
                </h4>
                <div className="flex flex-wrap items-center gap-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 text-xs pl-2.5 pr-1.5 py-1 rounded-full bg-sage/15 text-sage dark:text-sage-soft"
                    >
                      #{tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-sage/25 transition-colors"
                        title="Quitar etiqueta"
                        aria-label={`Quitar etiqueta ${tag}`}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    onBlur={handleTagBlur}
                    placeholder={tags.length ? 'Agregar…' : 'Agregar etiqueta y presiona Enter'}
                    className="flex-1 min-w-[140px] bg-transparent text-sm text-ink dark:text-night-text
                               placeholder:text-ink-soft/40 focus:outline-none py-1"
                  />
                </div>
              </div>

              {/* Notas enlazadas */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-soft/60 dark:text-night-text/40">
                    Notas enlazadas
                  </h4>
                  <button
                    onClick={() => setShowLinkDialog(true)}
                    className="text-xs px-3 py-1 rounded-full flex items-center gap-1 bg-ink/5 dark:bg-night-text/10 text-ink-soft dark:text-night-text/60 hover:bg-ink/10 dark:hover:bg-night-text/20 transition-colors"
                  >
                    🔗 Enlazar
                  </button>
                </div>

                {linkedNotes.length === 0 ? (
                  <p className="text-xs text-ink-soft/40 dark:text-night-text/30 italic">
                    Sin notas enlazadas todavía
                  </p>
                ) : (
                  <div className="space-y-2">
                    {linkedNotes.map((linked) => {
                      const linkedFolder = folders.find((f) => f.id === linked.folder)
                      return (
                        <div
                          key={linked.id}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-ink/[0.04] dark:bg-night-text/[0.06] border border-ink/[0.07] dark:border-night-text/[0.08]"
                        >
                          <span className="text-base shrink-0">
                            {linkedFolder?.icon || '📄'}
                          </span>
                          <button
                            onClick={() => handleOpenLinked(linked.id)}
                            className="flex-1 min-w-0 text-left"
                          >
                            <p className="font-display text-sm text-ink dark:text-night-text truncate leading-snug">
                              {linked.title || 'Sin título'}
                            </p>
                          </button>
                          <button
                            onClick={() => onUnlink?.(linked.id)}
                            className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-ink-soft/40 dark:text-night-text/30 text-xs hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                            title="Quitar enlace"
                            aria-label="Quitar enlace"
                          >
                            ✕
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {!note.trashed && (
        <VersePanel
          text={plainText}
          cursorPos={cursorPos}
          onNeedImport={onNeedImport}
          onActiveChange={setHasActiveVerse}
        />
      )}

      {showSpeaker && (
        <SpeakerMode
          note={{ ...note, title, body }}
          onClose={() => setShowSpeaker(false)}
          onNeedImport={onNeedImport}
        />
      )}

      {showLinkDialog && (
        <NoteLinkDialog
          currentNoteId={note.id}
          notes={allNotes}
          linkedNoteIds={note.linkedNoteIds || []}
          onLink={(targetId) => onLink?.(targetId)}
          onClose={() => setShowLinkDialog(false)}
        />
      )}
    </div>
  )
}

function FolderOptionGroup({ folder, folders }) {
  const children = folders.filter((c) => c.parentId === folder.id)
  return (
    <>
      <option value={folder.id}>
        {folder.icon} {folder.name}
      </option>
      {children.map((c) => (
        <option key={c.id} value={c.id}>
          {'\u00A0\u00A0'}↳ {c.name}
        </option>
      ))}
    </>
  )
}
