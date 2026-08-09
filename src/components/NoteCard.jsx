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

export default function NoteCard({ note, onOpen, onTogglePin }) {
  const meta = folderMeta[note.folder] ?? { icon: '📄', color: 'ink' }

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
    </article>
  )
}
