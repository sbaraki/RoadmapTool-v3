import { useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { useDraggable } from '@dnd-kit/core'
import type { ExhibitionProject, PhaseType } from '../../types'
import { STATUS_COLORS } from '../../utils/color'
import { addMonthsToString, dateToPixel } from '../../utils/date'
import { PhaseBar } from './PhaseBar'

function phaseKey(label: string): string {
  return label.toLowerCase().replace(/^\d+\.\s*/, '').trim()
}

function phaseLabel(phaseLabelValue: string, type?: PhaseType): string {
  return type?.label ?? phaseLabelValue
}

interface ProjectBarProps {
  project: ExhibitionProject
  startDate: string
  monthWidth: number
  phaseTypes: PhaseType[]
  isSelected: boolean
  onClick: () => void
}

export function ProjectBar({
  project,
  startDate,
  monthWidth,
  phaseTypes,
  isSelected,
  onClick,
}: ProjectBarProps) {
  const projStart = useMemo(() => parseISO(project.startDate), [project.startDate])
  const projEnd = useMemo(() => parseISO(project.endDate), [project.endDate])

  const isRange = project.scheduleMode === 'range'
  const left = useMemo(
    () => dateToPixel(startDate, project.startDate, monthWidth),
    [startDate, project.startDate, monthWidth],
  )
  const duration = useMemo(
    () => Math.max(dateToPixel(project.startDate, project.endDate, monthWidth) / monthWidth, 0.5),
    [project.startDate, project.endDate, monthWidth],
  )
  const width = isRange ? duration * monthWidth : monthWidth * 0.55

  const statusColor = STATUS_COLORS[project.status] || '#94a3b8'
  const prePhases = useMemo(
    () =>
      project.phases.filter(ph => {
        const pt = phaseTypes.find(t => t.id === ph.typeId)
        const key = phaseKey(phaseLabel(ph.label, pt))
        return key !== 'delivery' && key !== 'deinstall'
      }),
    [project.phases, phaseTypes],
  )
  const postPhases = useMemo(
    () =>
      project.phases.filter(ph => {
        const pt = phaseTypes.find(t => t.id === ph.typeId)
        return phaseKey(phaseLabel(ph.label, pt)) === 'deinstall'
      }),
    [project.phases, phaseTypes],
  )
  const totalPre = useMemo(
    () => prePhases.reduce((s, ph) => s + ph.durationMonths, 0),
    [prePhases],
  )
  const totalPost = useMemo(
    () => postPhases.reduce((s, ph) => s + ph.durationMonths, 0),
    [postPhases],
  )
   const preWidth = totalPre * monthWidth
   const postWidth = totalPost * monthWidth

   // dnd-kit draggables
  const dragData = {
    kind: 'timeline-project',
    projectId: project.id,
    startDate: project.startDate,
    endDate: project.endDate,
  }
  const moveDrag = useDraggable({
    id: `project:${project.id}:move`,
    data: { ...dragData, action: 'move' },
  })
  const resizeStartDrag = useDraggable({
    id: `project:${project.id}:resize-start`,
    data: { ...dragData, action: 'resize-start' },
  })
  const resizeEndDrag = useDraggable({
    id: `project:${project.id}:resize-end`,
    data: { ...dragData, action: 'resize-end' },
  })

  const containerLeft = isRange ? left - preWidth : left - width / 2
  const containerWidth = isRange ? width + preWidth + postWidth : width
  const runLabel = `${format(projStart, 'MMM yyyy')} - ${format(projEnd, 'MMM yyyy')}`
  const showDatePillsAsTbc = project.showDatePillsAsTbc ?? false
  const openDateLabel = showDatePillsAsTbc ? 'TBC' : format(projStart, 'MMM d').toUpperCase()
  const closeDateLabel = showDatePillsAsTbc ? 'TBC' : format(projEnd, 'MMM d').toUpperCase()
  const openDateTitle = showDatePillsAsTbc ? 'TBC' : format(projStart, 'MMM d, yyyy')
  const closeDateTitle = showDatePillsAsTbc ? 'TBC' : format(projEnd, 'MMM d, yyyy')
  const singleDateLabel = format(projStart, monthWidth >= 42 ? 'MMM d, yyyy' : 'MMM d')
  const showDatePills = project.showDatePills ?? true
  const moveX = moveDrag.transform?.x ?? 0
  const resizeStartX = resizeStartDrag.transform?.x ?? 0
  const resizeEndX = resizeEndDrag.transform?.x ?? 0
  const isMoving = moveDrag.isDragging
  const isResizingStart = resizeStartDrag.isDragging
  const isResizingEnd = resizeEndDrag.isDragging
  const startDeltaMonths = isResizingStart ? Math.round(resizeStartX / monthWidth) : 0
  const endDeltaMonths = isResizingEnd ? Math.round(resizeEndX / monthWidth) : 0
  const moveDeltaMonths = isMoving ? Math.round(moveX / monthWidth) : 0
  const resizedStartDate = addMonthsToString(project.startDate, startDeltaMonths)
  const resizedEndDate = addMonthsToString(project.endDate, endDeltaMonths)
  const previewStartDate = isMoving
    ? addMonthsToString(project.startDate, moveDeltaMonths)
    : isResizingStart
      ? resizedStartDate > project.endDate ? project.endDate : resizedStartDate
      : project.startDate
  const previewEndDate = isMoving
    ? addMonthsToString(project.endDate, moveDeltaMonths)
    : isResizingEnd
      ? resizedEndDate < project.startDate ? project.startDate : resizedEndDate
      : project.endDate
  const showSchedulePreview = isMoving || isResizingStart || isResizingEnd
  const visualPreWidth = Math.max(4, preWidth + (isResizingStart ? resizeStartX : 0))
  const visualRunLeft = preWidth + (isResizingStart ? resizeStartX : 0)
  const visualRunWidth = Math.max(monthWidth * 0.75, width - (isResizingStart ? resizeStartX : 0) + (isResizingEnd ? resizeEndX : 0))
  const visualPostLeft = preWidth + width + (isResizingEnd ? resizeEndX : 0)

  return (
    <div
      className="absolute"
      style={{
        left: containerLeft,
        top: 0,
        height: '100%',
        width: containerWidth,
        transform: isMoving ? `translate3d(${moveX}px, 0, 0)` : undefined,
        zIndex: isMoving || isResizingStart || isResizingEnd ? 30 : undefined,
      }}
    >
      {/* Pre-phases */}
      {isRange && prePhases.length > 0 && (
        <div className="phase-track phase-track-pre flex" style={{ left: 0, width: visualPreWidth }}>
          {prePhases.map((ph, idx) => {
            const pt = phaseTypes.find(t => t.id === ph.typeId)
            return (
              <PhaseBar
                key={ph.id}
                width={ph.durationMonths * monthWidth}
                color={pt?.color ?? '#94a3b8'}
                label={ph.label}
                durationMonths={ph.durationMonths}
                projectId={project.id}
                phaseId={ph.id}
                variant="pre"
                isFirst={idx === 0}
                isLast={idx === prePhases.length - 1}
              />
            )
          })}
        </div>
      )}

   {/* Main bar */}
       {isRange ? (
         <div
           className={`timeline-run-wrap ${showSchedulePreview ? 'timeline-run-wrap-active' : ''}`}
           style={{ left: visualRunLeft, width: visualRunWidth }}
           onClick={onClick}
           role="button"
           tabIndex={0}
           onKeyDown={e => {
             if (e.key === 'Enter' || e.key === ' ') onClick()
           }}
         >
            <div
              className={`timeline-bar-main ${isSelected ? 'ring-2 ring-secondary ring-offset-1' : ''} ${
                showSchedulePreview ? 'dragging' : ''
              }`}
              style={{ 
                backgroundColor: statusColor,
                opacity: 0.7  // Reduced from gradient to solid color with lower opacity
              }}
              title={`${project.title}\nRun: ${runLabel}\nStatus: ${project.status}`}
            >
              <span className={`timeline-bar-label ${visualRunWidth < 72 ? 'timeline-bar-label-hidden' : ''}`}>
                {project.title}
              </span>
              <span className={`timeline-bar-sub ${width < 260 ? 'timeline-bar-sub-hidden' : ''}`}>
                {runLabel}
              </span>
            </div>

            {showSchedulePreview && (
              <div className="schedule-preview">
                {previewStartDate} - {previewEndDate}
              </div>
            )}

            {showDatePills && (
              <>
                <div className="delivery-pin" title={`Exhibition Open: ${openDateTitle}`}>
                  <span>OPEN</span>
                  <span className="delivery-pin-date">{openDateLabel}</span>
                </div>

                <div className="delivery-pin delivery-pin-close" title={`Exhibition Close: ${closeDateTitle}`}>
                  <span>CLOSE</span>
                  <span className="delivery-pin-date">{closeDateLabel}</span>
                </div>
              </>
            )}

           {/* Move drag area */}
           <div
              className="absolute inset-0 z-5 cursor-grab active:cursor-grabbing"
              {...moveDrag.attributes}
              {...moveDrag.listeners}
            />

           {/* Resize handles */}
           <div
             className="timeline-resize-handle timeline-resize-handle-left"
             {...resizeStartDrag.attributes}
             {...resizeStartDrag.listeners}
           />
           <div
             className="timeline-resize-handle timeline-resize-handle-right"
             {...resizeEndDrag.attributes}
             {...resizeEndDrag.listeners}
           />
         </div>
       ) : (
         /* Single-date marker */
         <div
           className="milestone-project-marker"
           onClick={onClick}
           role="button"
           tabIndex={0}
           onKeyDown={e => {
             if (e.key === 'Enter' || e.key === ' ') onClick()
           }}
         >
           <div
             className={`milestone-project-diamond ${isSelected ? 'selected' : ''}`}
             style={{ backgroundColor: statusColor, borderColor: statusColor }}
           />
           <span className="milestone-project-label">
             <span className="milestone-project-label-title">{project.title}</span>
             <span className="milestone-project-label-date">{singleDateLabel}</span>
           </span>
         </div>
       )}

      {/* Post-phases */}
      {isRange && postPhases.length > 0 && (
        <div
          className="phase-track phase-track-post flex"
          style={{ left: visualPostLeft }}
        >
          {postPhases.map((ph, idx) => {
            const pt = phaseTypes.find(t => t.id === ph.typeId)
            return (
              <PhaseBar
                key={ph.id}
                width={ph.durationMonths * monthWidth}
                color={pt?.color ?? '#94a3b8'}
                label={ph.label}
                durationMonths={ph.durationMonths}
                projectId={project.id}
                phaseId={ph.id}
                variant="post"
                isFirst={idx === 0}
                isLast={idx === postPhases.length - 1}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
