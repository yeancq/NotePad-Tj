import { useEffect, useRef } from 'react'

// Pila compartida de pantallas "profundas" abiertas actualmente, en el orden
// en que se abrieron. Es a nivel de módulo (no de componente) para que
// funcione entre componentes distintos (ej. NoteEditor y su modo orador)
// con un solo listener de popstate para toda la app.
const stack = []
let ignoreNextPopstate = false
let listenerInstalled = false

function ensureListener() {
  if (listenerInstalled) return
  listenerInstalled = true
  window.addEventListener('popstate', () => {
    if (ignoreNextPopstate) {
      ignoreNextPopstate = false
      return
    }
    const top = stack.pop()
    if (top) top.current()
  })
}

/**
 * Registra una pantalla en la pila de "atrás". Mientras `active` sea true,
 * hay una entrada reservada en el historial del navegador para esta
 * pantalla — al presionar atrás (botón físico o gesto), se llama a onBack()
 * en vez de salir de la app. Si la pantalla se cierra por otro medio (un
 * botón "Volver" dentro de la propia UI), la entrada se limpia sola.
 */
export function useBackHandler(active, onBack) {
  const onBackRef = useRef(onBack)
  onBackRef.current = onBack
  const pushedRef = useRef(false)

  useEffect(() => {
    ensureListener()
  }, [])

  useEffect(() => {
    if (active && !pushedRef.current) {
      window.history.pushState({ __appLevel: true }, '')
      stack.push(onBackRef)
      pushedRef.current = true
    } else if (!active && pushedRef.current) {
      pushedRef.current = false
      const idx = stack.indexOf(onBackRef)
      if (idx !== -1) stack.splice(idx, 1)
      ignoreNextPopstate = true
      window.history.back()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])
}
