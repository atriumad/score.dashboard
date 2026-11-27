"use client"

import { useRouter } from "next/navigation"
import { ArrowUpRight } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StagePicker } from "@/components/stage-picker"
import type { CareerApplication } from "@/lib/types"
import type { Stage } from "@/lib/stages"
import { parseGfDate } from "@/lib/dates"

function formatDate(iso: string): string {
  const d = parseGfDate(iso)
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function ApplicationTable({
  applications,
  stages,
  onStageChange,
}: {
  applications: CareerApplication[]
  stages: Record<string, Stage>
  onStageChange: (entryId: string, stage: Stage) => void
}) {
  const router = useRouter()

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Date</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="hidden sm:table-cell">Email</TableHead>
            <TableHead className="hidden md:table-cell">
              Area of Interest
            </TableHead>
            <TableHead>Stage</TableHead>
            <TableHead className="w-12 text-right">View</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="h-24 text-center text-muted-foreground"
              >
                No applications to show.
              </TableCell>
            </TableRow>
          ) : (
            applications.map((app) => (
              <TableRow
                key={app.entry.id}
                className="group cursor-pointer transition-colors hover:bg-muted/40"
                onClick={() => router.push(`/applications/${app.entry.id}`)}
              >
                <TableCell>
                  <time dateTime={app.entry.date_created}>
                    {formatDate(app.entry.date_created)}
                  </time>
                </TableCell>
                <TableCell className="font-medium">{app.name}</TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">
                  {app.email}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {app.areas.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {app.areas.slice(0, 2).map((area) => (
                        <Badge key={area} variant="secondary">
                          {area}
                        </Badge>
                      ))}
                      {app.areas.length > 2 && (
                        <Badge variant="outline">
                          +{app.areas.length - 2}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <div
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <StagePicker
                      kind="hiring"
                      entryId={String(app.entry.id)}
                      value={stages[String(app.entry.id)] ?? "new"}
                      onStageChange={(next) =>
                        onStageChange(String(app.entry.id), next)
                      }
                    />
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`View application of ${app.name}`}
                    className="text-muted-foreground opacity-60 transition-opacity hover:opacity-100 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/applications/${app.entry.id}`)
                    }}
                  >
                    <ArrowUpRight />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}