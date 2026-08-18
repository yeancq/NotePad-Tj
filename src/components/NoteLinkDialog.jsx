import { useState } from 'react'
import { motion } from 'framer-motion'
import { stripHtml } from '../lib/htmlUtils'

export default function NoteLinkDialog({
  currentNoteId,
  notes = [],
  linkedNoteIds = [],
  onLink,
  onClose,
}) {
  const [search, setSearch] = useState('')

  const available = notes.filter((n) => {
    if (n.trashed) return false
    if (n.id === currentNoteId) return false
    if (linkedNoteIds.includes(n.id)) return false
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      (n.title || '').toLowerCase().includes(q) ||
      stripHtml(n.body).toLowerCase().includes(q)
    )
  })

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/30 dark:bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.2, 0, 0, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md bg-parchment dark:bg-night-surface rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <h2 className="font-display text-base text-ink dark:text-night-text">
            Enlazar con nota
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-ink-soft/50 dark:text-night-text/40 text-sm hover:bg-ink/5 dark:hover:bg-night-text/10 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="px-4 pb-3 border-b border-ink/10 dark:border-night-text/10">
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar nota…"
            className="w-full bg-white/60 dark:bg-night-surface-2 border border-ink/10 dark:border-night-text/10 rounded-full px-4 py-2 text-sm text-ink dark:text-night-text placeholder:text-ink-soft/50 dark:placeholder:text-night-text/30 focus:outline-none focus:ring-2 focus:ring-gilt/60"
          />
        </div>

        <div className="max-h-72 overflow-y-auto p-2">
          {available.length === 0 ? (
            <p className="text-center text-sm text-ink-soft/50 dark:text-night-text/30 py-8">
              {search.trim()
                ? 'Sin resultados'
                : 'No hay otras notas disponibles para enlazar'}
            </p>
          ) : (
            <div className="space-y-0.5">
              {available.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    onLink(n.id)
                    onClose()
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-ink/5 dark:hover:bg-night-text/10 transition-colors"
                >
                  <p className="font-display text-sm text-ink dark:text-night-text leading-snug truncate">
                    {n.title || 'Sin título'}
                  </p>
                  {stripHtml(n.body) && (
                    <p className="text-xs text-ink-soft/55 dark:text-night-text/35 truncate mt-0.5">
                      {stripHtml(n.body).slice(0, 90)}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="h-2 sm:h-0" />
      </motion.div>
    </div>
  )
}
