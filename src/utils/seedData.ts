import type { Gallery, PhaseType, ExhibitionProject, ProjectPhase, ProjectCheckpoint } from '../types'
import { generateId } from './id'

const CSV_DATA = `Project ID,Project Title,Status,Gallery,Item Type,Item Name,Start Date,End Date,Duration (Months),Description
EXH777,DEATH: LIFE'S GREATEST MYSTERY,Open to Public,FEATURE GALLERY,Project Main,DEATH: LIFE'S GREATEST MYSTERY,2026-02-25,2026-09-07,6.4,
EXH777,DEATH: LIFE'S GREATEST MYSTERY,Open to Public,FEATURE GALLERY,Phase (Post),NEW PHASE,2026-09-07,2026-09-22,0.5,
EXH777,DEATH: LIFE'S GREATEST MYSTERY,Open to Public,FEATURE GALLERY,Checkpoint,FM ARRIVES,2026-02-02,2026-02-02,0,external
EXH777,DEATH: LIFE'S GREATEST MYSTERY,Open to Public,FEATURE GALLERY,Checkpoint,OPENING DAY,2026-02-25,2026-02-25,0,date
EXH777,DEATH: LIFE'S GREATEST MYSTERY,Open to Public,FEATURE GALLERY,Checkpoint,FM RETURNS,2026-09-08,2026-09-08,0,date
EXH777,DEATH: LIFE'S GREATEST MYSTERY,Open to Public,FEATURE GALLERY,Checkpoint,FM DEPARTS,2026-09-18,2026-09-18,0,date
EXH778,HOCKEY: FASTER THAN EVER,In Development,FEATURE GALLERY,Project Main,HOCKEY: FASTER THAN EVER,2026-11-25,2027-04-18,4.7,
EXH778,HOCKEY: FASTER THAN EVER,In Development,FEATURE GALLERY,Phase (Pre),DESIGN DEVELOPMENT,2026-02-25,2026-09-25,7,
EXH778,HOCKEY: FASTER THAN EVER,In Development,FEATURE GALLERY,Phase (Pre),IMPLEMENTATION,2026-09-25,2026-11-25,2,
EXH778,HOCKEY: FASTER THAN EVER,In Development,FEATURE GALLERY,Phase (Post),DEINSTALL,2027-04-18,2027-05-06,0.6,
EXH778,HOCKEY: FASTER THAN EVER,In Development,FEATURE GALLERY,Checkpoint,CONCEPT PRESENTATION,2026-06-03,2026-06-03,0,presentation
EXH778,HOCKEY: FASTER THAN EVER,In Development,FEATURE GALLERY,Checkpoint,REFINEMENT PRESENTATION,2026-08-07,2026-08-07,0,presentation
EXH778,HOCKEY: FASTER THAN EVER,In Development,FEATURE GALLERY,Checkpoint,FINAL (DESIGN LOCK),2026-09-07,2026-09-07,0,presentation
EXH778,HOCKEY: FASTER THAN EVER,In Development,FEATURE GALLERY,Checkpoint,GALLERY REPAINT COMPLETE,2026-10-16,2026-10-16,0,date
EXH778,HOCKEY: FASTER THAN EVER,In Development,FEATURE GALLERY,Checkpoint,FLYING FISH ARRIVES,2026-11-13,2026-11-13,0,external
EXH778,HOCKEY: FASTER THAN EVER,In Development,FEATURE GALLERY,Checkpoint,OPENING DAY,2026-11-25,2026-11-25,0,date
EXH776,CHEZ NOUS: LA FRANCOPHONIE DE L'ALBERTA,Open to Public,HUMAN HISTORY NORTH,Project Main,CHEZ NOUS: LA FRANCOPHONIE DE L'ALBERTA,2026-03-26,2027-05-03,13.2,
EXH776,CHEZ NOUS: LA FRANCOPHONIE DE L'ALBERTA,Open to Public,HUMAN HISTORY NORTH,Phase (Post),DEINSTALL,2027-05-03,2027-06-03,1,
EXH780,DANCE,In Development,HUMAN HISTORY NORTH,Project Main,DANCE,2027-11-25,2029-01-28,14.1,
EXH780,DANCE,In Development,HUMAN HISTORY NORTH,Phase (Pre),CONTENT DEVELOPMENT,2026-02-25,2026-09-25,7,
EXH780,DANCE,In Development,HUMAN HISTORY NORTH,Phase (Pre),DESIGN DEVELOPMENT,2026-09-25,2027-08-25,11,
EXH780,DANCE,In Development,HUMAN HISTORY NORTH,Phase (Pre),IMPLEMENTATION,2027-08-25,2027-11-25,3,
EXH780,DANCE,In Development,HUMAN HISTORY NORTH,Phase (Post),DEINSTALL,2029-01-28,2029-02-28,1,
EXH780,DANCE,In Development,HUMAN HISTORY NORTH,Checkpoint,EXPERIENCE FRAMEWORK APPROVED,2026-08-19,2026-08-19,0,deliverable
EXH780,DANCE,In Development,HUMAN HISTORY NORTH,Checkpoint,CHARTER APPROVED (END OF CD PHASE),2026-09-25,2026-09-25,0,presentation
EXH774 ,STORIES OF US: BUILDING ALBERTA'S COLLECTION,Open to Public,NATURAL HISTORY SOUTH,Project Main,STORIES OF US: BUILDING ALBERTA'S COLLECTION,2025-12-18,2027-02-05,13.6,
EXH774 ,STORIES OF US: BUILDING ALBERTA'S COLLECTION,Open to Public,NATURAL HISTORY SOUTH,Phase (Pre),IMPLEMENTATION,2025-10-18,2025-12-18,2,
EXH774 ,STORIES OF US: BUILDING ALBERTA'S COLLECTION,Open to Public,NATURAL HISTORY SOUTH,Phase (Post),DEINSTALL,2027-02-05,2027-03-05,1,
EXH781,WILD,In Development,NATURAL HISTORY SOUTH,Project Main,WILD,2028-03-23,2029-06-03,14.4,
EXH781,WILD,In Development,NATURAL HISTORY SOUTH,Phase (Pre),CONTENT DEVELOPMENT,2026-04-23,2026-12-23,8,
EXH781,WILD,In Development,NATURAL HISTORY SOUTH,Phase (Pre),DESIGN DEVELOPMENT,2026-12-23,2027-12-23,12,
EXH781,WILD,In Development,NATURAL HISTORY SOUTH,Phase (Pre),IMPLEMENTATION,2027-12-23,2028-03-23,3,
EXH781,WILD,In Development,NATURAL HISTORY SOUTH,Phase (Post),DEINSTALL,2029-06-03,2029-07-03,1,
EXH781,WILD,In Development,NATURAL HISTORY SOUTH,Checkpoint,EXPERIENCE FRAMEWORK APPROVED,2026-10-29,2026-10-29,0,deliverable
EXH781,WILD,In Development,NATURAL HISTORY SOUTH,Checkpoint,CHARTER APPROVED (END OF CD PHASE),2026-12-17,2026-12-17,0,deliverable
,TBC,In Development,FEATURE GALLERY,Project Main,TBC,2027-10-07,2028-05-07,7,
,TBC,TBC,FEATURE GALLERY,Project Main,TBC,2028-10-12,2029-05-13,7,
EXH781,TBC,TBC,NATURAL HISTORY SOUTH,Project Main,TBC,2030-05-02,2031-07-13,14.4,
EXH781,TBC,TBC,NATURAL HISTORY SOUTH,Phase (Pre),CONTENT DEVELOPMENT,2028-06-02,2029-02-02,8,
EXH781,TBC,TBC,NATURAL HISTORY SOUTH,Phase (Pre),DESIGN DEVELOPMENT,2029-02-02,2030-02-02,12,
EXH781,TBC,TBC,NATURAL HISTORY SOUTH,Phase (Pre),IMPLEMENTATION,2030-02-02,2030-05-02,3,
EXH781,TBC,TBC,NATURAL HISTORY SOUTH,Phase (Post),DEINSTALL,2031-07-13,2031-08-13,1,
,TBC,TBC,HUMAN HISTORY NORTH,Project Main,TBC,2029-06-28,2030-07-30,13,
,TBC,TBC,HUMAN HISTORY NORTH,Phase (Pre),Idea Dev,2027-02-28,2027-08-28,6,
,TBC,TBC,HUMAN HISTORY NORTH,Phase (Pre),Content Dev,2027-08-28,2028-04-28,8,
,TBC,TBC,HUMAN HISTORY NORTH,Phase (Pre),Design Dev,2028-04-28,2029-04-28,12,
,TBC,TBC,HUMAN HISTORY NORTH,Phase (Pre),Implementation,2029-04-28,2029-06-28,2,
,TBC,TBC,HUMAN HISTORY NORTH,Phase (Post),Deinstall,2030-07-30,2030-08-30,1,
,CANADIAN RANGERS & NURSING SISTERS,In Development,PERMANENT GALLERIES,Project Main,CANADIAN RANGERS & NURSING SISTERS,2027-03-05,2027-03-05,0,
,CANADIAN RANGERS & NURSING SISTERS,In Development,PERMANENT GALLERIES,Phase (Pre),CONTENT DEVELOPMENT,2026-05-05,2026-07-05,2,
,CANADIAN RANGERS & NURSING SISTERS,In Development,PERMANENT GALLERIES,Phase (Pre),DESIGN DEVELOPMENT,2026-07-05,2026-12-13,5.25,
,CANADIAN RANGERS & NURSING SISTERS,In Development,PERMANENT GALLERIES,Phase (Pre),IMPLEMENTATION,2026-12-13,2027-03-06,2.75,
,CANADIAN RANGERS & NURSING SISTERS,In Development,PERMANENT GALLERIES,Checkpoint,CONTENT PACKAGE (END OF CD PHASE),2026-06-30,2026-06-30,0,deliverable
,CANADIAN RANGERS & NURSING SISTERS,In Development,PERMANENT GALLERIES,Checkpoint,CONCEPT PRESENTATION,2026-09-18,2026-09-18,0,presentation
,CANADIAN RANGERS & NURSING SISTERS,In Development,PERMANENT GALLERIES,Checkpoint,REFINEMENT PRESENTATION,2026-11-06,2026-11-06,0,presentation
,CANADIAN RANGERS & NURSING SISTERS,In Development,PERMANENT GALLERIES,Checkpoint,FINAL (DESIGN LOCK),2026-12-11,2026-12-11,0,deliverable
,NEW PROJECT,TBC,FEATURE GALLERY,Project Main,NEW PROJECT,2027-05-19,2027-08-19,3,
,NEW PROJECT,TBC,FEATURE GALLERY,Phase (Pre),Idea Dev,2026-05-19,2026-08-19,3,
,NEW PROJECT,TBC,FEATURE GALLERY,Phase (Pre),Content Dev,2026-08-19,2026-11-19,3,
,NEW PROJECT,TBC,FEATURE GALLERY,Phase (Pre),Design Dev,2026-11-19,2027-02-19,3,
,NEW PROJECT,TBC,FEATURE GALLERY,Phase (Pre),Implementation,2027-02-19,2027-05-19,3,
,NEW PROJECT,TBC,FEATURE GALLERY,Phase (Post),Deinstall,2027-08-19,2027-09-19,1,
,POLITICAL PROTEST,In Development,PERMANENT GALLERIES,Project Main,POLITICAL PROTEST,2026-08-27,2026-08-27,0,
,POLITICAL PROTEST,In Development,PERMANENT GALLERIES,Phase (Pre),CONTENT DEVELOPMENT,2026-05-04,2026-06-04,1,
,POLITICAL PROTEST,In Development,PERMANENT GALLERIES,Phase (Pre),DESIGN DEVELOPMENT,2026-06-04,2026-07-27,1.75,
,POLITICAL PROTEST,In Development,PERMANENT GALLERIES,Phase (Pre),IMPLEMENTATION,2026-07-27,2026-08-27,1,
,POLITICAL PROTEST,In Development,PERMANENT GALLERIES,Checkpoint,REFINEMENT PRESENTATION,2026-07-04,2026-07-04,0,presentation
,POLITICAL PROTEST,In Development,PERMANENT GALLERIES,Checkpoint,CONTENT PACKAGE (END OF CD PHASE),2026-06-04,2026-06-04,0,deliverable
,POLITICAL PROTEST,In Development,PERMANENT GALLERIES,Checkpoint,FINAL (DESIGN LOCK),2026-07-24,2026-07-24,0,deliverable`

