// Date ranges for stats and lists. Pure module: imported by server and client code.

export const RANGE_KEYS = ["7d", "30d", "90d", "year", "all"] as const
export type RangeKey = (typeof RANGE_KEYS)[number]
export const DEFAULT_RANGE: RangeKey = "30d"

export const RANGE_LABELS: Record<RangeKey, string> = {
  "7d": "7 days",
  "30d": "30 days",
  "90d": "90 days",
  year: "This year",
  all: "All time",
}

export function parseRange(value: string | null | undefined): RangeKey {
  return (RANGE_KEYS as readonly string[]).includes(value ?? "")
    ? (value as RangeKey)
    : DEFAULT_RANGE
}

export interface Bounds {
  // null start = no lower limit (all time)
  start: Date | null
  end: Date
  // The same length of time just before, for "vs previous period"; null for all time.
  prevStart: Date | null
  prevEnd: Date | null
}

const DAY = 24 * 60 * 60 * 1000

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function rangeBounds(key: RangeKey, now = new Date()): Bounds {
  if (key === "all") {
    return { start: null, end: now, prevStart: null, prevEnd: null }
  }
  let start: Date
  if (key === "year") {
    start = new Date(now.getFullYear(), 0, 1)
  } else {
    const days = { "7d": 7, "30d": 30, "90d": 90 }[key]
    // Today counts as one of the days.
    start = startOfDay(new Date(now.getTime() - (days - 1) * DAY))
  }
  const span = now.getTime() - start.getTime()
  return {
    start,
    end: now,
    prevStart: new Date(start.getTime() - span),
    prevEnd: start,
  }
}

export function inBounds(date: Date, start: Date | null, end: Date): boolean {
  const t = date.getTime()
  if (!Number.isFinite(t)) return false
  return (start === null || t >= start.getTime()) && t <= end.getTime()
}

/** Items received in the range, and in the period just before it. */
export function splitByRange<T>(
  items: T[],
  dateOf: (item: T) => Date,
  bounds: Bounds
): { current: T[]; previous: T[] | null } {
  const current = items.filter((i) => inBounds(dateOf(i), bounds.start, bounds.end))
  if (!bounds.prevStart || !bounds.prevEnd) return { current, previous: null }
  const prevStart = bounds.prevStart
  const prevEnd = bounds.prevEnd
  const previous = items.filter((i) => {
    const t = dateOf(i).getTime()
    return t >= prevStart.getTime() && t < prevEnd.getTime()
  })
  return { current, previous }
}

/** Percent change, or null when there is nothing to compare with. */
export function percentChange(current: number, previous: number | null): number | null {
  if (previous === null || previous === 0) return null
  return Math.round(((current - previous) / previous) * 100)
}

export type Grain = "day" | "week" | "month"

export function grainFor(start: Date, end: Date): Grain {
  const days = (end.getTime() - start.getTime()) / DAY
  if (days <= 31) return "day"
  if (days <= 190) return "week"
  return "month"
}

function bucketStart(d: Date, grain: Grain): Date {
  if (grain === "day") return startOfDay(d)
  if (grain === "month") return new Date(d.getFullYear(), d.getMonth(), 1)
  // Weeks start on Monday.
  const day = startOfDay(d)
  const offset = (day.getDay() + 6) % 7
  return new Date(day.getFullYear(), day.getMonth(), day.getDate() - offset)
}

function nextBucket(d: Date, grain: Grain): Date {
  if (grain === "day") return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
  if (grain === "week") return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7)
  return new Date(d.getFullYear(), d.getMonth() + 1, 1)
}

export interface Bucket {
  start: Date
  counts: Record<string, number>
}

/**
 * Counts per time bucket for several series (e.g. one per form).
 * With no start (all time), the first item's date is used.
 */
export function bucketSeries(
  series: Record<string, Date[]>,
  start: Date | null,
  end: Date
): { grain: Grain; buckets: Bucket[] } {
  const names = Object.keys(series)
  let from = start
  if (!from) {
    let min = end.getTime()
    for (const name of names) {
      for (const d of series[name]) {
        const t = d.getTime()
        if (Number.isFinite(t) && t < min) min = t
      }
    }
    from = new Date(min)
  }
  const grain = grainFor(from, end)
  const buckets: Bucket[] = []
  const index = new Map<number, Bucket>()
  for (let b = bucketStart(from, grain); b.getTime() <= end.getTime(); b = nextBucket(b, grain)) {
    const bucket: Bucket = { start: b, counts: Object.fromEntries(names.map((n) => [n, 0])) }
    buckets.push(bucket)
    index.set(b.getTime(), bucket)
  }
  for (const name of names) {
    for (const d of series[name]) {
      if (!inBounds(d, from, end)) continue
      const bucket = index.get(bucketStart(d, grain).getTime())
      if (bucket) bucket.counts[name] += 1
    }
  }
  return { grain, buckets }
}

export function formatBucket(d: Date, grain: Grain): string {
  if (grain === "month") {
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" })
  }
  const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  return grain === "week" ? `Week of ${label}` : label
}
