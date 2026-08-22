import { useEffect, useState } from 'react'
import { get, set } from 'idb-keyval'

// A partir de esta versión, las notas se guardan en IndexedDB (a través de
// idb-keyval, la misma librería que ya usamos para la Biblia) en vez de
// localStorage. localStorage tiene un límite típico de 5-10 MB por sitio y
// falla sin avisar al usuario si se supera — un riesgo real para notas con
// HTML enriquecido (negrita, resaltados, encabezados) acumuladas durante
// meses. IndexedDB soporta muchísimo más espacio.
//
// El nombre del hook se mantiene igual (useLocalStorageNotes) para no tener
// que tocar sus puntos de uso en App.jsx.
const STORAGE_KEY = 'cuaderno:notes'

export function useLocalStorageNotes(initialNotes) {
  const [notes, setNotes] = useState(initialNotes)
  const [loaded, setLoaded] = useState(false)

  // Carga inicial: primero busca en IndexedDB. Si no hay nada ahí todavía
  // (por ejemplo, la primera vez que se abre esta versión de la app),
  // intenta migrar los datos desde localStorage, donde se guardaban antes.
  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const stored = await get(STORAGE_KEY)
        if (stored !== undefined) {
          if (!cancelled) setNotes(stored)
          if (!cancelled) setLoaded(true)
          return
        }
      } catch (e) {
        console.error('No se pudo leer las notas de IndexedDB', e)
      }

      // Migración única desde localStorage (versiones anteriores de la app).
      // No se borra el dato viejo de localStorage por seguridad — queda ahí
      // sin usarse, como respaldo silencioso.
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (!cancelled) setNotes(parsed)
          await set(STORAGE_KEY, parsed)
        }
      } catch (e) {
        console.error('No se pudo migrar las notas desde localStorage', e)
      }

      if (!cancelled) setLoaded(true)
    })()

    return () => {
      cancelled = true
    }
  }, [])

  // Guarda cada cambio en IndexedDB. El guard "loaded" evita que el valor
  // inicial (antes de terminar la carga de arriba) sobrescriba por error
  // datos reales que todavía se están migrando o leyendo.
  useEffect(() => {
    if (!loaded) return
    set(STORAGE_KEY, notes).catch((e) => {
      console.error('No se pudo guardar las notas en IndexedDB', e)
    })
  }, [notes, loaded])

  return [notes, setNotes, loaded]
}
