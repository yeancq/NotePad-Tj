import { useRef, useState } from 'react'
import VersePanel from './VersePanel'

export default function NoteEditor({
  note,
  folders,
  onBack,
  onSave,
  onTrash,
  onRestore,
  onDeleteForever,
  onNeedImport,
}) {
  const [title, setTitle] = useState(note.title)
  const [body, setBody] = useState(note.body)
  const [folder, setFolder] = useState(note.folder)
  const [cursorPos, setCursorPos] = useState(0)
  const [hasActiveVerse, setHasActiveVerse] = useState(false)
  const textareaRef = useRef(null)

  const dirty = title !== note.title || body !== note.body || folder !== note.folder

  const handleSave = () => {
    onSave({ ...note, title: title.trim() || 'Sin título', body, folder })
  }

  const syncCursor = () => {
    if (textareaRef.current) setCursorPos(textareaRef.current.selectionStart)
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen">
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
          {folders
            .filter((f) => !f.parentId)
            .map((f) => (
              <FolderOptionGroup key={f.id} folder={f} folders={folders} />
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

      <div className="flex-1 flex flex-row min-h-0 min-w-0 overflow-x-hidden">
        <main className="flex-1 min-w-0 overflow-y-auto px-4 md:px-8 py-6 pb-24">
          <div className="max-w-3xl w-full mx-auto">
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
              rows={16}
              className="w-full bg-transparent focus:outline-none resize-none
                         text-ink dark:text-night-text placeholder:text-ink-soft/40 leading-relaxed disabled:opacity-60"
            />
          </div>
        </main>

        {!note.trashed && (
          <VersePanel
            text={body}
            cursorPos={cursorPos}
            onNeedImport={onNeedImport}
            onActiveChange={setHasActiveVerse}
          />
        )}
      </div>
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
