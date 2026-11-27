import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft, Mail, MailCheck, Phone } from "lucide-react"
import { requireAuth } from "@/lib/auth"
import { getEntry } from "@/lib/gravity-forms"
import { routeFor, type Route } from "@/lib/classify"
import { buildContactMessage, buildEventRequest, contactAsEventRequest } from "@/lib/extract"
import { MoveButton } from "@/components/move-button"
import { formIdFor } from "@/lib/forms"
import { formatEventDate, formatReceived } from "@/lib/format"
import { getRoutes, getStatuses } from "@/lib/status"
import type { Stage } from "@/lib/stages"
import type { EventRequest } from "@/lib/types"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CopyEmailButton } from "@/components/copy-email"
import { Header } from "@/components/header"
import { StagePicker } from "@/components/stage-picker"
import { cn } from "cn"

export const dynamic = "force-dynamic"

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value || "—"}</dd>
    </div>
  )
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  if (!(await requireAuth())) {
    redirect("/login")
  }

  const { id } = await params
  const formId = formIdFor("events")
  if (!formId || !/^\d+$/.test(id)) {
    notFound()
  }

  // An event lead is an Event Request form entry, or a contact form message
  // that is an event inquiry (entry ids are unique across forms).
  let request: EventRequest | null = null
  try {
    request = buildEventRequest(await getEntry(id, formId))
  } catch (err) {
    const message = err instanceof Error ? err.message : ""
    if (!message.includes("404")) redirect("/events")
  }
  const contactFormId = formIdFor("contact")
  if (!request && contactFormId) {
    try {
      request = contactAsEventRequest(buildContactMessage(await getEntry(id, contactFormId)))
    } catch (err) {
      const message = err instanceof Error ? err.message : ""
      if (!message.includes("404")) redirect("/events")
    }
  }
  if (!request) notFound()

  // Same fallback as the list: if Redis is unreachable the page still loads.
  let stage: Stage = "new"
  let savedRoute: Route | undefined
  try {
    stage = (await getStatuses("events"))[id] ?? "new"
    savedRoute = (await getRoutes())[id]
  } catch {
    stage = "new"
  }
  const fromContact = request.source === "contact"
  const inEvents = !fromContact || routeFor(request.details, savedRoute) === "events"

  const mailto = `mailto:${request.email}?subject=${encodeURIComponent(
    "Your event at Score Entertainment"
  )}`

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6">
        <Link
          href="/events"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "mb-4 -ml-2 text-muted-foreground"
          )}
        >
          <ArrowLeft className="size-3.5" />
          All event leads
        </Link>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              {request.name || request.email || "Event lead"}
            </h1>
            <p className="text-muted-foreground">
              Received {formatReceived(request.entry.date_created)}
              {fromContact ? " · through the contact form" : ""}
              {request.company ? ` · ${request.company}` : ""}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <div className="w-36">
              <StagePicker kind="events" entryId={id} value={stage} />
            </div>
            {fromContact && (
              <MoveButton
                entryId={id}
                to={inEvents ? "contact" : "events"}
                afterMove={inEvents ? "/contact" : undefined}
              />
            )}
            {request.email && (
              <>
                <a
                  href={mailto}
                  className={buttonVariants({ variant: "outline" })}
                >
                  <Mail className="size-3.5" />
                  Email
                </a>
                <CopyEmailButton email={request.email} />
              </>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Event</CardTitle>
            </CardHeader>
            <CardContent>
              {fromContact ? (
                <p className="text-sm text-muted-foreground">
                  Sent through the contact form, which has no event fields. The
                  date, group size and type are in the message below.
                </p>
              ) : (
                <dl className="space-y-2 text-sm">
                  <Row label="Type" value={request.eventType} />
                  <Row label="Date" value={formatEventDate(request.eventDate)} />
                  <Row label="Time" value={request.eventTime} />
                  <Row label="Guests" value={request.guests} />
                  <Row label="Package" value={request.packageName} />
                </dl>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {request.email && (
                <div className="flex items-start gap-2">
                  <MailCheck className="mt-0.5 size-4 shrink-0 text-brand-blue" />
                  <a
                    href={mailto}
                    className="break-all text-brand-blue hover:underline"
                  >
                    {request.email}
                  </a>
                </div>
              )}
              {request.phone && (
                <div className="flex items-start gap-2">
                  <Phone className="mt-0.5 size-4 shrink-0 text-brand-blue" />
                  <a href={`tel:${request.phone}`} className="hover:underline">
                    {request.phone}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {request.details && (
            <Card className="sm:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">{fromContact ? "Message" : "Details"}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="max-w-[75ch] text-sm whitespace-pre-wrap">
                  {request.details}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
