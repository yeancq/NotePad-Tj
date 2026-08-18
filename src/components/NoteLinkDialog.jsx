import { useState } from 'react'
import { motion } from 'framer-motion'
import { stripHtml } from '../lib/htmlUtils'

export default function NoteLinkDialog({
  currentNoteId,
  notes = [],
  linkedNoteIds = [],
  onLink,
  onClose,
}) {
  const [search, setSearch] = useState('')

  const available = notes.filter((n) => {
    if (n.trashed) return false
    if (n.id === currentNoteId) return false
    if (linkedNoteIds.includes(n.id)) return false
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      (n.title || '').toLowerCase().includes(q) ||
      stripHtml(n.body).toLowerCase().includes(q)
    )
  })

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/30 dark:bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.2, 0, 0, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md bg-parchment dark:bg-night-surface
                   rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <h2 className="font-display text-base text-ink dark:text-night-text">
            Enlazar con nota
          </h2>
          <button
            onClick={
