"use client"

import { useMemo, useState } from "react"
import { Copy, Search } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PAGE, ShowMore } from "@/components/show-more"
import { ChartCard, SERIES_COLORS, TimeBars } from "@/components/charts"
import { RangePicker, useRange } from "@/components/range-picker"
import { Kpi } from "@/components/stats"
import { parseGfDate } from "@/lib/dates"
import { formatReceived } from "@/lib/format"
import { bucketSeries, splitByRange } from "@/lib/range"
import type { Subscriber } from "@/lib/types"

const receivedOf = (s: Subscriber) => parseGfDate(s.entry.date_created)

export function NewsletterList({ subscribers }: { subscribers: Subscriber[] }) {
  const { key, bounds } = useRange()
  const [query, setQuery] = useState("")
  const [limit, setLimit] = useState(PAGE)

  const { current: inRange, previous } = useMemo(
    () => splitByRange(subscribers, receivedOf, bounds),
    [subscribers, bounds]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return inRange
    return inRange.filter((s) => s.email.toLowerCase().includes(q))
  }, [inRange, query])

  const timeline = useMemo(
    () => bucketSeries({ newsletter: inRange.map(receivedOf) }, bounds.start, bounds.end),
    [inRange, bounds]
  )
  const unique = new Set(inRange.map((s) => s.email.trim().toLowerCase()).filter(Boolean)).size

  async function copyAll() {
    // The same address can sign up more than once; copy each only once.
    const emails = Array.from(
      new Set(filtered.map((s) => s.email.trim().toLowerCase()).filter(Boolean))
    )
    try {
      await navigator.clipboard.writeText(emails.join(", "))
      toast.success(`Copied ${emails.length} emails`)
    } catch {
      toast.error("Could not copy to the clipboard")
    }
  }

  return (
    <div className="space-y-4">
      <RangePicker />

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-1 lg:grid-cols-1">
          <Kpi label="Sign-ups" value={inRange.length} previous={previous?.length ?? null} range={key} />
          <Kpi label="Unique emails" value={unique} range={key} caption="Repeat sign-ups counted once" />
        </div>
        <ChartCard title="Sign-ups over time" className="lg:col-span-3">
          <TimeBars
            series={[{ key: "newsletter", label: "Sign-ups", color: SERIES_COLORS[3] }]}
            buckets={timeline.buckets}
            grain={timeline.grain}
            height={180}
          />
        </ChartCard>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setLimit(PAGE)
            }}
            placeholder="Search by email…"
            aria-label="Search subscribers"
            className="pl-8"
          />
        </div>
        <Button
          variant="outline"
          onClick={copyAll}
          disabled={filtered.length === 0}
        >
          <Copy className="size-3.5" />
          Copy emails
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Subscribed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={2}
                  className="h-24 text-center text-muted-foreground"
                >
                  {subscribers.length === 0
                    ? "No subscribers yet."
                    : "No subscribers match this range or search."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.slice(0, limit).map((s) => (
                <TableRow key={s.entry.id}>
                  <TableCell className="break-all">{s.email || "—"}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatReceived(s.entry.date_created)}
                  </TableCell>
                </TableRow>
              ))
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
  )
}
