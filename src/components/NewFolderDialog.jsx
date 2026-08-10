import { useState } from 'react'
import { motion } from 'framer-motion'

const ICON_CHOICES = ['📁', '📚', '🏫', '🗂️', '📌', '🎯', '🌱', '✝️', '🙏', '📖', '🧭', '🎟️', '📜', '🗓️', '⭐']

// Sugiere un ícono más apropiado según el nombre, si el usuario no elige uno.
function suggestIcon(name) {
  const n = name.toLowerCase()
  if (/escuela/.test(n)) return '🏫'
  if (/estudio/.test(n)) return '📖'
  if (/reuni/.test(n)) return '🗓️'
  if (/predicaci/.test(n)) return '🧭'
  if (/asamblea|congreso/.test(n)) return '🎟️'
  return '📁'
}

export default function NewFolderDialog({ initial, onCreate, onClose, onDelete }) {
  const [name, setName] = useState(initial?.name || '')
  const [icon, setIcon] = useState(initial?.icon || '📁')
  const [iconTouched, setIconTouched] = useState(Boolean(initial))
  const isEdit = Boolean(initial)

  const handleNameChange = (value) => {
    setName(value)
    if (!iconTouched) setIcon(suggestIcon(value))
  }

  const handleCreate = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    onCreate(trimmed, icon)
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
        <h2 className="font-display text-lg text-ink dark:text-night-text mb-3">
          {isEdit ? 'Editar carpeta' : 'Nueva carpeta'}
        </h2>

        <div className="flex gap-2 mb-3">
          <div className="w-11 h-11 shrink-0 rounded-full bg-white/60 dark:bg-night-surface-2 border border-ink/10 dark:border-night-text/10 flex items-center justify-center text-xl">
            {icon}
          </div>
          <input
            autoFocus
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="Nombre de la carpeta"
            className="flex-1 min-w-0 bg-white/60 dark:bg-night-surface-2 border border-ink/10 dark:border-night-text/10
                       rounded-lg px-3 py-2 text-sm text-ink dark:text-night-text
                       placeholder:text-ink-soft/50 focus:outline-none focus:ring-2 focus:ring-gilt/60"
          />
        </div>

        <p className="text-xs text-ink-soft/60 dark:text-night-text/40 mb-1.5">Ícono</p>
        <div className="flex flex-wrap gap-1.5 mb-5">
          {ICON_CHOICES.map((ic) => (
            <button
              key={ic}
              onClick={() => {
                setIcon(ic)
                setIconTouched(true)
              }}
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-colors
                ${
                  icon === ic
                    ? 'bg-leather/15 ring-2 ring-leather dark:ring-gilt-soft'
                    : 'hover:bg-ink/5 dark:hover:bg-night-text/10'
                }`}
            >
              {ic}
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center gap-2">
          {isEdit && onDelete ? (
            <button
              onClick={onDelete}
              className="px-3 py-2 rounded-full text-sm text-leather hover:bg-leather/10 transition-colors"
            >
              Eliminar
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
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
              {isEdit ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
