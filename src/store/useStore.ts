import { create } from 'zustand'
import type {
  Gallery,
  PhaseType,
  ExhibitionProject,
  ProjectCheckpoint,
  ProjectPhase,
  PortfolioData,
  ScenarioLibrary,
  ScenarioSave,
} from '../types'
import { createInitialHistoryState, createSnapshot, type HistorySnapshot } from './history'
import { generateId } from '../utils/id'
import { addMonthsToString, formatDate } from '../utils/date'
import { DEFAULT_GALLERIES, DEFAULT_PHASE_TYPES } from '../data/defaults'
import {
  backupScenarioLibrary,
  getCloudSession,
  restoreScenarioLibrary,
  sendMagicLink,
  signOutCloud,
} from '../utils/supabaseSync'

const STORAGE_KEY = 'portfolio_tool_v2'
const DEFAULT_SCENARIO_NAME = 'Current Plan'

type CloudRestoreMode = 'replace' | 'merge'

function phaseKey(label: string): string {
  return label.toLowerCase().replace(/^\d+\.\s*/, '').trim()
}

function isDeliveryPhase(label: string): boolean {
  return phaseKey(label) === 'delivery'
}

function normalizePhaseTypes(phaseTypes: PhaseType[]): PhaseType[] {
  const renamed: Record<string, string> = {
    concept: '1. Initiation',
    initiation: '1. Initiation',
    'content development': '2. Content Development',
    'design development': '3. Design Development',
    implementation: '4. Implementation',
    delivery: '5. Delivery',
    deinstall: '6. Deinstall',
  }
  const normalized = phaseTypes.map(pt => ({
    id: pt.id,
    label: renamed[phaseKey(pt.label)] ?? pt.label,
    color: pt.color,
  }))
  const ids = new Set(normalized.map(pt => pt.id))
  return [
    ...normalized,
    ...DEFAULT_PHASE_TYPES.filter(pt => !ids.has(pt.id)),
  ]
}

function createDefaultPhases(phaseTypes: PhaseType[]): ProjectPhase[] {
  return phaseTypes.filter(pt => !isDeliveryPhase(pt.label)).map(pt => ({
    id: generateId(),
    label: pt.label,
    durationMonths: phaseKey(pt.label) === 'deinstall' ? 2 : 4,
    typeId: pt.id,
  }))
}

interface StoreState {
  museumName: string
  galleries: Gallery[]
  phaseTypes: PhaseType[]
  exhibitions: ExhibitionProject[]
  selectedProjectId: string | null
  editingCheckpoint: { projectId: string; checkpointId: string } | null
  collapsedLanes: string[]
  timelineStartDate: string
  timelineEndDate: string
  monthWidth: number
  showMilestones: boolean
  sidebarOpen: boolean
  settingsOpen: boolean

  activeScenarioId: string
  scenarios: ScenarioSave[]

  cloudEmail: string
  cloudUserEmail: string | null
  cloudUpdatedAt: string | null
  cloudStatus: 'idle' | 'loading' | 'sending-link' | 'backing-up' | 'restoring' | 'error' | 'success'
  cloudError: string | null

  history: HistorySnapshot[]
  future: HistorySnapshot[]

  commitHistory: () => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean

  setMuseumName: (name: string) => void
  setGalleries: (galleries: Gallery[]) => void
  setPhaseTypes: (phaseTypes: PhaseType[]) => void

  addGallery: (gallery: Gallery) => void
  removeGallery: (id: string) => void
  updateGallery: (id: string, updates: Partial<Gallery>) => void

  addPhaseType: (phaseType: PhaseType) => void
  removePhaseType: (id: string) => void
  updatePhaseType: (id: string, updates: Partial<PhaseType>) => void

  addProject: (project?: Partial<ExhibitionProject>) => ExhibitionProject
  updateProject: (id: string, updates: Partial<ExhibitionProject>) => void
  removeProject: (id: string) => void
  duplicateProject: (id: string) => void
  setSelectedProject: (id: string | null) => void
  setEditingCheckpoint: (value: { projectId: string; checkpointId: string } | null) => void
  moveProjectLaneOrder: (id: string, direction: 'up' | 'down') => void
  setProjectOrder: (galleryName: string, projectIds: string[]) => void

