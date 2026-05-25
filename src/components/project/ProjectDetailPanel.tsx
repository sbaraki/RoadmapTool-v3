import { useState, useEffect, useCallback } from 'react'
import { useStore } from '../../store/useStore'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { generateId } from '../../utils/id'
import { MILESTONE_COLORS } from '../../utils/color'
import { isValidDate } from '../../utils/date'
import { Plus, Trash2 } from 'lucide-react'
import type { ExhibitionProject, ProjectCheckpoint } from '../../types'

export function ProjectDetailPanel() {
  const selectedProjectId = useStore(s => s.selectedProjectId)
  const setSelectedProject = useStore(s => s.setSelectedProject)
  const project = useStore(s => s.exhibitions.find(p => p.id === selectedProjectId))
  const galleries = useStore(s => s.galleries)
  const phaseTypes = useStore(s => s.phaseTypes)
  const updateProject = useStore(s => s.updateProject)
  const removeProject = useStore(s => s.removeProject)
  const duplicateProject = useStore(s => s.duplicateProject)
  const addCheckpoint = useStore(s => s.addCheckpoint)
  const updateCheckpoint = useStore(s => s.updateCheckpoint)
  const removeCheckpoint = useStore(s => s.removeCheckpoint)
  const addPhase = useStore(s => s.addPhase)
  const updatePhase = useStore(s => s.updatePhase)
  const removePhase = useStore(s => s.removePhase)
  const applyPhasePreset = useStore(s => s.applyPhasePreset)

  const [title, setTitle] = useState('')
  const [status, setStatus] = useState('TBC')
  const [gallery, setGallery] = useState('')
  const [scheduleMode, setScheduleMode] = useState<'range' | 'single-date'>('range')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (project) {
      // Local edit buffers intentionally reset when a different project is selected.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTitle(project.title)
      setStatus(project.status)
      setGallery(project.gallery)
      setScheduleMode(project.scheduleMode)
      setStartDate(project.startDate)
      setEndDate(project.endDate)
      setDescription(project.description ?? '')
      setErrors({})
      setConfirmDelete(false)
    }
  }, [project])

  const validateAndSave = useCallback(() => {
    if (!project) return
    const errs: Record<string, string> = {}
    if (!title.trim()) errs.title = 'Title is required'
    if (!startDate || !isValidDate(startDate)) errs.startDate = 'Invalid date'
    if (scheduleMode === 'range' && (!endDate || !isValidDate(endDate))) errs.endDate = 'Invalid date'
    if (scheduleMode === 'range' && startDate && endDate && startDate > endDate) errs.endDate = 'End must be after start'
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    updateProject(project.id, {
      title: title.toUpperCase(),
      status: status as ExhibitionProject['status'],
      gallery,
      scheduleMode,
      startDate,
      endDate: scheduleMode === 'single-date' ? startDate : endDate,
      description: description.toUpperCase(),
    })
    setErrors({})
  }, [project, title, status, gallery, scheduleMode, startDate, endDate, description, updateProject])

  const cycleCheckpointColor = useCallback((cp: ProjectCheckpoint) => {
    if (!project) return
    const idx = MILESTONE_COLORS.findIndex(c => c.value === cp.color)
    const next = MILESTONE_COLORS[(idx + 1) % MILESTONE_COLORS.length]
    updateCheckpoint(project.id, cp.id, { color: next.value })
  }, [project, updateCheckpoint])

  if (!project) return null

  const statusOptions = ['TBC', 'In Development', 'Open to Public', 'Closed']
  const galleryOptions = galleries.map(g => ({ value: g.name, label: g.name }))

  return (
    <Modal
      open={!!selectedProjectId}
      onClose={() => setSelectedProject(null)}
      title={project.title || 'Project Details'}
      wide
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Project Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={validateAndSave}
          error={errors.title}
        />

        <div className="grid grid-cols-3 gap-3">
          <Select
            label="Status"
            value={status}
            onChange={e => { setStatus(e.target.value); updateProject(project.id, { status: e.target.value as ExhibitionProject['status'] }) }}
            options={statusOptions.map(s => ({ value: s, label: s }))}
          />
          <Select
            label="Gallery"
            value={gallery}
            onChange={e => { setGallery(e.target.value); updateProject(project.id, { gallery: e.target.value }) }}
            options={galleryOptions}
          />
          <Select
            label="Schedule"
            value={scheduleMode}
            onChange={e => { setScheduleMode(e.target.value as 'range' | 'single-date'); updateProject(project.id, { scheduleMode: e.target.value as 'range' | 'single-date' }) }}
            options={[
              { value: 'range', label: 'Date Range' },
              { value: 'single-date', label: 'Single Date' },
            ]}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Start Date"
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            onBlur={validateAndSave}
            error={errors.startDate}
          />
          {scheduleMode === 'range' && (
            <Input
              label="End Date"
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              onBlur={validateAndSave}
              error={errors.endDate}
            />
          )}
        </div>

        <Input
          label="Description / Notes"
          value={description}
          onChange={e => setDescription(e.target.value)}
          onBlur={validateAndSave}
          placeholder="Optional description..."
        />

        <div className="border-t border-outline-variant pt-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-label-md uppercase text-slate-muted">Phases</h3>
            <select
              className="text-label-md px-1.5 py-0.5 rounded border border-outline-variant bg-white text-slate-muted cursor-pointer outline-none hover:border-outline focus:border-secondary"
              value=""
              onChange={e => { if (e.target.value) applyPhasePreset(project.id, e.target.value as 'standard' | 'full' | 'simple' | 'clear'); }}
              aria-label="Phase preset"
            >
              <option value="" disabled>Preset…</option>
              <option value="standard">Standard</option>
              <option value="full">Full</option>
              <option value="simple">Simple</option>
              <option value="clear">Clear</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            {project.phases.map((phase, idx) => {
              const pt = phaseTypes.find(t => t.id === phase.typeId)
              return (
                <div key={phase.id} className="flex items-center gap-2 p-2 rounded bg-surface-container-low">
                  <span className="text-mono-data text-xs text-slate-muted w-5 text-right shrink-0">{idx + 1}.</span>
                  <div
                    className="w-1.5 h-6 rounded-sm shrink-0"
                    style={{ backgroundColor: pt?.color ?? '#94a3b8' }}
                  />
                  <input
                    className="flex-1 text-body-sm bg-transparent border-b border-transparent hover:border-outline-variant focus:border-secondary outline-none px-1 min-w-0"
                    value={phase.label}
                    onChange={e => updatePhase(project.id, phase.id, { label: e.target.value })}
                    onBlur={() => updatePhase(project.id, phase.id, { label: phase.label.toUpperCase() })}
                  />
                  <input
                    className="w-14 text-mono-data text-xs bg-transparent border-b border-transparent hover:border-outline-variant focus:border-secondary outline-none text-right px-1 shrink-0"
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={phase.durationMonths}
                    onChange={e => updatePhase(project.id, phase.id, { durationMonths: parseFloat(e.target.value) || 0.5 })}
                  />
                  <span className="text-mono-data text-xs text-slate-muted w-6 shrink-0">mo</span>
                  <select
                    className="text-mono-data text-xs border border-outline-variant rounded bg-white px-1 py-0.5 text-slate-text outline-none cursor-pointer shrink-0 hover:border-outline focus:border-secondary"
                    value={phase.typeId}
                    onChange={e => updatePhase(project.id, phase.id, { typeId: e.target.value })}
                  >
                    {phaseTypes.map(pt => (
                      <option key={pt.id} value={pt.id}>{pt.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => removePhase(project.id, phase.id)}
                    className="p-0.5 rounded hover:bg-error-container text-error shrink-0 cursor-pointer"
                    aria-label="Remove phase"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )
            })}
            <button
              onClick={() => {
                if (phaseTypes.length === 0) return
                addPhase(project.id, {
                  id: generateId(),
                  label: 'NEW PHASE',
                  durationMonths: 3,
                  typeId: phaseTypes[0].id,
                })
              }}
              className="flex items-center gap-1.5 text-label-md px-2 py-1 rounded text-slate-muted hover:bg-surface-container cursor-pointer"
            >
              <Plus size={14} /> Add Phase
            </button>
          </div>
        </div>

        <div className="border-t border-outline-variant pt-3">
          <h3 className="text-label-md uppercase text-slate-muted mb-2">Milestones</h3>
          <div className="flex flex-wrap gap-1 mb-2">
            {(['deliverable', 'presentation', 'external', 'date'] as const).map(kind => (
              <button
                key={kind}
                onClick={() => {
                  const now = new Date()
                  addCheckpoint(project.id, {
                    id: generateId(),
                    title: kind.charAt(0).toUpperCase() + kind.slice(1),
                    date: now.toISOString().slice(0, 10),
                    kind,
                    color: MILESTONE_COLORS[0].value,
                  })
                }}
                className="text-label-md px-2 py-0.5 rounded border border-outline-variant text-slate-muted hover:bg-surface-container cursor-pointer"
              >
                + {kind.charAt(0).toUpperCase() + kind.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-1.5">
            {project.checkpoints.map(cp => (
              <div key={cp.id} className="flex items-center gap-2 p-2 rounded bg-surface-container-low">
                <button
                  className="w-3 h-3 rounded-sm shrink-0 cursor-pointer hover:opacity-80"
                  style={{ backgroundColor: cp.color ?? '#64748b' }}
                  onClick={() => cycleCheckpointColor(cp)}
                  title={`Color: ${MILESTONE_COLORS.find(c => c.value === cp.color)?.label ?? 'Default'} (click to cycle)`}
                />
                <input
                  className="flex-1 text-body-sm bg-transparent border-b border-transparent hover:border-outline-variant focus:border-secondary outline-none px-1 min-w-0"
                  value={cp.title}
                  onChange={e => updateCheckpoint(project.id, cp.id, { title: e.target.value })}
                />
                <input
                  className="w-28 text-mono-data text-xs bg-transparent border-b border-transparent hover:border-outline-variant focus:border-secondary outline-none px-1 shrink-0"
                  type="date"
                  value={cp.date}
                  onChange={e => updateCheckpoint(project.id, cp.id, { date: e.target.value })}
                />
                <select
                  className="text-mono-data text-xs border border-outline-variant rounded bg-white px-1 py-0.5 text-slate-text outline-none cursor-pointer shrink-0 hover:border-outline focus:border-secondary"
                  value={cp.kind}
                  onChange={e => updateCheckpoint(project.id, cp.id, { kind: e.target.value as ProjectCheckpoint['kind'] })}
                >
                  <option value="deliverable">Deliverable</option>
                  <option value="presentation">Presentation</option>
                  <option value="external">External</option>
                  <option value="date">Date</option>
                </select>
                <button
                  onClick={() => removeCheckpoint(project.id, cp.id)}
                  className="p-0.5 rounded hover:bg-error-container text-error shrink-0 cursor-pointer"
                  aria-label="Remove milestone"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-outline-variant pt-3">
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => duplicateProject(project.id)}>
              Duplicate
            </Button>
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <Button variant="danger" size="sm" onClick={() => { removeProject(project.id); setConfirmDelete(false) }}>
                  Confirm Delete
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(true)}>
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
