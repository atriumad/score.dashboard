import { Card } from "@/components/ui/card"
import type { CareerApplication } from "@/lib/types"
import { parseGfDate } from "@/lib/dates"
import {
  Users,
  CalendarClock,
  FileText,
  Trophy,
  type LucideIcon,
} from "lucide-react"
import { cn } from "cn"

function topArea(applications: CareerApplication[]): string | null {
  const counts = new Map<string, number>()
  for (const app of applications) {
    for (const area of app.areas) {
      counts.set(area, (counts.get(area) ?? 0) + 1)
    }
  }
  let best: string | null = null
  let bestCount = 0
  for (const [area, count] of counts) {
    if (count > bestCount) {
      best = area
      bestCount = count
    }
  }
  return best
}

function newThisWeek(applications: CareerApplication[]): number {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  return applications.filter((app) => {
    try {
      return parseGfDate(app.entry.date_created).getTime() >= weekAgo
    } catch {
      return false
    }
  }).length
}

export function StatsCards({
  applications,
}: {
  applications: CareerApplication[]
}) {
  const total = applications.length
  const recent = newThisWeek(applications)
  const withResume = applications.filter((a) => Boolean(a.cvUrl)).length
  const area = topArea(applications)

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={Users}
        tint="bg-brand-blue/10 text-brand-blue"
        label="Total Applications"
        value={total}
      />
      <StatCard
        icon={CalendarClock}
        tint="bg-brand-blue-dark/10 text-brand-blue-dark"
        label="New This Week"
        value={recent}
      />
      <StatCard
        icon={FileText}
        tint="bg-navy/10 text-navy"
        label="With Resume"
        value={withResume}
      />
      <StatCard
        icon={Trophy}
        tint="bg-navy text-gold"
        label="Top Area"
        value={area ?? "—"}
        caption="Most requested"
      />
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  caption,
  tint,
}: {
  icon: LucideIcon
  label: string
  value: number | string
  caption?: string
  tint: string
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {label}
          </p>
          <p className="mt-2 truncate text-2xl font-semibold tracking-tight tabular-nums">
            {value}
          </p>
          {caption ? (
            <p className="mt-1 text-xs text-muted-foreground">{caption}</p>
          ) : null}
        </div>
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg",
            tint
          )}
        >
          <Icon className="size-4.5" />
        </div>
      </div>
    </Card>
  )
}