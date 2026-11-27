"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { CalendarClock, CalendarDays, Inbox, Search } from "lucide-react"
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
import { StatCard } from "@/components/stats-cards"
import { StagePicker } from "@/components/stage-picker"
import { StageSummary } from "@/components/stage-summary"
import { PAGE, ShowMore } from "@/components/show-more"
import { isWithinDays, isWithinLastDays } from "@/lib/dates"
import { formatEventDate, formatReceived } from "@/lib/format"
import { countByStage, type Stage } from "@/lib/stages"
import type { EventRequest } from "@/lib/types"

export function EventBoard({
  requests,
  statuses,
}: {
  requests: EventRequest[]
  statuses: Record<string, Stage>
}) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [type, setType] = useState("all")
  const [stage, setStage] = useState<Stage | null>(null)
  // Live copy of the stage map so counts follow changes made in the table.
  const [stages, setStages] = useState(statuses)
  const [limit, setLimit] = useState(PAGE)

  const types = useMemo(
    () =>
      Array.from(
        new Set(requests.map((r) => r.eventType).filter(Boolean))
      ).sort(),
    [requests]
  )

  const matching = useMemo(() => {
    const q = query.trim().toLowerCase()
    return requests.filter((r) => {
      if (type !== "all" && r.eventType !== type) return false
      if (!q) return true
      return (
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.company.toLowerCase().includes(q)
      )
    })
  }, [requests, query, type])

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

  const newThisWeek = requests.filter((r) =>
    isWithinLastDays(r.entry.date_created, 7)
  ).length
  const upcoming = requests.filter((r) => isWithinDays(r.eventDate, 30)).length

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={Inbox}
          tint="bg-brand-blue/10 text-brand-blue"
          label="Total Requests"
          value={requests.length}
        />
        <StatCard
          icon={CalendarClock}
          tint="bg-brand-blue-dark/10 text-brand-blue-dark"
          label="New This Week"
          value={newThisWeek}
        />
        <StatCard
          icon={CalendarDays}
          tint="bg-navy text-gold"
          label="Events in Next 30 Days"
          value={upcoming}
        />
      </div>

      <div className="space-y-4">
        <StageSummary
          kind="events"
          counts={counts}
          active={stage}
          onSelect={(next) => {
            setStage(next)
            setLimit(PAGE)
          }}
        />

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setLimit(PAGE)
              }}
              placeholder="Search by name, email or company…"
              aria-label="Search requests"
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
                  !value || value === "all" ? "All event types" : value
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All event types</SelectItem>
              {types.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
                      ? "No event requests yet. They will show up here as soon as someone submits the form."
                      : "No requests match these filters."}
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
                      <TableCell>
                        <div className="font-medium">{r.name || "—"}</div>
                        {r.company && (
                          <div className="text-xs text-muted-foreground">
                            {r.company}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {r.eventType ? (
                          <Badge variant="secondary">{r.eventType}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>{formatEventDate(r.eventDate)}</TableCell>
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
                            onStageChange={(next) =>
                              setStages((prev) => ({ ...prev, [id]: next }))
                            }
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
      </div>
    </div>
  )
}
