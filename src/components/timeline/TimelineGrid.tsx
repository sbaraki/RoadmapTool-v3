import { useMemo } from 'react'
import { addMonths, parseISO, differenceInMonths } from 'date-fns'
import { dateToPixel, formatDate } from '../../utils/date'

interface TimelineGridProps {
  startDate: string
  endDate: string
  monthWidth: number
}

export function TimelineGrid({ startDate, endDate, monthWidth }: TimelineGridProps) {
  const totalMonths = differenceInMonths(parseISO(endDate), parseISO(startDate))
  const totalWidth = Math.max(monthWidth, dateToPixel(startDate, endDate, monthWidth))

  const lines = useMemo(() => {
    const result: { left: number; isYear: boolean }[] = []
    for (let i = 0; i <= totalMonths; i++) {
      const date = addMonths(parseISO(startDate), i)
      result.push({ left: dateToPixel(startDate, formatDate(date), monthWidth), isYear: date.getMonth() === 0 })
    }
    return result
  }, [startDate, totalMonths, monthWidth])

  const showWeekly = monthWidth > 60
  const weeklyLines = useMemo(() => {
    if (!showWeekly) return []
    const result: { left: number }[] = []
    const current = parseISO(startDate)
    const end = parseISO(endDate)
    const startDay = current.getDay()
    if (startDay !== 1) {
      current.setDate(current.getDate() + ((8 - startDay) % 7 || 7))
    }
    while (current < end) {
      result.push({ left: dateToPixel(startDate, formatDate(current), monthWidth) })
      current.setDate(current.getDate() + 7)
    }
    return result
  }, [startDate, endDate, monthWidth, showWeekly])

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ width: totalWidth }}>
      {lines.map((line, i) => (
        <div
          key={i}
          className={line.isYear ? 'timeline-year-line' : 'timeline-month-line'}
          style={{ left: line.left }}
        />
      ))}
      {showWeekly &&
        weeklyLines.map((line, i) => (
          <div
            key={`w${i}`}
            className="timeline-week-line"
            style={{ left: line.left }}
          />
        ))}
    </div>
  )
}
