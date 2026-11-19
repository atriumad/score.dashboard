"use client"

import { useMemo, useState } from "react"
import { Search, Users } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { CareerApplication } from "@/lib/types"
import { countByStage, type HiringStage } from "@/lib/stages"
import { ApplicationTable } from "@/components/application-table"
import { StageSummary } from "@/components/stage-summary"

// Rows rendered at a time. Every row carries a stage picker, so drawing
// several hundred at once makes the page slow to load and to scroll.
const PAGE = 50

export function ApplicationFilters({
  applications,
  statuses,
}: {
  applications: CareerApplication[]
  statuses: Record<string, HiringStage>
}) {
  const [query, setQuery] = useState("")
  const [area, setArea] = useState<string>("all")
  const [stage, setStage] = useState<HiringStage | null>(null)
  // Live copy of the stage map so counts follow changes made in the table.
  const [stages, setStages] = useState(statuses)
  const [limit, setLimit] = useState(PAGE)

  const areas = useMemo(() => {
    const set = new Set<string>()
    for (const app of applications) {
      for (const a of app.areas) set.add(a)
    }
    return Array.from(set).sort()
  }, [applications])

  // Search and area narrow the pipeline; the stage filter only picks which
  // slice of it the table shows, so the counts stay comparable across stages.
  const matching = useMemo(() => {
    const q = query.trim().toLowerCase()
    return applications.filter((app) => {
      if (area !== "all" && !app.areas.includes(area)) return false
      if (!q) return true
      return (
        app.name.toLowerCase().includes(q) ||
        app.email.toLowerCase().includes(q)
      )
    })
  }, [applications, query, area])

  const counts = useMemo(
    () =>
      countByStage(
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

  return (
    <div className="space-y-4">
      <StageSummary counts={counts} active={stage} onSelect={(next) => {
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
            placeholder="Search by name or email…"
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
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="All areas" />
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
          {filtered.length}{" "}
          {filtered.length === 1 ? "application" : "applications"}
          {area !== "all" || query || stage ? " shown" : ""}
        </span>
      </div>

      <ApplicationTable
        applications={filtered.slice(0, limit)}
        stages={stages}
        onStageChange={(entryId, next) =>
          setStages((prev) => ({ ...prev, [entryId]: next }))
        }
      />

      {filtered.length > limit && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-muted-foreground">
            Showing {limit} of {filtered.length}
          </p>
          <Button variant="outline" onClick={() => setLimit(limit + PAGE)}>
            Show more
          </Button>
        </div>
      )}
    </div>
  )
}