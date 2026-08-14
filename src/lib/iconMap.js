// src/lib/iconMap.js
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
} from 'lucide-react'

// Mapeo de emoji a componente de Lucide
export const ICON_MAP = {
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

// Lista de emojis disponibles
export const ICON_CHOICES = Object.keys(ICON_MAP)

// Componente para renderizar un icono a partir de un emoji
export function FolderIcon({ emoji, className = 'w-5 h-5', strokeWidth = 1.8, ...props }) {
  const IconComponent = ICON_MAP[emoji] || Folder // por defecto Folder
  return <IconComponent className={className} strokeWidth={strokeWidth} {...props} />
}
