import { useEffect, useState } from 'react'
import { get, set } from 'idb-keyval'

// Ver comentario en useLocalStorageNotes.js: mismo mecanismo de migración
// desde localStorage a IndexedDB, aplicado aquí a las carpetas.
const STORAGE_KEY = 'cuaderno:folders'

export function useLocalStorageFolders(initialFolders) {
  const [folders, setFolders] = useState(initialFolders)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const stored = await get(STORAGE_KEY)
        if (stored !== undefined) {
          if (!cancelled) setFolders(stored)
          if (!cancelled) setLoaded(true)
          return
        }
      } catch (e) {
        console.error('No se pudo leer las carpetas de IndexedDB', e)
      }

      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (!cancelled) setFolders(parsed)
          await set(STORAGE_KEY, parsed)
        }
      } catch (e) {
        console.error('No se pudo migrar las carpetas desde localStorage', e)
      }

      if (!cancelled) setLoaded(true)
    })()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!loaded) return
    set(STORAGE_KEY, folders).catch((e) => {
      console.error('No se pudo guardar las carpetas en IndexedDB', e)
    })
  }, [folders, loaded])

  return [folders, setFolders, loaded]
}
