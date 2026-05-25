const GALLERY_COLOR = { bar: '#6b7280', rail: '#f3f4f6', labelBg: '#e5e7eb', chip: '#4b5563' }

export function getGalleryColor(_name: string): string {
  return GALLERY_COLOR.bar
}

export function getGalleryTheme(_name: string) {
  return GALLERY_COLOR
}

export function getPhaseColor(typeColor: string): string {
  return typeColor
}

export const MILESTONE_COLORS = [
  { label: 'Slate', value: '#64748b' },
  { label: 'Red', value: '#ef4444' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Emerald', value: '#10b981' },
  { label: 'Amber', value: '#f59e0b' },
  { label: 'Violet', value: '#8b5cf6' },
]

export const STATUS_COLORS: Record<string, string> = {
  'TBC': '#fca5a5',
  'In Development': '#f43f5e',
  'Open to Public': '#dc2626',
  'Closed': '#94a3b8',
}
