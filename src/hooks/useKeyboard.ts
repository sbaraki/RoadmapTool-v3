import { useEffect } from 'react'
import { useStore } from '../store/useStore'

export function useKeyboard() {
  const undo = useStore(s => s.undo)
  const redo = useStore(s => s.redo)

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (e.shiftKey) {
          e.preventDefault()
          redo()
        } else {
          e.preventDefault()
          undo()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [undo, redo])
}
