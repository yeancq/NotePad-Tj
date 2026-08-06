# Cuaderno — App de notas de estudio

App web instalable (PWA) inspirada en TheoPad, hecha con React + Vite + Tailwind.
Notas locales para estudio personal, reuniones y predicación, con reconocimiento
automático de referencias bíblicas. El texto bíblico (Traducción del Nuevo Mundo)
se importa una sola vez desde el EPUB oficial descargado de jw.org — todo se
procesa y guarda en el propio dispositivo (IndexedDB), sin servidores externos.

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
   `base: '/mi-repo/'` (o deja `'./'` si usarás un dominio propio / Pages en la raíz).
3. En Settings → Pages, pon "Source" en **GitHub Actions** (el workflow
   `.github/workflows/deploy.yml` compila y publica automáticamente en cada
   push a `main`).
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

## Estado actual

- ✅ Pantalla de inicio: lista de notas, carpetas, etiquetas, búsqueda, fijar
  notas, modo oscuro, estado vacío.
- ✅ Editor de notas con persistencia real (localStorage) y papelera funcional
  (mover, restaurar, eliminar para siempre).
- ✅ Importación del EPUB de la TNM (jw.org) con extracción de versículos
  probada contra un archivo real, incluida limpieza de notas al pie.
- ✅ Detector de referencias bíblicas en español + panel de vista previa con
  opción de anclar un versículo arriba (bottom sheet en móvil, panel lateral
  en pantallas grandes).
- ✅ Enlace entre notas: buscar y enlazar una nota desde otra, navegar entre
  ellas, quitar el enlace.
- ⏳ Pendiente: importación de programas de asamblea/congreso, personalización
  de color de acento, respaldo/exportación de notas.

