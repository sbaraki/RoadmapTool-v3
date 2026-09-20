import { useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'
import type { PortfolioData } from '../types'

function selectPortfolioData(state: ReturnType<typeof useStore.getState>): PortfolioData {
  return {
    museumName: state.museumName,
    galleries: state.galleries,
    phaseTypes: state.phaseTypes,
    exhibitions: state.exhibitions,
    keyDates: state.keyDates,
    timelineStartDate: state.timelineStartDate,
    timelineEndDate: state.timelineEndDate,
    monthWidth: state.monthWidth,
    collapsedLanes: state.collapsedLanes,
    showMilestones: state.showMilestones,
    sidebarOpen: state.sidebarOpen,
  }
}

export function useAutosave() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const prevRef = useRef<string>('')

  useEffect(() => {
    prevRef.current = JSON.stringify(selectPortfolioData(useStore.getState()))
    const unsub = useStore.subscribe((state) => {
      const next = JSON.stringify(selectPortfolioData(state))
      if (next === prevRef.current) return
      prevRef.current = next
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        useStore.getState().saveToStorage()
      }, 300)
    })
    return () => {
      unsub()
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])
}
