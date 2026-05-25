import { useMemo } from 'react'
import { addMonths, parseISO, format } from 'date-fns'
import { dateToPixel, getFiscalQuarter, getFiscalYear, getFiscalYearLabel } from '../../utils/date'

interface TimelineHeaderProps {
  startDate: string
  endDate: string
  monthWidth: number
}

export function TimelineHeader({ startDate, endDate, monthWidth }: TimelineHeaderProps) {
  const months = useMemo(() => {
    const result: {
      date: string; month: number; year: number; quarter: number;
      fiscalYear: number; fiscalQuarter: number; label: string; width: number
    }[] = []
    let current = parseISO(startDate)
    const end = parseISO(endDate)
    while (current < end) {
      const next = addMonths(current, 1)
      const segmentEnd = next < end ? next : end
      const dateStr = format(current, 'yyyy-MM-dd')
      result.push({
        date: dateStr,
        month: current.getMonth(),
        year: current.getFullYear(),
        quarter: Math.floor(current.getMonth() / 3) + 1,
        fiscalYear: getFiscalYear(dateStr),
        fiscalQuarter: getFiscalQuarter(dateStr),
        label: format(current, 'MMM'),
        width: Math.max(1, dateToPixel(startDate, format(segmentEnd, 'yyyy-MM-dd'), monthWidth) - dateToPixel(startDate, format(current, 'yyyy-MM-dd'), monthWidth)),
      })
      current = next
    }
    return result
  }, [startDate, endDate, monthWidth])

  const yearRanges = useMemo(() => {
    const years: { year: number; width: number }[] = []
    months.forEach((m) => {
      const ex = years.find(y => y.year === m.year)
      if (ex) ex.width += m.width
      else years.push({ year: m.year, width: m.width })
    })
    return years
  }, [months])

  const fiscalYearRanges = useMemo(() => {
    const fys: { fiscalYear: number; width: number }[] = []
    months.forEach((m) => {
      const ex = fys.find(f => f.fiscalYear === m.fiscalYear)
      if (ex) ex.width += m.width
      else fys.push({ fiscalYear: m.fiscalYear, width: m.width })
    })
    return fys
  }, [months])

  const fiscalQuarterRanges = useMemo(() => {
    const fqs: { fiscalYear: number; fiscalQuarter: number; width: number }[] = []
    months.forEach((m) => {
      const key = `${m.fiscalYear}-FQ${m.fiscalQuarter}`
      const ex = fqs.find(q => `${q.fiscalYear}-FQ${q.fiscalQuarter}` === key)
      if (ex) ex.width += m.width
      else fqs.push({ fiscalYear: m.fiscalYear, fiscalQuarter: m.fiscalQuarter, width: m.width })
    })
    return fqs
  }, [months])

  const innerWidth = Math.max(monthWidth, dateToPixel(startDate, endDate, monthWidth))
  const showMonthLabels = monthWidth >= 34

  return (
    <div className="sticky top-0 z-30 bg-white border-b border-outline-variant select-none">
      {/* Calendar Year */}
      <div className="flex" style={{ width: innerWidth, minWidth: '100%' }}>
        {yearRanges.map(yr => (
          <div
            key={yr.year}
            className="timeline-year-header"
            style={{ width: yr.width }}
          >
            {yr.year}
          </div>
        ))}
      </div>

      {/* Fiscal Year */}
      <div
        className="flex border-t border-outline-variant/20"
        style={{ width: innerWidth, minWidth: '100%' }}
      >
        {fiscalYearRanges.map(fy => (
          <div
            key={fy.fiscalYear}
            className="timeline-fiscal-year-header"
            style={{ width: fy.width }}
          >
            {getFiscalYearLabel(fy.fiscalYear)}
          </div>
        ))}
      </div>

      {/* Fiscal Quarter */}
      <div
        className="flex border-t border-outline-variant/20"
        style={{ width: innerWidth, minWidth: '100%' }}
      >
        {fiscalQuarterRanges.map(fqr => (
          <div
            key={`${fqr.fiscalYear}-FQ${fqr.fiscalQuarter}`}
            className="timeline-quarter-header"
            style={{ width: fqr.width }}
          >
            {fqr.width >= 88 ? `${getFiscalYearLabel(fqr.fiscalYear)} Q${fqr.fiscalQuarter}` : `Q${fqr.fiscalQuarter}`}
          </div>
        ))}
      </div>

      {/* Month */}
      {showMonthLabels && (
        <div
          className="flex border-t border-outline-variant/20"
          style={{ width: innerWidth, minWidth: '100%' }}
        >
          {months.map(m => (
            <div
              key={m.date}
              className="timeline-month-header"
              style={{ width: m.width }}
            >
              {m.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
