import { useState } from 'react'

export default function ImportBible({ onBack, onImported }) {
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [message, setMessage] = useState('')

  const handleImport = async (file) => {
    if (!file) return

    try {
      setStatus('loading')
      setMessage('Leyendo archivo...')

      // Carga dinámica de JSZip
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()
      
      const content = await file.arrayBuffer()
      const loaded = await zip.loadAsync(content)

      setMessage('Buscando archivo de la Biblia...')

      // Buscar el archivo EPUB de la Biblia (normalmente contenido en un archivo .xhtml o .html)
      let bibleFile = null
      let biblePath = null

      // Primero buscar en la carpeta OEBPS/Text/
      const textFiles = Object.keys(loaded.files).filter(
        (path) => path.startsWith('OEBPS/Text/') && (path.endsWith('.xhtml') || path.endsWith('.html'))
      )

      // Buscar archivos que contengan "bible" o "scripture" en el nombre
      const possibleBibleFiles = textFiles.filter(
        (path) =>
          path.toLowerCase().includes('bible') ||
          path.toLowerCase().includes('scripture') ||
          path.toLowerCase().includes('bi12') ||
          path.toLowerCase().includes('nwt')
      )

      if (possibleBibleFiles.length > 0) {
        biblePath = possibleBibleFiles[0]
        bibleFile = await loaded.files[biblePath].async('string')
      } else if (textFiles.length > 0) {
        // Si no encontramos un archivo específico, usar el primero
        biblePath = textFiles[0]
        bibleFile = await loaded.files[biblePath].async('string')
      }

      if (!bibleFile) {
        throw new Error('No se encontró el archivo de la Biblia en el EPUB')
      }

      setMessage('Procesando capítulos...')

      // Parsear el HTML para extraer los capítulos
      const parser = new DOMParser()
      const doc = parser.parseFromString(bibleFile, 'text/html')

      // Buscar todos los capítulos (normalmente en elementos <div> con clase "chapter" o similar)
      const chapters = doc.querySelectorAll('.chapter, [class*="chapter"], [class*="capitulo"]')
      
      if (chapters.length === 0) {
        // Si no encontramos capítulos, buscar por secciones
        const sections = doc.querySelectorAll('.section, [class*="section"], [class*="seccion"]')
        if (sections.length > 0) {
          // Procesar secciones como capítulos
          const bibleData = {}
          let currentBook = ''

          sections.forEach((section) => {
            const header = section.querySelector('h1, h2, h3, .header, [class*="header"]')
            if (header) {
              currentBook = header.textContent.trim()
              bibleData[currentBook] = []
            }

            const verses = section.querySelectorAll('.verse, [class*="verse"], [class*="versiculo"]')
            if (verses.length > 0) {
              const chapterData = []
              verses.forEach((verse) => {
                const verseNumber = verse.getAttribute('data-verse') || 
                                   verse.querySelector('.verse-num, [class*="num"]')?.textContent || 
                                   ''
                const verseText = verse.textContent.replace(verseNumber, '').trim()
                if (verseNumber && verseText) {
                  chapterData.push({ number: verseNumber, text: verseText })
                }
              })
              if (chapterData.length > 0 && currentBook) {
                bibleData[currentBook].push(chapterData)
              }
            }
          })

          // Guardar en localStorage
          localStorage.setItem('bibleData', JSON.stringify(bibleData))
          setStatus('success')
          setMessage(`¡Biblia importada correctamente! (${Object.keys(bibleData).length} libros)`)
          onImported()
          return
        }
      }

      // Procesar capítulos encontrados
      const bibleData = {}
      let currentBook = ''
      let currentChapter = []

      chapters.forEach((chapter) => {
        // Intentar identificar el libro
        const bookHeader = chapter.querySelector('h1, h2, h3, .book, [class*="book"]')
        if (bookHeader) {
          // Guardar capítulo anterior si existe
          if (currentBook && currentChapter.length > 0) {
            if (!bibleData[currentBook]) bibleData[currentBook] = []
            bibleData[currentBook].push(currentChapter)
            currentChapter = []
          }
          currentBook = bookHeader.textContent.trim()
        }

        // Extraer versículos
        const verses = chapter.querySelectorAll('.verse, [class*="verse"], [class*="versiculo"]')
        verses.forEach((verse) => {
          const verseNumber = verse.getAttribute('data-verse') || 
                             verse.querySelector('.verse-num, [class*="num"]')?.textContent || 
                             ''
          const verseText = verse.textContent.replace(verseNumber, '').trim()
          if (verseNumber && verseText) {
            currentChapter.push({ number: verseNumber, text: verseText })
          }
        })
      })

      // Guardar último capítulo
      if (currentBook && currentChapter.length > 0) {
        if (!bibleData[currentBook]) bibleData[currentBook] = []
        bibleData[currentBook].push(currentChapter)
      }

      if (Object.keys(bibleData).length === 0) {
        throw new Error('No se pudieron extraer los capítulos de la Biblia')
      }

      // Guardar en localStorage
      localStorage.setItem('bibleData', JSON.stringify(bibleData))
      setStatus('success')
      setMessage(`¡Biblia importada correctamente! (${Object.keys(bibleData).length} libros)`)
      onImported()

    } catch (error) {
      console.error('Error importing Bible:', error)
      setStatus('error')
      setMessage(`Error: ${error.message || 'No se pudo importar la Biblia'}`)
    }
  }

  return (
    <div className="min-h-screen bg-parchment dark:bg-night paper-texture flex flex-col">
      <header className="sticky top-0 z-20 bg-parchment/90 dark:bg-night/90 backdrop-blur-sm border-b border-ink/10 dark:border-night-text/10 px-4 md:px-8 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-9 h-9 flex items-center justify-center rounded-full text-ink dark:text-night-text hover:bg-ink/5 dark:hover:bg-night-text/10"
            aria-label="Volver"
          >
            ←
          </button>
          <h1 className="font-display text-xl text-ink dark:text-night-text">Importar Biblia</h1>
        </div>
      </header>

      <main className="flex-1 px-4 md:px-8 py-8 max-w-2xl mx-auto w-full">
        <div className="bg-white/60 dark:bg-night-surface-2 rounded-2xl p-6 shadow-sm border border-ink/5 dark:border-night-text/5">
          <p className="text-ink-soft dark:text-night-text/70 text-sm mb-6">
            Selecciona el archivo EPUB de la Traducción del Nuevo Mundo descargado desde jw.org
          </p>

          <div className="space-y-4">
            <div className="relative">
              <input
                type="file"
                accept=".epub"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleImport(file)
                }}
                disabled={status === 'loading'}
                className="block w-full text-sm text-ink-soft dark:text-night-text/70
                          file:mr-4 file:py-2.5 file:px-6
                          file:rounded-full file:border-0
                          file:text-sm file:font-medium
                          file:bg-gilt file:text-white
                          hover:file:bg-gilt/80
                          disabled:opacity-50 disabled:cursor-not-allowed
                          cursor-pointer"
              />
            </div>

            {status === 'loading' && (
              <div className="flex items-center gap-3 text-ink-soft dark:text-night-text/70">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gilt"></div>
                <span>{message}</span>
              </div>
            )}

            {status === 'success' && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800/30">
                <p className="text-green-700 dark:text-green-300 text-sm">{message}</p>
              </div>
            )}

            {status === 'error' && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800/30">
                <p className="text-red-700 dark:text-red-300 text-sm">{message}</p>
                <button
                  onClick={() => setStatus('idle')}
                  className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
                >
                  Reintentar
                </button>
              </div>
            )}

            {status === 'idle' && (
              <div className="text-xs text-ink-soft/50 dark:text-night-text/30 text-center">
                El archivo se procesa localmente, no se sube a ningún servidor
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
