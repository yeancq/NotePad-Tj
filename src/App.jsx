import { useMemo, useState, lazy } from 'react'
import { LazyWrapper } from './components/LazyWrapper'

// Componentes que se cargan siempre (críticos para la carga inicial)
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import NoteCard from './components/NoteCard'
import EmptyState from './components/EmptyState'
import Fab from './components/Fab'
import FolderGrid from './components/FolderGrid'
import FolderCard from './components/FolderCard'
import NewFolderDialog from './components/NewFolderDialog'

// Componentes con lazy loading (solo se cargan cuando se necesitan)
const NoteEditor = lazy(() => import('./components/NoteEditor'))
const ImportBible = lazy(() => import('./components/ImportBible'))
const ImportProgram = lazy(() => import('./components/ImportProgram'))
const ImportOutline = lazy(() => import('./components/ImportOutline'))
const Settings = lazy(() => import('./components/Settings'))
const SplashScreen = lazy(() => import('./components/SplashScreen'))

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
      // SOLO notas que pertenecen directamente a la carpeta activa
      // (las notas de subcarpetas NO se muestran aquí)
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
      prev.map((n) =>
        n.id === noteId ? { ...n, folder: folderId } : n
      )
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

  if (showSplash) {
    return (
      <LazyWrapper>
        <SplashScreen onFinish={() => setShowSplash(false)} />
      </LazyWrapper>
    )
  }

  if (showSettings) {
    return (
      <LazyWrapper>
        <Settings
          themeMode={themeMode}
          setThemeMode={setThemeMode}
          accentId={accentId}
          setAccentId={setAccentId}
          onBack={() => setShowSettings(false)}
        />
      </LazyWrapper>
    )
  }

  if (showImportOutline) {
    return (
      <LazyWrapper>
        <ImportOutline onBack={() => setShowImportOutline(false)} onCreateNote={createNoteFromOutline} />
      </LazyWrapper>
    )
  }

  if (showImportProgram) {
    return (
      <LazyWrapper>
        <ImportProgram onBack={() => setShowImportProgram(false)} onCreateNotes={createNotesFromProgram} />
      </LazyWrapper>
    )
  }

  if (showImport) {
    return (
      <LazyWrapper>
        <ImportBible onBack={() => setShowImport(false)} onImported={() => setShowImport(false)} />
      </LazyWrapper>
    )
  }

  if (openNote) {
    return (
      <div className="min-h-screen bg-parchment dark:bg-night paper-texture text-ink dark:text-night-text flex overflow-x-hidden">
        <LazyWrapper>
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
        </LazyWrapper>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-parchment dark:bg-night paper-texture flex text-ink dark:text-night-text">
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
            <header className="sticky top-0 z-20 bg-parchment/90 dark:bg-night/90 backdrop-blur-sm border-b border-ink/10 dark:border-night-text/10 px-4 md:px-8 py-4">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="md:hidden mb-1 w-9 h-9 -ml-1.5 flex items-center justify-center rounded-full text-ink dark:text-night-text hover:bg-ink/5 dark:hover:bg-night-text/10"
                    aria-label="Abrir menú"
                  >
                    ☰
                  </button>
                  <p className="font-display text-2xl md:text-3xl text-ink dark:text-night-text tracking-tight">
                    NotePad TJ
                  </p>
                  <p className="text-xs text-ink-soft dark:text-night-text/60 mt-0.5">
                    Estudio, reuniones y predicación
                  </p>
                </div>
                <button
                  onClick={() => setThemeMode(dark ? 'light' : 'dark')}
                  className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full
                             text-ink dark:text-night-text hover:bg-ink/5 dark:hover:bg-night-text/10 transition-colors"
                  aria-label="Cambiar modo oscuro"
                >
                  {dark ? '☀️' : '🌙'}
                </button>
              </div>
              <div className="relative max-w-md">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/50 dark:text-night-text/40 text-sm">
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
                  className="w-full bg-white/60 dark:bg-night-surface-2 border border-ink/10 dark:border-night-text/10
                             rounded-full pl-9 pr-4 py-2.5 text-sm text-ink dark:text-night-text
                             placeholder:text-ink-soft/50 dark:placeholder:text-night-text/30
                             focus:outline-none focus:ring-2 focus:ring-gilt/60 transition-shadow"
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
                const subfolders = folders.filter(f => f.parentId === activeFolder)
                const hasContent = filteredNotes.length > 0 || subfolders.length > 0

                if (!hasContent) {
                  return <EmptyState onCreate={createNote} filtered={Boolean(search || activeFolder)} />
                }

                return (
                  <div className="space-y-6 max-w-6xl">
                    {/* Subcarpetas */}
                    {subfolders.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft/60 dark:text-night-text/40">
                            Subcarpetas
                          </p>
                          <p className="text-[11px] text-ink-soft/40 dark:text-night-text/30">
                            ⋮ para opciones
                          </p>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                          {subfolders.map((folder) => {
                            const noteCount = notes.filter(n => n.folder === folder.id && !n.trashed).length
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

                    {/* Notas sueltas de la carpeta actual (sin las de subcarpetas) */}
                    {filteredNotes.length > 0 && (
                      <div>
                        {subfolders.length > 0 && (
                          <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft/60 dark:text-night-text/40 mb-3">
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
