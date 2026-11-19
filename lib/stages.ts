// Hiring pipeline stages. Pure module: imported by both server and client code.

export const HIRING_STAGES = [
  "new",
  "reviewing",
  "interview",
  "offer",
  "hired",
  "rejected",
] as const

export type HiringStage = (typeof HIRING_STAGES)[number]

export const HIRING_STAGE_LABELS: Record<HiringStage, string> = {
  new: "New",
  reviewing: "Reviewing",
  interview: "Interview",
  offer: "Offer",
  hired: "Hired",
  rejected: "Rejected",
}

// Values written by the previous four-status version of the dashboard.
// They stay in Redis untouched and are translated on read.
const LEGACY_STAGES: Record<string, HiringStage> = {
  received: "new",
  approved: "hired",
}

export function isHiringStage(value: unknown): value is HiringStage {
  return (
    typeof value === "string" &&
    (HIRING_STAGES as readonly string[]).includes(value)
  )
}

export function normalizeHiringStage(
  raw: string | null | undefined
): HiringStage {
  if (isHiringStage(raw)) return raw
  if (raw && Object.hasOwn(LEGACY_STAGES, raw)) return LEGACY_STAGES[raw]
  return "new"
}

export function countByStage(
  entryIds: string[],
  stages: Record<string, HiringStage>
): Record<HiringStage, number> {
  const counts = Object.fromEntries(
    HIRING_STAGES.map((stage) => [stage, 0])
  ) as Record<HiringStage, number>
  for (const id of entryIds) {
    counts[stages[id] ?? "new"] += 1
  }
  return counts
}
