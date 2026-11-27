export function parseGfDate(value: string): Date {
  const m =
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/.exec(value)
  if (!m) {
    return new Date(value)
  }
  return new Date(
    Number(m[1]),
    Number(m[2]) - 1,
    Number(m[3]),
    Number(m[4]),
    Number(m[5]),
    m[6] ? Number(m[6]) : 0
  )
}
/**
 * Date-only values from a form's date field ("2026-12-05" or "12/05/2026"),
 * as local midnight. Null when empty or not a real calendar date.
 */
export function parseEventDate(value: string): Date | null {
  let y: number, m: number, d: number
  let match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (match) {
    ;[y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])]
  } else {
    match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value)
    if (!match) return null
    ;[m, d, y] = [Number(match[1]), Number(match[2]), Number(match[3])]
  }
  const date = new Date(y, m - 1, d)
  // new Date() rolls impossible dates over (month 13 -> next January).
  if (date.getMonth() !== m - 1 || date.getDate() !== d) return null
  return date
}

/** True when the date falls from today through `days` days ahead. */
export function isWithinDays(value: string, days: number, now = new Date()) {
  const date = parseEventDate(value)
  if (!date) return false
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const end = new Date(today)
  end.setDate(end.getDate() + days)
  return date >= today && date <= end
}

export function isWithinLastDays(gfDate: string, days: number, now = new Date()) {
  const t = parseGfDate(gfDate).getTime()
  return Number.isFinite(t) && t >= now.getTime() - days * 24 * 60 * 60 * 1000
}
