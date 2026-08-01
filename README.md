# Cuaderno — App de notas de estudio

App web instalable (PWA) inspirada en TheoPad, hecha con React + Vite + Tailwind.
Notas locales para estudio personal, reuniones y predicación, con reconocimiento
automático de referencias bíblicas (RVR1960).

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
3. Activa GitHub Pages apuntando a la carpeta `dist` (con una GitHub Action de
   build, o publicando manualmente el contenido de `dist` en la rama `gh-pages`).
4. Una vez publicada, cualquier persona puede abrir la URL desde el navegador
   del celular y pulsar "Añadir a pantalla de inicio" / "Instalar app" — el
   `manifest.webmanifest` y el service worker (generados por `vite-plugin-pwa`)
   la hacen instalable y con soporte offline.

## Estado actual

- ✅ Pantalla de inicio: lista de notas, carpetas, etiquetas, búsqueda, fijar
  notas, modo oscuro, estado vacío.
- ⏳ Pendiente: editor de notas con detección automática de referencias
  bíblicas, importación de programas de asamblea, papelera funcional,
  personalización de color de acento, respaldo/exportación.
