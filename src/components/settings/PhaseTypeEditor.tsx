import { useStore } from '../../store/useStore'
import { Button } from '../ui/Button'
import { generateId } from '../../utils/id'
import { Trash2 } from 'lucide-react'

export function PhaseTypeEditor() {
  const phaseTypes = useStore(s => s.phaseTypes)
  const updatePhaseType = useStore(s => s.updatePhaseType)
  const removePhaseType = useStore(s => s.removePhaseType)
  const addPhaseType = useStore(s => s.addPhaseType)

  return (
    <div>
      <h3 className="text-label-md uppercase text-slate-muted mb-2">Phase Types</h3>
      <div className="flex flex-col gap-2">
        {phaseTypes.map(pt => (
          <div key={pt.id} className="flex items-center gap-2 p-2 rounded bg-surface-container-low">
            <input
              type="color"
              value={pt.color}
              onChange={e => updatePhaseType(pt.id, { color: e.target.value })}
              className="w-6 h-6 rounded cursor-pointer border-0 p-0"
            />
            <input
              className="flex-1 text-body-sm bg-transparent border-b border-transparent hover:border-outline-variant focus:border-secondary outline-none px-1"
              value={pt.label}
              onChange={e => updatePhaseType(pt.id, { label: e.target.value.toUpperCase() })}
            />
            <button
              onClick={() => removePhaseType(pt.id)}
              className="p-0.5 rounded hover:bg-error-container text-error cursor-pointer"
              aria-label="Remove phase type"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => addPhaseType({
            id: generateId(),
            label: 'NEW PHASE',
            color: '#6366f1',
          })}
        >
          + Add Phase Type
        </Button>
      </div>
    </div>
  )
}
