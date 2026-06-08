import { useMemo, type CSSProperties } from 'react'
import { addDays, differenceInCalendarDays, format, getYear, parseISO } from 'date-fns'
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
      const left = dateToPixel(timelineStart, instance.startDate, monthWidth)
      const right = dateToPixel(timelineStart, instance.endDate, monthWidth)
      let lane = 0
      while (true) {
        const ranges = occupied.get(lane) ?? []
        const conflict = ranges.some(([rangeLeft, rangeRight]) => left - 6 < rangeRight && right + 6 > rangeLeft)
        if (!conflict) {
          occupied.set(lane, [...ranges, [left, right]])
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

  return (
    <div
      className="key-date-band relative z-20 border-b border-outline-variant/30 bg-violet-50/70 backdrop-blur-sm"
      style={{
        height: laneCount * 24 + 12,
        width: totalWidth,
        '--key-date-band-base': `${laneCount * 24 + 12}px`,
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
        return (
          <div
            key={instance.id}
            className="key-date-bar"
            style={{
              left,
              top: instance.lane * 24 + 8,
              width,
              backgroundColor: instance.color,
            }}
            title={`${instance.title}: ${instance.startDate} - ${instance.endDate}`}
          >
            <span>{instance.title}</span>
          </div>
        )
      })}
    </div>
  )
}
