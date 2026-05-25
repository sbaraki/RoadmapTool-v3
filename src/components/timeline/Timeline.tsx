import { useEffect, useMemo, useRef } from 'react'
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { useStore } from '../../store/useStore'
import { TimelineHeader } from './TimelineHeader'
import { TimelineGrid } from './TimelineGrid'
import { GalleryLane } from './GalleryLane'
import { addDaysToString, addMonthsToString, dateToPixel, formatDate, pixelDeltaToDays, snapToWeek } from '../../utils/date'

export function Timeline() {
  const galleries = useStore(s => s.galleries)
  const exhibitions = useStore(s => s.exhibitions)
  const timelineStartDate = useStore(s => s.timelineStartDate)
  const timelineEndDate = useStore(s => s.timelineEndDate)
  const monthWidth = useStore(s => s.monthWidth)
  const collapsedLanes = useStore(s => s.collapsedLanes)
  const setSelectedProject = useStore(s => s.setSelectedProject)
  const updateProject = useStore(s => s.updateProject)
  const updatePhase = useStore(s => s.updatePhase)
  const updateCheckpoint = useStore(s => s.updateCheckpoint)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const totalWidth = useMemo(
    () => Math.max(monthWidth, dateToPixel(timelineStartDate, timelineEndDate, monthWidth)),
    [timelineStartDate, timelineEndDate, monthWidth]
  )
  const todayPixel = useMemo(() => {
    const now = new Date()
    return dateToPixel(timelineStartDate, formatDate(now), monthWidth)
  }, [timelineStartDate, monthWidth])
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scrollToToday = () => {
      if (!scrollRef.current) return
      const today = new Date()
      const x = Math.max(0, dateToPixel(timelineStartDate, formatDate(today), monthWidth))
      scrollRef.current.scrollTo({ left: Math.max(0, x - scrollRef.current.clientWidth / 2), behavior: 'smooth' })
    }
    window.addEventListener('timeline-scroll-today', scrollToToday)
    return () => window.removeEventListener('timeline-scroll-today', scrollToToday)
  }, [timelineStartDate, monthWidth])

  function handleDragEnd(event: DragEndEvent) {
    const data = event.active.data.current
    if (!data) return
    const deltaMonths = Math.round(event.delta.x / monthWidth)

    if (data.kind === 'timeline-phase') {
      if (deltaMonths === 0) return
      const projectId = data.projectId as string | undefined
      const phaseId = data.phaseId as string | undefined
      const durationMonths = data.durationMonths as number | undefined
      if (!projectId || !phaseId || !durationMonths) return
      updatePhase(projectId, phaseId, {
        durationMonths: Math.max(0.5, durationMonths + deltaMonths),
      })
      return
    }

    if (data.kind === 'timeline-milestone') {
      const projectId = data.projectId as string | undefined
      const checkpointId = data.checkpointId as string | undefined
      const date = data.date as string | undefined
      if (!projectId || !checkpointId || !date) return
      const deltaDays = pixelDeltaToDays(event.delta.x, monthWidth)
      if (deltaDays === 0) return
      updateCheckpoint(projectId, checkpointId, {
        date: addDaysToString(date, deltaDays),
      })
      return
    }

    if (data.kind !== 'timeline-project') return
    if (deltaMonths === 0) return

    const projectId = data.projectId as string
    const startDate = data.startDate as string
    const endDate = data.endDate as string
    const action = data.action as 'move' | 'resize-start' | 'resize-end'

    if (action === 'move') {
      updateProject(projectId, {
        startDate: snapToWeek(addMonthsToString(startDate, deltaMonths)),
        endDate: snapToWeek(addMonthsToString(endDate, deltaMonths)),
      })
    } else if (action === 'resize-start') {
      const nextStart = snapToWeek(addMonthsToString(startDate, deltaMonths))
      updateProject(projectId, { startDate: nextStart > endDate ? endDate : nextStart })
    } else if (action === 'resize-end') {
      const nextEnd = snapToWeek(addMonthsToString(endDate, deltaMonths))
      updateProject(projectId, { endDate: nextEnd < startDate ? startDate : nextEnd })
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div
        ref={scrollRef}
        className="timeline-container flex-1 overflow-x-auto overflow-y-auto relative"
        onClick={e => {
          if ((e.target as HTMLElement).closest('[role="button"]')) return
          setSelectedProject(null)
        }}
      >
        <div
          className="relative"
          style={{ width: totalWidth, minHeight: '100%' }}
        >
          {/* Today line spanning full height including header */}
          {todayPixel > 0 && todayPixel < totalWidth && (
            <div className="absolute top-0 bottom-0 pointer-events-none z-30" style={{ left: todayPixel }}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 text-[10px] font-bold tracking-wide text-rose-500 bg-white px-1.5 py-0.5 rounded-b border border-rose-500 border-t-0 uppercase leading-tight">
                Today
              </div>
              <div className="absolute top-0 bottom-0 border-l-2 border-rose-500" />
            </div>
          )}

          <TimelineHeader
            startDate={timelineStartDate}
            endDate={timelineEndDate}
            monthWidth={monthWidth}
          />

          <div className="relative" style={{ minHeight: 'calc(100% - 72px)' }}>
            <TimelineGrid
              startDate={timelineStartDate}
              endDate={timelineEndDate}
              monthWidth={monthWidth}
            />

            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
              <div className="relative z-10">
                {galleries.map(gallery => {
                  const galleryProjects = exhibitions.filter(p =>
                    p.gallery === gallery.name && p.startDate <= timelineEndDate && p.endDate >= timelineStartDate
                  )
                  return (
                    <GalleryLane
                      key={gallery.id}
                      gallery={gallery}
                      projects={galleryProjects}
                      timelineStart={timelineStartDate}
                      timelineEnd={timelineEndDate}
                      monthWidth={monthWidth}
                      isCollapsed={collapsedLanes.includes(gallery.id)}
                    />
                  )
                })}
              </div>
            </DndContext>

            {exhibitions.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <div className="text-center">
                  <p className="text-body-lg text-slate-muted mb-2">No projects yet</p>
                  <p className="text-body-sm text-slate-muted/70">
                    Add a gallery in Settings, then create your first project
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
