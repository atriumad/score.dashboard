import { redirect } from "next/navigation"
import { requireAuth } from "@/lib/auth"
import { buildEventRequest } from "@/lib/extract"
import { loadSection } from "@/lib/sections"
import { getStatuses } from "@/lib/status"
import type { Stage } from "@/lib/stages"
import { EventBoard } from "@/components/event-board"
import { SectionShell } from "@/components/section-shell"

export const dynamic = "force-dynamic"

export default async function EventsPage() {
  if (!(await requireAuth())) {
    redirect("/login")
  }

  const { entries, error, configured } = await loadSection("events")

  let statuses: Record<string, Stage> = {}
  try {
    statuses = await getStatuses("events")
  } catch {
    statuses = {}
  }

  return (
    <SectionShell
      title="Event requests"
      count={configured ? entries.length : undefined}
      error={error}
    >
      {configured ? (
        <EventBoard
          requests={entries.map(buildEventRequest)}
          statuses={statuses}
        />
      ) : (
        <p className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
          The event request form is not connected yet. Set GF_EVENTS_FORM_ID to
          the form&apos;s id and requests will appear here.
        </p>
      )}
    </SectionShell>
  )
}
