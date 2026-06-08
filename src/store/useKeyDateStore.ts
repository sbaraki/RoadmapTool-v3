import { create } from 'zustand'
import { formatDate } from '../utils/date'
import { generateId } from '../utils/id'

const STORAGE_KEY = 'portfolio_key_dates_v1'
const DEFAULT_SCENARIO_KEY = 'default'

export interface TimelineKeyDate {
  id: string
  title: string
  startDate: string
  endDate: string
  color: string
  recursAnnually: boolean
}

interface KeyDateState {
  keyDatesByScenario: Record<string, TimelineKeyDate[]>
  addKeyDate: (scenarioId?: string, keyDate?: Partial<TimelineKeyDate>) => void
  updateKeyDate: (scenarioId: string | undefined, id: string, updates: Partial<TimelineKeyDate>) => void
  removeKeyDate: (scenarioId: string | undefined, id: string) => void
}

function scenarioKey(scenarioId?: string) {
  return scenarioId || DEFAULT_SCENARIO_KEY
}

function readStoredKeyDates(): Record<string, TimelineKeyDate[]> {
  if (typeof localStorage === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).map(([id, value]) => [
        id,
        Array.isArray(value) ? normalizeKeyDates(value) : [],
      ]),
    )
  } catch {
    return {}
  }
}

function writeStoredKeyDates(keyDatesByScenario: Record<string, TimelineKeyDate[]>) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keyDatesByScenario))
}

function normalizeKeyDates(value: Partial<TimelineKeyDate>[]): TimelineKeyDate[] {
  return value
    .map(keyDate => {
      const startDate = keyDate.startDate || ''
      return {
        id: keyDate.id || generateId(),
        title: keyDate.title?.trim() || 'Key date',
        startDate,
        endDate: keyDate.endDate && keyDate.endDate >= startDate ? keyDate.endDate : startDate,
        color: keyDate.color || '#7c3aed',
        recursAnnually: keyDate.recursAnnually ?? false,
      }
    })
    .filter(keyDate => keyDate.startDate)
}

function defaultKeyDate(partial?: Partial<TimelineKeyDate>): TimelineKeyDate {
  const now = new Date()
  const startDate = formatDate(new Date(now.getFullYear(), 4, 1))
  const endDate = formatDate(new Date(now.getFullYear(), 4, 31))
  const keyDate = {
    id: generateId(),
    title: 'Site opening workflows',
    startDate,
    endDate,
    color: '#7c3aed',
    recursAnnually: true,
    ...partial,
  }
  if (keyDate.endDate < keyDate.startDate) keyDate.endDate = keyDate.startDate
  return keyDate
}

export function selectKeyDates(keyDatesByScenario: Record<string, TimelineKeyDate[]>, scenarioId?: string) {
  return keyDatesByScenario[scenarioKey(scenarioId)] ?? []
}

export const useKeyDateStore = create<KeyDateState>()((set) => ({
  keyDatesByScenario: readStoredKeyDates(),

  addKeyDate: (scenarioId, partial) => {
    const key = scenarioKey(scenarioId)
    set(state => {
      const next = {
        ...state.keyDatesByScenario,
        [key]: [...(state.keyDatesByScenario[key] ?? []), defaultKeyDate(partial)],
      }
      writeStoredKeyDates(next)
      return { keyDatesByScenario: next }
    })
  },

  updateKeyDate: (scenarioId, id, updates) => {
    const key = scenarioKey(scenarioId)
    set(state => {
      const nextDates = (state.keyDatesByScenario[key] ?? []).map(keyDate => {
        if (keyDate.id !== id) return keyDate
        const next = { ...keyDate, ...updates }
        if (next.endDate < next.startDate) next.endDate = next.startDate
        return next
      })
      const next = { ...state.keyDatesByScenario, [key]: nextDates }
      writeStoredKeyDates(next)
      return { keyDatesByScenario: next }
    })
  },

  removeKeyDate: (scenarioId, id) => {
    const key = scenarioKey(scenarioId)
    set(state => {
      const next = {
        ...state.keyDatesByScenario,
        [key]: (state.keyDatesByScenario[key] ?? []).filter(keyDate => keyDate.id !== id),
      }
      writeStoredKeyDates(next)
      return { keyDatesByScenario: next }
    })
  },
}))
