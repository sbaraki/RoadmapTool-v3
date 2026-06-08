import { useMemo, type CSSProperties } from 'react'
import { addDays, differenceInCalendarDays, format, getYear, isSameDay, parseISO } from 'date-fns'
import type { TimelineKeyDate } from '../../types'
import { dateToPixel } from '../../utils/date'

interface KeyDateBandProps {
  keyDates: TimelineKeyDate[]
  timelineStart: string
  timelineEnd: string
  monthWidth: number
  totalWidth: number
}

interface KeyDateInstance {
  id: string
  title: string
  startDate: string
  endDate: string
  color: string
  lane: number
}

const LANE_HEIGHT = 50
const BAND_VERTICAL_PADDING = 10
const LABEL_WIDTH = 168
const MIN_LABEL_GAP = 12

function overlapsRange(startDate: string, endDate: string, timelineStart: string, timelineEnd: string) {
  return startDate <= timelineEnd && endDate >= timelineStart
}

function createAnnualInstance(keyDate: TimelineKeyDate, year: number) {
  const start = parseISO(keyDate.startDate)
  const durationDays = Math.max(0, differenceInCalendarDays(parseISO(keyDate.endDate), start))
  const instanceStart = new Date(year, start.getMonth(), start.getDate())
  const instanceEnd = addDays(instanceStart, durationDays)
  return {
    startDate: format(instanceStart, 'yyyy-MM-dd'),
    endDate: format(instanceEnd, 'yyyy-MM-dd'),
  }
}

function assignLanes(
  keyDates: TimelineKeyDate[],
  timelineStart: string,
  timelineEnd: string,
  monthWidth: number,
  totalWidth: number,
) {
  const timelineStartYear = getYear(parseISO(timelineStart))
  const timelineEndYear = getYear(parseISO(timelineEnd))
  const instances: Omit<KeyDateInstance, 'lane'>[] = []

  keyDates.forEach(keyDate => {
    if (keyDate.recursAnnually) {
      for (let year = timelineStartYear - 1; year <= timelineEndYear + 1; year++) {
        const annual = createAnnualInstance(keyDate, year)
        if (overlapsRange(annual.startDate, annual.endDate, timelineStart, timelineEnd)) {
          instances.push({
            id: `${keyDate.id}-${year}`,
            title: keyDate.title,
            startDate: annual.startDate,
            endDate: annual.endDate,
            color: keyDate.color,
          })
        }
      }
    } else if (overlapsRange(keyDate.startDate, keyDate.endDate, timelineStart, timelineEnd)) {
      instances.push({
        id: keyDate.id,
        title: keyDate.title,
        startDate: keyDate.startDate,
        endDate: keyDate.endDate,
        color: keyDate.color,
      })
    }
  })

  const occupied = new Map<number, [number, number][]>()
  const assigned: KeyDateInstance[] = []

  instances
    .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.title.localeCompare(b.title))
    .forEach(instance => {
      const left = Math.max(0, dateToPixel(timelineStart, instance.startDate, monthWidth))
      const right = Math.min(totalWidth, dateToPixel(timelineStart, instance.endDate, monthWidth))
      const width = Math.max(8, right - left)
      const markerCenter = left + width / 2
      const labelLeft = clamp(markerCenter - LABEL_WIDTH / 2, 8, Math.max(8, totalWidth - LABEL_WIDTH - 8))
      const occupiedLeft = Math.min(left, labelLeft)
      const occupiedRight = Math.max(right, labelLeft + LABEL_WIDTH)
      let lane = 0
      while (true) {
        const ranges = occupied.get(lane) ?? []
        const conflict = ranges.some(
          ([rangeLeft, rangeRight]) =>
            occupiedLeft - MIN_LABEL_GAP < rangeRight && occupiedRight + MIN_LABEL_GAP > rangeLeft,
        )
        if (!conflict) {
          occupied.set(lane, [...ranges, [occupiedLeft, occupiedRight]])
          assigned.push({ ...instance, lane })
          return
        }
        lane++
      }
    })

  return {
    instances: assigned,
    laneCount: assigned.length ? Math.max(...assigned.map(instance => instance.lane)) + 1 : 0,
  }
}

function formatKeyDateRange(startDate: string, endDate: string) {
  const start = parseISO(startDate)
  const end = parseISO(endDate)

  if (isSameDay(start, end)) {
    return format(start, 'MMM d, yyyy')
  }

  if (start.getFullYear() === end.getFullYear()) {
    if (start.getMonth() === end.getMonth()) {
      return `${format(start, 'MMM d')}–${format(end, 'd, yyyy')}`
    }

    return `${format(start, 'MMM d')}–${format(end, 'MMM d, yyyy')}`
  }

  return `${format(start, 'MMM d, yyyy')}–${format(end, 'MMM d, yyyy')}`
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function KeyDateBand({ keyDates, timelineStart, timelineEnd, monthWidth, totalWidth }: KeyDateBandProps) {
  const { instances, laneCount } = useMemo(
    () => assignLanes(keyDates, timelineStart, timelineEnd, monthWidth, totalWidth),
    [keyDates, timelineStart, timelineEnd, monthWidth, totalWidth],
  )

  if (instances.length === 0) return null

  return (
    <div
      className="key-date-band relative z-20 border-b border-outline-variant/30 bg-slate-50/90 backdrop-blur-sm"
      style={{
        height: laneCount * LANE_HEIGHT + BAND_VERTICAL_PADDING,
        width: totalWidth,
        '--key-date-band-base': `${laneCount * LANE_HEIGHT + BAND_VERTICAL_PADDING}px`,
      } as CSSProperties}
      aria-label="Timeline key dates"
    >
      <div className="absolute left-3 top-2 text-[9px] font-bold uppercase tracking-wide text-slate-500 pointer-events-none">
        Key dates
      </div>
      {instances.map(instance => {
        const left = Math.max(0, dateToPixel(timelineStart, instance.startDate, monthWidth))
        const right = Math.min(totalWidth, dateToPixel(timelineStart, instance.endDate, monthWidth))
        const width = Math.max(8, right - left)
        const markerCenter = left + width / 2
        const labelLeft = clamp(markerCenter - LABEL_WIDTH / 2, 8, Math.max(8, totalWidth - LABEL_WIDTH - 8))
        const laneTop = instance.lane * LANE_HEIGHT + BAND_VERTICAL_PADDING
        const dateRange = formatKeyDateRange(instance.startDate, instance.endDate)

        return (
          <div
            key={instance.id}
            className="key-date-event"
            style={{
              '--key-date-color': instance.color,
              '--key-date-left': `${left}px`,
              '--key-date-top': `${laneTop}px`,
              '--key-date-width': `${width}px`,
              '--key-date-label-left': `${labelLeft}px`,
              '--key-date-label-width': `${LABEL_WIDTH}px`,
              '--key-date-marker-center': `${markerCenter}px`,
            } as CSSProperties}
            title={`${instance.title}: ${dateRange}`}
          >
            <div className="key-date-event-label">
              <span className="key-date-event-title">{instance.title}</span>
              <span className="key-date-event-date">{dateRange}</span>
            </div>
            <div className="key-date-event-stem" aria-hidden="true" />
            <div className="key-date-event-bar" aria-hidden="true" />
          </div>
        )
      })}
    </div>
  )
}
