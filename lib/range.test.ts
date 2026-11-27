import { expect, test } from "bun:test"
import {
  bucketSeries,
  parseRange,
  percentChange,
  rangeBounds,
  splitByRange,
} from "./range"

const now = new Date(2026, 10, 27, 15, 0) // 27 Nov 2026, 3 pm

test("unknown or missing range falls back to 30 days", () => {
  expect(parseRange(null)).toBe("30d")
  expect(parseRange("forever")).toBe("30d")
  expect(parseRange("90d")).toBe("90d")
})

test("7 days starts at midnight six days back, previous period is the same length", () => {
  const b = rangeBounds("7d", now)
  expect(b.start).toEqual(new Date(2026, 10, 21))
  expect(b.prevEnd).toEqual(b.start)
  expect(b.end.getTime() - b.start!.getTime()).toBe(
    b.prevEnd!.getTime() - b.prevStart!.getTime()
  )
})

test("this year starts on 1 January; all time has no limits", () => {
  expect(rangeBounds("year", now).start).toEqual(new Date(2026, 0, 1))
  const all = rangeBounds("all", now)
  expect(all.start).toBeNull()
  expect(all.prevStart).toBeNull()
})

test("splitByRange separates the range and the period before", () => {
  const dates = [
    new Date(2026, 10, 27), // in
    new Date(2026, 10, 21, 0, 1), // in (first day)
    new Date(2026, 10, 18), // previous
    new Date(2026, 9, 1), // neither
  ]
  const { current, previous } = splitByRange(dates, (d) => d, rangeBounds("7d", now))
  expect(current).toHaveLength(2)
  expect(previous).toHaveLength(1)
})

test("percentChange is null without a base", () => {
  expect(percentChange(5, null)).toBeNull()
  expect(percentChange(5, 0)).toBeNull()
  expect(percentChange(15, 10)).toBe(50)
  expect(percentChange(5, 10)).toBe(-50)
})

test("buckets: daily for 7 days, counts land in the right day", () => {
  const b = rangeBounds("7d", now)
  const { grain, buckets } = bucketSeries(
    { a: [new Date(2026, 10, 27, 9), new Date(2026, 10, 27, 10)], b: [new Date(2026, 10, 22)] },
    b.start,
    b.end
  )
  expect(grain).toBe("day")
  expect(buckets).toHaveLength(7)
  expect(buckets.at(-1)!.counts).toEqual({ a: 2, b: 0 })
  expect(buckets[1].counts).toEqual({ a: 0, b: 1 })
})

test("buckets: all time starts at the first item and goes monthly when long", () => {
  const { grain, buckets } = bucketSeries(
    { a: [new Date(2026, 0, 15), new Date(2026, 10, 2)] },
    null,
    now
  )
  expect(grain).toBe("month")
  expect(buckets[0].start).toEqual(new Date(2026, 0, 1))
  expect(buckets.reduce((s, x) => s + x.counts.a, 0)).toBe(2)
})
