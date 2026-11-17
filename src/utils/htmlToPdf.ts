import html2canvas from 'html2canvas'
import { PDFDocument } from 'pdf-lib'

/**
 * True PDF download for the staged document viewers:
 * rasterizes the rendered document inside an in-app iframe (same-origin
 * srcDoc preview) and composes an A4, multipage PDF file — WYSIWYG with
 * what the agent sees in the modal. Over-scroll and CSS scrollbars are
 * never captured. Yields a byte-stream download, no print dialog needed.
 */
export async function exportHtmlToPdfFromFrame(
  frame: HTMLIFrameElement | null,
  { downloadName = 'document.pdf', scale = 2 }: { downloadName?: string; scale?: number } = {},
): Promise<void> {
  const doc = frame?.contentDocument
  if (!frame || !doc) throw new Error('Document non disponible pour la génération du PDF')

  const canvas = await html2canvas(doc.body, {
    scale,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
  })

  const pdf = await PDFDocument.create()
  const A4_W = 595.28
  const A4_H = 841.89
  const cssW = canvas.width / scale
  // One preview CSS px maps to A4_W / cssW PDF pt on the X axis: the slice
  // height replicates the same aspect ratio per page.
  const sliceCssH = cssW * (A4_H / A4_W)
  const slicePx = Math.max(1, Math.round(sliceCssH * scale))
  const pageCount = Math.max(1, Math.ceil(canvas.height / slicePx))

  for (let i = 0; i < pageCount; i++) {
    const y = i * slicePx
    const h = Math.min(slicePx, canvas.height - y)
    if (h <= 0) break
    const slice = document.createElement('canvas')
    slice.width = canvas.width
    slice.height = h
    const ctx = slice.getContext('2d')
    if (!ctx) throw new Error('Canvas indisponible')
    ctx.drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h)

    const png = await pdf.embedPng(slice.toDataURL('image/png'))
    const page = pdf.addPage([A4_W, A4_H])
    const drawH = (h / scale / cssW) * A4_W
    page.drawImage(png, { x: 0, y: A4_H - drawH, width: A4_W, height: drawH })
  }

  const bytes = await pdf.save()
  const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = downloadName
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 4000)
}
