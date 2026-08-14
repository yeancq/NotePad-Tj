```javascript
import * as Icons from 'lucide-react'
import React from 'react'

// Mapeo de emoji a componente de Lucide
const iconMap = {
  '📁': Icons.Folder,
  '📚': Icons.BookOpen,
  '🏫': Icons.School,
  '🗂️': Icons.Archive,
  '📌': Icons.Pin,
  '🎯': Icons.Target,
  '🌱': Icons.Leaf,
  '✝️': Icons.Church,
  '🙏': Icons.Heart,
  '📖': Icons.Book,
  '🧭': Icons.Compass,
  '🎟️': Icons.Ticket,
  '📜': Icons.Scroll,
  '🗓️': Icons.Calendar,
  '⭐': Icons.Star,
}

// Lista de emojis disponibles
export const ICON_CHOICES = Object.keys(iconMap)

// Componente para renderizar un icono a partir de un emoji
export function FolderIcon({ emoji, className = 'w-5 h-5', strokeWidth = 1.8, ...props }) {
  const IconComponent = iconMap[emoji] || Icons.Folder
  return React.createElement(IconComponent, { className, strokeWidth, ...props })
}
```
