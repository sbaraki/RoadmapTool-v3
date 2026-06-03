import { useMemo, type CSSProperties } from 'react'
import { parseISO } from 'date-fns'
import type { Gallery, ExhibitionProject, ProjectCheckpoint } from '../../types'
import { ProjectBar } from './ProjectBar'
import { MilestoneMarker } from './MilestoneMarker'
import { STATUS_COLORS, getGalleryColor } from '../../utils/color'
import { useStore } from '../../store/useStore'
import { addMonthsToString, dateToPixel, pixelToDate } from '../../utils/date'

interface GalleryLaneProps {
  gallery: Gallery
  projects: ExhibitionProject[]
  timelineStart: string
  timelineEnd: string
  monthWidth: number
  isCollapsed: boolean
}

type AssignedLane = { checkpoint: ProjectCheckpoint; lane: number }

function computeMilestoneLanes(
  checkpoints: ProjectCheckpoint[],
  timelineStart: string,
  monthWidth: number,
): { lanes: AssignedLane[]; maxLanes: number; bandHeight: number } {
  if (checkpoints.length === 0) return { lanes: [], maxLanes: 0, bandHeight: 0 }

  const occupied = new Map<number, [number, number][]>()
  const lanes: AssignedLane[] = []

  const sorted = [...checkpoints].sort(
    (a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime(),
  )

  for (const cp of sorted) {
    const cpLeft = dateToPixel(timelineStart, cp.date, monthWidth)
    const tickOffset = 14
    const projectDotWidth = 10
    const titleWidth = cp.title.length * 6.2
    const metaWidth = `${cp.date} · ${cp.kind}`.length * 5.5
    const labelTextWidth = Math.max(titleWidth, metaWidth) + 8
    const labelWidth = Math.min(240, Math.max(100, tickOffset + projectDotWidth + labelTextWidth))
    const cpRight = cpLeft + labelWidth

    let lane = 0
    while (true) {
      const ranges = occupied.get(lane) ?? []
      const conflict = ranges.some(([l, r]) => cpLeft - 20 < r && cpRight + 20 > l)
      if (!conflict) {
        occupied.set(lane, [...ranges, [cpLeft, cpRight]])
        lanes.push({ checkpoint: cp, lane })
        break
      }
      lane++
    }
  }

  const maxLane = lanes.length > 0 ? Math.max(...lanes.map(a => a.lane)) + 1 : 0
  const bandHeight = Math.max(maxLane, 1) * 30 + 10
  return { lanes, maxLanes: maxLane, bandHeight }
}

export function GalleryLane({
  gallery,
  projects,
  timelineStart,
  timelineEnd,
  monthWidth,
  isCollapsed,
}: GalleryLaneProps) {
  const phaseTypes = useStore(s => s.phaseTypes)
  const selectedProjectId = useStore(s => s.selectedProjectId)
  const setSelectedProject = useStore(s => s.setSelectedProject)
  const addProject = useStore(s => s.addProject)
  const showMilestones = useStore(s => s.showMilestones)

  const sortedProjects = useMemo(
    () => [...projects].sort((a, b) => (a.laneOrder ?? 0) - (b.laneOrder ?? 0)),
    [projects],
  )

  const totalWidth = Math.max(monthWidth, dateToPixel(timelineStart, timelineEnd, monthWidth))
  const galleryColor = getGalleryColor(gallery.name)

  const perProjectMilestones = useMemo(() => {
    const map = new Map<string, { lanes: AssignedLane[]; maxLanes: number; bandHeight: number }>()
    for (const project of sortedProjects) {
      const cps = (project.checkpoints ?? []).filter(
        cp => cp.date >= timelineStart && cp.date <= timelineEnd
      )
      if (showMilestones && cps.length > 0) {
        map.set(project.id, computeMilestoneLanes(cps, timelineStart, monthWidth))
      }
    }
    return map
  }, [sortedProjects, timelineStart, timelineEnd, monthWidth, showMilestones])

  function handleDoubleClick(e: React.MouseEvent<HTMLElement>) {
    if ((e.target as HTMLElement).closest('[role="button"]')) return
    const rect = e.currentTarget.getBoundingClientRect()
    const clickedDate = pixelToDate(timelineStart, e.clientX - rect.left, monthWidth)
    const mode = gallery.kind === 'permanent' ? 'single-date' : 'range'
    addProject({
      gallery: gallery.name,
      scheduleMode: mode,
      startDate: clickedDate,
      endDate: mode === 'single-date' ? clickedDate : addMonthsToString(clickedDate, 24),
      laneOrder: sortedProjects.length,
    })
  }

  const setEditingCheckpoint = useStore(s => s.setEditingCheckpoint)

  function renderCollapsedProject(project: (typeof sortedProjects)[0]) {
    const left = dateToPixel(timelineStart, project.startDate, monthWidth)
    const w = dateToPixel(project.startDate, project.endDate, monthWidth)
    const showLabel = w >= 100
    const statusColor = STATUS_COLORS[project.status] ?? '#94a3b8'
    const milestones = (project.checkpoints ?? []).filter(
      cp => cp.date >= timelineStart && cp.date <= timelineEnd
    )
    const projectStartPx = left
    return (
      <div
        key={project.id}
        className="collapsed-project-preview absolute rounded-sm cursor-pointer transition-opacity hover:opacity-80 flex flex-col items-start justify-center overflow-hidden px-1.5"
        style={{
          left,
          width: Math.max(w, 4),
          backgroundColor: `${statusColor}24`,
          borderLeft: `3px solid ${statusColor}`,
          boxShadow: `inset 0 0 0 1px ${statusColor}30`,
        }}
        onClick={() => setSelectedProject(project.id)}
      >
        <span className="text-mono-data text-[10px] font-semibold text-slate-text leading-tight truncate w-full">
          {project.title}
        </span>
        {showLabel && (
          <span className="text-mono-data text-[9px] text-slate-muted leading-tight truncate w-full">
            {project.startDate} – {project.endDate}
          </span>
        )}
        {milestones.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 flex items-end">
            {milestones.map(cp => {
              const dotLeft = dateToPixel(timelineStart, cp.date, monthWidth) - projectStartPx
              if (dotLeft < 0 || dotLeft > Math.max(w, 4)) return null
              return (
                <div
                  key={cp.id}
                  className="absolute w-1.5 h-1.5 rounded-full cursor-pointer z-10 hover:scale-150 transition-transform"
                  style={{ left: dotLeft - 3, backgroundColor: cp.color ?? '#64748b' }}
                  title={cp.title}
                  onClick={e => {
                    e.stopPropagation()
                    setEditingCheckpoint({ projectId: project.id, checkpointId: cp.id })
                  }}
                />
              )
            })}
          </div>
        )}
      </div>
    )
  }

  if (isCollapsed) {
    return (
      <div className="border-b border-outline-variant/30">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-low/60">
          <div
            className="w-2 h-2 rounded-sm flex-shrink-0"
            style={{ backgroundColor: galleryColor }}
          />
          <span className="text-label-md text-slate-muted tracking-wide uppercase">
            {gallery.name}
          </span>
          <span className="text-mono-data text-xs text-slate-muted/60">{projects.length}</span>
        </div>
        <div className="collapsed-lane-body relative overflow-hidden" style={{ width: totalWidth }} onDoubleClick={handleDoubleClick}>
          {sortedProjects.map(project => {
            if (project.scheduleMode === 'single-date') {
              const left = dateToPixel(timelineStart, project.startDate, monthWidth)
              const statusColor = STATUS_COLORS[project.status] ?? '#94a3b8'
              const milestones = (project.checkpoints ?? []).filter(
                cp => cp.date >= timelineStart && cp.date <= timelineEnd
              )
              return (
                <div
                  key={project.id}
                  className="collapsed-project-single absolute flex items-center gap-1.5 cursor-pointer hover:opacity-80"
                  style={{ left }}
                  onClick={() => setSelectedProject(project.id)}
                >
                  <div
                    className="w-2.5 h-2.5 rotate-45 rounded-sm shrink-0"
                    style={{ backgroundColor: statusColor }}
                  />
                  <span className="text-mono-data text-[10px] font-semibold text-slate-text truncate max-w-[120px]">
                    {project.title}
                  </span>
                  <span className="text-mono-data text-[9px] text-slate-muted whitespace-nowrap">
                    {project.startDate}
                  </span>
                  {milestones.length > 0 && (
                    <div className="flex items-center gap-0.5 ml-1">
                      {milestones.map(cp => (
                        <div
                          key={cp.id}
                          className="w-1.5 h-1.5 rounded-full cursor-pointer hover:scale-150 transition-transform"
                          style={{ backgroundColor: cp.color ?? '#64748b' }}
                          title={cp.title}
                          onClick={e => {
                            e.stopPropagation()
                            setEditingCheckpoint({ projectId: project.id, checkpointId: cp.id })
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            }
            return renderCollapsedProject(project)
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="border-b border-outline-variant/30">
      <div className="sticky left-0 z-10 flex items-center gap-2 px-3 py-1.5 bg-surface-container-low/60 border-b border-outline-variant/20">
        <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: galleryColor }} />
        <span className="text-label-md text-slate-muted tracking-wide uppercase">{gallery.name}</span>
        <span className="text-mono-data text-xs text-slate-muted/60">{projects.length}</span>
      </div>

      {sortedProjects.map(project => {
        const pm = perProjectMilestones.get(project.id)
        const hasMilestones = Boolean(pm && pm.lanes.length > 0)

        return (
          <div key={project.id} className="project-block">
            <div className="lane-row" onDoubleClick={handleDoubleClick}>
              <ProjectBar
                project={project}
                startDate={timelineStart}
                monthWidth={monthWidth}
                phaseTypes={phaseTypes}
                isSelected={selectedProjectId === project.id}
                onClick={() => setSelectedProject(project.id)}
              />
            </div>
            {hasMilestones && (
              <div
                className="milestone-band relative"
                style={{
                  height: pm!.bandHeight,
                  '--milestone-band-base': `${pm!.bandHeight}px`,
                } as CSSProperties}
              >
                {pm!.lanes.map(({ checkpoint, lane }) => (
                  <MilestoneMarker
                    key={checkpoint.id}
                    projectId={project.id}
                    checkpoint={checkpoint}
                    originDate={timelineStart}
                    monthWidth={monthWidth}
                    laneIndex={lane}
                    totalLanes={pm!.maxLanes}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}

      {sortedProjects.length === 0 && (
        <div
          className="project-block"
          onDoubleClick={handleDoubleClick}
        >
          <div className="lane-row flex items-center justify-center" style={{ width: totalWidth }}>
            <span className="text-body-sm text-slate-muted/30 italic">Double-click to add project</span>
          </div>
        </div>
      )}
    </div>
  )
}
