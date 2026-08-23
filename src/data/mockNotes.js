// Los íconos ahora se guardan como una clave (ver src/data/folderIcons.jsx),
// no como emoji directo. FolderIcon se encarga de traducir la clave al SVG.
export const folders = [
  { id: 'estudio', name: 'Estudio personal', icon: 'book', parentId: null },
  { id: 'reunion', name: 'Reuniones', icon: 'calendar', parentId: null },
  { id: 'predicacion', name: 'Predicación', icon: 'compass', parentId: null },
  { id: 'asamblea', name: 'Asambleas', icon: 'ticket', parentId: null },
  { id: 'bosquejos', name: 'Bosquejos Públicos', icon: 'scroll', parentId: null },
]

export const notes = []
