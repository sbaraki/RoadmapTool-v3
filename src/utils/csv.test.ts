import { describe, expect, it } from 'vitest'
import type { ExhibitionProject } from '../types'
import { generateCsv } from './csv'

function makeProject(overrides: Partial<ExhibitionProject> = {}): ExhibitionProject {
  return {
    id: 'proj-1',
    exhibitionId: 'EXH-1',
    title: 'TEST SHOW',
    status: 'In Development',
    startDate: '2026-01-01',
    endDate: '2026-06-01',
    gallery: 'FEATURE GALLERY',
    scheduleMode: 'range',
    checkpoints: [],
    phases: [],
    ...overrides,
  }
}

describe('generateCsv', () => {
  it('uses the seed vocabulary so exports round-trip', () => {
    const csv = generateCsv([
      makeProject({
        phases: [
          { id: 'ph-1', label: 'DESIGN DEVELOPMENT', durationMonths: 3, typeId: 'pt3' },
          { id: 'ph-2', label: 'DEINSTALL', durationMonths: 1, typeId: 'pt6' },
          { id: 'ph-3', label: 'DELIVERY', durationMonths: 1, typeId: 'pt5' },
        ],
        checkpoints: [
          { id: 'cp-1', title: 'OPENING DAY', date: '2026-01-01', kind: 'date' },
        ],
      }),
    ])

    const lines = csv.split('\n')
    expect(lines[0]).toContain('Item Type')
    expect(csv).toContain('Project Main')
    expect(csv).toContain('Phase (Pre)')
    expect(csv).toContain('Phase (Post)')
    expect(csv).toContain('Checkpoint')
    // Checkpoint kind travels in the Description column (seed reads it back).
    expect(csv).toContain(',date')
  })

  it('returns an empty payload for zero projects', () => {
    expect(generateCsv([])).toBe('')
  })
})
