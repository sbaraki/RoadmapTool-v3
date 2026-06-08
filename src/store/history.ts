import type { Gallery, PhaseType, ExhibitionProject, TimelineKeyDate } from '../types'

export interface HistorySnapshot {
  museumName: string
  galleries: Gallery[]
  phaseTypes: PhaseType[]
  exhibitions: ExhibitionProject[]
  keyDates: TimelineKeyDate[]
}

export interface HistoryState {
  history: HistorySnapshot[]
  future: HistorySnapshot[]
}

export function createInitialHistoryState(): HistoryState {
  return { history: [], future: [] }
}

export function createSnapshot(
  museumName: string,
  galleries: Gallery[],
  phaseTypes: PhaseType[],
  exhibitions: ExhibitionProject[],
  keyDates: TimelineKeyDate[]
): HistorySnapshot {
  return {
    museumName,
    galleries: structuredClone(galleries),
    phaseTypes: structuredClone(phaseTypes),
    exhibitions: structuredClone(exhibitions),
    keyDates: structuredClone(keyDates),
  }
}
