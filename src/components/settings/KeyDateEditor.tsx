import { Plus, Trash2 } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

export function KeyDateEditor() {
  const keyDates = useStore(s => s.keyDates)
  const addKeyDate = useStore(s => s.addKeyDate)
  const updateKeyDate = useStore(s => s.updateKeyDate)
  const removeKeyDate = useStore(s => s.removeKeyDate)

  return (
    <section className="border-t border-outline-variant pt-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-label-md uppercase text-slate-muted mb-1">Timeline Key Dates</h3>
          <p className="text-body-xs text-slate-muted/80 leading-relaxed max-w-[560px]">
            Add labeled date lines for annual workflows, holidays, blackout periods, or any reminder that should sit above every gallery lane.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => addKeyDate()}>
          <Plus size={14} /> Add Key Date
        </Button>
      </div>

      {keyDates.length === 0 ? (
        <div className="rounded-md border border-dashed border-outline-variant bg-surface-container-lowest px-3 py-4 text-body-sm text-slate-muted">
          No key dates yet. Add one to show a labeled line on the timeline.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {keyDates.map(keyDate => (
            <div key={keyDate.id} className="rounded-md border border-outline-variant bg-surface-container-lowest p-3">
              <div className="grid grid-cols-[1.4fr_130px_130px_92px_auto] items-end gap-2">
                <Input
                  label="Label"
                  value={keyDate.title}
                  onChange={e => updateKeyDate(keyDate.id, { title: e.target.value })}
                  placeholder="Site opening workflows"
                />
                <Input
                  label="Start"
                  type="date"
                  value={keyDate.startDate}
                  onChange={e => updateKeyDate(keyDate.id, { startDate: e.target.value })}
                />
                <Input
                  label="End"
                  type="date"
                  value={keyDate.endDate}
                  onChange={e => updateKeyDate(keyDate.id, { endDate: e.target.value })}
                />
                <Input
                  label="Color"
                  type="color"
                  value={keyDate.color}
                  onChange={e => updateKeyDate(keyDate.id, { color: e.target.value })}
                  className="h-[34px] px-1 py-1"
                />
                <button
                  type="button"
                  onClick={() => removeKeyDate(keyDate.id)}
                  className="mb-0.5 inline-flex h-[34px] w-[34px] items-center justify-center rounded-md text-error hover:bg-error-container cursor-pointer"
                  aria-label={`Remove ${keyDate.title || 'key date'}`}
                  title="Remove key date"
                >
                  <Trash2 size={15} />
                </button>
              </div>
              <label className="mt-2 inline-flex items-center gap-2 text-body-sm text-slate-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={keyDate.recursAnnually}
                  onChange={e => updateKeyDate(keyDate.id, { recursAnnually: e.target.checked })}
                  className="h-4 w-4 rounded border-outline-variant text-secondary"
                />
                Repeat every year using the same month and day range
              </label>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
