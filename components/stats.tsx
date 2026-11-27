"use client"

import Link from "next/link"
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"
import { DOT_CLASSES, StageDot } from "@/components/stage-dot"
import { RANGE_LABELS, percentChange, type RangeKey } from "@/lib/range"
import {
  PIPELINES,
  STAGE_LABELS,
  WON_STAGES,
  countByStage,
  type PipelineKind,
  type Stage,
} from "@/lib/stages"
import { cn } from "cn"

/** A headline number with its change against the period before. */
export function Kpi({
  label,
  value,
  previous,
  range,
  href,
  caption,
}: {
  label: string
  value: number | string
  previous?: number | null
  range: RangeKey
  href?: string
  caption?: string
}) {
  const change = typeof value === "number" && previous !== undefined ? percentChange(value, previous) : null
  const body = (
    <>
      <p className="truncate text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
      <p className="mt-1 flex min-h-4 items-center gap-1 text-xs text-muted-foreground">
        {change !== null ? (
          <>
            {change > 0 ? (
              <ArrowUpRight className="size-3.5" aria-hidden />
            ) : change < 0 ? (
              <ArrowDownRight className="size-3.5" aria-hidden />
            ) : (
              <Minus className="size-3.5" aria-hidden />
            )}
            <span className="font-medium text-foreground tabular-nums">
              {change > 0 ? "+" : ""}
              {change}%
            </span>
            <span>vs previous {range === "year" ? "period" : RANGE_LABELS[range].toLowerCase()}</span>
          </>
        ) : previous !== undefined && previous !== null && range !== "all" ? (
          <span>{previous} in the previous period</span>
        ) : (
          caption && <span>{caption}</span>
        )}
      </p>
    </>
  )
  return href ? (
    <Link
      href={href}
      className="block rounded-xl border bg-card p-5 shadow-sm transition-colors hover:border-navy/40 hover:bg-muted/30"
    >
      {body}
    </Link>
  ) : (
    <div className="rounded-xl border bg-card p-5 shadow-sm">{body}</div>
  )
}

/** One pipeline's stages as a segmented bar, with every count written out. */
export function StageStrip({
  kind,
  ids,
  stages,
  href,
}: {
  kind: PipelineKind
  ids: string[]
  stages: Record<string, Stage>
  href?: (stage: Stage) => string
}) {
  const counts = countByStage(kind, ids, stages)
  const total = ids.length
  const won = WON_STAGES[kind].reduce((s, st) => s + (counts[st] ?? 0), 0)
  const order = PIPELINES[kind].stages
  return (
    <div className="space-y-2.5">
      <div className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-muted" aria-hidden>
        {total > 0 &&
          order.map((s) =>
            counts[s] ? (
              <div key={s} className={cn("h-full", DOT_CLASSES[s])} style={{ width: `${(counts[s] / total) * 100}%` }} />
            ) : null
          )}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {order.map((s) => {
          const inner = (
            <>
              <StageDot stage={s} />
              <span className="text-muted-foreground">{STAGE_LABELS[s]}</span>
              <span className="font-medium tabular-nums">{counts[s] ?? 0}</span>
            </>
          )
          return (
            <li key={s}>
              {href ? (
                <Link href={href(s)} className="flex items-center gap-1.5 hover:underline">{inner}</Link>
              ) : (
                <span className="flex items-center gap-1.5">{inner}</span>
              )}
            </li>
          )
        })}
      </ul>
      <p className="text-xs text-muted-foreground">
        {total === 0
          ? "Nothing received in this range."
          : `${total} received · ${Math.round((won / total) * 100)}% ${
              kind === "hiring" ? "hired" : kind === "events" ? "confirmed or completed" : "won"
            }`}
      </p>
    </div>
  )
}
