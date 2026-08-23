import {
  Folder,
  FolderOpen,
  Library,
  School,
  MapPin,
  Target,
  Sprout,
  Cross,
  Heart,
  BookOpen,
  Compass,
  Ticket,
  ScrollText,
  CalendarDays,
  Star,
  FileText,
} from 'lucide-react'

// Mapa central: clave interna -> componente de ícono (lucide-react).
// "file" no aparece en el selector de la Tanda 1 (es el ícono por defecto
// de una NOTA sin carpeta, no una opción elegible para carpetas), pero vive
// aquí para que todo el mapeo de íconos quede en un solo lugar.
export const folderIconMap = {
  folder: Folder,
  library: Library,
  school: School,
  archive: FolderOpen,
  pin: MapPin,
  target: Target,
  sprout: Sprout,
  cross: Cross,
  heart: Heart,
  book: BookOpen,
  compass: Compass,
  ticket: Ticket,
  scroll: ScrollText,
  calendar: CalendarDays,
  star: Star,
  file: FileText,
}

// Las 15 opciones que se muestran en el selector de ícono de carpeta
// (antes eran emojis sueltos en NewFolderDialog.jsx).
export const ICON_CHOICES = [
  'folder',
  'library',
  'school',
  'archive',
  'pin',
  'target',
  'sprout',
  'cross',
  'heart',
  'book',
  'compass',
  'ticket',
  'scroll',
  'calendar',
  'star',
]

// Compatibilidad con datos ya guardados: las carpetas creadas antes de este
// cambio tienen folder.icon guardado como un emoji (ej. "📖"). Esta tabla
// traduce esos emojis viejos a la clave nueva correspondiente, para que las
// carpetas existentes se vean con el ícono SVG sin tener que tocar los
// datos guardados en IndexedDB.
const LEGACY_EMOJI_TO_KEY = {
  '📁': 'folder',
  '📚': 'library',
  '🏫': 'school',
  '🗂️': 'archive',
  '📌': 'pin',
  '🎯': 'target',
  '🌱': 'sprout',
  '✝️': 'cross',
  '🙏': 'heart',
  '📖': 'book',
  '🧭': 'compass',
  '🎟️': 'ticket',
  '📜': 'scroll',
  '🗓️': 'calendar',
  '⭐': 'star',
  '📄': 'file',
}

/** Devuelve la clave de ícono válida para un valor guardado (clave nueva o emoji viejo). */
export function resolveFolderIconKey(icon) {
  if (!icon) return 'folder'
  if (folderIconMap[icon]) return icon
  if (LEGACY_EMOJI_TO_KEY[icon]) return LEGACY_EMOJI_TO_KEY[icon]
  return 'folder'
}

/**
 * Componente listo para usar en cualquier lugar donde antes se imprimía
 * folder.icon como emoji: <FolderIcon icon={folder.icon} className="..." />
 */
export function FolderIcon({ icon, className, ...props }) {
  const key = resolveFolderIconKey(icon)
  const Icon = folderIconMap[key] || Folder
  return <Icon className={className} {...props} />
}

/** Sugiere una clave de ícono según el nombre de la carpeta (para NewFolderDialog). */
export function suggestIconKey(name) {
  const n = name.toLowerCase()
  if (/escuela/.test(n)) return 'school'
  if (/estudio/.test(n)) return 'book'
  if (/reuni/.test(n)) return 'calendar'
  if (/predicaci/.test(n)) return 'compass'
  if (/asamblea|congreso/.test(n)) return 'ticket'
  return 'folder'
}
