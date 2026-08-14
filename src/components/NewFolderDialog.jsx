import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Folder,
  BookOpen,
  School,
  Archive,
  Pin,
  Target,
  Leaf,
  Church,
  Heart,
  Book,
  Compass,
  Ticket,
  Scroll,
  Calendar,
  Star,
  Trash2,
} from 'lucide-react'

// Mapeo de emoji a icono de Lucide (para visualización)
const ICON_MAP = {
  '📁': Folder,
  '📚': BookOpen,
  '🏫': School,
  '🗂️': Archive,
  '📌': Pin,
  '🎯': Target,
  '🌱': Leaf,
  '✝️': Church,
  '🙏': Heart,
  '📖': Book,
  '🧭': Compass,
  '🎟️': Ticket,
  '📜': Scroll,
  '🗓️': Calendar,
  '⭐': Star,
}

// Lista de emojis (se mantienen como valor interno)
const ICON_CHOICES = Object.keys(ICON_MAP)

// Sugiere un emoji según el nombre (igual que antes)
function suggestIcon(name) {
  const n = name.toLowerCase()
  if (/escuela/.test(n)) return '🏫'
  if (/estudio/.test(n)) return '📖'
  if (/reuni/.test(n)) return '🗓️'
  if (/predicaci/.test(n)) return '🧭'
  if (/asamblea|congreso/.test(n)) return '🎟️'
  return '📁'
}

export default function NewFolderDialog({ initial, parentName, onCreate, onClose, onDelete }) {
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

  // Obtener el componente de Lucide para un emoji
  const IconComponent = ICON_MAP[icon] || Folder

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 dark:bg-black/50 px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-surface rounded-2xl shadow-xl p-5 border border-theme"
      >
        <h2 className={`font-display text-lg text-theme ${!isEdit && parentName ? 'mb-1' : 'mb-3'}`}>
          {isEdit ? 'Editar carpeta' : 'Nueva carpeta'}
        </h2>
        {!isEdit && parentName && (
          <p className="text-xs text-muted/60 mb-3">
            Se creará dentro de <strong>{parentName}</strong>
          </p>
        )}

        <div className="flex gap-2 mb-3">
          <div className="w-11 h-11 shrink-0 rounded-full bg-surface-2 border border-theme flex items-center justify-center text-xl text-accent">
            <IconComponent className="w-6 h-6" strokeWidth={1.8} />
          </div>
          <input
            autoFocus
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="Nombre de la carpeta"
            className="flex-1 min-w-0 bg-surface-2 border border-theme
                       rounded-lg px-3 py-2 text-sm text-theme
                       placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/60"
          />
        </div>

        <p className="text-xs text-muted mb-1.5">Ícono</p>
        <div className="flex flex-wrap gap-1.5 mb-5">
          {ICON_CHOICES.map((ic) => {
            const LucideIcon = ICON_MAP[ic]
            const isSelected = icon === ic
            return (
              <button
                key={ic}
                onClick={() => {
                  setIcon(ic)
                  setIconTouched(true)
                }}
                className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-colors
                  ${
                    isSelected
                      ? 'bg-accent/15 ring-2 ring-accent text-accent'
                      : 'hover:bg-ink/5 dark:hover:bg-night-text/10 text-muted'
                  }`}
              >
                <LucideIcon className="w-5 h-5" strokeWidth={1.8} />
              </button>
            )
          })}
        </div>

        <div className="flex justify-between items-center gap-2">
          {isEdit && onDelete ? (
            <button
              onClick={onDelete}
              className="px-3 py-2 rounded-full text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" /> Eliminar
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-full text-sm text-muted hover:bg-ink/5 dark:hover:bg-night-text/10 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              disabled={!name.trim()}
              className="px-4 py-2 rounded-full text-sm bg-accent text-surface disabled:opacity-40 hover:bg-accent/90 transition-colors"
            >
              {isEdit ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
