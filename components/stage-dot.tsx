import type { Stage } from "@/lib/stages"
import { cn } from "cn"

const DOT_CLASSES: Record<Stage, string> = {
  new: "bg-gold",
  reviewing: "bg-amber-500",
  interview: "bg-sky-500",
  offer: "bg-violet-500",
  hired: "bg-emerald-500",
  rejected: "bg-red-500",
  contacted: "bg-amber-500",
  quoted: "bg-sky-500",
  confirmed: "bg-emerald-500",
  completed: "bg-slate-400",
  lost: "bg-red-500",
}

export function StageDot({ stage }: { stage: Stage }) {
  return (
    <span
      aria-hidden
      className={cn("size-2 shrink-0 rounded-full", DOT_CLASSES[stage])}
    />
  )
}
