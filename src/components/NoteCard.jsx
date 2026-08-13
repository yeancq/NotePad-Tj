import { useState } from 'react'
import { Pin, Folder as FolderIcon, Trash2, Check } from 'lucide-react'
import { stripHtml } from '../lib/htmlUtils'

const folderMeta = {
  estudio: { icon: '📖', color: 'sage' },
  reunion: { icon: '🗓️', color: 'leather' },
  predicacion: { icon: '🧭', color: 'gilt' },
  asamblea: { icon: '🎟️', color: 'leather' },
}

function formatDate(iso) {
  const d = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((now - d) / 86400000)
  if (diffDays === 0) return 'Hoy'
  if (diffDays === 1) return 'Ayer'
  if (diffDays < 7) return `Hace ${diffDays} días`
  return d.toLocaleDateString('es', { day: 'numeric', month: 'short' })
}

export default function NoteCard({ note, folders = [], onOpen, onTogglePin, onMoveNote, onDelete }) {
  const [showMenu, setShowMenu] = useState(false)
  const meta = folderMeta[note.folder] ?? { icon: '📄', color: 'ink' }

  const availableFolders = folders.filter(f => !f.parentId).map(f => ({
    ...f,
    children: folders.filter(c => c.parentId === f.id)
  }))

  const handleMove = (folderId, e) => {
    e.stopPropagation()
    if (folderId === note.folder) {
      setShowMenu(false)
      return
    }
    onMoveNote?.(note.id, folderId)
    setShowMenu(false)
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    setShowMenu(false)
    if (window.confirm(`¿Eliminar la nota "${note.title || 'Sin título'}" permanentemente?`)) {
      onDelete?.(note.id)
    }
  }

  return (
    <article
      onClick={onOpen}
      className="group relative bg-surface hover:bg-surface-2
                 border border-theme rounded-xl p-4 shadow-card
                 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
    >
      {note.pinned && (
        <span
          className="absolute -top-0 right-4 w-4 h-6 bg-accent rounded-b-sm shadow-sm"
          style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 75%, 0 100%)' }}
          title="Nota fijada"
        />
      )}

      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span className="text-xs text-muted flex items-center gap-1">
          <span>{meta.icon}</span>
          {formatDate(note.updatedAt)}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onTogglePin()
            }}
            className={`text-sm opacity-0 group-hover:opacity-100 transition-opacity ${
              note.pinned ? 'opacity-100' : ''
            }`}
            title={note.pinned ? 'Quitar de fijadas' : 'Fijar nota'}
          >
            <Pin className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(!showMenu)
            }}
            className="text-sm opacity-0 group-hover:opacity-100 transition-opacity"
            title="Mover a otra carpeta"
          >
            <FolderIcon className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleDelete(e)
            }}
            className="text-sm opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
            title="Eliminar nota"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <h3 className="font-display text-lg leading-snug text-theme mb-1.5 line-clamp-2">
        {note.title}
      </h3>

      <p className="text-sm text-soft line-clamp-2 mb-3">
        {stripHtml(note.body)}
      </p>

      <div className="flex items-center gap-2 flex-wrap">
        {note.tags.map((tag) => (
          <span
            key={tag}
            className="text-[11px] px-2 py-0.5 rounded-full bg-primary-soft/30 text-primary-text"
          >
            #{tag}
          </span>
        ))}
      </div>

      {showMenu && (
        <div
          className="absolute right-0 top-full mt-1 w-56 bg-surface
                     rounded-lg shadow-lg border border-theme p-1.5 z-20"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted px-2 py-1.5">
            Mover a carpeta
          </p>
          <div className="max-h-48 overflow-y-auto">
            {availableFolders.map((folder) => (
              <div key={folder.id}>
                <button
                  onClick={(e) => handleMove(folder.id, e)}
                  className={`w-full text-left px-2 py-1.5 text-sm rounded-md transition-colors flex items-center gap-2
                    ${note.folder === folder.id
                      ? 'bg-ink/5 dark:bg-night-text/10 text-muted cursor-default'
                      : 'hover:bg-ink/5 dark:hover:bg-night-text/10 text-theme'
                    }`}
                  disabled={note.folder === folder.id}
                >
                  <span>{folder.icon || '📁'}</span>
                  <span className="flex-1 truncate">{folder.name}</span>
                  {note.folder === folder.id && <Check className="w-3.5 h-3.5" />}
                </button>
                {folder.children.length > 0 && (
                  <div className="ml-6">
                    {folder.children.map((child) => (
                      <button
                        key={child.id}
                        onClick={(e) => handleMove(child.id, e)}
                        className={`w-full text-left px-2 py-1 text-sm rounded-md transition-colors flex items-center gap-2
                          ${note.folder === child.id
                            ? 'bg-ink/5 dark:bg-night-text/10 text-muted cursor-default'
                            : 'hover:bg-ink/5 dark:hover:bg-night-text/10 text-theme'
                          }`}
                        disabled={note.folder === child.id}
                      >
                        <span>{child.icon || '📁'}</span>
                        <span className="flex-1 truncate">↳ {child.name}</span>
                        {note.folder === child.id && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  )
}
