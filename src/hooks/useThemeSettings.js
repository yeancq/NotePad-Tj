import { useEffect, useState } from 'react'
import { accentPalettes, deepen, lighten } from '../data/accentPalettes'

const THEME_KEY = 'cuaderno:themeMode'
const ACCENT_KEY = 'cuaderno:accent'

function getSystemDark() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

export function useThemeSettings() {
  const [themeMode, setThemeMode] = useState(
    () => localStorage.getItem(THEME_KEY) || 'system'
  )
  const [accentId, setAccentId] = useState(
    () => localStorage.getItem(ACCENT_KEY) || 'leather'
  )
  const [systemDark, setSystemDark] = useState(getSystemDark)

  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e) => setSystemDark(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  const dark = themeMode === 'system' ? systemDark : themeMode === 'dark'

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  useEffect(() => {
    localStorage.setItem(THEME_KEY, themeMode)
  }, [themeMode])

  useEffect(() => {
    localStorage.setItem(ACCENT_KEY, accentId)
    const palette = accentPalettes.find((p) => p.id === accentId) || accentPalettes[0]
    const root = document.documentElement.style
    root.setProperty('--color-leather', palette.base)
    root.setProperty('--color-leather-deep', deepen(palette.base))
    root.setProperty('--color-gilt', deepen(lighten(palette.base, 26), 4))
    root.setProperty('--color-gilt-soft', lighten(palette.base, 30))
    // Color de acento con opacidad para bordes y sombras de tarjetas
    // 4d = 30% opacidad, 28 = 16% opacidad (hex de 0-255)
    root.setProperty('--color-accent-border', palette.base + '4d')
    root.setProperty('--color-accent-glow', palette.base + '28')
  }, [accentId])

  return { themeMode, setThemeMode, accentId, setAccentId, dark }
}
