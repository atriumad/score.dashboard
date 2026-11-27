"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StageDot } from "@/components/stage-dot"
import { parseEventDate } from "@/lib/dates"
import { STAGE_LABELS, type Stage } from "@/lib/stages"
import type { EventRequest } from "@/lib/types"
import { cn } from "cn"

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

/** Requests placed on their event date, one month at a time. */
export function EventCalendar({
  requests,
  stages,
  note,
}: {
  requests: EventRequest[]
  stages: Record<string, Stage>
  note?: string
}) {
  const today = new Date()
  // Open on the month of the next upcoming event, else this month.
  const [month, setMonth] = useState(() => {
    const next = requests
      .map((r) => parseEventDate(r.eventDate))
      .filter((d): d is Date => d !== null && d >= new Date(today.getFullYear(), today.getMonth(), today.getDate()))
      .sort((a, b) => a.getTime() - b.getTime())[0]
    const base = next ?? today
    return new Date(base.getFullYear(), base.getMonth(), 1)
  })

  const byDay = useMemo(() => {
    const map = new Map<string, EventRequest[]>()
    for (const r of requests) {
      const d = parseEventDate(r.eventDate)
      if (!d) continue
      const k = dayKey(d)
      map.set(k, [...(map.get(k) ?? []), r])
    }
    return map
  }, [requests])

  const undated = requests.filter((r) => !parseEventDate(r.eventDate)).length

  // Grid starts on the Monday on or before the 1st.
  const first = new Date(month)
  const lead = (first.getDay() + 6) % 7
  const start = new Date(first.getFullYear(), first.getMonth(), 1 - lead)
  const days = Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i))
  const weeks = days[35].getMonth() === month.getMonth() ? 6 : 5
  const inMonth = requests.filter((r) => {
    const d = parseEventDate(r.eventDate)
    return d && d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear()
  }).length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">
            {month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </h2>
          <p className="text-xs text-muted-foreground">
            {inMonth} {inMonth === 1 ? "event" : "events"} this month
            {undated > 0 && ` · ${undated} without a valid date`}
          </p>
          {note && <p className="text-xs text-muted-foreground">{note}</p>}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setMonth(new Date(today.getFullYear(), today.getMonth(), 1))}>
            Today
          </Button>
          <Button variant="outline" size="sm" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <div className="grid min-w-[42rem] grid-cols-7">
          {WEEKDAYS.map((d) => (
            <div key={d} className="border-b bg-muted/50 px-2 py-1.5 text-xs font-medium text-muted-foreground">
              {d}
            </div>
          ))}
          {days.slice(0, weeks * 7).map((d, i) => {
            const items = byDay.get(dayKey(d)) ?? []
            const outside = d.getMonth() !== month.getMonth()
            const isToday = dayKey(d) === dayKey(today)
            return (
              <div
                key={i}
                className={cn(
                  "min-h-24 border-b border-r p-1.5 text-xs [&:nth-child(7n)]:border-r-0",
                  outside && "bg-muted/30 text-muted-foreground"
                )}
              >
                <div className="mb-1 flex justify-end">
                  <span
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full tabular-nums",
                      isToday && "bg-navy font-semibold text-white"
                    )}
                  >
                    {d.getDate()}
                  </span>
                </div>
                <ul className="space-y-1">
                  {items.slice(0, 3).map((r) => {
                    const stage = stages[String(r.entry.id)] ?? "new"
                    return (
                      <li key={r.entry.id}>
                        <Link
                          href={`/events/${r.entry.id}`}
                          title={`${r.name} · ${r.eventType || "Event"}${r.eventTime ? ` · ${r.eventTime}` : ""}${r.guests ? ` · ${r.guests} guests` : ""} · ${STAGE_LABELS[stage]}`}
                          className="flex items-center gap-1.5 rounded bg-muted px-1.5 py-1 hover:bg-navy/10"
                        >
                          <StageDot stage={stage} />
                          <span className="truncate">{r.name || "—"}</span>
                        </Link>
                      </li>
                    )
                  })}
                  {items.length > 3 && (
                    <li className="px-1.5 text-muted-foreground">+{items.length - 3} more</li>
                  )}
                </ul>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
