import { useState, useEffect, useRef } from 'react'
import VersePanel from './VersePanel'
import SpeakerMode from './SpeakerMode'
import SpeakerIcon from './SpeakerIcon'
import RichEditor from './RichEditor'
import NoteLinkDialog from './NoteLinkDialog'
import { ensureHtml } from '../lib/htmlUtils'
import { useBackHandler } from '../hooks/useBackHandler'

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
  const [cursorPos, setCursorPos] = useState(0)
  const [hasActiveVerse, setHasActiveVerse] = useState(false)
  const [showSpeaker, setShowSpeaker] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showLinkDialog, setShowLinkDialog] = useState(false)

  const autoSaveTimer = useRef(null)

  const dirty = title !== note.title || body !== note.body || folder !== note.folder

  const handleSave = () => {
    if (!dirty) return
    setSaving(true)
    onSave({ ...note, title: title.trim() || 'Sin título', body, folder })
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
  }, [title, body, folder])

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

      <div className="flex-1 min-h-0 min-w-0 overflow-y-auto px-4 md:px-8 py-6 pb-24">
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
            className="w-full font-display text-2xl md:text-3xl bg-transparent focus:outline-none text-ink dark:text-night-text placeholder:text-ink-soft/40 mb-4 disabled:opacity-60"
          />
          <RichEditor
            html={body}
            onChange={setBody}
            onCursorChange={(text, offset) => {
              setPlainText(text)
              setCursorPos(offset)
            }}
            disabled={note.trashed}
            placeholder="Escribe aquí… (ej. Filipenses 4:6, 7)"
          />

          {!note.trashed && (
            <div className="mt-10 pt-6 border-t border-ink/10 dark:border-night-text/10">
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
