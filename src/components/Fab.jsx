export default function Fab({ onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label="Crear nueva nota"
      className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-20
                 w-14 h-14 rounded-full bg-leather dark:bg-leather-deep text-parchment
                 shadow-lg shadow-leather/30 flex items-center justify-center
                 text-2xl leading-none
                 transition-transform duration-200 hover:scale-105 active:scale-95
                 ring-4 ring-gilt/20"
    >
      +
    </button>
  )
}
