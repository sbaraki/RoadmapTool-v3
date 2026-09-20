// Pure helpers for PDF export sizing (no DOM dependencies, unit-testable).

export const MAX_EXPORT_PIXELS = 24_000_000
export const MAX_EXPORT_DIMENSION = 12_000
export const PIXEL_RATIO_CANDIDATES = [3, 2, 1.5, 1, 0.75]

export function chooseExportPixelRatios(captureWidth: number, captureHeight: number): number[] {
  const fitting = PIXEL_RATIO_CANDIDATES.filter(ratio =>
    captureWidth * ratio <= MAX_EXPORT_DIMENSION &&
    captureHeight * ratio <= MAX_EXPORT_DIMENSION &&
    captureWidth * captureHeight * ratio * ratio <= MAX_EXPORT_PIXELS
  )
  return fitting.length > 0 ? fitting : [PIXEL_RATIO_CANDIDATES[PIXEL_RATIO_CANDIDATES.length - 1]]
}
