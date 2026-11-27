"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { PAGE, ShowMore } from "@/components/show-more"
import { ChartCard, SERIES_COLORS, TimeBars } from "@/components/charts"
import { MoveButton } from "@/components/move-button"
import { RangePicker, useRange } from "@/components/range-picker"
import { Kpi } from "@/components/stats"
import { parseGfDate } from "@/lib/dates"
import { formatReceived } from "@/lib/format"
import { bucketSeries, splitByRange } from "@/lib/range"
import type { ContactMessage } from "@/lib/types"

const receivedOf = (m: ContactMessage) => parseGfDate(m.entry.date_created)

/** General contact form messages. Event inquiries live in Events. */
export function ContactList({
  messages,
  movedToEvents,
}: {
  messages: ContactMessage[]
  // How many contact form messages are event inquiries, shown in Events
  movedToEvents: number
}) {
  const { key, bounds } = useRange()
  const [query, setQuery] = useState("")
  const [limit, setLimit] = useState(PAGE)

  const { current: inRange, previous } = useMemo(
    () => splitByRange(messages, receivedOf, bounds),
    [messages, bounds]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return inRange
    return inRange.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.message.toLowerCase().includes(q)
    )
  }, [inRange, query])

  const timeline = useMemo(
    () => bucketSeries({ contact: inRange.map(receivedOf) }, bounds.start, bounds.end),
    [inRange, bounds]
  )
  const optedIn = inRange.filter((m) => m.optIn).length

  return (
    <div className="space-y-6">
      <RangePicker />

      <p className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        Messages asking about parties, birthdays, groups or other events are in{" "}
        <Link href={`/events?range=${key}&type=contact`} className="font-medium text-brand-blue hover:underline">
          Events
        </Link>{" "}
        ({movedToEvents} in all). Use “Move to Events” on any message here that belongs there.
      </p>

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-1 lg:grid-cols-1">
          <Kpi label="Messages" value={inRange.length} previous={previous?.length ?? null} range={key} />
          <Kpi
            label="Opted in to news"
            value={optedIn}
            range={key}
            caption={inRange.length ? `${Math.round((optedIn / inRange.length) * 100)}% of messages` : undefined}
          />
        </div>
        <ChartCard title="Messages over time" className="lg:col-span-3">
          <TimeBars
            series={[{ key: "contact", label: "Messages", color: SERIES_COLORS[2] }]}
            buckets={timeline.buckets}
            grain={timeline.grain}
            height={180}
          />
        </ChartCard>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setLimit(PAGE)
            }}
            placeholder="Search by name, email or message…"
            aria-label="Search messages"
            className="pl-8"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
            {messages.length === 0 ? "No contact messages yet." : "No messages match this range or search."}
          </p>
        ) : (
          <ul className="divide-y overflow-hidden rounded-xl border bg-card shadow-sm">
            {filtered.slice(0, limit).map((m) => (
              <li key={m.entry.id} className="space-y-2 p-4">
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                  <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="font-medium">{m.name || "—"}</span>
                    {m.email && (
                      <a href={`mailto:${m.email}`} className="text-sm break-all text-brand-blue hover:underline">
                        {m.email}
                      </a>
                    )}
                    {m.phone && (
                      <a href={`tel:${m.phone}`} className="text-sm text-muted-foreground hover:underline">
                        {m.phone}
                      </a>
                    )}
                    {m.optIn && <Badge variant="secondary">Opted in to news</Badge>}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <time dateTime={m.entry.date_created} className="text-xs text-muted-foreground">
                      {formatReceived(m.entry.date_created)}
                    </time>
                    <MoveButton entryId={String(m.entry.id)} to="events" />
                  </div>
                </div>
                {m.message && (
                  <p className="max-w-[75ch] text-sm whitespace-pre-wrap text-foreground/90">{m.message}</p>
                )}
              </li>
            ))}
          </ul>
        )}

        <ShowMore
          shown={Math.min(limit, filtered.length)}
          total={filtered.length}
          onMore={() => setLimit(limit + PAGE)}
        />
      </div>
    </div>
  )
}
