# Cuaderno — App de notas de estudio

App web instalable (PWA) inspirada en TheoPad, hecha con React + Vite + Tailwind.
Notas locales para estudio personal, reuniones y predicación, con reconocimiento
automático de referencias bíblicas. El texto bíblico (Traducción del Nuevo Mundo)
se importa una sola vez desde el EPUB oficial descargado de jw.org — todo se
procesa y guarda en el propio dispositivo (IndexedDB), sin servidores externos.

## Características

- 📝 **Editor enriquecido** con negrita, cursiva, subrayado, resaltados de color
  y encabezados.
- 📖 **Importación del EPUB de la TNM** (jw.org): se procesa completo en el
  navegador (JSZip + DOMParser) y se guarda en IndexedDB.
- 🔍 **Detector de referencias bíblicas en español**: reconoce citas como
  "Filipenses 4:6, 7" o "Mateo 24:15; 8:6" y muestra el texto real debajo del
  editor (panel lateral en escritorio, bottom sheet en móvil).
- 🔗 **Enlace bidireccional entre notas**: busca y enlaza una nota desde otra,
  navega entre ellas y quita el enlace cuando quieras.
- 📅 **Importación de programas de asamblea/congreso** desde archivos `.rtf`:
  crea automáticamente una nota por cada discurso, con orador y puntos clave.
- 📜 **Importación de bosquejos públicos** desde archivos `.docx`: conserva
  negrita, cursiva, sangrías y detecta el título automáticamente.
- 🎤 **Modo orador**: vista de lectura con cronómetro flotante arrastrable,
  zoom de texto y acceso rápido a las citas bíblicas mencionadas.
- 📁 **Carpetas y subcarpetas** con iconos personalizables y sugeridos
  automáticamente según el nombre.
- 🗑️ **Papelera funcional**: mover, restaurar o eliminar notas para siempre.
- 🎨 **Personalización completa**: modo claro, oscuro o sistema, y 6 paletas
  de color de acento que derivan variantes automáticamente.
- 💾 **Respaldo y restauración**: exporta e importa tus notas como JSON, con
  opción de fusionar o reemplazar.
- 📌 **Notas fijadas**, búsqueda por título/cuerpo/etiquetas, estado vacío
  amigable y saludo dinámico según la hora del día.
- 📲 **PWA instalable** con service worker y auto-actualización al publicar
  cambios.
- 🌐 **100% local-first**: todo se procesa y guarda en el dispositivo, sin
  servidores externos.

## Desarrollo local

```bash
npm install
npm run dev
```

## Compilar para producción

```bash
npm run build
```

Esto genera la carpeta `dist/` lista para publicarse como sitio estático.

## Publicar en GitHub Pages

1. Sube este proyecto a un repositorio de GitHub.
2. En `vite.config.js`, si el repo se llama `mi-repo`, cambia `base: './'` por
   `base: '/mi-repo/'` (o deja `'./'` si usarás un dominio propio / Pages en
   la raíz).
3. En Settings → Pages, pon "Source" en **GitHub Actions** (el workflow
   `.github/workflows/deploy.yml` compila, genera un número de versión
   automático y publica en cada push a `main`).
4. Una vez publicada, cualquier persona puede abrir la URL desde el navegador
   del celular y pulsar "Añadir a pantalla de inicio" / "Instalar app" — el
   `manifest.webmanifest` y el service worker (generados por `vite-plugin-pwa`)
   la hacen instalable y con soporte offline.

## Importar la Biblia (TNM)

Desde la barra lateral → "📖 Importar Biblia (TNM)":

1. Descarga el EPUB de la Traducción del Nuevo Mundo en español desde jw.org
   (Publicaciones → La Biblia → Descargar → EPUB).
2. Selecciona el archivo en la app. Se procesa completo en el navegador
   (JSZip + DOMParser) y se guarda en IndexedDB — no se sube a ningún servidor.
3. Una vez importada, cualquier referencia bíblica detectada en una nota
   (ej. "Filipenses 4:6, 7") muestra el texto real debajo del editor.

## Importar programas de asamblea

Desde el botón flotante (+) → "📅 Programas de asambleas" o desde la barra
lateral → "🎟️ Importar programa":

1. Selecciona el archivo `.rtf` del programa de tu asamblea o congreso.
2. La app detecta automáticamente los discursos, horarios y puntos clave.
3. Elige qué puntos convertir en notas (música, canciones y oraciones quedan
   desmarcadas por defecto).
4. Se crea una carpeta nueva (o se reutiliza una existente) con una nota por
   cada discurso, lista para que anotes lo que se diga.

## Importar bosquejos públicos

Desde el botón flotante (+) → "📜 Importar bosquejo":

1. Selecciona el archivo `.docx` del bosquejo.
2. Se crea una nota nueva en **Bosquejos Públicos**, conservando negrita,
   cursiva, sangrías y detectando el título automáticamente.

## Modo orador

Desde el editor de una nota, pulsa el ícono de orador (🎤) en la barra
superior:

- Vista de lectura limpia con el contenido de la nota.
- Las referencias bíblicas se vuelven clickeables y muestran el texto real.
- Isla flotante arrastrable con cronómetro, zoom de texto y botón de cerrar.

## Respaldo de notas

Desde Configuración → "Respaldo de notas":

- **Exportar**: descarga un JSON con todas tus notas y carpetas.
- **Importar**: sube un JSON previamente exportado y elige entre:
  - *Agregar a lo que ya tengo* (fusiona sin duplicados, comparando por ID).
  - *Reemplazar todo* (sustituye completamente tus notas actuales).

## Estructura del proyecto
