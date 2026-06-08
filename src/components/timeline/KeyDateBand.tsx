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
  label: string
  startDate: string
  endDate: string
  color: string
  lane: number
}

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

function formatDateRange(startDate: string, endDate: string) {
  const start = parseISO(startDate)
  const end = parseISO(endDate)
  if (isSameDay(start, end)) return format(start, 'MMM d, yyyy')
  if (start.getFullYear() === end.getFullYear()) {
    return `${format(start, 'MMM d')}–${format(end, 'MMM d, yyyy')}`
  }
  return `${format(start, 'MMM d, yyyy')}–${format(end, 'MMM d, yyyy')}`
}

function createInstance(keyDate: TimelineKeyDate, startDate: string, endDate: string, id = keyDate.id) {
  const title = keyDate.title.trim() || 'Key date'
  return {
    id,
    title,
    label: `${title} · ${formatDateRange(startDate, endDate)}`,
    startDate,
    endDate,
    color: keyDate.color,
  }
}

function estimateLabelWidth(label: string) {
  return Math.max(150, label.length * 6.8 + 18)
}

function assignLanes(
  keyDates: TimelineKeyDate[],
  timelineStart: string,
  timelineEnd: string,
  monthWidth: number,
) {
  const timelineStartYear = getYear(parseISO(timelineStart))
  const timelineEndYear = getYear(parseISO(timelineEnd))
  const instances: Omit<KeyDateInstance, 'lane'>[] = []

  keyDates.forEach(keyDate => {
    if (keyDate.recursAnnually) {
      for (let year = timelineStartYear - 1; year <= timelineEndYear + 1; year++) {
        const annual = createAnnualInstance(keyDate, year)
        if (overlapsRange(annual.startDate, annual.endDate, timelineStart, timelineEnd)) {
          instances.push(createInstance(keyDate, annual.startDate, annual.endDate, `${keyDate.id}-${year}`))
        }
      }
    } else if (overlapsRange(keyDate.startDate, keyDate.endDate, timelineStart, timelineEnd)) {
      instances.push(createInstance(keyDate, keyDate.startDate, keyDate.endDate))
    }
  })

  const occupied = new Map<number, [number, number][]>()
  const assigned: KeyDateInstance[] = []

  instances
    .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.title.localeCompare(b.title))
    .forEach(instance => {
      const left = dateToPixel(timelineStart, instance.startDate, monthWidth)
      const right = dateToPixel(timelineStart, instance.endDate, monthWidth)
      const labelRight = left + estimateLabelWidth(instance.label)
      const instanceRight = Math.max(right, labelRight)
      let lane = 0
      while (true) {
        const ranges = occupied.get(lane) ?? []
        const conflict = ranges.some(([rangeLeft, rangeRight]) => left - 14 < rangeRight && instanceRight + 14 > rangeLeft)
        if (!conflict) {
          occupied.set(lane, [...ranges, [left, instanceRight]])
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

export function KeyDateBand({ keyDates, timelineStart, timelineEnd, monthWidth, totalWidth }: KeyDateBandProps) {
  const { instances, laneCount } = useMemo(
    () => assignLanes(keyDates, timelineStart, timelineEnd, monthWidth),
    [keyDates, timelineStart, timelineEnd, monthWidth],
  )

  if (instances.length === 0) return null

  const laneHeight = 44
  const bandHeight = laneCount * laneHeight + 12

  return (
    <div
      className="key-date-band relative z-20 border-b border-outline-variant/30 bg-violet-50/70 backdrop-blur-sm"
      style={{
        height: bandHeight,
        width: totalWidth,
        '--key-date-band-base': `${bandHeight}px`,
      } as CSSProperties}
      aria-label="Timeline key dates"
    >
      <div className="absolute left-2 top-1 text-[9px] font-bold uppercase tracking-wide text-violet-900/60 pointer-events-none">
        Key dates
      </div>
      {instances.map(instance => {
        const left = Math.max(0, dateToPixel(timelineStart, instance.startDate, monthWidth))
        const right = Math.min(totalWidth, dateToPixel(timelineStart, instance.endDate, monthWidth))
        const width = Math.max(8, right - left)
        const labelWidth = estimateLabelWidth(instance.label)
        const labelLeft = Math.max(0, Math.min(left, totalWidth - labelWidth - 8))
        const top = instance.lane * laneHeight + 8
        return (
          <div key={instance.id} className="key-date-item" style={{ top }}>
            <div
              className="key-date-label"
              style={{
                left: labelLeft,
                color: instance.color,
              }}
            >
              {instance.label}
            </div>
            <div
              className="key-date-line"
              style={{
                left,
                top: 25,
                width,
                '--key-date-color': instance.color,
              } as CSSProperties}
              title={instance.label}
              aria-label={instance.label}
            />
          </div>
        )
      })}
    </div>
  )
}
