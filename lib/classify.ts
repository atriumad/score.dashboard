// Which contact form messages are really event inquiries. Pure module.
//
// The contact form has no "reason" field, so the message text decides. A
// person can override any message with Move to Events / Move to Contact;
// that choice is saved and always wins over these words.

const EVENT_WORDS = [
  "birthday",
  "bday",
  "b-day",
  "party",
  "parties",
  "event",
  "celebrat",
  "corporate",
  "team building",
  "team-building",
  "company outing",
  "outing",
  "field trip",
  "group",
  "booking",
  "book a",
  "book the",
  "rent the",
  "rental",
  "buyout",
  "private room",
  "package",
  "kids",
  "graduation",
  "fundraiser",
  "church",
  "youth",
  "school trip",
  "bachelor",
  "holiday party",
  "christmas party",
  "quinceañera",
  "quinceanera",
  "cumpleaños",
  "fiesta",
]

const PATTERN = new RegExp(
  EVENT_WORDS.map((w) => w.replace(/[.*+?^${}()|[\]\\-]/g, "\\$&")).join("|"),
  "i"
)

export function looksLikeEventInquiry(message: string): boolean {
  return PATTERN.test(message)
}

export type Route = "events" | "contact"

export function isRoute(value: unknown): value is Route {
  return value === "events" || value === "contact"
}

/** Where a contact message belongs: a saved choice first, else its words. */
export function routeFor(message: string, saved: Route | undefined): Route {
  if (saved) return saved
  return looksLikeEventInquiry(message) ? "events" : "contact"
}
