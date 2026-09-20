import { describe, expect, it } from 'vitest'
import {
  addMonthsToString,
  clampDate,
  dateToPixel,
  isValidDate,
  monthsBetween,
  pixelDeltaToDays,
} from './date'

describe('date utils', () => {
  it('measures whole months between ISO dates', () => {
    expect(monthsBetween('2026-01-01', '2026-04-01')).toBe(3)
    expect(monthsBetween('2026-04-01', '2026-01-01')).toBe(-3)
  })

  it('adds calendar months to ISO strings', () => {
    expect(addMonthsToString('2026-01-15', 1)).toBe('2026-02-15')
    expect(addMonthsToString('2026-01-15', -1)).toBe('2025-12-15')
  })

  it('maps the origin date to pixel zero', () => {
    expect(dateToPixel('2026-01-01', '2026-01-01', 40)).toBe(0)
    expect(dateToPixel('2026-01-01', '2026-02-01', 40)).toBe(40)
  })

  it('round-trips a month width to ~30 days', () => {
    expect(pixelDeltaToDays(40, 40)).toBe(30)
    expect(pixelDeltaToDays(0, 40)).toBe(0)
  })

  it('clamps dates into range', () => {
    expect(clampDate('2026-01-01', '2026-02-01', '2026-03-01')).toBe('2026-02-01')
    expect(clampDate('2026-04-01', '2026-02-01', '2026-03-01')).toBe('2026-03-01')
    expect(clampDate('2026-02-15', '2026-02-01', '2026-03-01')).toBe('2026-02-15')
  })

  it('validates ISO date strings', () => {
    expect(isValidDate('2026-01-01')).toBe(true)
    expect(isValidDate('not-a-date')).toBe(false)
    expect(isValidDate('')).toBe(false)
  })
})