interface CsvRow {
  projectId: string
  title: string
  status: string
  gallery: string
  itemType: string
  itemName: string
  startDate: string
  endDate: string
  durationMonths: string
  description: string
}

function parseCsv(text: string): CsvRow[] {
  const lines = text.split('\n')
  const rows: CsvRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const vals = line.split(',')
    rows.push({
      projectId: vals[0]?.trim() ?? '',
      title: vals[1]?.trim() ?? '',
      status: vals[2]?.trim() ?? '',
      gallery: vals[3]?.trim() ?? '',
      itemType: vals[4]?.trim() ?? '',
      itemName: vals[5]?.trim() ?? '',
      startDate: vals[6]?.trim() ?? '',
      endDate: vals[7]?.trim() ?? '',
      durationMonths: vals[8]?.trim() ?? '',
      description: vals[9]?.trimRight() ?? '',
    })
  }
  return rows
}

const PHASE_COLORS = [
  '#7f8f2a', '#4f8bb8', '#9aad25', '#ed8a24', '#10b981', '#f2b95b',
  '#a855f7', '#ec4899', '#06b6d4', '#f97316',
]

function galleryId(name: string): string {
  return `gallery_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`
}

function phaseTypeId(label: string): string {
  return `pt_${label.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`
}

export interface SeedData {
  galleries: Gallery[]
  phaseTypes: PhaseType[]
  exhibitions: ExhibitionProject[]
}

