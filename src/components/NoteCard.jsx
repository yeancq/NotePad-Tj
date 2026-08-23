import { useState } from 'react'
import { stripHtml } from '../lib/htmlUtils'
import NoteLinkDialog from './NoteLinkDialog'

function formatDate(iso) {
  const d = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((now - d) / 86400000)
  if (diffDays === 0) return 'Hoy'
  if (diffDays === 1) return 'Ayer'
  if (diffDays < 7) return `Hace ${diffDays} días`
  return d.toLocaleDateString('es', { day: 'numeric', month: 'short' })
}

export default function NoteCard({
  note,
  folders = [],
  allNotes = [],
  onOpen,
  onTogglePin,
  onMoveNote,
  onTrash,
  onLink,
}) {
  const [showMenu, setShowMenu] = useState(false)
  const [showLinkDialog, setShowLinkDialog] = useState(false)

  // Ícono real de la carpeta a la que pertenece esta nota. Antes se usaba un
  // mapa fijo (folderMeta) con solo 4 carpetas predeterminadas, así que
  // cualquier carpeta creada por el usuario caía siempre en un 📄 genérico.
  // Ahora se busca directamente en la lista de carpetas que ya llega como
  // prop, igual que hace NoteEditor con el <select> de carpeta.
  const noteFolder = folders.find((f) => f.id === note.folder)
  const folderIcon = noteFolder?.icon || '📄'

  const availableFolders = folders.filter(f => !f.parentId).map(f => ({
    ...f,
    children: folders.filter(c => c.parentId === f.id)
  }))

  const handleMove = (folderId, e) => {
    e.stopPropagation()
    if (folderId === note.folder) {
      setShowMenu(fa
