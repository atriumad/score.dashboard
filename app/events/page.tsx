import { redirect } from "next/navigation"
import { requireAuth } from "@/lib/auth"
import { loadInquiries } from "@/lib/inquiries"
import { EventBoard } from "@/components/event-board"
import { SectionShell } from "@/components/section-shell"

export const dynamic = "force-dynamic"

export default async function EventsPage() {
  if (!(await requireAuth())) {
    redirect("/login")
  }

  const { events, eventStages, eventsError, contactError } = await loadInquiries()
  const error = [eventsError, contactError].filter(Boolean).join(" · ") || null

  return (
    <SectionShell title="Event leads" count={events.length} error={error}>
      <EventBoard requests={events} statuses={eventStages} />
    </SectionShell>
  )
}
