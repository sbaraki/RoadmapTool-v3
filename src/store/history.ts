import type { Gallery, PhaseType, ExhibitionProject } from '../types'

export interface HistorySnapshot {
  museumName: string
  galleries: Gallery[]
  phaseTypes: PhaseType[]
  exhibitions: ExhibitionProject[]
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
  exhibitions: ExhibitionProject[]
): HistorySnapshot {
  return {
    museumName,
    galleries: structuredClone(galleries),
    phaseTypes: structuredClone(phaseTypes),
    exhibitions: structuredClone(exhibitions),
  }
}
