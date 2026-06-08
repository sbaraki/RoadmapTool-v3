import type { Gallery, PhaseType } from '../types'

export const DEFAULT_GALLERIES: Gallery[] = []

export const DEFAULT_PHASE_TYPES: PhaseType[] = [
  { id: 'pt1', label: 'INITIATION', color: '#7f8f2a' },
  { id: 'pt2', label: 'CONTENT DEVELOPMENT', color: '#4f8bb8' },
  { id: 'pt3', label: 'DESIGN DEVELOPMENT', color: '#9aad25' },
  { id: 'pt4', label: 'IMPLEMENTATION', color: '#ed8a24' },
  { id: 'pt5', label: 'DELIVERY', color: '#10b981' },
  { id: 'pt6', label: 'DEINSTALL', color: '#f2b95b' },
]
