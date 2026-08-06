import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const EASE = [0.2, 0, 0, 1]

export default function LinkNotePicker({ notes, excludeId, excludeIds, onPick, onClose }) {
  const [query, setQuery] = useState('')

  const options = notes.filter(
    (n) =>
      !n.trashed &&
      n.id !== excludeId &&
      !excludeIds.includes(n.id) &&
      (n.title || 'Sin título').toLowerCase().includes(query.toLowerCase())
  )

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35, ease: EASE }}
        className="fixed inset-0 z-40 bg-ink/30 dark:bg-black/50 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 24, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 24, opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.4, ease: EASE }}
          onClick={(e) => e.stopPropagation()}
          className="w-full sm:max-w-md bg-parchment dark:bg-night-surface rounded-t-3xl sm:rounded-2xl
                     border border-ink/[0.06] dark:border-night-text/[0.06]
                     shadow-2xl shadow-ink/20 max-h-[75vh] flex flex-col overflow-hidden"
        >
          <div className="px-5 pt-5 pb-3">
            <p className="font-display text-lg text-ink dark:text-night-text mb-3">Enlazar nota</p>
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por título…"
              className="w-full bg-white/60 dark:bg-night-surface-2 border border-ink/10 dark:border-night-text/10
                         rounded-full px-4 py-2 text-sm text-ink dark:text-night-text
                         placeholder:text-ink-soft/50 dark:placeholder:text-night-text/30
                         focus:outline-none focus:ring-2 focus:ring-gilt/50 transition-shadow"
            />
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-4">
            {options.length === 0 ? (
              <p className="text-sm text-ink-soft/60 dark:text-night-text/40 px-4 py-6 text-center">
                No hay notas que coincidan.
              </p>
            ) : (
              options.map((n) => (
                <button
                  key={n.id}
                  onClick={() => onPick(n.id)}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-ink/5 dark:hover:bg-night-text/5 transition-colors"
                >
                  <p className="text-sm text-ink dark:text-night-text truncate">
                    {n.title || 'Sin título'}
                  </p>
                  <p className="text-xs text-ink-soft/60 dark:text-night-text/40 truncate">
                    {n.body?.slice(0, 60) || 'Nota vacía'}
                  </p>
                </button>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
