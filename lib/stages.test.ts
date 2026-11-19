import { expect, test } from "bun:test"
import {
  EVENT_STAGES,
  HIRING_STAGES,
  countByStage,
  isPipelineKind,
  isStage,
  normalizeStage,
} from "./stages"

test("legacy hiring values translate", () => {
  expect(normalizeStage("hiring", "received")).toBe("new")
  expect(normalizeStage("hiring", "approved")).toBe("hired")
  expect(normalizeStage("hiring", "reviewing")).toBe("reviewing")
  expect(normalizeStage("hiring", "rejected")).toBe("rejected")
})

test("current values pass through", () => {
  for (const s of HIRING_STAGES) expect(normalizeStage("hiring", s)).toBe(s)
  for (const s of EVENT_STAGES) expect(normalizeStage("events", s)).toBe(s)
})

test("missing or unknown values become new", () => {
  expect(normalizeStage("hiring", null)).toBe("new")
  expect(normalizeStage("hiring", undefined)).toBe("new")
  expect(normalizeStage("hiring", "")).toBe("new")
  expect(normalizeStage("hiring", "banana")).toBe("new")
})

test("a stage from the other pipeline is not valid", () => {
  expect(isStage("events", "hired")).toBe(false)
  expect(isStage("hiring", "quoted")).toBe(false)
  expect(normalizeStage("events", "hired")).toBe("new")
  expect(normalizeStage("events", "approved")).toBe("new")
})

test("counts only listed entries, unlisted default to new", () => {
  const counts = countByStage("hiring", ["1", "2", "3"], {
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

test("event counts use event stages", () => {
  const counts = countByStage("events", ["1", "2"], { "1": "confirmed" })
  expect(counts).toEqual({
    new: 1,
    contacted: 0,
    quoted: 0,
    confirmed: 1,
    completed: 0,
    lost: 0,
  })
})

test("isStage rejects legacy and non-strings", () => {
  expect(isStage("hiring", "offer")).toBe(true)
  expect(isStage("hiring", "approved")).toBe(false)
  expect(isStage("hiring", 3)).toBe(false)
})

test("isPipelineKind", () => {
  expect(isPipelineKind("events")).toBe(true)
  expect(isPipelineKind("contact")).toBe(false)
  expect(isPipelineKind(undefined)).toBe(false)
})
