import { format, parseISO } from 'date-fns'
import { useDraggable } from '@dnd-kit/core'
import type { ProjectCheckpoint } from '../../types'
import { addDaysToString, dateToPixel, pixelDeltaToDays } from '../../utils/date'
import { useStore } from '../../store/useStore'

interface MilestoneMarkerProps {
  projectId: string
  checkpoint: ProjectCheckpoint
  originDate: string
  monthWidth: number
  laneIndex: number
  totalLanes: number
}

export function MilestoneMarker({
  projectId,
  checkpoint,
  originDate,
  monthWidth,
  laneIndex,
}: MilestoneMarkerProps) {
  const left = dateToPixel(originDate, checkpoint.date, monthWidth)
  const color = checkpoint.color ?? '#64748b'
  const top = laneIndex * 30 + 5

  const drag = useDraggable({
    id: `milestone:${projectId}:${checkpoint.id}`,
      data: {
        kind: 'timeline-milestone',
        projectId,
        checkpointId: checkpoint.id,
        date: checkpoint.date,
      },
  })

  const dragX = drag.transform?.x ?? 0
  const deltaDays = drag.isDragging ? pixelDeltaToDays(dragX, monthWidth) : 0
  const previewDate = drag.isDragging ? addDaysToString(checkpoint.date, deltaDays) : checkpoint.date
  const formattedDate = format(parseISO(previewDate), monthWidth >= 42 ? 'MMM d, yyyy' : 'MMM d')

  const setEditingCheckpoint = useStore(s => s.setEditingCheckpoint)

  return (
    <div
      className={`milestone-marker ${drag.isDragging ? 'milestone-marker-dragging' : ''}`}
      style={{
        left,
        top,
        transform: drag.isDragging ? `translate3d(${dragX}px, 0, 0)` : undefined,
      }}
    >
      {/* Colored square icon at the exact date position — acts as the drag handle */}
      <div
        className="milestone-square"
        style={{ backgroundColor: color }}
        title={`${checkpoint.title} · ${checkpoint.kind}`}
        {...drag.attributes}
        {...drag.listeners}
      />

      {/* Label to the right of the square */}
      <div
        className="milestone-label"
        style={{ color }}
        onClick={() => setEditingCheckpoint({ projectId, checkpointId: checkpoint.id })}
      >
        <span className="milestone-label-title">{checkpoint.title}</span>
        <span className="milestone-meta">{formattedDate} · {checkpoint.kind}</span>
      </div>

      {/* Drag preview */}
      {drag.isDragging && (
        <span className="milestone-date-preview">{previewDate}</span>
      )}
    </div>
  )
}
