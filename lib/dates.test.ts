import { expect, test } from "bun:test"
import { isWithinDays, parseEventDate, parseGfDate } from "./dates"

test("entry dates from Gravity Forms are UTC", () => {
  expect(parseGfDate("2026-11-27 16:41:05").toISOString()).toBe("2026-11-27T16:41:05.000Z")
  expect(parseGfDate("2026-11-27 16:41").toISOString()).toBe("2026-11-27T16:41:00.000Z")
})

const now = new Date(2026, 10, 19, 15, 30) // Nov 19 2026, afternoon

test("parses the date formats Gravity Forms stores", () => {
  expect(parseEventDate("2026-12-05")?.getDate()).toBe(5)
  expect(parseEventDate("2026-12-05")?.getMonth()).toBe(11)
  expect(parseEventDate("12/05/2026")?.getFullYear()).toBe(2026)
  expect(parseEventDate("12/05/2026")?.getMonth()).toBe(11)
})

test("empty or malformed dates are null", () => {
  expect(parseEventDate("")).toBeNull()
  expect(parseEventDate("soon")).toBeNull()
  expect(parseEventDate("2026-13-40")).toBeNull()
})

test("today counts as upcoming even late in the day", () => {
  expect(isWithinDays("2026-11-19", 30, now)).toBe(true)
})

test("window edges", () => {
  expect(isWithinDays("2026-12-19", 30, now)).toBe(true)
  expect(isWithinDays("2026-12-20", 30, now)).toBe(false)
  expect(isWithinDays("2026-11-18", 30, now)).toBe(false)
  expect(isWithinDays("", 30, now)).toBe(false)
})
