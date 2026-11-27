"use client"

import { useCallback, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { StagePicker } from "@/components/stage-picker"
import { StageSummary } from "@/components/stage-summary"
import { PAGE, ShowMore } from "@/components/show-more"
import { BarList, ChartCard } from "@/components/charts"
import { EventCalendar } from "@/components/event-calendar"
import { PipelineBoard } from "@/components/pipeline-board"
import { RangePicker, Segmented, useRange, useView } from "@/components/range-picker"
import { Kpi, StageStrip } from "@/components/stats"
import { isWithinDays, parseGfDate } from "@/lib/dates"
import { formatEventDate, formatReceived } from "@/lib/format"
import { splitByRange } from "@/lib/range"
import { countByStage, type Stage } from "@/lib/stages"
import type { EventRequest } from "@/lib/types"

const VIEWS = ["list", "board", "calendar"] as const
// Type filter choice for event inquiries sent through the contact form.
const CONTACT_TYPE = "__contact"
const receivedOf = (r: EventRequest) => parseGfDate(r.entry.date_created)

function tally(values: string[]): { label: string; value: number }[] {
  const m = new Map<string, number>()
  for (const v of values) m.set(v, (m.get(v) ?? 0) + 1)
  return Array.from(m, ([label, value]) => ({ label, value }))
}

export function EventBoard({
  requests,
  statuses,
}: {
  requests: EventRequest[]
  statuses: Record<string, Stage>
}) {
  const router = useRouter()
  const { key, bounds } = useRange()
  const [view, setView] = useView(VIEWS)
  const [query, setQuery] = useState("")
  // ?type=contact opens the list on contact form messages (linked from Contact).
  const params = useSearchParams()
  const [type, setType] = useState(params.get("type") === "contact" ? CONTACT_TYPE : "all")
  const [stage, setStage] = useState<Stage | null>(null)
  // Live copy of the stage map so counts follow changes made in the table or board.
  const [stages, setStages] = useState(statuses)
  const [limit, setLimit] = useState(PAGE)

  const types = useMemo(
    () =>
      Array.from(
        new Set(requests.map((r) => r.eventType).filter(Boolean))
      ).sort(),
    [requests]
  )

  const { current: inRange, previous } = useMemo(
    () => splitByRange(requests, receivedOf, bounds),
    [requests, bounds]
  )

  // Search and type apply everywhere; the received-date range applies to the
  // list, board and stats, but not the calendar, which is about event dates.
  const searchAndType = useCallback(
    (r: EventRequest) => {
      if (type === CONTACT_TYPE) {
        if (r.source !== "contact") return false
      } else if (type !== "all" && r.eventType !== type) {
        return false
      }
      const q = query.trim().toLowerCase()
      if (!q) return true
      return (
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.company.toLowerCase().includes(q) ||
        r.details.toLowerCase().includes(q)
      )
    },
    [query, type]
  )

  const matching = useMemo(() => inRange.filter(searchAndType), [inRange, searchAndType])

  const counts = useMemo(
    () =>
      countByStage(
        "events",
        matching.map((r) => String(r.entry.id)),
        stages
      ),
    [matching, stages]
  )

  const filtered = useMemo(
    () =>
      stage === null
        ? matching
        : matching.filter(
            (r) => (stages[String(r.entry.id)] ?? "new") === stage
          ),
    [matching, stages, stage]
  )

  const fromForm = inRange.filter((r) => r.source === "form")
  const upcoming = requests.filter((r) => isWithinDays(r.eventDate, 30)).length
  const guestCounts = fromForm.map((r) => r.guests).filter((g): g is number => typeof g === "number" && g > 0)
  const avgGuests = guestCounts.length ? Math.round(guestCounts.reduce((s, g) => s + g, 0) / guestCounts.length) : null

  const onStageChange = (id: string, next: Stage) =>
    setStages((prev) => ({ ...prev, [id]: next }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <RangePicker />
        <Segmented
          label="View"
          value={view}
          options={[
            { value: "list", label: "List" },
            { value: "board", label: "Board" },
            { value: "calendar", label: "Calendar" },
          ]}
          onChange={setView}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Event leads"
          value={inRange.length}
          previous={previous?.length ?? null}
          range={key}
          caption={`${fromForm.length} event form · ${inRange.length - fromForm.length} contact form`}
        />
        <Kpi label="Not contacted yet" value={countByStage("events", inRange.map((r) => String(r.entry.id)), stages).new ?? 0} range={key} caption="Still in New" />
        <Kpi label="Events in next 30 days" value={upcoming} range={key} caption="By event date, event form only" />
        <Kpi label="Average guests" value={avgGuests ?? "—"} range={key} caption={guestCounts.length ? `From ${guestCounts.length} event form requests` : "No guest counts yet"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Pipeline" description="Leads in this range by stage">
          <StageStrip kind="events" ids={inRange.map((r) => String(r.entry.id))} stages={stages} />
        </ChartCard>
        <ChartCard title="Event types" description="Event form only; contact form messages have no type">
          <BarList items={tally(fromForm.map((r) => r.eventType || "Not given"))} total={fromForm.length} empty="No event form requests in this range." limit={5} />
        </ChartCard>
        <ChartCard title="Packages" description="Event form only">
          <BarList items={tally(fromForm.map((r) => r.packageName || "Not chosen"))} total={fromForm.length} empty="No event form requests in this range." limit={5} />
        </ChartCard>
      </div>

      <div className="space-y-4">
        {view === "list" && (
          <StageSummary
            kind="events"
            counts={counts}
            active={stage}
            onSelect={(next) => {
              setStage(next)
              setLimit(PAGE)
            }}
          />
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setLimit(PAGE)
              }}
              placeholder="Search by name, email, company or message…"
              aria-label="Search event leads"
              className="pl-8"
            />
          </div>
          <Select
            value={type}
            onValueChange={(v) => {
              setType(v ?? "all")
              setLimit(PAGE)
            }}
          >
            <SelectTrigger className="w-full sm:w-56" aria-label="Event type">
              <SelectValue placeholder="All event types">
                {(value: string | null) =>
                  !value || value === "all"
                    ? "All event types"
                    : value === CONTACT_TYPE
                      ? "Contact form messages"
                      : value
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All event types</SelectItem>
              <SelectItem value={CONTACT_TYPE}>Contact form messages</SelectItem>
              {types.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {view === "calendar" ? (
          <EventCalendar
            requests={requests.filter((r) => r.source === "form" && searchAndType(r))}
            stages={stages}
            note="Contact form messages have no event date, so they are not on the calendar."
          />
        ) : view === "board" ? (
          <PipelineBoard
            kind="events"
            items={matching.map((r) => ({
              id: String(r.entry.id),
              title: r.name || r.email,
              subtitle:
                r.source === "contact"
                  ? r.details
                  : [r.eventType, r.company].filter(Boolean).join(" · "),
              tags:
                r.source === "contact"
                  ? ["Contact form"]
                  : [formatEventDate(r.eventDate), r.guests ? `${r.guests} guests` : ""].filter(Boolean),
              meta: `Received ${formatReceived(r.entry.date_created)}`,
              href: `/events/${r.entry.id}`,
            }))}
            stages={stages}
            onStageChange={onStageChange}
          />
        ) : (
          <>
            <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Type</TableHead>
                    <TableHead>Event date</TableHead>
                    <TableHead className="hidden text-right md:table-cell">
                      Guests
                    </TableHead>
                    <TableHead className="hidden md:table-cell">Received</TableHead>
                    <TableHead>Stage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-24 text-center text-muted-foreground"
                      >
                        {requests.length === 0
                          ? "No event leads yet. They will show up here as soon as someone submits the event form or asks about an event through the contact form."
                          : "No event leads match these filters."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.slice(0, limit).map((r) => {
                      const id = String(r.entry.id)
                      return (
                        <TableRow
                          key={id}
                          className="cursor-pointer transition-colors hover:bg-muted/40"
                          onClick={() => router.push(`/events/${id}`)}
                        >
                          <TableCell className="max-w-xs">
                            <div className="font-medium">{r.name || r.email || "—"}</div>
                            {r.source === "contact" ? (
                              <div className="line-clamp-2 text-xs whitespace-normal text-muted-foreground">
                                {r.details}
                              </div>
                            ) : (
                              r.company && (
                                <div className="text-xs text-muted-foreground">
                                  {r.company}
                                </div>
                              )
                            )}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {r.source === "contact" ? (
                              <Badge variant="outline">Contact form</Badge>
                            ) : r.eventType ? (
                              <Badge variant="secondary">{r.eventType}</Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>{r.source === "contact" ? <span className="text-muted-foreground">In message</span> : formatEventDate(r.eventDate)}</TableCell>
                          <TableCell className="hidden text-right tabular-nums md:table-cell">
                            {r.guests ?? "—"}
                          </TableCell>
                          <TableCell className="hidden text-muted-foreground md:table-cell">
                            {formatReceived(r.entry.date_created)}
                          </TableCell>
                          <TableCell>
                            <div
                              onClick={(e) => e.stopPropagation()}
                              onPointerDown={(e) => e.stopPropagation()}
                            >
                              <StagePicker
                                kind="events"
                                entryId={id}
                                value={stages[id] ?? "new"}
                                onStageChange={(next) => onStageChange(id, next)}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            <ShowMore
              shown={Math.min(limit, filtered.length)}
              total={filtered.length}
              onMore={() => setLimit(limit + PAGE)}
            />
          </>
        )}
      </div>
    </div>
  )
}
