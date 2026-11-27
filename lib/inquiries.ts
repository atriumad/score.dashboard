// Event requests and contact messages, with the contact form's event
// inquiries moved into Events. Server only.
import { routeFor, type Route } from "./classify"
import { buildContactMessage, buildEventRequest, contactAsEventRequest } from "./extract"
import { loadSection } from "./sections"
import { getRoutes, getStatuses } from "./status"
import type { Stage } from "./stages"
import type { ContactMessage, EventRequest } from "./types"

export interface Inquiries {
  // Event Request form entries plus contact messages that are event inquiries
  events: EventRequest[]
  // Everything else sent through the contact form
  contact: ContactMessage[]
  eventStages: Record<string, Stage>
  eventsError: string | null
  contactError: string | null
  eventsConfigured: boolean
}

async function orEmpty<T>(p: Promise<Record<string, T>>): Promise<Record<string, T>> {
  try {
    return await p
  } catch {
    return {}
  }
}

export async function loadInquiries(): Promise<Inquiries> {
  const [eventsData, contactData, routes, eventStages] = await Promise.all([
    loadSection("events"),
    loadSection("contact"),
    orEmpty<Route>(getRoutes()),
    orEmpty<Stage>(getStatuses("events")),
  ])

  const events = eventsData.entries.map(buildEventRequest)
  const contact: ContactMessage[] = []
  for (const m of contactData.entries.map(buildContactMessage)) {
    if (routeFor(m.message, routes[String(m.entry.id)]) === "events") {
      events.push(contactAsEventRequest(m))
    } else {
      contact.push(m)
    }
  }
  // Newest first, whichever form they came from.
  events.sort((a, b) => b.entry.date_created.localeCompare(a.entry.date_created))

  return {
    events,
    contact,
    eventStages,
    eventsError: eventsData.error,
    contactError: contactData.error,
    eventsConfigured: eventsData.configured,
  }
}
