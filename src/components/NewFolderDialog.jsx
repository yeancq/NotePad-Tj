import { useState } from 'react'
import { motion } from 'framer-motion'

export default function NewFolderDialog({ onCreate, onClose }) {
  const [name, setName] = useState('')

  const handleCreate = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    onCreate(trimmed)
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-ink/30 dark:bg-black/50 px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-parchment dark:bg-night-surface rounded-2xl shadow-xl p-5"
      >
        <h2 className="font-display text-lg text-ink dark:text-night-text mb-3">Nueva carpeta</h2>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          placeholder="Nombre de la carpeta"
          className="w-full bg-white/60 dark:bg-night-surface-2 border border-ink/10 dark:border-night-text/10
                     rounded-lg px-3 py-2 text-sm text-ink dark:text-night-text
                     placeholder:text-ink-soft/50 focus:outline-none focus:ring-2 focus:ring-gilt/60 mb-4"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full text-sm text-ink-soft dark:text-night-text/60 hover:bg-ink/5 dark:hover:bg-night-text/10 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="px-4 py-2 rounded-full text-sm bg-leather text-parchment disabled:opacity-40 hover:bg-leather-deep transition-colors"
          >
            Crear
          </button>
        </div>
      </motion.div>
    </div>
  )
}
