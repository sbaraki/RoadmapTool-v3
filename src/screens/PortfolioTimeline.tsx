import { useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'
import { AppShell } from '../components/layout/AppShell'
import { Timeline } from '../components/timeline/Timeline'
import { MilestoneEditModal } from '../components/timeline/MilestoneEditModal'
import { ProjectDetailPanel } from '../components/project/ProjectDetailPanel'
import { SettingsModal } from '../components/settings/SettingsModal'
import { useAutosave } from '../hooks/useAutosave'
import { useKeyboard } from '../hooks/useKeyboard'
import { generateSeedData } from '../utils/seedData'

export default function PortfolioTimeline() {
  useAutosave()
  useKeyboard()

  const loadFromStorage = useStore(s => s.loadFromStorage)
  const seedData = useStore(s => s.seedData)

  const loadedRef = useRef(false)

  useEffect(() => {
    if (!loadedRef.current) {
      const loaded = loadFromStorage()
      if (!loaded) {
        seedData(generateSeedData())
      }
      loadedRef.current = true
    }
  }, [loadFromStorage, seedData])

  return (
    <>
      <AppShell>
        <Timeline />
      </AppShell>

      <ProjectDetailPanel />
      <MilestoneEditModal />
      <SettingsModal />

    </>
  )
}
