import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const EASE = [0.2, 0, 0, 1]

const actions = [
  { key: 'outline', icon: '📜', label: 'Importar bosquejo' },
  { key: 'program', icon: '📅', label: 'Programas de asambleas' },
  { key: 'folder', icon: '📁', label: 'Nueva carpeta' },
  { key: 'note', icon: '📝', label: 'Nueva nota' },
]

export default function Fab({ onNewNote, onNewFolder, onImportProgram, onImportOutline }) {
  const [open, setOpen] = useState(false)

  const handlers = {
    outline: () => {
      setOpen(false)
      onImportOutline()
    },
    program: () => {
      setOpen(false)
      onImportProgram()
    },
    folder: () => {
      setOpen(false)
      onNewFolder()
    },
    note: () => {
      setOpen(false)
      onNewNote()
    },
  }

  return (
    <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-30 flex flex-col items-end gap-2.5">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="flex flex-col items-end gap-2.5"
          >
            {actions.map((a, i) => (
              <motion.button
                key={a.key}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.35, ease: EASE, delay: i * 0.04 }}
                onClick={handlers[a.key]}
                className="flex items-center gap-2 pl-4 pr-5 py-2.5 rounded-full
                           bg-gilt/15 dark:bg-gilt/20 text-leather dark:text-gilt-soft
                           text-sm font-medium shadow-sm backdrop-blur-sm
                           hover:bg-gilt/25 dark:hover:bg-gilt/30 transition-colors"
              >
                <span className="text-base">{a.icon}</span>
                {a.label}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Cerrar menú' : 'Crear'}
        animate={{ rotate: open ? 45 : 0 }}
        transition={{ duration: 0.35, ease: EASE }}
        className="w-14 h-14 rounded-full bg-leather dark:bg-leather-deep text-parchment
                   shadow-lg shadow-leather/30 flex items-center justify-center
                   text-2xl leading-none ring-4 ring-gilt/20"
      >
        +
      </motion.button>
    </div>
  )
}
