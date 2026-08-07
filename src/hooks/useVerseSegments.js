import { useEffect, useState } from 'react'
import { getVerseText, isBibleImported } from '../lib/epubBible'

export function useBibleReady() {
  const [bibleReady, setBibleReady] = useState(true)
  useEffect(() => {
    isBibleImported().then(setBibleReady)
  }, [])
  return bibleReady
}

export function useVerseSegments(activeRef, bibleReady) {
  const [segmentTexts, setSegmentTexts] = useState([])

  useEffect(() => {
    if (!activeRef || !bibleReady) {
      setSegmentTexts([])
      return
    }
    let cancelled = false
    ;(async () => {
      const results = []
      for (const seg of activeRef.segments) {
        const parts = await Promise.all(
          seg.verses.map((v) => getVerseText(activeRef.book, seg.chapter, v))
        )
        results.push({ verseLabel: seg.verseLabel, text: parts.filter(Boolean).join(' ') })
      }
      if (!cancelled) setSegmentTexts(results)
    })()
    return () => {
      cancelled = true
    }
  }, [activeRef, bibleReady])

  return segmentTexts
}
