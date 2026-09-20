import { describe, expect, it } from 'vitest'
import { PIXEL_RATIO_CANDIDATES, chooseExportPixelRatios } from './exportSize'

describe('chooseExportPixelRatios', () => {
  it('prefers full sharpness for small timelines', () => {
    expect(chooseExportPixelRatios(1200, 800)[0]).toBe(3)
  })

  it('steps down for large timelines', () => {
    const ratios = chooseExportPixelRatios(5000, 3000)
    expect(ratios[0]).toBeLessThan(3)
    expect(ratios).toContain(1)
  })

  it('always returns at least the lowest fallback', () => {
    const ratios = chooseExportPixelRatios(20000, 20000)
    expect(ratios).toEqual([PIXEL_RATIO_CANDIDATES[PIXEL_RATIO_CANDIDATES.length - 1]])
  })
})