  addCheckpoint: (projectId: string, checkpoint: ProjectCheckpoint) => void
  updateCheckpoint: (projectId: string, checkpointId: string, updates: Partial<ProjectCheckpoint>) => void
  removeCheckpoint: (projectId: string, checkpointId: string) => void

  addPhase: (projectId: string, phase: ProjectPhase) => void
  updatePhase: (projectId: string, phaseId: string, updates: Partial<ProjectPhase>) => void
  removePhase: (projectId: string, phaseId: string) => void
  reorderPhase: (projectId: string, phaseId: string, direction: 'up' | 'down') => void
  applyPhasePreset: (projectId: string, preset: 'standard' | 'full' | 'simple' | 'clear') => void

  toggleCollapseLane: (galleryId: string) => void
  expandAllLanes: () => void
  collapseAllLanes: () => void

  setTimelineRange: (start: string, end: string) => void
  setMonthWidth: (width: number) => void
  seedData: (data: { galleries: Gallery[]; phaseTypes: PhaseType[]; exhibitions: ExhibitionProject[] }) => void
  setShowMilestones: (show: boolean) => void
  setSidebarOpen: (open: boolean) => void
  setSettingsOpen: (open: boolean) => void

  createScenario: () => void
  duplicateScenario: () => void
  renameScenario: (id: string, name: string) => void
  deleteScenario: (id: string) => void
  switchScenario: (id: string) => void

  setCloudEmail: (email: string) => void
  loadCloudSession: () => Promise<void>
  sendCloudMagicLink: () => Promise<void>
  signOutOfCloud: () => Promise<void>
  backupToCloud: () => Promise<void>
  restoreFromCloud: (mode: CloudRestoreMode) => Promise<void>

  loadFromStorage: () => boolean
  saveToStorage: (options?: { touchActive?: boolean }) => void
}

function defaultTimelineEnd(): string {
  const d = new Date()
  return formatDate(new Date(d.getFullYear() + 3, d.getMonth(), 1))
}

function defaultTimelineStart(): string {
  const d = new Date()
  return formatDate(new Date(d.getFullYear() - 1, d.getMonth(), 1))
}

function normalizePortfolioData(data: Partial<PortfolioData>): PortfolioData {
  const phaseTypes = data.phaseTypes ? normalizePhaseTypes(data.phaseTypes) : DEFAULT_PHASE_TYPES
  return {
    museumName: data.museumName ?? '',
    galleries: data.galleries ?? DEFAULT_GALLERIES,
    phaseTypes,
    exhibitions: (data.exhibitions ?? []).map(project => ({
      ...project,
      showDatePills: project.showDatePills ?? true,
      showDatePillsAsTbc: project.showDatePillsAsTbc ?? false,
      phases: project.phases.map(phase => {
        const phaseType = phaseTypes.find(pt => pt.id === phase.typeId)
        return phaseType ? { ...phase, label: phaseType.label } : phase
      }),
    })),
    timelineStartDate: data.timelineStartDate ?? defaultTimelineStart(),
    timelineEndDate: data.timelineEndDate ?? defaultTimelineEnd(),
    monthWidth: data.monthWidth ?? 40,
    collapsedLanes: data.collapsedLanes ?? [],
    showMilestones: data.showMilestones ?? true,
    sidebarOpen: data.sidebarOpen ?? true,
  }
}

function createPortfolioData(state: StoreState): PortfolioData {
  const {
    museumName, galleries, phaseTypes, exhibitions,
    timelineStartDate, timelineEndDate, monthWidth,
    collapsedLanes, showMilestones, sidebarOpen,
  } = state
  return {
    museumName, galleries, phaseTypes, exhibitions,
    timelineStartDate, timelineEndDate, monthWidth,
    collapsedLanes, showMilestones, sidebarOpen,
  }
}

