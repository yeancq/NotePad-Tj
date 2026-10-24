import { get, set, del } from 'idb-keyval'

// Los PDF de la sección Atalaya se guardan en IndexedDB (igual que las
// notas y la Biblia), como ArrayBuffer. La lista de PDF importados vive
// en una sola clave y cada archivo en su propia clave.
const LIST_KEY = 'atalaya:list'
const fileKey = (id) => `atalaya:file:${id}`
const tocKey = (id) => `atalaya:toc:${id}`

export async function listPdfs() {
  return (await get(LIST_KEY)) || []
}

export async function addPdf(name, buffer, numPages) {
  const id = `pdf-${Date.now()}`
  await set(fileKey(id), buffer)
  const entry = {
    id,
    name,
    size: buffer.byteLength,
    numPages,
    addedAt: new Date().toISOString(),
  }
  const list = await listPdfs()
  await set(LIST_KEY, [entry, ...list])
  return entry
}

export async function getPdfData(id) {
  return (await get(fileKey(id))) || null
}

export async function removePdf(id) {
  await del(fileKey(id))
  await del(tocKey(id))
  const list = await listPdfs()
  await set(
    LIST_KEY,
    list.filter((p) => p.id !== id)
  )
}

// Índice de artículos detectado (ver pdfToc.js): { v: versión, items: [...] }
export async function getToc(id) {
  return (await get(tocKey(id))) || null
}

export async function saveToc(id, toc) {
  await set(tocKey(id), toc)
}
