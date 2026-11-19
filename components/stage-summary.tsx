"use client"

import { StageDot } from "@/components/stage-dot"
import {
  HIRING_STAGES,
  HIRING_STAGE_LABELS,
  type HiringStage,
} from "@/lib/stages"
import { cn } from "cn"

export function StageSummary({
  counts,
  active,
  onSelect,
}: {
  counts: Record<HiringStage, number>
  active: HiringStage | null
  onSelect: (stage: HiringStage | null) => void
}) {
  return (
    <div
      role="group"
      aria-label="Filter by stage"
      className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6"
    >
      {HIRING_STAGES.map((stage) => {
        const selected = active === stage
        return (
          <button
            key={stage}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(selected ? null : stage)}
            className={cn(
              "flex items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2 text-left text-sm transition-colors outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring",
              selected && "border-navy bg-navy/5 ring-1 ring-navy"
            )}
          >
            <span className="flex min-w-0 items-center gap-2">
              <StageDot stage={stage} />
              <span className="truncate font-medium">
                {HIRING_STAGE_LABELS[stage]}
              </span>
            </span>
            <span className="tabular-nums text-muted-foreground">
              {counts[stage]}
            </span>
          </button>
        )
      })}
    </div>
  )
}
