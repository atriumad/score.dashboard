import { expect, test } from "bun:test"
import { looksLikeEventInquiry, routeFor } from "./classify"

test("event inquiries are recognised", () => {
  expect(
    looksLikeEventInquiry(
      "Hello. I would like information on birthday party prices. My son's 13th birthday is in December."
    )
  ).toBe(true)
  expect(looksLikeEventInquiry("Do you do corporate team building for 40 people?")).toBe(true)
  expect(looksLikeEventInquiry("Quiero reservar para una fiesta de cumpleaños")).toBe(true)
})

test("ordinary messages stay in contact", () => {
  expect(looksLikeEventInquiry("What time do you close on Sunday?")).toBe(false)
  expect(looksLikeEventInquiry("I lost my keys at the go-kart track yesterday")).toBe(false)
  expect(looksLikeEventInquiry("")).toBe(false)
  // seen in real messages: a small play reservation and a job pitch
  expect(looksLikeEventInquiry("Do we need reservation for 2 adults & 1 child to play mini golf?")).toBe(false)
  expect(looksLikeEventInquiry("I would love to work with you and your guests")).toBe(false)
})

test("a saved choice always wins over the words", () => {
  expect(routeFor("birthday party for 10", "contact")).toBe("contact")
  expect(routeFor("what are your hours?", "events")).toBe("events")
  expect(routeFor("birthday party for 10", undefined)).toBe("events")
  expect(routeFor("what are your hours?", undefined)).toBe("contact")
})
