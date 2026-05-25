import { useDraggable } from '@dnd-kit/core'

interface PhaseBarProps {
  width: number
  color: string
  label: string
  durationMonths: number
  projectId?: string
  phaseId?: string
  variant?: 'pre' | 'post'
  isFirst: boolean
  isLast: boolean
}

export function PhaseBar({
  width,
  color,
  label,
  durationMonths,
  projectId,
  phaseId,
  variant,
  isFirst,
  isLast,
}: PhaseBarProps) {
  const canResize = Boolean(projectId && phaseId)
  const resizeDrag = useDraggable({
    id: `phase:${projectId ?? 'none'}:${phaseId ?? 'none'}:resize-duration`,
    disabled: !canResize,
    data: {
      kind: 'timeline-phase',
      action: 'resize-duration',
      projectId,
      phaseId,
      durationMonths,
    },
  })
  const pixelsPerMonth = durationMonths > 0 ? width / durationMonths : width
  const previewDuration = Math.max(0.5, durationMonths + Math.round((resizeDrag.transform?.x ?? 0) / pixelsPerMonth))
  const visualWidth = resizeDrag.isDragging ? Math.max(pixelsPerMonth * 0.5, width + (resizeDrag.transform?.x ?? 0)) : width
  const classNames = ['phase-segment']
  if (variant === 'pre') classNames.push('phase-segment-pre')
  if (variant === 'post') classNames.push('phase-segment-post')
  if (isFirst && isLast) {
    // Single segment: full rounding.
  } else if (isFirst) {
    classNames.push('phase-segment-first')
  } else if (isLast) {
    classNames.push('phase-segment-last')
  }

  // Make phases more secondary - reduce opacity significantly
  // Pre-phases: 0.35 opacity (was 0.65)
  // Post-phases: 0.40 opacity (was 0.85 for main, 0.55 for post - now making post more visible than pre)
  // Main phase: 0.60 opacity (was 0.85)
  let opacity = 0.85
  if (variant === 'pre') {
    opacity = 0.35  // More subtle pre-phases
  } else if (variant === 'post') {
    opacity = 0.50  // Moderate post-phases (delivery phase)
  }
  
  const computedColor = addAlpha(color, opacity)
  const displayLabel = getResponsivePhaseLabel(label, width, resizeDrag.isDragging ? previewDuration : durationMonths)

  return (
    <div
      className={classNames.join(' ')}
      style={{
        width: visualWidth,
        minWidth: 4,
        backgroundColor: computedColor,
      }}
      title={`${label} (${durationMonths} mo)`}
    >
      {displayLabel && (
        <span className="phase-segment-label">
          {displayLabel}
        </span>
      )}
      {canResize && (
        <button
          type="button"
          className="phase-resize-handle"
          aria-label={`Resize ${label} duration`}
          title={`Drag to resize ${label}`}
          {...resizeDrag.attributes}
          {...resizeDrag.listeners}
        />
      )}
      {resizeDrag.isDragging && (
        <span className="phase-duration-preview">{previewDuration} mo</span>
      )}
    </div>
  )
}

function getResponsivePhaseLabel(label: string, width: number, durationMonths: number): string | null {
  const numbered = label.match(/^(\d+)\.\s*(.+)$/)
  const phaseNumber = numbered?.[1]
  const phaseName = numbered?.[2] ?? label

  if (width < 52) return null
  if (width < 92) return phaseNumber ? phaseNumber : `${durationMonths}m`
  if (width < 136) return phaseNumber ? `${phaseNumber} · ${durationMonths}m` : `${durationMonths}m`
  if (width < 190) return phaseNumber ? `${phaseNumber}. ${phaseName.split(' ')[0]}` : phaseName
  return `${label} · ${durationMonths}m`
}

function addAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
