"use client"

import { useMemo, useState } from "react"
import { Search, Users } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { CareerApplication } from "@/lib/types"
import { countByStage, type Stage } from "@/lib/stages"
import { parseGfDate } from "@/lib/dates"
import { formatReceived } from "@/lib/format"
import { bucketSeries, splitByRange } from "@/lib/range"
import { ApplicationTable } from "@/components/application-table"
import { StageSummary } from "@/components/stage-summary"
import { PAGE, ShowMore } from "@/components/show-more"
import { BarList, ChartCard, SERIES_COLORS, TimeBars } from "@/components/charts"
import { PipelineBoard } from "@/components/pipeline-board"
import { RangePicker, Segmented, useRange, useView } from "@/components/range-picker"
import { Kpi } from "@/components/stats"

const VIEWS = ["table", "board"] as const
const receivedOf = (app: CareerApplication) => parseGfDate(app.entry.date_created)

export function ApplicationFilters({
  applications,
  statuses,
}: {
  applications: CareerApplication[]
  statuses: Record<string, Stage>
}) {
  const { key, bounds } = useRange()
  const [view, setView] = useView(VIEWS)
  const [query, setQuery] = useState("")
  const [area, setArea] = useState<string>("all")
  const [stage, setStage] = useState<Stage | null>(null)
  // Live copy of the stage map so counts follow changes made in the table or board.
  const [stages, setStages] = useState(statuses)
  const [limit, setLimit] = useState(PAGE)

  const areas = useMemo(() => {
    const set = new Set<string>()
    for (const app of applications) {
      for (const a of app.areas) set.add(a)
    }
    return Array.from(set).sort()
  }, [applications])

  const { current: inRange, previous } = useMemo(
    () => splitByRange(applications, receivedOf, bounds),
    [applications, bounds]
  )

  // Range, search and area narrow the pipeline; the stage filter only picks which
  // slice of it the table shows, so the counts stay comparable across stages.
  const matching = useMemo(() => {
    const q = query.trim().toLowerCase()
    return inRange.filter((app) => {
      if (area !== "all" && !app.areas.includes(area)) return false
      if (!q) return true
      return (
        app.name.toLowerCase().includes(q) ||
        app.email.toLowerCase().includes(q)
      )
    })
  }, [inRange, query, area])

  const counts = useMemo(
    () =>
      countByStage(
        "hiring",
        matching.map((app) => String(app.entry.id)),
        stages
      ),
    [matching, stages]
  )

  const filtered = useMemo(
    () =>
      stage === null
        ? matching
        : matching.filter(
            (app) => (stages[String(app.entry.id)] ?? "new") === stage
          ),
    [matching, stages, stage]
  )

  const timeline = useMemo(
    () => bucketSeries({ hiring: inRange.map(receivedOf) }, bounds.start, bounds.end),
    [inRange, bounds]
  )
  const areaCounts = useMemo(() => {
    const m = new Map<string, number>()
    for (const app of inRange) for (const a of app.areas) m.set(a, (m.get(a) ?? 0) + 1)
    return Array.from(m, ([label, value]) => ({ label, value }))
  }, [inRange])

  const inRangeCounts = countByStage("hiring", inRange.map((a) => String(a.entry.id)), stages)
  const withResume = inRange.filter((a) => Boolean(a.cvUrl)).length

  const onStageChange = (entryId: string, next: Stage) =>
    setStages((prev) => ({ ...prev, [entryId]: next }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <RangePicker />
        <Segmented
          label="View"
          value={view}
          options={[
            { value: "table", label: "Table" },
            { value: "board", label: "Board" },
          ]}
          onChange={setView}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Applications" value={inRange.length} previous={previous?.length ?? null} range={key} />
        <Kpi label="Not reviewed yet" value={inRangeCounts.new ?? 0} range={key} caption="Still in New" />
        <Kpi label="Interview or offer" value={(inRangeCounts.interview ?? 0) + (inRangeCounts.offer ?? 0)} range={key} caption="In progress now" />
        <Kpi
          label="With resume"
          value={withResume}
          range={key}
          caption={inRange.length ? `${Math.round((withResume / inRange.length) * 100)}% of applications` : undefined}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <ChartCard title="Applications over time" className="lg:col-span-3">
          <TimeBars
            series={[{ key: "hiring", label: "Applications", color: SERIES_COLORS[0] }]}
            buckets={timeline.buckets}
            grain={timeline.grain}
            height={180}
          />
        </ChartCard>
        <ChartCard title="Areas of interest" description="Applicants can pick more than one" className="lg:col-span-2">
          <BarList items={areaCounts} total={inRange.length} empty="No applications in this range." limit={6} />
        </ChartCard>
      </div>

      <div className="space-y-4">
        {view === "table" && (
          <StageSummary
            kind="hiring"
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
              placeholder="Search by name or email…"
              aria-label="Search applications"
              className="pl-8"
            />
          </div>
          <Select
            value={area}
            onValueChange={(v) => {
              setArea(v ?? "all")
              setLimit(PAGE)
            }}
          >
            <SelectTrigger className="w-full sm:w-56" aria-label="Area of interest">
              <SelectValue placeholder="All areas">
                {(value: string | null) =>
                  !value || value === "all" ? "All areas" : value
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All areas</SelectItem>
              {areas.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Users className="size-3.5" />
          <span>
            {view === "board" ? matching.length : filtered.length}{" "}
            {(view === "board" ? matching.length : filtered.length) === 1 ? "application" : "applications"}
            {view === "board" ? " · drag a card to change its stage" : ""}
          </span>
        </div>

        {view === "board" ? (
          <PipelineBoard
            kind="hiring"
            items={matching.map((app) => ({
              id: String(app.entry.id),
              title: app.name,
              subtitle: app.email,
              tags: app.areas,
              meta: formatReceived(app.entry.date_created),
              href: `/applications/${app.entry.id}`,
            }))}
            stages={stages}
            onStageChange={onStageChange}
          />
        ) : (
          <>
            <ApplicationTable
              applications={filtered.slice(0, limit)}
              stages={stages}
              onStageChange={onStageChange}
            />
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
