"use client"

import Link from "next/link"
import { useMemo } from "react"
import { AlertTriangle, ArrowRight, CalendarDays } from "lucide-react"
import { BarList, ChartCard, SERIES_COLORS, TimeBars } from "@/components/charts"
import { RangePicker, useRange } from "@/components/range-picker"
import { Kpi, StageStrip } from "@/components/stats"
import { StageDot } from "@/components/stage-dot"
import { isWithinDays, parseEventDate, parseGfDate } from "@/lib/dates"
import { formatEventDate } from "@/lib/format"
import { RANGE_LABELS, bucketSeries, splitByRange } from "@/lib/range"
import { STAGE_LABELS, type Stage } from "@/lib/stages"
import type { OverviewData } from "@/lib/rows"

const received = (r: { received: string }) => parseGfDate(r.received)

function stageMap(rows: { id: string; stage: Stage }[]): Record<string, Stage> {
  return Object.fromEntries(rows.map((r) => [r.id, r.stage]))
}

export function Overview({ data }: { data: OverviewData }) {
  const { key, bounds } = useRange()
  const q = `?range=${key}`

  const split = useMemo(
    () => ({
      hiring: splitByRange(data.hiring, received, bounds),
      events: splitByRange(data.events, received, bounds),
      contact: splitByRange(data.contact, received, bounds),
      newsletter: splitByRange(data.newsletter, received, bounds),
    }),
    [data, bounds]
  )

  const series = [
    { key: "hiring", label: "Applications", color: SERIES_COLORS[0] },
    { key: "events", label: "Event leads", color: SERIES_COLORS[1] },
    { key: "contact", label: "Contact", color: SERIES_COLORS[2] },
    { key: "newsletter", label: "Newsletter", color: SERIES_COLORS[3] },
  ]
  const hiringNow = split.hiring.current
  const eventsNow = split.events.current
  const contactNow = split.contact.current
  const newsletterNow = split.newsletter.current

  const timeline = useMemo(
    () =>
      bucketSeries(
        {
          hiring: hiringNow.map(received),
          events: eventsNow.map(received),
          contact: contactNow.map(received),
          newsletter: newsletterNow.map(received),
        },
        bounds.start,
        bounds.end
      ),
    [hiringNow, eventsNow, contactNow, newsletterNow, bounds]
  )

  const areas = useMemo(() => {
    const counts = new Map<string, number>()
    for (const a of hiringNow) for (const area of a.areas) counts.set(area, (counts.get(area) ?? 0) + 1)
    return Array.from(counts, ([label, value]) => ({ label, value }))
  }, [hiringNow])

  // Backlog is all time: something still New is waiting whatever the range.
  const waiting = [
    { label: "Applicants not reviewed", count: data.hiring.filter((r) => r.stage === "new").length, href: `/applications${q}&view=board` },
    { label: "Event leads not contacted", count: data.events.filter((r) => r.stage === "new").length, href: `/events${q}&view=board` },
  ]

  const upcoming = useMemo(
    () =>
      data.events
        .filter((e) => isWithinDays(e.eventDate, 30) && e.stage !== "lost")
        .sort((a, b) => (parseEventDate(a.eventDate)?.getTime() ?? 0) - (parseEventDate(b.eventDate)?.getTime() ?? 0)),
    [data.events]
  )

  const rangeLabel = key === "all" ? "all time" : key === "year" ? "this year" : `the last ${RANGE_LABELS[key].toLowerCase()}`

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Overview</h1>
          <p className="text-sm text-muted-foreground">Everything received through scoreusa.com in {rangeLabel}.</p>
        </div>
        <RangePicker />
      </div>

      {data.errors.length > 0 && (
        <div className="space-y-1 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {data.errors.map((e) => (
            <p key={e.section}>
              <AlertTriangle className="mr-1.5 inline size-4" />
              {e.section} could not be loaded: {e.message}
            </p>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Applications" value={split.hiring.current.length} previous={split.hiring.previous?.length ?? null} range={key} href={`/applications${q}`} />
        <Kpi label="Event leads" value={split.events.current.length} previous={split.events.previous?.length ?? null} range={key} href={`/events${q}`} />
        <Kpi label="Contact messages" value={split.contact.current.length} previous={split.contact.previous?.length ?? null} range={key} href={`/contact${q}`} />
        <Kpi label="Newsletter sign-ups" value={split.newsletter.current.length} previous={split.newsletter.previous?.length ?? null} range={key} href={`/newsletter${q}`} />
      </div>

      <ChartCard title="Submissions over time" description="Every form on the website, stacked. Hover a bar for the breakdown.">
        <TimeBars series={series} buckets={timeline.buckets} grain={timeline.grain} />
      </ChartCard>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Waiting on the team" description="Still in New, any date" className="lg:col-span-1">
          <ul className="divide-y">
            {waiting.map((w) => (
              <li key={w.label}>
                <Link href={w.href} className="flex items-center justify-between gap-3 py-2.5 text-sm hover:text-brand-blue">
                  <span>{w.label}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-lg font-semibold tabular-nums">{w.count}</span>
                    <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </ChartCard>

        <ChartCard title="Pipelines" description="Where this range's submissions stand now" className="lg:col-span-2">
          <div className="space-y-5">
            <div>
              <h3 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Hiring</h3>
              <StageStrip kind="hiring" ids={split.hiring.current.map((r) => r.id)} stages={stageMap(data.hiring)} />
            </div>
            <div>
              <h3 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Event leads
                <span className="ml-1.5 normal-case tracking-normal">
                  ({split.events.current.filter((r) => r.source === "contact").length} from the contact form)
                </span>
              </h3>
              <StageStrip kind="events" ids={split.events.current.map((r) => r.id)} stages={stageMap(data.events)} />
            </div>
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Areas of interest" description="What applicants in this range want to work in">
          <BarList items={areas} total={split.hiring.current.length} empty="No applications in this range." />
        </ChartCard>

        <ChartCard
          title="Upcoming events"
          description="Event dates in the next 30 days"
          action={
            <Link href={`/events${q}&view=calendar`} className="text-xs text-brand-blue hover:underline">
              Calendar
            </Link>
          }
        >
          {!data.eventsConfigured ? (
            <p className="py-6 text-center text-sm text-muted-foreground">The event form is not connected.</p>
          ) : upcoming.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No events booked in the next 30 days.</p>
          ) : (
            <ul className="divide-y">
              {upcoming.slice(0, 8).map((e) => (
                <li key={e.id}>
                  <Link href={`/events/${e.id}`} className="flex items-center justify-between gap-3 py-2.5 text-sm hover:text-brand-blue">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <CalendarDays className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{e.name || "—"}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {formatEventDate(e.eventDate)}
                          {e.eventType && ` · ${e.eventType}`}
                          {e.guests ? ` · ${e.guests} guests` : ""}
                        </span>
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                      <StageDot stage={e.stage} />
                      {STAGE_LABELS[e.stage]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </ChartCard>
      </div>
    </div>
  )
}
