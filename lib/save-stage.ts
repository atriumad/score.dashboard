import type { PipelineKind, Stage } from "./stages"

/** Saves one entry's stage. Resolves with an error message, or null when saved. */
export async function saveStage(
  kind: PipelineKind,
  entryId: string,
  stage: Stage
): Promise<string | null> {
  try {
    const res = await fetch("/api/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, entryId, status: stage }),
    })
    if (res.ok) return null
    const data = await res.json().catch(() => null)
    return data?.error ?? "Could not update stage"
  } catch {
    return "Connection error"
  }
}
