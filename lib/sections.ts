import { getEntries } from "./gravity-forms"
import { formIdFor, type SectionKey } from "./forms"
import type { GFEntry } from "./types"

export interface SectionData {
  entries: GFEntry[]
  error: string | null
  // False when the section has no form yet (e.g. events before the form
  // exists in WordPress). The page says so instead of showing an error.
  configured: boolean
}

export async function loadSection(section: SectionKey): Promise<SectionData> {
  const formId = formIdFor(section)
  if (!formId) {
    return { entries: [], error: null, configured: false }
  }
  try {
    return { entries: await getEntries(formId), error: null, configured: true }
  } catch (err) {
    return {
      entries: [],
      error: err instanceof Error ? err.message : "Failed to load entries",
      configured: true,
    }
  }
}
