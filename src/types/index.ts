export interface Gallery {
  id: string
  name: string
  kind: 'permanent' | 'temporary'
}

export interface PhaseType {
  id: string
  label: string
  color: string
}

export interface ProjectPhase {
  id: string
  label: string
  durationMonths: number
  typeId: string
}

export type CheckpointKind = 'deliverable' | 'presentation' | 'external' | 'date'

export interface ProjectCheckpoint {
  id: string
  title: string
  date: string
  kind: CheckpointKind
  color?: string
}

export type ProjectStatus = 'TBC' | 'In Development' | 'Open to Public' | 'Closed'

export type ScheduleMode = 'range' | 'single-date'

export interface ExhibitionProject {
  id: string
  exhibitionId: string
  title: string
  status: ProjectStatus
  startDate: string
  endDate: string
  gallery: string
  scheduleMode: ScheduleMode
  checkpoints: ProjectCheckpoint[]
  phases: ProjectPhase[]
  laneOrder?: number
  description?: string
}

export interface PrintSettings {
  paperSize: 'letter' | 'ledger'
  orientation: 'landscape' | 'portrait'
}
