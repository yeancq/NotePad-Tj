import { useState } from 'react'
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

export default function NoteCard({ note, folders = [], onOpen, onTogglePin, onMoveNote }) {
  const [showMenu, setShowMenu] = useState(false)
  const meta = folderMeta[note.folder] ?? { icon: '📄', color: 'ink' }

  // Obtener carpetas principales y subcarpetas de forma ordenada
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

  return (
    <article
      onClick={onOpen}
      className="group relative bg-white/70 dark:bg-night-surface hover:bg-white dark:hover:bg-night-surface-2
                 border border-ink/10 dark:border-night-text/10 rounded-xl p-4
                 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md
                 hover:shadow-ink/5"
    >
      {note.pinned && (
        <span
          className="absolute -top-0 right-4 w-4 h-6 bg-leather dark:bg-leather-deep rounded-b-sm
                     shadow-sm"
          style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 75%, 0 100%)' }}
          title="Nota fijada"
        />
      )}

      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span className="text-xs text-ink-soft/70 dark:text-night-text/40 flex items-center gap-1">
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
            {note.pinned ? '🔖' : '📌'}
          </button>
          {/* Botón para mover nota */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(!showMenu)
            }}
            className="text-sm opacity-0 group-hover:opacity-100 transition-opacity"
            title="Mover a otra carpeta"
          >
            📂
          </button>
        </div>
      </div>

      <h3 className="font-display text-lg leading-snug text-ink dark:text-night-text mb-1.5 line-clamp-2">
        {note.title}
      </h3>

      <p className="text-sm text-ink-soft dark:text-night-text/60 line-clamp-2 mb-3">
        {stripHtml(note.body)}
      </p>

      <div className="flex items-center gap-2 flex-wrap">
        {note.tags.map((tag) => (
          <span
            key={tag}
            className="text-[11px] px-2 py-0.5 rounded-full bg-sage/15 text-sage dark:text-sage-soft"
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* Menú para mover nota */}
      {showMenu && (
        <div
          className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-night-surface-2 
                     rounded-lg shadow-xl border border-ink/10 dark:border-night-text/10 p-1.5 z-20"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft/40 dark:text-night-text/30 px-2 py-1.5">
            Mover a carpeta
          </p>
          <div className="max-h-48 overflow-y-auto">
            {availableFolders.map((folder) => (
              <div key={folder.id}>
                <button
                  onClick={(e) => handleMove(folder.id, e)}
                  className={`w-full text-left px-2 py-1.5 text-sm rounded-md transition-colors flex items-center gap-2
                    ${note.folder === folder.id 
                      ? 'bg-ink/5 dark:bg-night-text/10 text-ink-soft/50 dark:text-night-text/40 cursor-default' 
                      : 'hover:bg-ink/5 dark:hover:bg-night-text/10 text-ink dark:text-night-text'
                    }`}
                  disabled={note.folder === folder.id}
                >
                  <span>{folder.icon || '📁'}</span>
                  <span className="flex-1 truncate">{folder.name}</span>
                  {note.folder === folder.id && <span className="text-xs">✓</span>}
                </button>
                {/* Subcarpetas */}
                {folder.children.length > 0 && (
                  <div className="ml-6">
                    {folder.children.map((child) => (
                      <button
                        key={child.id}
                        onClick={(e) => handleMove(child.id, e)}
                        className={`w-full text-left px-2 py-1 text-sm rounded-md transition-colors flex items-center gap-2
                          ${note.folder === child.id 
                            ? 'bg-ink/5 dark:bg-night-text/10 text-ink-soft/50 dark:text-night-text/40 cursor-default' 
                            : 'hover:bg-ink/5 dark:hover:bg-night-text/10 text-ink dark:text-night-text'
                          }`}
                        disabled={note.folder === child.id}
                      >
                        <span>{child.icon || '📁'}</span>
                        <span className="flex-1 truncate">↳ {child.name}</span>
                        {note.folder === child.id && <span className="text-xs">✓</span>}
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
