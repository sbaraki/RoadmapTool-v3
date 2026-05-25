import { toCanvas } from 'html-to-image'
import jsPDF from 'jspdf'

export async function exportTimelineToPdf(): Promise<void> {
  const container = document.querySelector('.timeline-container') as HTMLElement | null
  if (!container) return

  const origOverflow = container.style.overflow
  container.style.overflow = 'visible'

  const canvas = await toCanvas(container, {
    backgroundColor: '#ffffff',
    pixelRatio: 2,
    skipAutoScale: true,
  })

  container.style.overflow = origOverflow

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'in',
    format: [17, 11],
  })

  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()

  const scale = Math.min(pageW / canvas.width, pageH / canvas.height)
  const imgW = canvas.width * scale
  const imgH = canvas.height * scale
  const x = (pageW - imgW) / 2
  const y = (pageH - imgH) / 2

  pdf.addImage(canvas, 'PNG', x, y, imgW, imgH)

  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10)
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  pdf.setFontSize(7)
  pdf.setTextColor(148, 163, 184)
  pdf.text(`Exported ${dateStr} ${timeStr}`, pageW - 0.3, pageH - 0.15, { align: 'right' })

  pdf.save(`RAM_ExhibitionPortfolio_${dateStr}.pdf`)
}
