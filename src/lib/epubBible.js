import JSZip from 'jszip'
import { set, get, keys, del } from 'idb-keyval'
import { bibleBooks, chapterFileName } from '../data/bibleBooks'
import { parseChapterXhtml } from './bibleTextParser'

const META_KEY = 'bible:meta'

/**
 * Importa el EPUB completo: recorre los 66 libros y todos sus capítulos,
 * extrae el texto y las notas al pie, y los guarda en IndexedDB.
 * onProgress(done, total) se llama tras cada capítulo procesado.
 */
export async function importBibleEpub(file, onProgress) {
  const zip = await JSZip.loadAsync(file)

  const totalChapters = bibleBooks.reduce((sum, b) => sum + b.chapters, 0)
  let done = 0
  let imported = 0
  const missing = []

  for (const book of bibleBooks) {
    for (let chapter = 1; chapter <= book.chapters; chapter++) {
      const fileName = chapterFileName(book.id, chapter)
      const zipEntry = zip.file(`OEBPS/${fileName}`)
      if (!zipEntry) {
        missing.push(`${book.name} ${chapter}`)
      } else {
        const xhtml = await zipEntry.async('string')
        const { verses, footnotes } = parseChapterXhtml(xhtml)
        await set(`verses:${book.id}:${chapter}`, verses)
        if (footnotes.length > 0) {
          await set(`fnotes:${book.id}:${chapter}`, footnotes)
        }
        imported++
      }
      done++
      if (onProgress) onProgress(done, totalChapters)
    }
  }

  const meta = {
    importedAt: new Date().toISOString(),
    totalChapters,
    imported,
    missingCount: missing.length,
  }
  await set(META_KEY, meta)
  return { ...meta, missing }
}

export async function getBibleMeta() {
  return (await get(META_KEY)) || null
}

export async function isBibleImported() {
  const meta = await getBibleMeta()
  return Boolean(meta && meta.imported > 0)
}

export async function getVerseText(bookId, chapter, verse) {
  const chapterVerses = await get(`verses:${bookId}:${chapter}`)
  if (!chapterVerses) return null
  return chapterVerses[verse] || null
}

/** Devuelve las notas al pie de un capítulo, o [] si no hay ninguna. */
export async function getChapterFootnotes(bookId, chapter) {
  return (await get(`fnotes:${bookId}:${chapter}`)) || []
}

export async function deleteBibleData() {
  const allKeys = await keys()
  const toDelete = allKeys.filter(
    (k) => typeof k === 'string' && (k.startsWith('verses:') || k.startsWith('fnotes:'))
  )
  await Promise.all(toDelete.map((k) => del(k)))
  await del(META_KEY)
}
