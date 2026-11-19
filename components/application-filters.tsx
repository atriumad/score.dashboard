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
import type { ApplicationStatus, CareerApplication } from "@/lib/types"
import { ApplicationTable } from "@/components/application-table"

export function ApplicationFilters({
  applications,
  statuses,
}: {
  applications: CareerApplication[]
  statuses: Record<string, ApplicationStatus>
}) {
  const [query, setQuery] = useState("")
  const [area, setArea] = useState<string>("all")

  const areas = useMemo(() => {
    const set = new Set<string>()
    for (const app of applications) {
      for (const a of app.areas) set.add(a)
    }
    return Array.from(set).sort()
  }, [applications])

  const filtered = useMemo(() => {
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email…"
            className="pl-8"
          />
        </div>
        <Select
          value={area}
          onValueChange={(v) => setArea(v ?? "all")}
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
          {area !== "all" || query ? " shown" : ""}
        </span>
      </div>

      <ApplicationTable applications={filtered} statuses={statuses} />
    </div>
  )
}