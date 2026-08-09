export default function EmptyState({ onCreate, filtered }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 px-6">
      <div className="w-16 h-16 rounded-full bg-leather/10 dark:bg-leather/20 flex items-center justify-center text-2xl mb-4">
        {filtered ? '⌕' : '📖'}
      </div>
      <h3 className="font-display text-xl text-ink dark:text-night-text mb-1.5">
        {filtered ? 'No hay notas aquí todavía' : 'Tu cuaderno está en blanco'}
      </h3>
      <p className="text-sm text-ink-soft dark:text-night-text/50 max-w-xs mb-5">
        {filtered
          ? 'Prueba con otra carpeta o borra la búsqueda.'
          : 'Escribe tu primera nota de estudio, reunión o predicación.'}
      </p>
      {!filtered && (
        <button
          onClick={onCreate}
          className="px-5 py-2.5 rounded-full bg-leather text-parchment text-sm font-medium
                     hover:bg-leather-deep transition-colors shadow-sm"
        >
          + Crear nota
        </button>
      )}
    </div>
  )
}
