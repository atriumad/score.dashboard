// Pipeline stages. Pure module: imported by both server and client code.

export const HIRING_STAGES = [
  "new",
  "reviewing",
  "interview",
  "offer",
  "hired",
  "rejected",
] as const

export const EVENT_STAGES = [
  "new",
  "contacted",
  "quoted",
  "confirmed",
  "completed",
  "lost",
] as const

export type HiringStage = (typeof HIRING_STAGES)[number]
export type EventStage = (typeof EVENT_STAGES)[number]
export type Stage = HiringStage | EventStage
// Event inquiries sent through the contact form are worked in "events" too.
export type PipelineKind = "hiring" | "events"

export const PIPELINE_KINDS: readonly PipelineKind[] = ["hiring", "events"]

export const STAGE_LABELS: Record<Stage, string> = {
  new: "New",
  reviewing: "Reviewing",
  interview: "Interview",
  offer: "Offer",
  hired: "Hired",
  rejected: "Rejected",
  contacted: "Contacted",
  quoted: "Quoted",
  confirmed: "Confirmed",
  completed: "Completed",
  lost: "Lost",
}

// Stages that end a pipeline well, used for conversion rates.
export const WON_STAGES: Record<PipelineKind, readonly Stage[]> = {
  hiring: ["hired"],
  events: ["confirmed", "completed"],
}

interface Pipeline {
  stages: readonly Stage[]
  // Values written by an earlier version of the dashboard. They stay in
  // Redis untouched and are translated on read.
  legacy: Record<string, Stage>
}

export const PIPELINES: Record<PipelineKind, Pipeline> = {
  hiring: {
    stages: HIRING_STAGES,
    legacy: { received: "new", approved: "hired" },
  },
  events: { stages: EVENT_STAGES, legacy: {} },
}

export function isPipelineKind(value: unknown): value is PipelineKind {
  return (PIPELINE_KINDS as readonly unknown[]).includes(value)
}

export function isStage(kind: PipelineKind, value: unknown): value is Stage {
  return (
    typeof value === "string" &&
    (PIPELINES[kind].stages as readonly string[]).includes(value)
  )
}

export function normalizeStage(
  kind: PipelineKind,
  raw: string | null | undefined
): Stage {
  if (isStage(kind, raw)) return raw
  const { legacy } = PIPELINES[kind]
  if (raw && Object.hasOwn(legacy, raw)) return legacy[raw]
  return "new"
}

export function countByStage(
  kind: PipelineKind,
  entryIds: string[],
  stages: Record<string, Stage>
): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const stage of PIPELINES[kind].stages) counts[stage] = 0
  for (const id of entryIds) {
    // A stage from another pipeline can't be shown here; count it as new.
    const stage = stages[id]
    counts[stage !== undefined && stage in counts ? stage : "new"] += 1
  }
  return counts
}
