import JSZip from 'jszip'

const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'

function children(el, tag) {
  return el ? Array.from(el.getElementsByTagNameNS(W, tag)) : []
}
function child(el, tag) {
  return el ? el.getElementsByTagNameNS(W, tag)[0] || null : null
}

function runInfo(runEl) {
  const rPr = child(runEl, 'rPr')
  const bold = Boolean(child(rPr, 'b'))
  const italic = Boolean(child(rPr, 'i'))
  const szEl = child(rPr, 'sz')
  const size = szEl ? parseInt(szEl.getAttribute('w:val'), 10) : 24
  let text = ''
  // Recorremos los hijos directos del run en orden para no perder tabs/saltos.
  for (const node of Array.from(runEl.childNodes)) {
    if (node.localName === 't') text += node.textContent
    else if (node.localName === 'tab') text += '\t'
    else if (node.localName === 'br') text += '\n'
  }
  return { text, bold, italic, size }
}

function paragraphIndentLevel(pPr) {
  const ind = child(pPr, 'ind')
  if (!ind) return 0
  const left = parseInt(ind.getAttribute('w:left') || '0', 10)
  if (left <= 142) return 0
  // ~283 twips por nivel, según el documento real inspeccionado.
  return Math.max(0, Math.min(3, Math.round((left - 142) / 283)))
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function runsToInlineHtml(runs) {
  return runs
    .map((r) => {
      if (!r.text) return ''
      let t = escapeHtml(r.text).replace(/\t/g, '&emsp;').replace(/\n/g, '<br>')
      if (r.bold) t = `<strong>${t}</strong>`
      if (r.italic) t = `<em>${t}</em>`
      return t
    })
    .join('')
}

/**
 * Convierte el .docx (como File/Blob) a { title, html } donde:
 * - El primer párrafo (tamaño ≥26, negrita) se usa como título de la nota.
 * - Los párrafos totalmente en negrita se vuelven encabezados (h3).
 * - El resto son párrafos normales, con negrita/cursiva reales y sangría
 *   según el nivel detectado (indent-1, indent-2, indent-3).
 */
export async function docxToHtml(file) {
  const zip = await JSZip.loadAsync(file)
  const entry = zip.file('word/document.xml')
  if (!entry) throw new Error('No es un archivo .docx válido (falta word/document.xml).')
  const xml = await entry.async('string')

  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  const body = doc.getElementsByTagNameNS(W, 'body')[0]
  const paragraphs = children(body, 'p')

  let title = ''
  const htmlParts = []
  let usedAsTitle = false

  paragraphs.forEach((p) => {
    const pPr = child(p, 'pPr')
    const runEls = children(p, 'r')
    const runs = runEls.map(runInfo).filter((r) => r.text !== '')
    if (runs.length === 0) return

    const plainText = runs.map((r) => r.text).join('').replace(/\t/g, ' ').trim()
    if (!plainText) return

    const allBold = runs.every((r) => r.bold)
    const maxSize = Math.max(...runs.map((r) => r.size))

    // El primer párrafo grande y en negrita se usa como título de la nota.
    if (!usedAsTitle && maxSize >= 26) {
      title = plainText.replace(/\s+/g, ' ').trim()
      usedAsTitle = true
      return
    }

    const inline = runsToInlineHtml(runs)
    if (allBold) {
      htmlParts.push(`<h3>${inline}</h3>`)
      return
    }

    const level = paragraphIndentLevel(pPr)
    const cls = level > 0 ? ` class="indent-${level}"` : ''
    htmlParts.push(`<p${cls}>${inline}</p>`)
  })

  return { title: title || 'Bosquejo importado', html: htmlParts.join('') }
}
