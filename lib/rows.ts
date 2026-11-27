// Small, serializable rows sent from server pages to the charts, so the
// browser never receives whole form entries just to count them.
import type { Stage } from "./stages"

export interface Row {
  id: string
  // Gravity Forms date_created (UTC)
  received: string
  name: string
}

export interface HiringRow extends Row {
  stage: Stage
  areas: string[]
}

export interface EventRow extends Row {
  stage: Stage
  eventDate: string
  eventType: string
  guests: number | null
  packageName: string
  source: "form" | "contact"
}

export interface OverviewData {
  hiring: HiringRow[]
  // Event Request form entries plus contact form event inquiries
  events: EventRow[]
  // General contact messages (event inquiries are in events)
  contact: Row[]
  newsletter: { id: string; received: string }[]
  // Sections that could not be loaded, with the reason.
  errors: { section: string; message: string }[]
  eventsConfigured: boolean
}
