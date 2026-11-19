import { expect, test } from "bun:test"
import {
  HIRING_STAGES,
  countByStage,
  isHiringStage,
  normalizeHiringStage,
} from "./stages"

test("legacy values translate", () => {
  expect(normalizeHiringStage("received")).toBe("new")
  expect(normalizeHiringStage("approved")).toBe("hired")
  expect(normalizeHiringStage("reviewing")).toBe("reviewing")
  expect(normalizeHiringStage("rejected")).toBe("rejected")
})

test("current values pass through", () => {
  for (const s of HIRING_STAGES) expect(normalizeHiringStage(s)).toBe(s)
})

test("missing or unknown values become new", () => {
  expect(normalizeHiringStage(null)).toBe("new")
  expect(normalizeHiringStage(undefined)).toBe("new")
  expect(normalizeHiringStage("")).toBe("new")
  expect(normalizeHiringStage("banana")).toBe("new")
})

test("counts only listed entries, unlisted default to new", () => {
  const counts = countByStage(["1", "2", "3"], {
    "1": "hired",
    "2": "offer",
    "99": "hired",
  })
  expect(counts).toEqual({
    new: 1,
    reviewing: 0,
    interview: 0,
    offer: 1,
    hired: 1,
    rejected: 0,
  })
})

test("isHiringStage rejects legacy and non-strings", () => {
  expect(isHiringStage("offer")).toBe(true)
  expect(isHiringStage("approved")).toBe(false)
  expect(isHiringStage(3)).toBe(false)
})
