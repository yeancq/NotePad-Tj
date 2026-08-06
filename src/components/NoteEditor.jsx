import { useRef, useState } from 'react'
import VerseFloatingCard from './VerseFloatingCard'
import LinkNotePicker from './LinkNotePicker'

const folderOptions = [
  { id: 'estudio', name: 'Estudio personal', icon: '📖' },
  { id: 'reunion', name: 'Reuniones', icon: '🗓️' },
  { id: 'predicacion', name: 'Predicación', icon: '🧭' },
  { id: 'asamblea', name: 'Asambleas', icon: '🎟️' },
]

export default function NoteEditor({
  note,
  allNotes,
  onBack,
  onSave,
  onTrash,
  onRestore,
  onDeleteForever,
  onNeedImport,
  onOpenNote,
}) {
  const [title, setTitle] = useState(note.title)
  const [body, setBody] = useState(note.body)
  const [folder, setFolder] = useState(note.folder)
  const [linkedNoteIds, setLinkedNoteIds] = useState(note.linkedNoteIds || [])
  const [cursorPos, setCursorPos] = useState(0)
  const [hasActiveVerse, setHasActiveVerse] = useState(false)
  const [showLinkPicker, setShowLinkPicker] = useState(false)
  const textareaRef = useRef(null)

  const dirty =
    title !== note.title ||
    body !== note.body ||
    folder !== note.folder ||
    JSON.stringify(linkedNoteIds) !== JSON.stringify(note.linkedNoteIds || [])

  const buildUpdated = () => ({
    ...note,
    title: title.trim() || 'Sin título',
    body,
    folder,
    linkedNoteIds,
  })

  const handleSave = () => {
    onSave(buildUpdated())
  }

  const syncCursor = () => {
    if (textareaRef.current) setCursorPos(textareaRef.current.selectionStart)
  }

  const addLink = (targetId) => {
    setLinkedNoteIds((prev) => (prev.includes(targetId) ? prev : [...prev, targetId]))
    setShowLinkPicker(false)
  }

  const removeLink = (targetId) => {
    setLinkedNoteIds((prev) => prev.filter((id) => id !== targetId))
  }

  const openLinkedNote = (targetId) => {
    onSave(buildUpdated())
    onOpenNote(targetId)
  }

  const linkedNotes = linkedNoteIds
    .map((id) => allNotes.find((n) => n.id === id))
    .filter((n) => n && !n.trashed)

  return (
    <div
      className={`flex-1 flex flex-col min-h-screen
                  transition-[padding] duration-500 ease-out
                  ${hasActiveVerse ? 'lg:pr-[380px]' : ''}`}
    >
      <header className="sticky top-0 z-20 bg-parchment/90 dark:bg-night/90 backdrop-blur-sm border-b border-ink/10 dark:border-night-text/10 px-4 md:px-8 py-3 flex items-center gap-3">
        <button
          onClick={() => {
            if (dirty) handleSave()
            onBack()
          }}
          className="w-9 h-9 flex items-center justify-center rounded-full text-ink dark:text-night-text hover:bg-ink/5 dark:hover:bg-night-text/10"
          aria-label="Volver"
        >
          ←
        </button>

        <select
          value={folder}
          onChange={(e) => setFolder(e.target.value)}
          className="text-sm bg-transparent border border-ink/15 dark:border-night-text/15 rounded-full px-3 py-1.5
                     text-ink dark:text-night-text focus:outline-none focus:ring-2 focus:ring-gilt/60"
        >
          {folderOptions.map((f) => (
            <option key={f.id} value={f.id}>
              {f.icon} {f.name}
            </option>
          ))}
        </select>

        <div className="flex-1" />

        {note.trashed ? (
          <>
            <button
              onClick={() => onRestore(note.id)}
              className="text-sm px-3 py-1.5 rounded-full bg-sage/15 text-sage hover:bg-sage/25 transition-colors"
            >
              Restaurar
            </button>
            <button
              onClick={() => onDeleteForever(note.id)}
              className="text-sm px-3 py-1.5 rounded-full text-leather hover:bg-leather/10 transition-colors"
            >
              Eliminar
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onTrash(note.id)}
              className="w-9 h-9 flex items-center justify-center rounded-full text-ink-soft dark:text-night-text/60 hover:bg-ink/5 dark:hover:bg-night-text/10"
              title="Mover a la papelera"
            >
              🗑️
            </button>
            <button
              onClick={handleSave}
              disabled={!dirty}
              className="text-sm px-4 py-1.5 rounded-full bg-leather text-parchment disabled:opacity-40 disabled:cursor-default hover:bg-leather-deep transition-colors"
            >
              Guardar
            </button>
          </>
        )}
      </header>

      <main className="flex-1 px-4 md:px-8 py-6 pb-24 max-w-3xl w-full mx-auto">
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
          className="w-full font-display text-2xl md:text-3xl bg-transparent focus:outline-none
                     text-ink dark:text-night-text placeholder:text-ink-soft/40 mb-4 disabled:opacity-60"
        />
        <textarea
          ref={textareaRef}
          value={body}
          onChange={(e) => {
            setBody(e.target.value)
            // El cursor se mueve junto con el texto que se escribe.
            requestAnimationFrame(syncCursor)
          }}
          onClick={syncCursor}
          onKeyUp={syncCursor}
          onSelect={syncCursor}
          disabled={note.trashed}
          placeholder="Escribe aquí… (ej. Filipenses 4:6, 7)"
          rows={10}
          className="w-full bg-transparent focus:outline-none resize-none
                     text-ink dark:text-night-text placeholder:text-ink-soft/40 leading-relaxed disabled:opacity-60"
        />

        {!note.trashed && (
          <div className="mt-8 pt-5 border-t border-ink/[0.06] dark:border-night-text/[0.06]">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-soft/60 dark:text-night-text/40">
                Notas enlazadas
              </p>
              <button
                onClick={() => setShowLinkPicker(true)}
                className="text-xs text-leather dark:text-gilt-soft hover:underline underline-offset-2"
              >
                + Enlazar nota
              </button>
            </div>

            {linkedNotes.length === 0 ? (
              <p className="text-sm text-ink-soft/50 dark:text-night-text/30">
                Sin notas enlazadas todavía.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {linkedNotes.map((n) => (
                  <div
                    key={n.id}
                    className="group flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-full
                               bg-white/60 dark:bg-night-surface border border-ink/10 dark:border-night-text/10
                               hover:border-gilt/40 transition-colors"
                  >
                    <button
                      onClick={() => openLinkedNote(n.id)}
                      className="text-sm text-ink dark:text-night-text max-w-[180px] truncate"
                      title={n.title || 'Sin título'}
                    >
                      🔗 {n.title || 'Sin título'}
                    </button>
                    <button
                      onClick={() => removeLink(n.id)}
                      className="w-5 h-5 flex items-center justify-center rounded-full text-xs
                                 text-ink-soft/40 dark:text-night-text/30 hover:text-leather dark:hover:text-gilt-soft
                                 hover:bg-ink/5 dark:hover:bg-night-text/10 transition-colors"
                      aria-label="Quitar enlace"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {!note.trashed && (
        <VerseFloatingCard
          text={body}
          cursorPos={cursorPos}
          onNeedImport={onNeedImport}
          onActiveChange={setHasActiveVerse}
        />
      )}

      {showLinkPicker && (
        <LinkNotePicker
          notes={allNotes}
          excludeId={note.id}
          excludeIds={linkedNoteIds}
          onPick={addLink}
          onClose={() => setShowLinkPicker(false)}
        />
      )}
    </div>
  )
}
