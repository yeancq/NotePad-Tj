import { useState } from 'react'
import { motion } from 'framer-motion'
import { ICON_CHOICES, FolderIcon, suggestIconKey, resolveFolderIconKey } from '../data/folderIcons.jsx'

export default function NewFolderDialog({ initial, parentName, onCreate, onClose, onDelete }) {
  const [name, setName] = useState(initial?.name || '')
  const [icon, setIcon] = useState(resolveFolderIconKey(initial?.icon) || 'folder')
  const [iconTouched, setIconTouched] = useState(Boolean(initial))
  const isEdit = Boolean(initial)

  const handleNameChange = (value) => {
    setName(value)
    if (!iconTouched) setIcon(suggestIconKey(value))
  }

  const handleCreate = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    onCreate(trimmed, icon)
  }

  // Antes este botón llamaba a onDelete() directamente, sin confirmar —
  // inconsistente con el menú de la tarjeta de carpeta (FolderCard.jsx),
  // que sí pregunta. Ahora ambos caminos confirman igual. Las notas de la
  // carpeta se mueven a la papelera, no se borran para siempre (ver
  // deleteFolderAndContents en App.jsx).
  const handleDeleteClick = () => {
    if (window.confirm(`¿Eliminar la carpeta "${initial?.name}"? Sus notas se moverán a la papelera.`)) {
      onDelete?.()
    }
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
        <h2 className={`font-display text-lg text-ink dark:text-night-text ${!isEdit && parentName ? 'mb-1' : 'mb-3'}`}>
          {isEdit ? 'Editar carpeta' : 'Nueva carpeta'}
        </h2>
        {!isEdit && parentName && (
          <p className="text-xs text-ink-soft/60 dark:text-night-text/40 mb-3">
            Se creará dentro de <strong>{parentName}</strong>
          </p>
        )}

        <div className="flex gap-2 mb-3">
          <div className="w-11 h-11 shrink-0 rounded-full bg-white/60 dark:bg-night-surface-2 border border-ink/10 dark:border-night-text/10 flex items-center justify-center text-leather dark:text-gilt-soft">
            <FolderIcon icon={icon} className="w-5 h-5" strokeWidth={1.75} />
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
          {ICON_CHOICES.map((key) => (
            <button
              key={key}
              onClick={() => {
                setIcon(key)
                setIconTouched(true)
              }}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors
                ${
                  icon === key
                    ? 'bg-leather/15 ring-2 ring-leather dark:ring-gilt-soft text-leather dark:text-gilt-soft'
                    : 'text-ink-soft dark:text-night-text/60 hover:bg-ink/5 dark:hover:bg-night-text/10'
                }`}
            >
              <FolderIcon icon={key} className="w-[18px] h-[18px]" strokeWidth={1.75} />
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center gap-2">
          {isEdit && onDelete ? (
            <button
              onClick={handleDeleteClick}
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
