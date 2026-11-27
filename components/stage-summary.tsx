"use client"

import { StageDot } from "@/components/stage-dot"
import {
  PIPELINES,
  STAGE_LABELS,
  type PipelineKind,
  type Stage,
} from "@/lib/stages"
import { cn } from "cn"

export function StageSummary({
  kind,
  counts,
  active,
  onSelect,
}: {
  kind: PipelineKind
  counts: Record<string, number>
  active: Stage | null
  onSelect: (stage: Stage | null) => void
}) {
  return (
    <div
      role="group"
      aria-label="Filter by stage"
      className={cn(
        "grid grid-cols-2 gap-2 sm:grid-cols-3",
        PIPELINES[kind].stages.length === 5 ? "lg:grid-cols-5" : "lg:grid-cols-6"
      )}
    >
      {PIPELINES[kind].stages.map((stage) => {
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
                {STAGE_LABELS[stage]}
              </span>
            </span>
            <span className="tabular-nums text-muted-foreground">
              {counts[stage] ?? 0}
            </span>
          </button>
        )
      })}
    </div>
  )
}