export function generateSeedData(): SeedData {
  const rows = parseCsv(CSV_DATA)

  // Collect unique galleries
  const galleryNames = [...new Set(rows.map(r => r.gallery).filter(Boolean))]
  const galleries: Gallery[] = galleryNames.map((name) => ({
    id: galleryId(name),
    name,
    kind: (name === 'PERMANENT GALLERIES' ? 'permanent' : 'temporary') as 'permanent' | 'temporary',
  }))

  // Collect unique phase labels (from Phase (Pre) and Phase (Post) rows)
  const phaseLabels = [...new Set(rows.filter(r => r.itemType.startsWith('Phase')).map(r => r.itemName))]
  const phaseTypes: PhaseType[] = phaseLabels.map((label, idx) => ({
    id: phaseTypeId(label),
    label,
    color: PHASE_COLORS[idx % PHASE_COLORS.length],
  }))

  // Group rows by project
  // Sequential approach: each "Project Main" row starts a new project
  interface ProjectGroup {
    main: CsvRow | null
    phases: CsvRow[]
    checkpoints: CsvRow[]
  }

  const groups: ProjectGroup[] = []
  let currentGroup: ProjectGroup | null = null

  for (const row of rows) {
    if (row.itemType === 'Project Main') {
      currentGroup = { main: row, phases: [], checkpoints: [] }
      groups.push(currentGroup)
    } else if (row.itemType.startsWith('Phase')) {
      if (currentGroup) currentGroup.phases.push(row)
    } else if (row.itemType === 'Checkpoint') {
      if (currentGroup) currentGroup.checkpoints.push(row)
    }
  }

  // Build exhibitions
  const exhibitions: ExhibitionProject[] = groups.map((group) => {
    const main = group.main
    const id = generateId()

    const startDate = main?.startDate ?? ''
    const endDate = main?.endDate ?? ''
    const scheduleMode: 'range' | 'single-date' =
      startDate && endDate && startDate !== endDate ? 'range' : 'single-date'

    const phases: ProjectPhase[] = group.phases.map((row) => {
      const pt = phaseTypes.find(p => p.label === row.itemName)
      return {
        id: generateId(),
        label: row.itemName,
        durationMonths: parseFloat(row.durationMonths) || 1,
        typeId: pt?.id ?? phaseTypes[0]?.id ?? '',
      }
    })

    const checkpoints: ProjectCheckpoint[] = group.checkpoints.map((row) => {
      const kind = (row.description || 'date') as ProjectCheckpoint['kind']
      return {
        id: generateId(),
        title: row.itemName,
        date: row.startDate,
        kind,
        color: undefined,
      }
    })

    const status = (main?.status || 'TBC') as ExhibitionProject['status']
    const title = main?.itemName || main?.title || 'UNTITLED'
    const exhibitionId = main?.projectId || ''

    return {
      id,
      exhibitionId,
      title: title.toUpperCase(),
      status,
      gallery: main?.gallery ?? '',
      scheduleMode,
      startDate,
      endDate,
      phases,
      checkpoints,
      laneOrder: groups.indexOf(group),
      description: '',
    }
  })

  return { galleries, phaseTypes, exhibitions }
}
