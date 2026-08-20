import { useEffect, useState } from 'react'
import { getVerseText, getChapterFootnotes, isBibleImported } from '../lib/epubBible'

export function useBibleReady() {
  const [bibleReady, setBibleReady] = useState(true)
  useEffect(() => {
    isBibleImported().then(setBibleReady)
  }, [])
  return bibleReady
}

/**
 * Obtiene los textos de los versículos y las notas al pie relevantes para
 * la referencia activa. Devuelve { segmentTexts, footnotes }.
 */
export function useVerseSegments(activeRef, bibleReady) {
  const [segmentTexts, setSegmentTexts] = useState([])
  const [footnotes, setFootnotes] = useState([])

  useEffect(() => {
    if (!activeRef || !bibleReady) {
      setSegmentTexts([])
      setFootnotes([])
      return
    }
    let cancelled = false
    ;(async () => {
      // Obtener textos de versículos
      const results = []
      const chaptersSeen = new Set()
      for (const seg of activeRef.segments) {
        const parts = await Promise.all(
          seg.verses.map((v) => getVerseText(activeRef.book, seg.chapter, v))
        )
        results.push({ verseLabel: seg.verseLabel, text: parts.filter(Boolean).join(' ') })
        chaptersSeen.add(seg.chapter)
      }

      // Obtener notas al pie de todos los capítulos involucrados
      const allFootnotes = []
      for (const chapter of chaptersSeen) {
        const chFn = await getChapterFootnotes(activeRef.book, chapter)
        allFootnotes.push(...chFn)
      }

      // Filtrar las notas al pie relevantes para los versículos mostrados.
      // El formato JW.org incluye "[N]" en cada nota (ej: "* [8] O «...».")
      const displayedVerses = new Set()
      activeRef.segments.forEach((seg) => seg.verses.forEach((v) => displayedVerses.add(v)))

      const filtered = allFootnotes.filter((fn) => {
        const match = fn.match(/\[(\d+)\]/)
        if (!match) return true // Sin referencia a versículo → mostrar siempre
        return displayedVerses.has(parseInt(match[1], 10))
      })

      if (!cancelled) {
        setSegmentTexts(results)
        setFootnotes(filtered)
      }
    })()
    return () => { cancelled = true }
  }, [activeRef, bibleReady])

  return { segmentTexts, footnotes }
}
