import { get, set } from 'idb-keyval'

const NOTES_KEY = 'cuaderno:notes'
const FOLDERS_KEY = 'cuaderno:folders'

export async function exportBackup() {
  const notes = (await get(NOTES_KEY)) || []
  const folders = (await get(FOLDERS_KEY)) || []

  const backup = {
    app: 'NotePad TJ',
    version: 1,
    exportedAt: new Date().toISOString(),
    notes,
    folders,
  }

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const date = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `notepad-tj-respaldo-${date}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)

  return { notesCount: notes.length, foldersCount: folders.length }
}

/**
 * Lee un archivo de respaldo y devuelve su contenido validado, sin tocar
 * todavía el almacenamiento (eso lo hace applyBackup, tras confirmar).
 */
export async function readBackupFile(file) {
  const text = await file.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('El archivo no es un JSON válido.')
  }
  if (!Array.isArray(data.notes) || !Array.isArray(data.folders)) {
    throw new Error('Este archivo no tiene el formato de un respaldo de NotePad TJ.')
  }
  return data
}

/**
 * mode: 'merge' agrega lo que falte sin borrar lo que ya tienes (evita
 * duplicados comparando por id). 'replace' sustituye todo por completo.
 */
export async function applyBackup(data, mode) {
  if (mode === 'replace') {
    await set(NOTES_KEY, data.notes)
    await set(FOLDERS_KEY, data.folders)
    return
  }

  const currentNotes = (await get(NOTES_KEY)) || []
  const currentFolders = (await get(FOLDERS_KEY)) || []

  const noteIds = new Set(currentNotes.map((n) => n.id))
  const mergedNotes = [...currentNotes, ...data.notes.filter((n) => !noteIds.has(n.id))]

  const folderIds = new Set(currentFolders.map((f) => f.id))
  const mergedFolders = [...currentFolders, ...data.folders.filter((f) => !folderIds.has(f.id))]

  await set(NOTES_KEY, mergedNotes)
  await set(FOLDERS_KEY, mergedFolders)
}
