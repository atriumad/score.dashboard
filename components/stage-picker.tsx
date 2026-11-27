"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { StageDot } from "@/components/stage-dot"
import { saveStage } from "@/lib/save-stage"
import {
  PIPELINES,
  STAGE_LABELS,
  isStage,
  type PipelineKind,
  type Stage,
} from "@/lib/stages"

export function StagePicker({
  kind,
  entryId,
  value,
  onStageChange,
}: {
  kind: PipelineKind
  entryId: string
  value: Stage
  onStageChange?: (stage: Stage) => void
}) {
  const [stage, setStage] = useState<Stage>(value)
  const [saving, setSaving] = useState(false)

  async function handleChange(next: string | null) {
    if (!isStage(kind, next) || next === stage) return
    const previous = stage

    // Optimistic: show the new stage now, put it back if the save fails.
    function apply(s: Stage) {
      setStage(s)
      onStageChange?.(s)
    }

    apply(next)
    setSaving(true)
    const error = await saveStage(kind, entryId, next)
    if (error) {
      toast.error(error)
      apply(previous)
    }
    setSaving(false)
  }

  return (
    <Select value={stage} onValueChange={handleChange}>
      <SelectTrigger
        disabled={saving}
        aria-label="Stage"
        className="h-7 w-full min-w-28 gap-1.5 rounded-md border border-border bg-background px-2 text-xs"
      >
        <StageDot stage={stage} />
        <span className="truncate font-medium">
          {STAGE_LABELS[stage]}
        </span>
      </SelectTrigger>
      <SelectContent>
        {PIPELINES[kind].stages.map((s) => (
          <SelectItem key={s} value={s}>
            {STAGE_LABELS[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
