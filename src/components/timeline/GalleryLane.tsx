import { useMemo, type CSSProperties } from 'react'
import { format, parseISO } from 'date-fns'
import type { Gallery, ExhibitionProject } from '../../types'
import { ProjectBar } from './ProjectBar'
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

const PERMANENT_PDF_LABEL_MIN_WIDTH = 150
const PERMANENT_PDF_LANE_HEIGHT = 22
const PERMANENT_PDF_MARKER_GAP = 12
const PERMANENT_PDF_TITLE_CHARACTER_WIDTH = 6.8
const PERMANENT_PDF_MARKER_CHROME_WIDTH = 18

function getPermanentPdfMilestoneWidth(project: ExhibitionProject) {
  return Math.max(
    PERMANENT_PDF_LABEL_MIN_WIDTH,
    Math.ceil(project.title.length * PERMANENT_PDF_TITLE_CHARACTER_WIDTH) + PERMANENT_PDF_MARKER_CHROME_WIDTH,
  )
}

function formatPermanentMilestoneDate(value: string) {
  return format(parseISO(value), 'MMM d, yyyy')
}

function getPermanentPdfMilestoneLanes(projects: ExhibitionProject[], timelineStart: string, monthWidth: number) {
  const occupiedRightByLane: number[] = []

  return projects
    .map(project => ({
      project,
      left: dateToPixel(timelineStart, project.endDate, monthWidth),
      width: getPermanentPdfMilestoneWidth(project),
    }))
    .sort((a, b) => a.left - b.left)
    .map(item => {
      let lane = occupiedRightByLane.findIndex(right => item.left > right + PERMANENT_PDF_MARKER_GAP)
      if (lane === -1) lane = occupiedRightByLane.length
      occupiedRightByLane[lane] = item.left + item.width
      return { ...item, lane }
    })
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
  const sortedProjects = useMemo(
    () => [...projects].sort((a, b) => (a.laneOrder ?? 0) - (b.laneOrder ?? 0)),
    [projects],
  )

  const totalWidth = Math.max(monthWidth, dateToPixel(timelineStart, timelineEnd, monthWidth))
  const galleryColor = getGalleryColor(gallery.name)
  const isPermanent = gallery.kind === 'permanent'
  const permanentPdfMilestones = useMemo(
    () => getPermanentPdfMilestoneLanes(sortedProjects, timelineStart, monthWidth),
    [sortedProjects, timelineStart, monthWidth],
  )
  const permanentPdfLaneCount = permanentPdfMilestones.length
    ? Math.max(...permanentPdfMilestones.map(item => item.lane)) + 1
    : 1
  const permanentPdfBodyHeight = Math.max(42, permanentPdfLaneCount * PERMANENT_PDF_LANE_HEIGHT + 18)

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



  function renderCollapsedProject(project: (typeof sortedProjects)[0]) {
    const left = dateToPixel(timelineStart, project.startDate, monthWidth)
    const w = dateToPixel(project.startDate, project.endDate, monthWidth)
    const showLabel = w >= 100
    const statusColor = STATUS_COLORS[project.status] ?? '#94a3b8'
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
    <div className={`border-b border-outline-variant/30 ${isPermanent ? 'permanent-gallery-lane' : ''}`}>
      <div className="sticky left-0 z-10 flex items-center gap-2 px-3 py-1.5 bg-surface-container-low/60 border-b border-outline-variant/20">
        <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: galleryColor }} />
        <span className="text-label-md text-slate-muted tracking-wide uppercase">{gallery.name}</span>
        <span className="text-mono-data text-xs text-slate-muted/60">{projects.length}</span>
      </div>

      {isPermanent && (
        <div
          className="permanent-pdf-summary-body relative overflow-hidden"
          style={{
            width: totalWidth,
            height: permanentPdfBodyHeight,
            '--permanent-pdf-body-height': `${permanentPdfBodyHeight}px`,
          } as CSSProperties}
          onDoubleClick={handleDoubleClick}
        >
          {permanentPdfMilestones.length === 0 ? (
            <span className="permanent-pdf-empty absolute">No permanent milestones</span>
          ) : (
            permanentPdfMilestones.map(({ project, left, lane, width }) => {
              const statusColor = STATUS_COLORS[project.status] ?? '#94a3b8'
              return (
                <button
                  key={project.id}
                  type="button"
                  className="permanent-pdf-milestone absolute flex items-start gap-1.5 text-left"
                  style={{
                    left,
                    top: lane * PERMANENT_PDF_LANE_HEIGHT + 9,
                    '--permanent-milestone-color': statusColor,
                    '--permanent-milestone-width': `${width}px`,
                  } as CSSProperties}
                  onClick={() => setSelectedProject(project.id)}
                >
                  <span className="permanent-pdf-milestone-dot" />
                  <span className="permanent-pdf-milestone-label">
                    <span className="permanent-pdf-milestone-title">{project.title}</span>
                    <span className="permanent-pdf-milestone-date">{formatPermanentMilestoneDate(project.endDate)}</span>
                  </span>
                </button>
              )
            })
          )}
        </div>
      )}

      {sortedProjects.map(project => {
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
