import { useEffect, useState } from 'react'

const STORAGE_KEY = 'cuaderno:notes'

export function useLocalStorageNotes(initialNotes) {
  const [notes, setNotes] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) return JSON.parse(raw)
    } catch (e) {
      console.error('No se pudo leer localStorage', e)
    }
    return initialNotes
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
    } catch (e) {
      console.error('No se pudo guardar en localStorage', e)
    }
  }, [notes])

  return [notes, setNotes]
}
