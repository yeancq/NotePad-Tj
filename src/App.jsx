import { useEffect, useState, useMemo } from 'react'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import NoteCard from './components/NoteCard'
import EmptyState from './components/EmptyState'
import Fab from './components/Fab'
import FolderGrid from './components/FolderGrid'
import FolderCard from './components/FolderCard'
import NewFolderDialog from './components/NewFolderDialog'
import NoteEditor from './components/NoteEditor'
import ImportBible from './components/ImportBible'
import ImportProgram from './components/ImportProgram'
import ImportOutline from './components/ImportOutline'
import Settings from './components/Settings'
import SplashScreen from './components/SplashScreen'
import { folders as defaultFolders, notes as initialNotes } from './data/mockNotes'
import { useLocalStorageNotes } from './hooks/useLocalStorageNotes'
import { useLocalStorageFolders } from './hooks/useLocalStorageFolders'
import { useThemeSettings } from './hooks/useThemeSettings'
import { useBackHandler } from './hooks/useBackHandler'
import { stripHtml } from './lib/htmlUtils'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

export default function App() {
  const [notes, setNotes] = useLocalStorageNotes(initialNotes)
  const [folders, setFolders] = useLocalStorageFolders(defaultFolders)
  const [activeFolder, setActiveFolder] = useState(null)
  const [search, setSearch] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [openNoteId, setOpenNoteId] = useState(null)
  const [showImport, setShowImport] = useState(false)
  const [showImportProgram, setShowImportProgram] = useState(false)
  const [showImportOutline, setShowImportOutline] = useState(false)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showHome, setShowHome] = useState(true)
  const [editingFolderId, setEditingFolderId] = useState(null)
  const { themeMode, setThemeMode, accentId, setAccentId, dark } = useThemeSettings()
  const [showSplash, setShowSplash] = useState(true)
  const [isCheckingVersion, setIsCheckingVersion] = useState(true)

  // ============================================================
  // 🔄 SISTEMA DE ACTUALIZACIÓN AUTOMÁTICA (versión.json)
  // ============================================================
  useEffect(() => {
    const checkVersion = async () => {
      try {
        const response = await fetch('/version.json?t=' + Date.now())
        if (!response.ok) throw new Error('No se pudo obtener version.json')

        const data = await response.json()
        const serverVersion = data.version
        const savedVersion = localStorage.getItem('appVersion')

        if (savedVersion && savedVersion !== serverVersion) {
          console.log(`🔄 Nueva versión: ${savedVersion} → ${serverVersion}`)
          localStorage.setItem('appVersion', serverVersion)

          if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations()
            for (const registration of registrations) {
              await registration.unregister()
            }
          }

          if ('caches' in window) {
            const cacheKeys = await caches.keys()
            for (const key of cacheKeys) {
              if (key.includes('assets') || key.includes('workbox')) {
                await caches.delete(key)
              }
            }
          }

          setTimeout(() => {
            window.location.href = window.location.href.split('?')[0] + '?t=' + Date.now()
          }, 500)
          return
        } else if (!savedVersion) {
          localStorage.setItem('appVersion', serverVersion)
        }
      } catch (error) {
        console.warn('⚠️ Error verificando versión:', error)
      } finally {
        setIsCheckingVersion(false)
      }
    }

    checkVersion()
  }, [])

  const counts = useMemo(() => {
    const c = { all: 0, pinned: 0, trash: 0 }
    folders.forEach((f) => (c[f.id] = 0))
    notes.forEach((n) => {
      if (n.trashed) {
        c.trash++
        return
      }
      c.all++
      if (n.pinned) c.pinned++
      if (c[n.folder] !== undefined) c[n.folder]++
    })
    return c
  }, [notes, folders])

  const filteredNotes = useMemo(() => {
    let list = notes.filter((n) => (activeFolder === 'trash' ? n.trashed : !n.trashed))

    if (activeFolder === 'pinned') {
      list = list.filter((n) => n.pinned)
    } else if (activeFolder && activeFolder !== 'trash') {
      list = list.filter((n) => n.folder === activeFolder)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          stripHtml(n.body).toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q))
      )
    }

    return [...list].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return new Date(b.updatedAt) - new Date(a.updatedAt)
    })
  }, [notes, folders, activeFolder, search])

  const openNote = notes.find((n) => n.id === openNoteId) ?? null

  useBackHandler(Boolean(openNote), () => setOpenNoteId(null))
  useBackHandler(showSettings, () => setShowSettings(false))
  useBackHandler(showImportOutline, () => setShowImportOutline(false))
  useBackHandler(showImportProgram, () => setShowImportProgram(false))
  useBackHandler(showImport, () => setShowImport(false))
  useBackHandler(!showHome, () => setShowHome(true))

  const togglePin = (id) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)))
  }

  const moveNoteToFolder = (noteId, folderId) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, folder: folderId } : n))
    )
  }

  const createNote = () => {
    const id = Date.now()
    const newNote = {
      id,
      title: '',
      body: '',
      folder: activeFolder && folders.some((f) => f.id === activeFolder) ? activeFolder : 'estudio',
      tags: [],
      pinned: false,
      trashed: false,
      updatedAt: new Date().toISOString(),
    }
    setNotes((prev) => [newNote, ...prev])
    setOpenNoteId(id)
  }

  const saveNote = (updated) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === updated.id ? { ...updated, updatedAt: new Date().toISOString() } : n
      )
    )
  }

  const trashNote = (id) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, trashed: true, pinned: false } : n)))
    setOpenNoteId(null)
  }

  const restoreNote = (id) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, trashed: false } : n)))
  }

  const deleteForever = (id) => {
    setNotes((prev) => prev.filter((n) => n.id !== id))
    setOpenNoteId(null)
  }

  const createNotesFromProgram = (folderName, items) => {
    const cleanName = folderName.trim() || 'Asamblea sin nombre'

    let folderId
    const existing = folders.find((f) => f.parentId === 'asamblea' && f.name === cleanName)
    if (existing) {
      folderId = existing.id
    } else {
      folderId = `asamblea-${Date.now()}`
      setFolders((prev) => [
        ...prev,
        { id: folderId, name: cleanName, icon: '🎟️', parentId: 'asamblea' },
      ])
    }

    const baseId = Date.now()
    const now = new Date().toISOString()
    const newNotes = items.map((item, i) => ({
      id: baseId + i,
      title: `${String(i + 1).padStart(2, '0')}. ${item.title}`.slice(0, 120),
      body: `Orador:\n\n${item.bullets.map((b) => `• ${b}`).join('\n')}`.trim() + '\n',
      folder: folderId,
      tags: [],
      pinned: false,
      trashed: false,
      updatedAt: now,
    }))
    setNotes((prev) => [...newNotes, ...prev])
    setShowImportProgram(false)
    setActiveFolder(folderId)
  }

  const createNoteFromOutline = (title, html) => {
    const id = Date.now()
    const newNote = {
      id,
      title: title.trim() || 'Bosquejo importado',
      body: html,
      folder: 'bosquejos',
      tags: [],
      pinned: false,
      trashed: false,
      updatedAt: new Date().toISOString(),
    }
    setNotes((prev) => [newNote, ...prev])
    setShowImportOutline(false)
    setActiveFolder('bosquejos')
    setOpenNoteId(id)
  }

  const createFolder = (name, icon) => {
    const id = `folder-${Date.now()}`
    const current = folders.find((f) => f.id === activeFolder)
    const parentId = !showHome && current ? current.parentId || current.id : null
    setFolders((prev) => [...prev, { id, name, icon: icon || '📁', parentId }])
    setShowNewFolder(false)
    setActiveFolder(id)
    setShowHome(false)
  }

  const updateFolder = (id, name, icon) => {
    setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, name, icon } : f)))
    setEditingFolderId(null)
  }

  const deleteFolderAndContents = (id) => {
    const childIds = folders.filter((f) => f.parentId === id).map((f) => f.id)
    const idsToRemove = new Set([id, ...childIds])
    setFolders((prev) => prev.filter((f) => !idsToRemove.has(f.id)))
    setNotes((prev) => prev.filter((n) => !idsToRemove.has(n.folder)))
    setEditingFolderId(null)
  }

  // ============================================================
  // 💾 RESPALDO DE DATOS (Exportar / Importar)
  // ============================================================
  const exportAllData = () => {
    const data = {
      notes: notes,
      folders: folders,
      version: '1.0',
      exportedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `notepad-tj-backup-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const importAllData = (file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        if (data.notes && data.folders) {
          setNotes(data.notes)
          setFolders(data.folders)
          alert('✅ Respaldo importado correctamente')
        } else {
          alert('❌ El archivo no tiene el formato correcto')
        }
      } catch (error) {
        alert('❌ Error al leer el archivo: ' + error.message)
      }
    }
    reader.readAsText(file)
  }

  // ============================================================
  // ⏳ Gestión de pantalla de carga
  // ============================================================
  if (isCheckingVersion || showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />
  }

  if (showSettings) {
    return (
      <Settings
        themeMode={themeMode}
        setThemeMode={setThemeMode}
        accentId={accentId}
        setAccentId={setAccentId}
        onBack={() => setShowSettings(false)}
        onExport={exportAllData}
        onImport={importAllData}
      />
    )
  }

  if (showImportOutline) {
    return <ImportOutline onBack={() => setShowImportOutline(false)} onCreateNote={createNoteFromOutline} />
  }

  if (showImportProgram) {
    return (
      <ImportProgram onBack={() => setShowImportProgram(false)} onCreateNotes={createNotesFromProgram} />
    )
  }

  if (showImport) {
    return <ImportBible onBack={() => setShowImport(false)} onImported={() => setShowImport(false)} />
  }

  if (openNote) {
    return (
      <div className="min-h-screen bg-theme paper-texture text-theme flex overflow-x-hidden">
        <NoteEditor
          key={openNote.id}
          note={openNote}
          folders={folders}
          onBack={() => setOpenNoteId(null)}
          onSave={saveNote}
          onTrash={trashNote}
          onRestore={restoreNote}
          onDeleteForever={deleteForever}
          onNeedImport={() => setShowImport(true)}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-theme paper-texture flex text-theme">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenImport={() => setShowImport(true)}
        onOpenImportProgram={() => setShowImportProgram(true)}
        onOpenSettings={() => setShowSettings(true)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {showHome ? (
          <>
            <header className="sticky top-0 z-20 bg-theme/90 backdrop-blur-sm border-b border-theme px-4 md:px-8 py-4">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="md:hidden mb-1 w-9 h-9 -ml-1.5 flex items-center justify-center rounded-full text-theme hover:bg-ink/5 dark:hover:bg-night-text/10"
                    aria-label="Abrir menú"
                  >
                    ☰
                  </button>
                  <p className="font-display text-2xl md:text-3xl text-theme tracking-tight">
                    NotePad TJ
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    Estudio, reuniones y predicación
                  </p>
                </div>
                <button
                  onClick={() => setThemeMode(dark ? 'light' : 'dark')}
                  className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full
                             text-theme hover:bg-ink/5 dark:hover:bg-night-text/10 transition-colors"
                  aria-label="Cambiar modo oscuro"
                >
                  {dark ? '☀️' : '🌙'}
                </button>
              </div>
              <div className="relative max-w-md">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/50 text-sm">
                  ⌕
                </span>
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setActiveFolder(null)
                    setShowHome(false)
                  }}
                  type="text"
                  placeholder="Buscar en tus notas…"
                  className="w-full bg-surface border border-theme
                             rounded-full pl-9 pr-4 py-2.5 text-sm text-theme
                             placeholder:text-muted/50
                             focus:outline-none focus:ring-2 focus:ring-accent/60 transition-shadow"
                />
              </div>
            </header>

            <main className="flex-1 px-4 md:px-8 py-6 pb-28">
              <FolderGrid
                folders={folders}
                counts={counts}
                onSelect={(f) => {
                  setActiveFolder(f)
                  setShowHome(false)
                }}
                onEditFolder={setEditingFolderId}
                onDeleteFolder={deleteFolderAndContents}
              />
            </main>
          </>
        ) : (
          <>
            <TopBar
              search={search}
              onSearch={setSearch}
              dark={dark}
              onToggleDark={() => setThemeMode(dark ? 'light' : 'dark')}
              onOpenSidebar={() => setSidebarOpen(true)}
              onGoHome={() => {
                setShowHome(true)
                setSearch('')
              }}
              showBack
              greeting={`${getGreeting()} · ${filteredNotes.length} ${
                filteredNotes.length === 1 ? 'nota' : 'notas'
              }`}
            />

            <main className="flex-1 px-4 md:px-8 py-6 pb-28">
              {(() => {
                const subfolders = folders.filter((f) => f.parentId === activeFolder)
                const hasContent = filteredNotes.length > 0 || subfolders.length > 0

                if (!hasContent) {
                  return <EmptyState onCreate={createNote} filtered={Boolean(search || activeFolder)} />
                }

                return (
                  <div className="space-y-6 max-w-6xl">
                    {subfolders.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                            Subcarpetas
                          </p>
                          <p className="text-[11px] text-muted/60">
                            ⋮ para opciones
                          </p>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                          {subfolders.map((folder) => {
                            const noteCount = notes.filter((n) => n.folder === folder.id && !n.trashed).length
                            return (
                              <FolderCard
                                key={folder.id}
                                folder={folder}
                                noteCount={noteCount}
                                onOpen={() => setActiveFolder(folder.id)}
                                onEdit={() => setEditingFolderId(folder.id)}
                                onDelete={() => deleteFolderAndContents(folder.id)}
                              />
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {filteredNotes.length > 0 && (
                      <div>
                        {subfolders.length > 0 && (
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
                            Notas
                          </p>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
                          {filteredNotes.map((note) => (
                            <NoteCard
                              key={note.id}
                              note={note}
                              folders={folders}
                              onOpen={() => setOpenNoteId(note.id)}
                              onTogglePin={() => togglePin(note.id)}
                              onMoveNote={moveNoteToFolder}
                              onDelete={(id) => {
                                if (activeFolder === 'trash') {
                                  if (window.confirm('¿Eliminar esta nota permanentemente?')) {
                                    deleteForever(id)
                                  }
                                } else {
                                  trashNote(id)
                                }
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}
            </main>
          </>
        )}
      </div>

      {activeFolder !== 'trash' && (
        <Fab
          onNewNote={createNote}
          onNewFolder={() => setShowNewFolder(true)}
          onImportProgram={() => setShowImportProgram(true)}
          onImportOutline={() => setShowImportOutline(true)}
        />
      )}

      {showNewFolder && (
        <NewFolderDialog
          parentName={!showHome ? folders.find((f) => f.id === activeFolder)?.name : null}
          onCreate={createFolder}
          onClose={() => setShowNewFolder(false)}
        />
      )}

      {editingFolderId && (
        <NewFolderDialog
          initial={folders.find((f) => f.id === editingFolderId)}
          onCreate={(name, icon) => updateFolder(editingFolderId, name, icon)}
          onDelete={() => deleteFolderAndContents(editingFolderId)}
          onClose={() => setEditingFolderId(null)}
        />
      )}
    </div>
  )
      }
