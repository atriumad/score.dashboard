import { redirect } from "next/navigation"
import { requireAuth } from "@/lib/auth"
import { buildCareerApplication } from "@/lib/extract"
import { loadInquiries } from "@/lib/inquiries"
import { loadSection } from "@/lib/sections"
import { getStatuses } from "@/lib/status"
import type { Stage } from "@/lib/stages"
import type { OverviewData } from "@/lib/rows"
import { Header } from "@/components/header"
import { Overview } from "@/components/overview"

export const dynamic = "force-dynamic"

export default async function OverviewPage() {
  if (!(await requireAuth())) {
    redirect("/login")
  }

  const [hiring, newsletter, inquiries, hiringStages] = await Promise.all([
    loadSection("hiring"),
    loadSection("newsletter"),
    loadInquiries(),
    getStatuses("hiring").catch((): Record<string, Stage> => ({})),
  ])

  const errors: OverviewData["errors"] = []
  for (const [section, message] of [
    ["Hiring", hiring.error],
    ["Event leads", inquiries.eventsError],
    ["Contact", inquiries.contactError],
    ["Newsletter", newsletter.error],
  ] as const) {
    if (message) errors.push({ section, message })
  }

  const data: OverviewData = {
    hiring: hiring.entries.map((e) => {
      const a = buildCareerApplication(e)
      const id = String(e.id)
      return { id, received: e.date_created, stage: hiringStages[id] ?? "new", name: a.name, areas: a.areas }
    }),
    events: inquiries.events.map((r) => {
      const id = String(r.entry.id)
      return {
        id,
        received: r.entry.date_created,
        stage: inquiries.eventStages[id] ?? "new",
        name: r.name,
        eventDate: r.eventDate,
        eventType: r.eventType,
        guests: r.guests,
        packageName: r.packageName,
        source: r.source,
      }
    }),
    contact: inquiries.contact.map((m) => ({
      id: String(m.entry.id),
      received: m.entry.date_created,
      name: m.name,
    })),
    newsletter: newsletter.entries.map((e) => ({ id: String(e.id), received: e.date_created })),
    errors,
    eventsConfigured: inquiries.eventsConfigured,
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        <Overview data={data} />
      </main>
    </div>
  )
}
