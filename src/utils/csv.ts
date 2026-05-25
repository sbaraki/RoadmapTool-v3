import type { ExhibitionProject } from '../types'

function escapeCsv(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`
  }
  return val
}

interface CsvRow {
  'Project ID': string
  'Project Title': string
  Status: string
  Gallery: string
  'Item Type': string
  'Item Name': string
  'Start Date': string
  'End Date': string
  'Duration (Months)': string
  Description: string
}

export function generateCsv(projects: ExhibitionProject[]): string {
  const rows: CsvRow[] = []

  for (const project of projects) {
    rows.push({
      'Project ID': project.exhibitionId,
      'Project Title': project.title,
      Status: project.status,
      Gallery: project.gallery,
      'Item Type': 'Project',
      'Item Name': project.title,
      'Start Date': project.startDate,
      'End Date': project.endDate,
      'Duration (Months)': '',
      Description: project.description ?? '',
    })

    for (const phase of project.phases) {
      rows.push({
        'Project ID': project.exhibitionId,
        'Project Title': project.title,
        Status: project.status,
        Gallery: project.gallery,
        'Item Type': 'Phase',
        'Item Name': phase.label,
        'Start Date': '',
        'End Date': '',
        'Duration (Months)': String(phase.durationMonths),
        Description: '',
      })
    }

    for (const cp of project.checkpoints) {
      rows.push({
        'Project ID': project.exhibitionId,
        'Project Title': project.title,
        Status: project.status,
        Gallery: project.gallery,
        'Item Type': 'Checkpoint',
        'Item Name': cp.title,
        'Start Date': cp.date,
        'End Date': cp.date,
        'Duration (Months)': '',
        Description: cp.kind,
      })
    }
  }

  const headers = Object.keys(rows[0] ?? {}) as (keyof CsvRow)[]
  const lines = [
    headers.join(','),
    ...rows.map(row => headers.map(h => escapeCsv(row[h])).join(',')),
  ]

  return lines.join('\n')
}

export function downloadCsv(csv: string, filename?: string): void {
  const dateStr = new Date().toISOString().slice(0, 10)
  const name = filename ?? `exhibitions_report_${dateStr}.csv`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}