function createScenario(name: string, data: PortfolioData): ScenarioSave {
  return {
    id: generateId(),
    name,
    updatedAt: new Date().toISOString(),
    data: structuredClone(data),
  }
}

function createScenarioLibrary(data: PortfolioData): ScenarioLibrary {
  const scenario = createScenario(DEFAULT_SCENARIO_NAME, data)
  return {
    version: 3,
    activeScenarioId: scenario.id,
    scenarios: [scenario],
  }
}

function isScenarioLibrary(data: unknown): data is ScenarioLibrary {
  if (!data || typeof data !== 'object') return false
  const candidate = data as Partial<ScenarioLibrary>
  return Array.isArray(candidate.scenarios) && typeof candidate.activeScenarioId === 'string'
}

function normalizeScenarioLibrary(data: unknown): ScenarioLibrary {
  if (isScenarioLibrary(data) && data.scenarios.length > 0) {
    const scenarios = data.scenarios.map((scenario, index) => ({
      id: scenario.id || generateId(),
      name: scenario.name?.trim() || `Scenario ${index + 1}`,
      updatedAt: scenario.updatedAt || new Date().toISOString(),
      data: normalizePortfolioData(scenario.data ?? {}),
    }))
    const activeScenarioId = scenarios.some(s => s.id === data.activeScenarioId)
      ? data.activeScenarioId
      : scenarios[0].id
    return { version: 3, activeScenarioId, scenarios }
  }

  return createScenarioLibrary(normalizePortfolioData(data as Partial<PortfolioData>))
}

function mergeScenarioLibraries(local: ScenarioLibrary, cloud: ScenarioLibrary): ScenarioLibrary {
  const scenarios = new Map<string, ScenarioSave>()

  local.scenarios.forEach(scenario => scenarios.set(scenario.id, scenario))
  cloud.scenarios.forEach(scenario => {
    const existing = scenarios.get(scenario.id)
    if (!existing || new Date(scenario.updatedAt).getTime() > new Date(existing.updatedAt).getTime()) {
      scenarios.set(scenario.id, scenario)
    }
  })

  const mergedScenarios = Array.from(scenarios.values())
  const activeScenarioId = mergedScenarios.some(s => s.id === local.activeScenarioId)
    ? local.activeScenarioId
    : mergedScenarios.some(s => s.id === cloud.activeScenarioId)
      ? cloud.activeScenarioId
      : mergedScenarios[0].id

  return { version: 3, activeScenarioId, scenarios: mergedScenarios }
}

function applyPortfolioData(data: PortfolioData) {
  return {
    museumName: data.museumName,
    galleries: data.galleries,
    phaseTypes: data.phaseTypes,
    exhibitions: data.exhibitions,
    timelineStartDate: data.timelineStartDate,
    timelineEndDate: data.timelineEndDate,
    monthWidth: data.monthWidth,
    collapsedLanes: data.collapsedLanes,
    showMilestones: data.showMilestones,
    sidebarOpen: data.sidebarOpen,
    selectedProjectId: null,
    editingCheckpoint: null,
    ...createInitialHistoryState(),
  }
}

