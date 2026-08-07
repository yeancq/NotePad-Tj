import { useEffect, useState } from 'react'

const STORAGE_KEY = 'cuaderno:folders'

export function useLocalStorageFolders(initialFolders) {
  const [folders, setFolders] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) return JSON.parse(raw)
    } catch (e) {
      console.error('No se pudo leer las carpetas de localStorage', e)
    }
    return initialFolders
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(folders))
    } catch (e) {
      console.error('No se pudo guardar las carpetas en localStorage', e)
    }
  }, [folders])

  return [folders, setFolders]
}
