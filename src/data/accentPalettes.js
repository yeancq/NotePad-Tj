// Cada acento se define con UN solo color base; las variantes "deep" (botones,
// estados activos) y "soft" (insignias, texto en modo oscuro) se derivan
// automáticamente ajustando el brillo — así el usuario solo elige un color y
// todo el resto de la app se acopla sin tener que tocar cada componente.
export const accentPalettes = [
  { id: 'leather', name: 'Cuero (original)', base: '#6b1e23' },
  { id: 'blue', name: 'Azul', base: '#2f6fed' },
  { id: 'teal', name: 'Verde azulado', base: '#0f9488' },
  { id: 'orange', name: 'Naranja', base: '#e08a1e' },
  { id: 'green', name: 'Verde', base: '#4c9a3f' },
  { id: 'purple', name: 'Morado', base: '#8e3fc9' },
]

function hexToHsl(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      default:
        h = (r - g) / d + 4
    }
    h /= 6
  }
  return [h * 360, s * 100, l * 100]
}

function hslToHex(h, s, l) {
  s /= 100
  l /= 100
  const k = (n) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  const toHex = (x) =>
    Math.round(x * 255)
      .toString(16)
      .padStart(2, '0')
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`
}

/** Variante más oscura del color base (para botones y estados activos). */
export function deepen(hex, amount = 12) {
  const [h, s, l] = hexToHsl(hex)
  return hslToHex(h, s, Math.max(0, l - amount))
}

/** Variante más clara del color base (para insignias y texto en modo oscuro). */
export function lighten(hex, amount = 18) {
  const [h, s, l] = hexToHsl(hex)
  return hslToHex(h, s, Math.min(100, l + amount))
}
