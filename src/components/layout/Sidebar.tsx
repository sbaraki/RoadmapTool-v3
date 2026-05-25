import { useMemo } from 'react'
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  GripVertical,
} from 'lucide-react'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useStore } from '../../store/useStore'
import type { ExhibitionProject, ProjectStatus } from '../../types'
import { STATUS_COLORS } from '../../utils/color'

const STATUS_LABELS: Record<ProjectStatus, string> = {
  TBC: 'TBC',
  'In Development': 'IN DEV',
  'Open to Public': 'OPEN',
  Closed: 'CLOSED',
}

export function Sidebar() {
  const galleries = useStore(s => s.galleries)
  const exhibitions = useStore(s => s.exhibitions)
  const collapsedLanes = useStore(s => s.collapsedLanes)
  const toggleCollapseLane = useStore(s => s.toggleCollapseLane)
  const selectedProjectId = useStore(s => s.selectedProjectId)
  const setSelectedProject = useStore(s => s.setSelectedProject)
  const moveProjectLaneOrder = useStore(s => s.moveProjectLaneOrder)
  const setProjectOrder = useStore(s => s.setProjectOrder)
  const showMilestones = useStore(s => s.showMilestones)
  const setShowMilestones = useStore(s => s.setShowMilestones)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const milestoneCount = useMemo(
    () => exhibitions.reduce((count, project) => count + (project.checkpoints?.length ?? 0), 0),
    [exhibitions],
  )

  return (
    <aside className="w-[340px] bg-white border-r border-outline-variant flex-shrink-0 overflow-y-auto no-print">
      <div className="sticky top-0 z-20 bg-white border-b border-outline-variant px-3 py-2">
        <h2 className="text-label-md uppercase tracking-wide text-slate-muted">Portfolio</h2>
      </div>

      {milestoneCount > 0 && (
        <section className="mx-3 my-3 rounded-md border border-outline-variant bg-surface-container-lowest overflow-hidden">
          <button
            type="button"
            onClick={() => setShowMilestones(!showMilestones)}
            className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-surface-container cursor-pointer"
          >
            <CalendarDays size={14} className="text-rose-600" />
            <span className="text-label-md uppercase tracking-wide text-slate-text flex-1">Milestones</span>
            <span className="text-mono-data text-xs text-slate-muted">{milestoneCount}</span>
            <span className="text-xs text-slate-muted">{showMilestones ? 'Shown' : 'Hidden'}</span>
          </button>
        </section>
      )}

      <div className="pb-3">
        {galleries.map(gallery => {
          const galleryProjects = exhibitions
            .filter(project => project.gallery === gallery.name)
            .sort((a, b) => (a.laneOrder ?? 0) - (b.laneOrder ?? 0))
          const isCollapsed = collapsedLanes.includes(gallery.id)

          return (
            <section key={gallery.id} className="border-b border-outline-variant/30 last:border-b-0">
              <button
                type="button"
                onClick={() => toggleCollapseLane(gallery.id)}
                className="flex items-center gap-2 w-full px-3 py-2 hover:bg-surface-container transition-colors cursor-pointer text-left"
              >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                <span className="text-body-sm font-medium text-slate-text flex-1 truncate">{gallery.name}</span>
                <span className="text-mono-data text-slate-muted text-xs">{galleryProjects.length}</span>
              </button>

              {!isCollapsed && (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event: DragEndEvent) => {
                    const { active, over } = event
                    if (!over || active.id === over.id) return
                    const oldIndex = galleryProjects.findIndex(project => project.id === active.id)
                    const newIndex = galleryProjects.findIndex(project => project.id === over.id)
                    if (oldIndex < 0 || newIndex < 0) return
                    const reordered = arrayMove(galleryProjects, oldIndex, newIndex)
                    setProjectOrder(gallery.name, reordered.map(project => project.id))
                  }}
                >
                  <SortableContext items={galleryProjects.map(project => project.id)} strategy={verticalListSortingStrategy}>
                    {galleryProjects.map(project => (
                      <SortableProjectRow
                        key={project.id}
                        project={project}
                        selected={selectedProjectId === project.id}
                        onSelect={() => setSelectedProject(project.id)}
                        onMoveUp={() => moveProjectLaneOrder(project.id, 'up')}
                        onMoveDown={() => moveProjectLaneOrder(project.id, 'down')}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </section>
          )
        })}
      </div>
    </aside>
  )
}

interface SortableProjectRowProps {
  project: ExhibitionProject
  selected: boolean
  onSelect: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}

function SortableProjectRow({ project, selected, onSelect, onMoveUp, onMoveDown }: SortableProjectRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: project.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-start gap-1 pl-8 pr-2 py-1.5 cursor-pointer transition-colors
        ${selected ? 'bg-surface-container-high' : 'hover:bg-surface-container'}
        ${isDragging ? 'relative z-20 shadow-lg bg-white' : ''}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') onSelect() }}
    >
      <button
        type="button"
        className="mt-0.5 text-slate-muted flex-shrink-0 cursor-grab active:cursor-grabbing"
        aria-label={`Drag ${project.title}`}
        onClick={event => event.stopPropagation()}
        {...attributes}
        {...listeners}
      >
        <GripVertical size={12} />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-body-sm text-slate-text font-medium flex-1 truncate">{project.title}</span>
          <span
            className="inline-flex h-4 items-center justify-center rounded-sm px-1.5 text-[9px] font-bold tracking-wide text-white flex-shrink-0"
            style={{ backgroundColor: STATUS_COLORS[project.status] }}
            title={project.status}
          >
            {STATUS_LABELS[project.status]}
          </span>
        </div>
        <div className="text-mono-data text-[11px] text-slate-muted truncate">
          {project.exhibitionId} · {project.startDate} - {project.endDate}
        </div>
      </div>

      <div className="flex gap-0.5 pt-0.5">
        <button
          type="button"
          onClick={event => { event.stopPropagation(); onMoveUp() }}
          className="p-0.5 rounded hover:bg-surface-container-highest text-slate-muted cursor-pointer"
          aria-label="Move up"
        >
          <ArrowUp size={12} />
        </button>
        <button
          type="button"
          onClick={event => { event.stopPropagation(); onMoveDown() }}
          className="p-0.5 rounded hover:bg-surface-container-highest text-slate-muted cursor-pointer"
          aria-label="Move down"
        >
          <ArrowDown size={12} />
        </button>
      </div>
    </div>
  )
}
