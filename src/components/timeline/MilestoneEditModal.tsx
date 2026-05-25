import { useCallback, useState } from 'react'
import { useStore } from '../../store/useStore'
import { Modal } from '../ui/Modal'
import { MILESTONE_COLORS } from '../../utils/color'
import { isValidDate } from '../../utils/date'
import { Trash2 } from 'lucide-react'
import type { ProjectCheckpoint } from '../../types'

export function MilestoneEditModal() {
  const editingCheckpoint = useStore(s => s.editingCheckpoint)
  const setEditingCheckpoint = useStore(s => s.setEditingCheckpoint)
  const project = useStore(s => s.exhibitions.find(p => p.id === editingCheckpoint?.projectId))
  const updateCheckpoint = useStore(s => s.updateCheckpoint)
  const removeCheckpoint = useStore(s => s.removeCheckpoint)

  const checkpoint: ProjectCheckpoint | undefined = project?.checkpoints.find(
    cp => cp.id === editingCheckpoint?.checkpointId
  )

  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleClose = useCallback(() => {
    setEditingCheckpoint(null)
    setConfirmDelete(false)
  }, [setEditingCheckpoint])

  if (!editingCheckpoint || !project || !checkpoint) return null

  const cycleColor = () => {
    const currentIndex = MILESTONE_COLORS.findIndex(c => c.value === (checkpoint.color ?? '#64748b'))
    const nextColor = MILESTONE_COLORS[(currentIndex + 1) % MILESTONE_COLORS.length].value
    updateCheckpoint(project.id, checkpoint.id, { color: nextColor === '#64748b' ? undefined : nextColor })
  }

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    removeCheckpoint(project.id, checkpoint.id)
    handleClose()
  }

  const currentColor = checkpoint.color ?? '#64748b'
  const colorLabel = MILESTONE_COLORS.find(c => c.value === currentColor)?.label ?? 'Default'

  return (
    <Modal open onClose={handleClose} title="Edit Milestone">
      <div className="flex flex-col gap-4">
        {/* Title */}
        <div className="flex flex-col gap-1">
          <label className="text-label-sm text-slate-text">Title</label>
          <input
            className="w-full text-body-sm bg-transparent border-b border-outline-variant hover:border-outline focus:border-secondary outline-none px-1 py-1"
            value={checkpoint.title}
            onChange={e => updateCheckpoint(project.id, checkpoint.id, { title: e.target.value })}
          />
        </div>

        {/* Date */}
        <div className="flex flex-col gap-1">
          <label className="text-label-sm text-slate-text">Date</label>
          <input
            className="w-full text-mono-data text-sm border border-outline-variant rounded bg-white px-2 py-1 text-slate-text outline-none hover:border-outline focus:border-secondary"
            type="date"
            value={checkpoint.date}
            onChange={e => {
              if (isValidDate(e.target.value)) {
                updateCheckpoint(project.id, checkpoint.id, { date: e.target.value })
              }
            }}
          />
        </div>

        {/* Kind */}
        <div className="flex flex-col gap-1">
          <label className="text-label-sm text-slate-text">Kind</label>
          <select
            className="w-full text-mono-data text-sm border border-outline-variant rounded bg-white px-2 py-1 text-slate-text outline-none cursor-pointer hover:border-outline focus:border-secondary"
            value={checkpoint.kind}
            onChange={e => updateCheckpoint(project.id, checkpoint.id, { kind: e.target.value as ProjectCheckpoint['kind'] })}
          >
            <option value="deliverable">Deliverable</option>
            <option value="presentation">Presentation</option>
            <option value="external">External</option>
            <option value="date">Date</option>
          </select>
        </div>

        {/* Color */}
        <div className="flex flex-col gap-1">
          <label className="text-label-sm text-slate-text">Color ({colorLabel})</label>
          <div className="flex gap-2 items-center">
            <button
              className="w-6 h-6 rounded-sm cursor-pointer hover:opacity-80 border border-outline-variant"
              style={{ backgroundColor: currentColor }}
              onClick={cycleColor}
              title="Click to cycle color"
            />
            <span className="text-body-xs text-slate-text/60">Click to cycle through palette colors</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-outline-variant pt-3 mt-1">
          <button
            onClick={handleDelete}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs cursor-pointer transition-colors ${
              confirmDelete
                ? 'bg-error text-white'
                : 'text-error hover:bg-error-container'
            }`}
          >
            <Trash2 size={14} />
            {confirmDelete ? 'Confirm Delete' : 'Delete Milestone'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
