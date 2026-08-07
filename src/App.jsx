import { useEffect, useMemo, useState } from 'react'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import NoteCard from './components/NoteCard'
import EmptyState from './components/EmptyState'
import Fab from './components/Fab'
import NoteEditor from './components/NoteEditor'
import ImportBible from './components/ImportBible'
import ImportProgram from './components/ImportProgram'
import { folders as defaultFolders, notes as initialNotes } from './data/mockNotes'
import { useLocalStorageNotes } from './hooks/useLocalStorageNotes'
import { useLocalStorageFolders } from './hooks/useLocalStorageFolders'

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
  const [dark, setDark] = useState(
    () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
  )

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

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

    if (activeFolder === 'pinned') list = list.filter((n) => n.pinned)
    else if (activeFolder && activeFolder !== 'trash') {
      const childIds = folders.filter((f) => f.parentId === activeFolder).map((f) => f.id)
      const scope = new Set([activeFolder, ...childIds])
      list = list.filter((n) => scope.has(n.folder))
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.body.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q))
      )
    }

    return [...list].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return new Date(b.updatedAt) - new Date(a.updatedAt)
    })
  }, [notes, folders, activeFolder, search])

  const openNote = notes.find((n) => n.id === openNoteId) ?? null

  const togglePin = (id) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)))
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

    // Reutiliza la subcarpeta si ya existe una con el mismo nombre bajo "Asamblea"
    // (por si el usuario importa el mismo programa dos veces).
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
      <div className="min-h-screen bg-parchment dark:bg-night paper-texture text-ink dark:text-night-text flex">
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
    <div className="min-h-screen bg-parchment dark:bg-night paper-texture flex text-ink dark:text-night-text">
      <Sidebar
        folders={folders}
        activeFolder={activeFolder}
        onSelect={(f) => {
          setActiveFolder(f)
          setSidebarOpen(false)
        }}
        counts={counts}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenImport={() => setShowImport(true)}
        onOpenImportProgram={() => setShowImportProgram(true)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar
          search={search}
          onSearch={setSearch}
          dark={dark}
          onToggleDark={() => setDark((d) => !d)}
          onOpenSidebar={() => setSidebarOpen(true)}
          greeting={`${getGreeting()} · ${filteredNotes.length} ${
            filteredNotes.length === 1 ? 'nota' : 'notas'
          }`}
        />

        <main className="flex-1 px-4 md:px-8 py-6 pb-28">
          {filteredNotes.length === 0 ? (
            <EmptyState onCreate={createNote} filtered={Boolean(search || activeFolder)} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5 max-w-6xl">
              {filteredNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onOpen={() => setOpenNoteId(note.id)}
                  onTogglePin={() => togglePin(note.id)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {activeFolder !== 'trash' && <Fab onClick={createNote} />}
    </div>
  )
}
