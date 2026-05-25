import type { Gallery, PhaseType } from '../types'

export const DEFAULT_GALLERIES: Gallery[] = []

export const DEFAULT_PHASE_TYPES: PhaseType[] = [
  { id: 'pt1', label: '1. Initiation', color: '#7f8f2a' },
  { id: 'pt2', label: '2. Content Development', color: '#4f8bb8' },
  { id: 'pt3', label: '3. Design Development', color: '#9aad25' },
  { id: 'pt4', label: '4. Implementation', color: '#ed8a24' },
  { id: 'pt5', label: '5. Delivery', color: '#10b981' },
  { id: 'pt6', label: '6. Deinstall', color: '#f2b95b' },
]