export const useStore = create<StoreState>()((set, get) => ({
  museumName: '',
  galleries: DEFAULT_GALLERIES,
  phaseTypes: DEFAULT_PHASE_TYPES,
  exhibitions: [],
  selectedProjectId: null,
  editingCheckpoint: null,
  collapsedLanes: [],
  timelineStartDate: defaultTimelineStart(),
  timelineEndDate: defaultTimelineEnd(),
  monthWidth: 40,
  showMilestones: true,
  sidebarOpen: true,
  settingsOpen: false,
  activeScenarioId: '',
  scenarios: [],
  cloudEmail: '',
  cloudUserEmail: null,
  cloudUpdatedAt: null,
  cloudStatus: 'idle',
  cloudError: null,

  ...createInitialHistoryState(),

  commitHistory: () => {
    const { museumName, galleries, phaseTypes, exhibitions, history } = get()
    const snapshot = createSnapshot(museumName, galleries, phaseTypes, exhibitions)
    set({ history: [...history.slice(-49), snapshot], future: [] })
  },

  undo: () => {
    const { history, museumName, galleries, phaseTypes, exhibitions, future } = get()
    if (history.length === 0) return
    const prev = history[history.length - 1]
    const current = createSnapshot(museumName, galleries, phaseTypes, exhibitions)
    set({
      ...prev,
      history: history.slice(0, -1),
      future: [...future, current],
    })
  },

  redo: () => {
    const { future, museumName, galleries, phaseTypes, exhibitions, history } = get()
    if (future.length === 0) return
    const next = future[future.length - 1]
    const current = createSnapshot(museumName, galleries, phaseTypes, exhibitions)
    set({
      ...next,
      future: future.slice(0, -1),
      history: [...history, current],
    })
  },

  canUndo: () => get().history.length > 0,
  canRedo: () => get().future.length > 0,

  setMuseumName: (name) => {
    get().commitHistory()
    set({ museumName: name.toUpperCase() })
  },

  setGalleries: (galleries) => {
    get().commitHistory()
    set({ galleries })
  },

  setPhaseTypes: (phaseTypes) => {
    get().commitHistory()
    set({ phaseTypes })
  },

  addGallery: (gallery) => {
    get().commitHistory()
    set(s => ({ galleries: [...s.galleries, gallery] }))
  },

  removeGallery: (id) => {
    const { galleries, exhibitions } = get()
    if (galleries.length <= 1) return
    const gallery = galleries.find(g => g.id === id)
    if (!gallery) return
    const remaining = galleries.filter(g => g.id !== id)
    const firstGallery = remaining[0]
    get().commitHistory()
    set({
      galleries: remaining,
      exhibitions: exhibitions.map(p =>
        p.gallery === gallery.name ? { ...p, gallery: firstGallery!.name } : p
      ),
    })
  },

  updateGallery: (id, updates) => {
    const { galleries } = get()
    const oldGallery = galleries.find(g => g.id === id)
    get().commitHistory()
    set(s => ({
      galleries: s.galleries.map(g => g.id === id ? { ...g, ...updates } : g),
      exhibitions: updates.name && oldGallery
        ? s.exhibitions.map(p =>
            p.gallery === oldGallery.name ? { ...p, gallery: updates.name! } : p
          )
        : s.exhibitions,
    }))
  },

  addPhaseType: (phaseType) => {
    get().commitHistory()
    set(s => ({ phaseTypes: [...s.phaseTypes, phaseType] }))
  },

  removePhaseType: (id) => {
    get().commitHistory()
    set(s => ({ phaseTypes: s.phaseTypes.filter(pt => pt.id !== id) }))
  },

  updatePhaseType: (id, updates) => {
    get().commitHistory()
    set(s => ({
      phaseTypes: s.phaseTypes.map(pt => pt.id === id ? { ...pt, ...updates } : pt),
      exhibitions: updates.label
        ? s.exhibitions.map(project => ({
            ...project,
            phases: project.phases.map(phase => phase.typeId === id ? { ...phase, label: updates.label! } : phase),
          }))
        : s.exhibitions,
    }))
  },

  addProject: (partial) => {
    get().commitHistory()
    const { galleries, exhibitions, phaseTypes } = get()
    const targetGallery = galleries.length > 0 ? galleries[0] : null
    const now = new Date()
    const startDate = formatDate(new Date(now.getFullYear() + 1, now.getMonth(), 1))
    const endDate = addMonthsToString(startDate, 24)

    const project: ExhibitionProject = {
      id: generateId(),
      exhibitionId: `EXH-${now.getFullYear() + 1}-${String(exhibitions.length + 1).padStart(3, '0')}`,
      title: 'NEW EXHIBITION',
      status: 'TBC',
      startDate,
      endDate,
      gallery: targetGallery?.name ?? '',
      scheduleMode: 'range',
      checkpoints: [],
      phases: createDefaultPhases(phaseTypes),
      showDatePills: true,
      showDatePillsAsTbc: false,
      laneOrder: exhibitions.filter(e => e.gallery === targetGallery?.name).length,
      ...partial,
    }
    set(s => ({ exhibitions: [...s.exhibitions, project], selectedProjectId: project.id }))
    return project
  },

  updateProject: (id, updates) => {
    get().commitHistory()
    set(s => ({
      exhibitions: s.exhibitions.map(p =>
        p.id === id ? { ...p, ...updates } : p
      ),
    }))
  },

  removeProject: (id) => {
    get().commitHistory()
    set(s => ({
      exhibitions: s.exhibitions.filter(p => p.id !== id),
      selectedProjectId: s.selectedProjectId === id ? null : s.selectedProjectId,
    }))
  },

  duplicateProject: (id) => {
    get().commitHistory()
    const project = get().exhibitions.find(p => p.id === id)
    if (!project) return
    const now = new Date()
    const clone: ExhibitionProject = {
      ...structuredClone(project),
      id: generateId(),
      exhibitionId: `EXH-${now.getFullYear()}-${String(get().exhibitions.length + 1).padStart(3, '0')}`,
      title: `${project.title} (COPY)`,
    }
    set(s => ({ exhibitions: [...s.exhibitions, clone] }))
  },

  setSelectedProject: (id) => set({ selectedProjectId: id }),
  setEditingCheckpoint: (value) => set({ editingCheckpoint: value }),

  moveProjectLaneOrder: (id, direction) => {
    get().commitHistory()
    const { exhibitions } = get()
    const project = exhibitions.find(p => p.id === id)
    if (!project) return
    const sameGallery = exhibitions
      .filter(p => p.gallery === project.gallery)
      .sort((a, b) => (a.laneOrder ?? 0) - (b.laneOrder ?? 0))
    const idx = sameGallery.findIndex(p => p.id === id)
    if (idx < 0) return
    const updates = new Map<string, number | undefined>()
    if (direction === 'up' && idx > 0) {
      const swapped = sameGallery[idx - 1]
      updates.set(project.id, swapped.laneOrder)
      updates.set(swapped.id, project.laneOrder)
    } else if (direction === 'down' && idx < sameGallery.length - 1) {
      const swapped = sameGallery[idx + 1]
      updates.set(project.id, swapped.laneOrder)
      updates.set(swapped.id, project.laneOrder)
    }
    if (updates.size === 0) return
    set({ exhibitions: exhibitions.map(p => updates.has(p.id) ? { ...p, laneOrder: updates.get(p.id) } : p) })
  },

  setProjectOrder: (galleryName, projectIds) => {
    get().commitHistory()
    const orderById = new Map(projectIds.map((id, index) => [id, index]))
    set(s => ({
      exhibitions: s.exhibitions.map(project =>
        project.gallery === galleryName && orderById.has(project.id)
          ? { ...project, laneOrder: orderById.get(project.id) }
          : project
      ),
    }))
  },

  addCheckpoint: (projectId, checkpoint) => {
    get().commitHistory()
    set(s => ({
      exhibitions: s.exhibitions.map(p =>
        p.id === projectId ? { ...p, checkpoints: [...(p.checkpoints ?? []), checkpoint] } : p
      ),
    }))
  },

  updateCheckpoint: (projectId, checkpointId, updates) => {
    get().commitHistory()
    set(s => ({
      exhibitions: s.exhibitions.map(p =>
        p.id === projectId
          ? {
              ...p,
              checkpoints: (p.checkpoints ?? []).map(cp =>
                cp.id === checkpointId ? { ...cp, ...updates } : cp
              ),
            }
          : p
      ),
    }))
  },

  removeCheckpoint: (projectId, checkpointId) => {
    get().commitHistory()
    set(s => ({
      exhibitions: s.exhibitions.map(p =>
        p.id === projectId
          ? { ...p, checkpoints: (p.checkpoints ?? []).filter(cp => cp.id !== checkpointId) }
          : p
      ),
    }))
  },

  addPhase: (projectId, phase) => {
    get().commitHistory()
    set(s => ({
      exhibitions: s.exhibitions.map(p =>
        p.id === projectId ? { ...p, phases: [...p.phases, phase] } : p
      ),
    }))
  },

  updatePhase: (projectId, phaseId, updates) => {
    get().commitHistory()
    set(s => ({
      exhibitions: s.exhibitions.map(p =>
        p.id === projectId
          ? { ...p, phases: p.phases.map(ph => ph.id === phaseId ? { ...ph, ...updates } : ph) }
          : p
      ),
    }))
  },

  removePhase: (projectId, phaseId) => {
    get().commitHistory()
    set(s => ({
      exhibitions: s.exhibitions.map(p =>
        p.id === projectId
          ? { ...p, phases: p.phases.filter(ph => ph.id !== phaseId) }
          : p
      ),
    }))
  },

  reorderPhase: (projectId, phaseId, direction) => {
    get().commitHistory()
    const { exhibitions } = get()
    const project = exhibitions.find(p => p.id === projectId)
    if (!project) return
    const phases = [...project.phases]
    const idx = phases.findIndex(ph => ph.id === phaseId)
    if (idx < 0) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= phases.length) return
    ;[phases[idx], phases[swapIdx]] = [phases[swapIdx], phases[idx]]
    set(s => ({
      exhibitions: s.exhibitions.map(p =>
        p.id === projectId ? { ...p, phases } : p
      ),
    }))
  },

  applyPhasePreset: (projectId, preset) => {
    get().commitHistory()
    const { phaseTypes, exhibitions } = get()
    const project = exhibitions.find(p => p.id === projectId)
    if (!project) return

    let phases: ProjectPhase[]
    switch (preset) {
      case 'clear':
        phases = []
        break
      case 'simple':
        phases = phaseTypes.filter(pt => !isDeliveryPhase(pt.label) && phaseKey(pt.label) !== 'deinstall').slice(0, 2).map(pt => ({
          id: generateId(),
          label: pt.label,
          durationMonths: 4,
          typeId: pt.id,
        }))
        break
      case 'full':
        phases = createDefaultPhases(phaseTypes)
        break
      case 'standard':
      default:
        phases = createDefaultPhases(phaseTypes)
        break
    }
    set(s => ({
      exhibitions: s.exhibitions.map(p =>
        p.id === projectId ? { ...p, phases } : p
      ),
    }))
  },

  toggleCollapseLane: (galleryId) => {
    set(s => ({
      collapsedLanes: s.collapsedLanes.includes(galleryId)
        ? s.collapsedLanes.filter(id => id !== galleryId)
        : [...s.collapsedLanes, galleryId],
    }))
  },

  expandAllLanes: () => set({ collapsedLanes: [] }),

  collapseAllLanes: () => set(s => ({
    collapsedLanes: s.galleries.map(g => g.id),
  })),

  setTimelineRange: (start, end) => set({ timelineStartDate: start, timelineEndDate: end }),
  setMonthWidth: (width) => set({ monthWidth: Math.max(30, Math.min(120, width)) }),

  seedData: (data) => {
    const portfolioData = normalizePortfolioData({
      galleries: data.galleries,
      phaseTypes: data.phaseTypes,
      exhibitions: data.exhibitions,
      timelineStartDate: get().timelineStartDate,
      timelineEndDate: get().timelineEndDate,
      monthWidth: get().monthWidth,
      showMilestones: get().showMilestones,
      sidebarOpen: get().sidebarOpen,
      collapsedLanes: [],
      museumName: get().museumName,
    })
    const library = createScenarioLibrary(portfolioData)
    set({
      galleries: portfolioData.galleries,
      phaseTypes: portfolioData.phaseTypes,
      exhibitions: portfolioData.exhibitions,
      collapsedLanes: [],
      selectedProjectId: null,
      activeScenarioId: library.activeScenarioId,
      scenarios: library.scenarios,
    })
    get().saveToStorage({ touchActive: false })
  },

  setShowMilestones: (show) => set({ showMilestones: show }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSettingsOpen: (open) => set({ settingsOpen: open }),

  createScenario: () => {
    get().saveToStorage()
    const raw = localStorage.getItem(STORAGE_KEY)
    const currentLibrary = normalizeScenarioLibrary(raw ? JSON.parse(raw) : createPortfolioData(get()))
    const baseData = normalizePortfolioData({})
    const scenario = createScenario(`Scenario ${currentLibrary.scenarios.length + 1}`, baseData)
    const scenarios = [...currentLibrary.scenarios, scenario]
    const library = { version: 3 as const, activeScenarioId: scenario.id, scenarios }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(library))
    set({
      ...applyPortfolioData(scenario.data),
      activeScenarioId: scenario.id,
      scenarios,
    })
  },

  duplicateScenario: () => {
    get().saveToStorage()
    const raw = localStorage.getItem(STORAGE_KEY)
    const currentLibrary = normalizeScenarioLibrary(raw ? JSON.parse(raw) : createPortfolioData(get()))
    const current = currentLibrary.scenarios.find(s => s.id === currentLibrary.activeScenarioId)
    const data = createPortfolioData(get())
    const scenario = createScenario(`${current?.name ?? DEFAULT_SCENARIO_NAME} Copy`, data)
    const scenarios = [...currentLibrary.scenarios, scenario]
    const library = { version: 3 as const, activeScenarioId: scenario.id, scenarios }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(library))
    set({
      ...applyPortfolioData(scenario.data),
      activeScenarioId: scenario.id,
      scenarios,
    })
  },

  renameScenario: (id, name) => {
    const trimmed = name.trim()
    if (!trimmed) return
    get().saveToStorage()
    const raw = localStorage.getItem(STORAGE_KEY)
    const currentLibrary = normalizeScenarioLibrary(raw ? JSON.parse(raw) : createPortfolioData(get()))
    const scenarios = currentLibrary.scenarios.map(s => s.id === id ? { ...s, name: trimmed } : s)
    const library = { version: 3 as const, activeScenarioId: currentLibrary.activeScenarioId, scenarios }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(library))
    set({ scenarios })
  },

  deleteScenario: (id) => {
    get().saveToStorage()
    const raw = localStorage.getItem(STORAGE_KEY)
    const currentLibrary = normalizeScenarioLibrary(raw ? JSON.parse(raw) : createPortfolioData(get()))
    const { scenarios, activeScenarioId } = currentLibrary
    if (scenarios.length <= 1) return
    const nextScenarios = scenarios.filter(s => s.id !== id)
    const nextActiveId = activeScenarioId === id ? nextScenarios[0].id : activeScenarioId
    const nextActive = nextScenarios.find(s => s.id === nextActiveId) ?? nextScenarios[0]
    const library = { version: 3 as const, activeScenarioId: nextActive.id, scenarios: nextScenarios }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(library))
    set({
      ...applyPortfolioData(nextActive.data),
      activeScenarioId: nextActive.id,
      scenarios: nextScenarios,
    })
  },

  switchScenario: (id) => {
    if (id === get().activeScenarioId) return
    get().saveToStorage()
    const raw = localStorage.getItem(STORAGE_KEY)
    const library = normalizeScenarioLibrary(raw ? JSON.parse(raw) : { scenarios: get().scenarios, activeScenarioId: get().activeScenarioId })
    const scenario = library.scenarios.find(s => s.id === id)
    if (!scenario) return
    const nextLibrary = { ...library, activeScenarioId: id }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextLibrary))
    set({
      ...applyPortfolioData(scenario.data),
      activeScenarioId: id,
      scenarios: nextLibrary.scenarios,
    })
  },

  setCloudEmail: (email) => set({ cloudEmail: email }),

  loadCloudSession: async () => {
    set({ cloudStatus: 'loading', cloudError: null })
    const result = await getCloudSession()
    if (result.success) {
      set({
        cloudUserEmail: result.user?.email ?? null,
        cloudEmail: result.user?.email ?? get().cloudEmail,
        cloudStatus: 'idle',
      })
    } else {
      set({ cloudStatus: 'error', cloudError: result.error ?? null })
    }
  },

  sendCloudMagicLink: async () => {
    const email = get().cloudEmail.trim()
    if (!email) {
      set({ cloudStatus: 'error', cloudError: 'Email is required' })
      return
    }
    set({ cloudStatus: 'sending-link', cloudError: null })
    const result = await sendMagicLink(email)
    set(result.success
      ? { cloudStatus: 'success' }
      : { cloudStatus: 'error', cloudError: result.error ?? null })
  },

  signOutOfCloud: async () => {
    set({ cloudStatus: 'loading', cloudError: null })
    const result = await signOutCloud()
    set(result.success
      ? { cloudStatus: 'idle', cloudUserEmail: null }
      : { cloudStatus: 'error', cloudError: result.error ?? null })
  },

  backupToCloud: async () => {
    const { saveToStorage } = get()
    set({ cloudStatus: 'backing-up', cloudError: null })
    saveToStorage()
    const raw = localStorage.getItem(STORAGE_KEY)
    const library = normalizeScenarioLibrary(raw ? JSON.parse(raw) : createPortfolioData(get()))
    const result = await backupScenarioLibrary(library)
    set(result.success
      ? { cloudStatus: 'success', cloudUpdatedAt: result.updatedAt ?? null }
      : { cloudStatus: 'error', cloudError: result.error ?? null })
  },

  restoreFromCloud: async (mode) => {
    set({ cloudStatus: 'restoring', cloudError: null })
    get().saveToStorage({ touchActive: false })
    const result = await restoreScenarioLibrary()
    if (result.success && result.data) {
      const cloudLibrary = normalizeScenarioLibrary(result.data)
      const raw = localStorage.getItem(STORAGE_KEY)
      const localLibrary = normalizeScenarioLibrary(raw ? JSON.parse(raw) : createPortfolioData(get()))
      const library = mode === 'merge' ? mergeScenarioLibraries(localLibrary, cloudLibrary) : cloudLibrary
      const scenario = library.scenarios.find(s => s.id === library.activeScenarioId) ?? library.scenarios[0]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(library))
      set({
        ...applyPortfolioData(scenario.data),
        activeScenarioId: scenario.id,
        scenarios: library.scenarios,
        cloudUpdatedAt: result.updatedAt ?? null,
        cloudStatus: 'success',
        settingsOpen: false,
      })
    } else {
      set({ cloudStatus: 'error', cloudError: result.error ?? null })
    }
  },

  loadFromStorage: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return false
      const library = normalizeScenarioLibrary(JSON.parse(raw))
      const scenario = library.scenarios.find(s => s.id === library.activeScenarioId) ?? library.scenarios[0]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(library))
      set({
        ...applyPortfolioData(scenario.data),
        activeScenarioId: scenario.id,
        scenarios: library.scenarios,
      })
      return true
    } catch {
      return false
    }
  },

  saveToStorage: (options) => {
    const state = get()
    const activeScenarioId = state.activeScenarioId || generateId()
    const touchActive = options?.touchActive ?? true
    const now = new Date().toISOString()
    const currentData = createPortfolioData(state)
    const raw = localStorage.getItem(STORAGE_KEY)
    const storedLibrary = raw ? normalizeScenarioLibrary(JSON.parse(raw)) : createScenarioLibrary(currentData)
    const knownScenarios = state.scenarios.length > 0 ? state.scenarios : storedLibrary.scenarios
    const scenarios = knownScenarios.some(s => s.id === activeScenarioId)
      ? knownScenarios.map(s => s.id === activeScenarioId
        ? { ...s, updatedAt: touchActive ? now : s.updatedAt, data: currentData }
        : s)
      : [{ id: activeScenarioId, name: DEFAULT_SCENARIO_NAME, updatedAt: now, data: currentData }, ...knownScenarios]
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: 3,
      activeScenarioId,
      scenarios,
    }))
  },
}))
