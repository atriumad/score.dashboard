"use client"

import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"
import { StageDot } from "@/components/stage-dot"
import { saveStage } from "@/lib/save-stage"
import {
  PIPELINES,
  STAGE_LABELS,
  isStage,
  type PipelineKind,
  type Stage,
} from "@/lib/stages"
import { cn } from "cn"

export interface BoardItem {
  id: string
  title: string
  subtitle?: string
  meta?: string
  tags?: string[]
  // Detail page, when there is one.
  href?: string
}

const COLUMN_PAGE = 20

/**
 * Cards in one column per stage. Drag a card to another column to change its
 * stage (saved right away, put back if the save fails), or use its menu.
 */
export function PipelineBoard({
  kind,
  items,
  stages,
  onStageChange,
}: {
  kind: PipelineKind
  items: BoardItem[]
  stages: Record<string, Stage>
  onStageChange: (id: string, stage: Stage) => void
}) {
  const [dragging, setDragging] = useState<string | null>(null)
  const [over, setOver] = useState<Stage | null>(null)
  const [limits, setLimits] = useState<Record<string, number>>({})

  const stageOf = (id: string): Stage => {
    const s = stages[id]
    return s && isStage(kind, s) ? s : "new"
  }

  async function move(id: string, next: Stage) {
    const previous = stageOf(id)
    if (previous === next) return
    onStageChange(id, next)
    const error = await saveStage(kind, id, next)
    if (error) {
      toast.error(error)
      onStageChange(id, previous)
    }
  }

  const columns = PIPELINES[kind].stages

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(15rem, 1fr))` }}
      >
        {columns.map((stage) => {
          const cards = items.filter((i) => stageOf(i.id) === stage)
          const limit = limits[stage] ?? COLUMN_PAGE
          return (
            <section
              key={stage}
              aria-label={`${STAGE_LABELS[stage]}: ${cards.length}`}
              onDragOver={(e) => {
                if (!dragging) return
                e.preventDefault()
                e.dataTransfer.dropEffect = "move"
                if (over !== stage) setOver(stage)
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver(null)
              }}
              onDrop={(e) => {
                e.preventDefault()
                const id = e.dataTransfer.getData("text/plain") || dragging
                setOver(null)
                setDragging(null)
                if (id) void move(id, stage)
              }}
              className={cn(
                "flex min-h-40 flex-col rounded-xl border bg-muted/40 p-2 transition-colors",
                over === stage && "border-navy bg-navy/5 ring-1 ring-navy"
              )}
            >
              <header className="flex items-center justify-between gap-2 px-1.5 pt-1 pb-2">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <StageDot stage={stage} />
                  {STAGE_LABELS[stage]}
                </span>
                <span className="rounded-full bg-card px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
                  {cards.length}
                </span>
              </header>
              <ul className="flex flex-1 flex-col gap-2">
                {cards.slice(0, limit).map((card) => (
                  <li
                    key={card.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", card.id)
                      e.dataTransfer.effectAllowed = "move"
                      setDragging(card.id)
                    }}
                    onDragEnd={() => {
                      setDragging(null)
                      setOver(null)
                    }}
                    className={cn(
                      "cursor-grab rounded-lg border bg-card p-3 text-sm shadow-xs transition-opacity active:cursor-grabbing",
                      dragging === card.id && "opacity-40"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      {card.href ? (
                        <Link href={card.href} className="min-w-0 font-medium hover:underline" draggable={false}>
                          <span className="line-clamp-2">{card.title || "—"}</span>
                        </Link>
                      ) : (
                        <span className="line-clamp-2 min-w-0 font-medium">{card.title || "—"}</span>
                      )}
                    </div>
                    {card.subtitle && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{card.subtitle}</p>
                    )}
                    {card.tags && card.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {card.tags.slice(0, 3).map((t) => (
                          <span key={t} className="rounded bg-muted px-1.5 py-0.5 text-[11px]">{t}</span>
                        ))}
                        {card.tags.length > 3 && (
                          <span className="px-1 py-0.5 text-[11px] text-muted-foreground">+{card.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">{card.meta}</span>
                      <select
                        aria-label={`Move ${card.title || "card"} to`}
                        value={stage}
                        onChange={(e) => {
                          const next = e.target.value
                          if (isStage(kind, next)) void move(card.id, next)
                        }}
                        className="max-w-28 rounded border bg-background px-1 py-0.5 text-[11px] text-muted-foreground"
                      >
                        {columns.map((s) => (
                          <option key={s} value={s}>{STAGE_LABELS[s]}</option>
                        ))}
                      </select>
                    </div>
                  </li>
                ))}
                {cards.length === 0 && (
                  <li className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                    Drop here
                  </li>
                )}
              </ul>
              {cards.length > limit && (
                <button
                  type="button"
                  onClick={() => setLimits((l) => ({ ...l, [stage]: limit + COLUMN_PAGE }))}
                  className="mt-2 rounded-md py-1.5 text-xs font-medium text-muted-foreground hover:bg-card hover:text-foreground"
                >
                  Show {Math.min(COLUMN_PAGE, cards.length - limit)} more of {cards.length - limit}
                </button>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}
