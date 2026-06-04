import { toCanvas } from 'html-to-image'
import jsPDF from 'jspdf'
import { format, parseISO } from 'date-fns'
import { useStore } from '../store/useStore'

const LEDGER_WIDTH_IN = 17
const LEDGER_HEIGHT_IN = 11
const PAGE_MARGIN_IN = 0.25
const METADATA_HEIGHT_IN = 0.42
const METADATA_GAP_IN = 0.08
const FOOTER_HEIGHT_IN = 0.18
const BASE_LANE_ROW_HEIGHT = 68
const BASE_COLLAPSED_LANE_HEIGHT = 44
const BASE_COLLAPSED_PROJECT_HEIGHT = 38
const BASE_TIMELINE_RUN_TOP = 30
const BASE_PHASE_TRACK_TOP = 8

function resetExportSizing(container: HTMLElement) {
  container.classList.remove('pdf-export-fill')
  container.style.removeProperty('--lane-row-height')
  container.style.removeProperty('--timeline-run-top')
  container.style.removeProperty('--phase-track-top')
  container.style.removeProperty('--collapsed-lane-height')
  container.style.removeProperty('--collapsed-project-top')
  container.style.removeProperty('--collapsed-project-height')
  container.style.removeProperty('--milestone-band-extra')
  container.style.removeProperty('--milestone-marker-offset')
}

function applyPdfVerticalFill(container: HTMLElement, targetAspect: number) {
  resetExportSizing(container)
  container.classList.add('pdf-export-fill')

  const contentWidth = Math.max(container.scrollWidth, container.offsetWidth)
  const baseHeight = Math.max(container.scrollHeight, container.offsetHeight)
  const targetHeight = contentWidth / targetAspect
  const extraHeight = Math.max(0, targetHeight - baseHeight)

  if (extraHeight <= 1) return

  const laneRows = container.querySelectorAll('.lane-row').length
  const collapsedRows = container.querySelectorAll('.collapsed-lane-body').length
  const milestoneBands = container.querySelectorAll('.milestone-band').length
  const rowUnits = laneRows + collapsedRows
  const milestoneUnits = milestoneBands * 0.7
  const rowExtra = extraHeight / Math.max(rowUnits + milestoneUnits, 1)
  const milestoneBandExtra = rowExtra * 0.7
  const collapsedProjectTop = (BASE_COLLAPSED_LANE_HEIGHT + rowExtra - BASE_COLLAPSED_PROJECT_HEIGHT) / 2

  container.style.setProperty('--lane-row-height', `${BASE_LANE_ROW_HEIGHT + rowExtra}px`)
  container.style.setProperty('--timeline-run-top', `${BASE_TIMELINE_RUN_TOP + rowExtra / 2}px`)
  container.style.setProperty('--phase-track-top', `${BASE_PHASE_TRACK_TOP + rowExtra / 2}px`)
  container.style.setProperty('--collapsed-lane-height', `${BASE_COLLAPSED_LANE_HEIGHT + rowExtra}px`)
  container.style.setProperty('--collapsed-project-height', `${BASE_COLLAPSED_PROJECT_HEIGHT}px`)
  container.style.setProperty('--collapsed-project-top', `${Math.max(2, collapsedProjectTop)}px`)
  container.style.setProperty('--milestone-band-extra', `${milestoneBandExtra}px`)
  container.style.setProperty('--milestone-marker-offset', `${milestoneBandExtra / 2}px`)
}

function formatExportDate(value: string) {
  return format(parseISO(value), 'MMM d, yyyy')
}

function getExportMetadata() {
  const state = useStore.getState()
  const activeScenario = state.scenarios.find(scenario => scenario.id === state.activeScenarioId)
  const title = state.museumName?.trim() || 'RAM Exhibitions Roadmap'
  const scenarioName = activeScenario?.name?.trim() || 'Current Plan'
  const range = `${formatExportDate(state.timelineStartDate)} - ${formatExportDate(state.timelineEndDate)}`
  return { title, scenarioName, range }
}

function drawMetadata(pdf: jsPDF, now: Date, pageW: number) {
  const metadata = getExportMetadata()
  const left = PAGE_MARGIN_IN
  const right = pageW - PAGE_MARGIN_IN
  const top = PAGE_MARGIN_IN + 0.1

  pdf.setDrawColor(203, 213, 225)
  pdf.setLineWidth(0.01)
  pdf.line(left, PAGE_MARGIN_IN + METADATA_HEIGHT_IN, right, PAGE_MARGIN_IN + METADATA_HEIGHT_IN)

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(10)
  pdf.setTextColor(15, 23, 42)
  pdf.text(metadata.title, left, top)

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(7.5)
  pdf.setTextColor(71, 85, 105)
  pdf.text(`${metadata.scenarioName}  |  ${metadata.range}`, left, top + 0.18)

  pdf.setFontSize(7)
  pdf.setTextColor(100, 116, 139)
  pdf.text(
    `Exported ${format(now, 'MMM d, yyyy h:mm a')}`,
    right,
    top + 0.18,
    { align: 'right' },
  )
}

function nextFrame() {
  return new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
}

export async function exportTimelineToPdf(): Promise<void> {
  const container = document.querySelector('.timeline-container') as HTMLElement | null
  if (!container) return

  const origOverflow = container.style.overflow
  const imageAreaW = LEDGER_WIDTH_IN - PAGE_MARGIN_IN * 2
  const imageAreaH = LEDGER_HEIGHT_IN - PAGE_MARGIN_IN * 2 - METADATA_HEIGHT_IN - METADATA_GAP_IN - FOOTER_HEIGHT_IN
  const imageAreaAspect = imageAreaW / imageAreaH

  let canvas: HTMLCanvasElement

  try {
    container.style.overflow = 'visible'
    applyPdfVerticalFill(container, imageAreaAspect)
    await nextFrame()

    const captureWidth = Math.ceil(Math.max(container.scrollWidth, container.offsetWidth))
    const captureHeight = Math.ceil(Math.max(container.scrollHeight, container.offsetHeight))

    canvas = await toCanvas(container, {
      backgroundColor: '#ffffff',
      pixelRatio: 2,
      skipAutoScale: true,
      width: captureWidth,
      height: captureHeight,
      style: {
        width: `${captureWidth}px`,
        height: `${captureHeight}px`,
        overflow: 'visible',
      },
    })
  } finally {
    container.style.overflow = origOverflow
    resetExportSizing(container)
  }

  const imgData = canvas.toDataURL('image/jpeg', 0.85)

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'in',
    format: [LEDGER_WIDTH_IN, LEDGER_HEIGHT_IN],
    compress: true,
  })

  const pageW = pdf.internal.pageSize.getWidth()

  const scale = Math.min(imageAreaW / canvas.width, imageAreaH / canvas.height)
  const imgW = canvas.width * scale
  const imgH = canvas.height * scale
  const x = PAGE_MARGIN_IN + (imageAreaW - imgW) / 2
  const imageAreaY = PAGE_MARGIN_IN + METADATA_HEIGHT_IN + METADATA_GAP_IN
  const y = imageAreaY + (imageAreaH - imgH) / 2

  const now = new Date()
  drawMetadata(pdf, now, pageW)
  pdf.addImage(imgData, 'JPEG', x, y, imgW, imgH, undefined, 'FAST')

  const dateStr = now.toISOString().slice(0, 10)


  pdf.save(`RAM_ExhibitionPortfolio_${dateStr}.pdf`)
}
