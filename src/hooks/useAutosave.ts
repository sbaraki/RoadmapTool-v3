import { useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'

export function useAutosave() {
  const saveToStorage = useStore(s => s.saveToStorage)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    const unsub = useStore.subscribe(() => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        saveToStorage()
      }, 300)
    })
    return () => {
      unsub()
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [saveToStorage])
}
