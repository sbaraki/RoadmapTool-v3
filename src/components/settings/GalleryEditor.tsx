import { useStore } from '../../store/useStore'
import { Button } from '../ui/Button'
import { generateId } from '../../utils/id'
import { Trash2 } from 'lucide-react'

export function GalleryEditor() {
  const galleries = useStore(s => s.galleries)
  const updateGallery = useStore(s => s.updateGallery)
  const removeGallery = useStore(s => s.removeGallery)
  const addGallery = useStore(s => s.addGallery)

  return (
    <div>
      <h3 className="text-label-md uppercase text-slate-muted mb-2">Locations / Galleries</h3>
      <div className="flex flex-col gap-2">
        {galleries.map(g => (
          <div key={g.id} className="flex items-center gap-2 p-2 rounded bg-surface-container-low">
            <input
              className="flex-1 text-body-sm bg-transparent border-b border-transparent hover:border-outline-variant focus:border-secondary outline-none px-1"
              value={g.name}
              onChange={e => updateGallery(g.id, { name: e.target.value.toUpperCase() })}
            />
            <select
              value={g.kind}
              onChange={e => updateGallery(g.id, { kind: e.target.value as 'permanent' | 'temporary' })}
              className="text-body-sm border border-outline-variant rounded px-1.5 py-0.5 bg-white"
            >
              <option value="temporary">Temporary</option>
              <option value="permanent">Permanent</option>
            </select>
            <button
              onClick={() => removeGallery(g.id)}
              disabled={galleries.length <= 1}
              className="p-0.5 rounded hover:bg-error-container text-error cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Remove gallery"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => addGallery({
            id: generateId(),
            name: 'NEW GALLERY',
            kind: 'temporary',
          })}
        >
          + Add Gallery
        </Button>
      </div>
    </div>
  )
}
