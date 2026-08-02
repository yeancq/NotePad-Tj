import { useEffect, useMemo, useState } from 'react'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import NoteCard from './components/NoteCard'
import EmptyState from './components/EmptyState'
import Fab from './components/Fab'
import { folders as folderDefs, notes as initialNotes } from './data/mockNotes'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

export default function App() {
  const [notes, setNotes] = useState(initialNotes)
  const [activeFolder, setActiveFolder] = useState(null)
  const [search, setSearch] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dark, setDark] = useState(
    () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
  )

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  const counts = useMemo(() => {
    const c = { all: notes.length, pinned: 0, trash: 0 }
    folderDefs.forEach((f) => (c[f.id] = 0))
    notes.forEach((n) => {
      if (n.pinned) c.pinned++
      if (c[n.folder] !== undefined) c[n.folder]++
    })
    return c
  }, [notes])

  const filteredNotes = useMemo(() => {
    let list = notes
    if (activeFolder === 'pinned') list = list.filter((n) => n.pinned)
    else if (activeFolder === 'trash') list = []
    else if (activeFolder) list = list.filter((n) => n.folder === activeFolder)

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.excerpt.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q))
      )
    }

    return [...list].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return new Date(b.updatedAt) - new Date(a.updatedAt)
    })
  }, [notes, activeFolder, search])

  const togglePin = (id) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n))
    )
  }

  return (
    <div className="min-h-screen bg-parchment dark:bg-night paper-texture flex text-ink dark:text-night-text">
      <Sidebar
        folders={folderDefs}
        activeFolder={activeFolder}
        onSelect={(f) => {
          setActiveFolder(f)
          setSidebarOpen(false)
        }}
        counts={counts}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
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
            <EmptyState onCreate={() => {}} filtered={Boolean(search || activeFolder)} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5 max-w-6xl">
              {filteredNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onOpen={() => {}}
                  onTogglePin={() => togglePin(note.id)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      <Fab onClick={() => {}} />
    </div>
  )
}
