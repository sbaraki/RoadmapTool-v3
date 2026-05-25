import { useState } from 'react'
import {
  Plus, Undo2, Redo2, Download, Printer, Settings, LoaderCircle,
  Eye, EyeOff, ChevronsUpDown, ChevronsDownUp, Crosshair, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react'
import { useStore } from '../../store/useStore'
import { IconButton } from '../ui/IconButton'
import { exportTimelineToPdf } from '../../utils/pdfExport'

export function Header() {
  const [exporting, setExporting] = useState(false)
  const {
    museumName,
    undo, redo, canUndo, canRedo,
    showMilestones, setShowMilestones,
    sidebarOpen, setSidebarOpen,
    expandAllLanes, collapseAllLanes,
    addProject,
    setSettingsOpen,
    exhibitions,
    galleries,
    timelineStartDate, timelineEndDate,
    setTimelineRange, setMonthWidth, monthWidth,
  } = useStore()

  function handleNewProject() {
    addProject()
  }

  function handleScrollToToday() {
    window.dispatchEvent(new CustomEvent('timeline-scroll-today'))
  }

  return (
    <header className="bg-white border-b border-outline-variant no-print">
      <div className="flex items-center justify-between gap-4 px-container py-2">
        <div className="flex min-w-0 flex-col">
          <h1 className="text-headline-sm text-slate-text truncate">{museumName || 'PORTFOLIO ROADMAP'}</h1>
          <span className="text-body-sm text-slate-muted">Portfolio Timeline</span>
        </div>

        <div className="flex min-w-0 items-center gap-1 overflow-x-auto py-1">
          <IconButton
            label={sidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            active={sidebarOpen}
          >
            {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </IconButton>

          <div className="w-px h-5 bg-outline-variant mx-1" />

          <IconButton label={galleries.length > 0 ? 'New Project' : 'Add a gallery first'} onClick={handleNewProject} disabled={galleries.length === 0}>
            <Plus size={18} />
          </IconButton>

          <div className="w-px h-5 bg-outline-variant mx-1" />

           <IconButton label="Undo" onClick={undo} disabled={!canUndo()}>
             <Undo2 size={18} />
           </IconButton>
           <IconButton label="Redo" onClick={redo} disabled={!canRedo()}>
             <Redo2 size={18} />
           </IconButton>

          <div className="w-px h-5 bg-outline-variant mx-1" />

          <IconButton
            label={showMilestones ? 'Hide Milestones' : 'Show Milestones'}
            onClick={() => setShowMilestones(!showMilestones)}
            active={showMilestones}
          >
            {showMilestones ? <Eye size={18} /> : <EyeOff size={18} />}
          </IconButton>

          <IconButton label="Expand All" onClick={expandAllLanes}>
            <ChevronsDownUp size={18} />
          </IconButton>
          <IconButton label="Collapse All" onClick={collapseAllLanes}>
            <ChevronsUpDown size={18} />
          </IconButton>

          <div className="w-px h-5 bg-outline-variant mx-1" />

          <div className="flex items-center gap-1.5 mr-2 text-label-md text-slate-muted">
            <label className="flex items-center gap-1">
              <span>Start</span>
              <input
                type="date"
                value={timelineStartDate}
                max={timelineEndDate}
                onChange={event => setTimelineRange(event.target.value, timelineEndDate)}
                className="h-7 rounded border border-outline-variant bg-white px-1.5 text-xs text-slate-text outline-none hover:border-outline focus:border-secondary"
              />
            </label>
            <label className="flex items-center gap-1">
              <span>End</span>
              <input
                type="date"
                value={timelineEndDate}
                min={timelineStartDate}
                onChange={event => setTimelineRange(timelineStartDate, event.target.value)}
                className="h-7 rounded border border-outline-variant bg-white px-1.5 text-xs text-slate-text outline-none hover:border-outline focus:border-secondary"
              />
            </label>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setMonthWidth(monthWidth - 5)}
              className="text-body-sm px-1.5 py-0.5 rounded hover:bg-surface-container text-slate-muted cursor-pointer"
              aria-label="Zoom out"
            >
              -
            </button>
            <span className="text-mono-data text-slate-muted w-8 text-center">{Math.round(monthWidth)}</span>
            <button
              onClick={() => setMonthWidth(monthWidth + 5)}
              className="text-body-sm px-1.5 py-0.5 rounded hover:bg-surface-container text-slate-muted cursor-pointer"
              aria-label="Zoom in"
            >
              +
            </button>
          </div>

          <div className="w-px h-5 bg-outline-variant mx-1" />

          <IconButton label="CSV Export" onClick={() => {
            import('../../utils/csv').then(({ generateCsv, downloadCsv }) => {
              const csv = generateCsv(exhibitions)
              const safeName = (museumName || 'portfolio').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
              downloadCsv(csv, `${safeName}_exhibitions_${new Date().toISOString().slice(0, 10)}.csv`)
            })
          }}>
            <Download size={18} />
          </IconButton>

          <IconButton label="Scroll To Today" onClick={handleScrollToToday}>
            <Crosshair size={18} />
          </IconButton>

          <IconButton
            label="Export PDF"
            disabled={exporting}
            onClick={async () => {
              setExporting(true)
              await exportTimelineToPdf()
              setExporting(false)
            }}
          >
            {exporting ? <LoaderCircle size={18} className="animate-spin" /> : <Printer size={18} />}
          </IconButton>

          <IconButton label="Settings" onClick={() => setSettingsOpen(true)}>
            <Settings size={18} />
          </IconButton>

        </div>
      </div>
    </header>
  )
}
