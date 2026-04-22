import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/* ── Class name merger ────────────────────────────────────── */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/* ── Date formatting ──────────────────────────────────────── */
export function formatDate(date: string | Date, locale = 'fr-FR'): string {
  return new Date(date).toLocaleDateString(locale, {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
  })
}

export function formatDateTime(date: string | Date, locale = 'fr-FR'): string {
  return new Date(date).toLocaleString(locale, {
    day:    '2-digit',
    month:  'short',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  })
}

export function formatTimeAgo(date: string | Date): string {
  const now  = Date.now()
  const then = new Date(date).getTime()
  const diff = Math.floor((now - then) / 1000)

  if (diff < 60)          return `il y a ${diff}s`
  if (diff < 3600)        return `il y a ${Math.floor(diff / 60)}min`
  if (diff < 86400)       return `il y a ${Math.floor(diff / 3600)}h`
  return `il y a ${Math.floor(diff / 86400)}j`
}

/* ── Number formatting ────────────────────────────────────── */
export function formatValue(value: number, decimals = 1): string {
  return value.toFixed(decimals)
}

/* ── Sensor status from value + threshold ─────────────────── */
export function getSensorStatus(
  value:    number,
  minValue: number | null,
  maxValue: number | null,
): 'normal' | 'warning' | 'critical' {
  const margin = 0.1 // 10% margin for warning zone

  if (minValue !== null) {
    const warningZone = minValue * (1 + margin)
    if (value < minValue)    return 'critical'
    if (value < warningZone) return 'warning'
  }

  if (maxValue !== null) {
    const warningZone = maxValue * (1 - margin)
    if (value > maxValue)    return 'critical'
    if (value > warningZone) return 'warning'
  }

  return 'normal'
}

/* ── CSV export helper ────────────────────────────────────── */
export function exportToCsv(
  filename: string,
  headers:  string[],
  rows:     (string | number | null | undefined)[][]
): void {
  const escape = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return ''
    const str = String(val)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(escape).join(','))
  ].join('\n')

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href     = url
  link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

/* ── Truncate text ────────────────────────────────────────── */
export function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str
}

/* ── Capitalize ───────────────────────────────────────────── */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
