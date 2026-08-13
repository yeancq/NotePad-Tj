import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Fab({ onNewNote, onNewFolder, onImportProgram, onImportOutline }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
            className="flex flex-col gap-2"
          >
            <FabButton onClick={onNewNote} icon="📝" label="Nueva nota" />
            <FabButton onClick={onNewFolder} icon="📁" label="Nueva carpeta" />
            <FabButton onClick={onImportProgram} icon="🎟️" label="Importar programa" />
            <FabButton onClick={onImportOutline} icon="📄" label="Importar bosquejo" />
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 rounded-full bg-accent text-surface shadow-lg
                   hover:bg-accent/90 hover:scale-105 transition-all duration-200
                   flex items-center justify-center text-3xl"
      >
        {open ? '✕' : '+'}
      </button>
    </div>
  )
}

function FabButton({ onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface text-theme shadow-md
                 border border-theme hover:shadow-lg transition-shadow text-sm"
    >
      <span className="text-base">{icon}</span>
      <span>{label}</span>
    </button>
  )
}
