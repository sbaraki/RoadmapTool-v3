import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  differenceInMonths,
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  startOfQuarter,
  endOfQuarter,
  isWithinInterval,
  isAfter,
  isBefore,
  isSameDay,
  isValid,
} from 'date-fns'

export function parseDate(dateStr: string): Date {
  return parseISO(dateStr)
}

export function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function formatDisplay(date: Date): string {
  return format(date, 'MMM d, yyyy')
}

export function monthsBetween(start: string, end: string): number {
  return differenceInMonths(parseISO(end), parseISO(start))
}

export function dateToMonthsOffset(origin: string, date: string): number {
  return differenceInMonths(parseISO(date), parseISO(origin))
}

export function monthsOffsetToDate(origin: string, offsetMonths: number): string {
  return formatDate(addMonths(parseISO(origin), offsetMonths))
}

export function addMonthsToString(dateStr: string, months: number): string {
  return formatDate(addMonths(parseISO(dateStr), months))
}

export function addDaysToString(dateStr: string, days: number): string {
  return formatDate(addDays(parseISO(dateStr), days))
}

export function getMonthStart(dateStr: string): string {
  return formatDate(startOfMonth(parseISO(dateStr)))
}

export function getMonthEnd(dateStr: string): string {
  return formatDate(endOfMonth(parseISO(dateStr)))
}

export function getYearStart(dateStr: string): string {
  return formatDate(startOfYear(parseISO(dateStr)))
}

export function getYearEnd(dateStr: string): string {
  return formatDate(endOfYear(parseISO(dateStr)))
}

export function getQuarterStart(dateStr: string): string {
  return formatDate(startOfQuarter(parseISO(dateStr)))
}

export function getQuarterEnd(dateStr: string): string {
  return formatDate(endOfQuarter(parseISO(dateStr)))
}

export function isValidDate(dateStr: string): boolean {
  const d = parseISO(dateStr)
  return isValid(d)
}

export function isDateInRange(date: string, start: string, end: string): boolean {
  return isWithinInterval(parseISO(date), { start: parseISO(start), end: parseISO(end) })
}

export function isDateAfter(date: string, compare: string): boolean {
  return isAfter(parseISO(date), parseISO(compare))
}

export function isDateBefore(date: string, compare: string): boolean {
  return isBefore(parseISO(date), parseISO(compare))
}

export function isSameDate(date1: string, date2: string): boolean {
  return isSameDay(parseISO(date1), parseISO(date2))
}

export function getMonthLabel(date: Date): string {
  return format(date, 'MMM')
}

export function getQuarterLabel(date: Date): string {
  const q = Math.floor(date.getMonth() / 3) + 1
  return `Q${q}`
}

export function getYear(date: Date): number {
  return date.getFullYear()
}

export function getFiscalQuarter(dateStr: string): number {
  const month = parseISO(dateStr).getMonth()
  return Math.floor(((month + 9) % 12) / 3) + 1
}

export function getFiscalYear(dateStr: string): number {
  const d = parseISO(dateStr)
  const month = d.getMonth()
  const year = d.getFullYear()
  return month >= 3 ? year : year - 1
}

export function getFiscalYearLabel(fy: number): string {
  const s = String(fy).slice(-2)
  const e = String(fy + 1).slice(-2)
  return `FY${s}/${e}`
}

export function clampDate(date: string, min: string, max: string): string {
  const d = parseISO(date)
  const mn = parseISO(min)
  const mx = parseISO(max)
  if (isBefore(d, mn)) return formatDate(mn)
  if (isAfter(d, mx)) return formatDate(mx)
  return date
}

export function dateToPixel(origin: string, dateStr: string, monthWidth: number): number {
  const originDate = parseISO(origin)
  const targetDate = parseISO(dateStr)
  const wholeMonths = differenceInMonths(targetDate, originDate)
  const monthAnchor = addMonths(originDate, wholeMonths)
  const extraDays = differenceInCalendarDays(targetDate, monthAnchor)
  return wholeMonths * monthWidth + extraDays * (monthWidth / 30)
}

export function pixelDeltaToDays(px: number, monthWidth: number): number {
  return Math.round(px / (monthWidth / 30))
}

export function pixelToDate(origin: string, px: number, monthWidth: number): string {
  const totalMonths = px / monthWidth
  const wholeMonths = Math.floor(totalMonths)
  const remainder = totalMonths - wholeMonths
  const baseDate = addMonths(parseISO(origin), wholeMonths)
  const extraDays = Math.round(remainder * 30)
  baseDate.setDate(baseDate.getDate() + extraDays)
  return formatDate(baseDate)
}

export function monthsToPixel(months: number, monthWidth: number): number {
  return months * monthWidth
}

export function generateDateRange(start: string, end: string): string[] {
  const dates: string[] = []
  let current = parseISO(start)
  const endDate = parseISO(end)
  while (!isAfter(current, endDate)) {
    dates.push(formatDate(current))
    current = addMonths(current, 1)
  }
  return dates
}

export function snapToWeek(dateStr: string): string {
  const d = parseISO(dateStr)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return formatDate(d)
}
