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

      // Construir el conjunto de referencias "capítulo:versículo" de los
      // versículos que se están mostrando actualmente.
      // El formato de las notas en el EPUB de JW.org es: "^ Ecl. 8:9 O ..."
      // por lo que buscamos el patrón numérico capítulo:versículo en cada nota.
      const displayedChapterVerses = new Set()
      activeRef.segments.forEach((seg) => {
        seg.verses.forEach((v) => {
          displayedChapterVerses.add(`${seg.chapter}:${v}`)
        })
      })

      const filtered = allFootnotes.filter((fn) => {
        // Buscar el primer patrón "número:número" en el texto de la nota
        const match = fn.match(/\b(\d+):(\d+)\b/)
        // Si la nota no tiene referencia de versículo, no la mostramos
        if (!match) return false
        return displayedChapterVerses.has(`${match[1]}:${match[2]}`)
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
