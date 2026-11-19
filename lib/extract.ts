import type { CareerApplication, GFEntry } from "./types"

/**
 * Static label map for the Career Form (form 3). The GF REST API returns
 * entry field values as plain strings keyed by field id (e.g. "2*), and for
 * checkbox fields the stored value already equals the option label
 * (choices have no distinct value), so no `_labels` object is involved.
 */
const FIELD_LABELS: Record<string, string> = {
  "1.2": "Prefijo",
  "1.3": "Nombre",
  "1.4": "Segundo nombre",
  "1.6": "Apellido",
  "1.8": "Sufijo",
  "2": "Email",
  "4": "Teléfono",
  "6.1": "Guest Services",
  "6.2": "Food & Beverage",
  "6.3": "Management",
  "6.4": "Sales & Events",
  "6.5": "Go-Karts",
  "6.6": "Other",
  "7": "Resumen / CV",
}

const AREA_KEYS = ["6.1", "6.2", "6.3", "6.4", "6.5", "6.6"]

function fieldValue(entry: GFEntry, fieldId: string): string {
  const v = entry[fieldId]
  return typeof v === "string" ? v : ""
}

/**
 * Labels of the checked options for the multi-select checkbox
 * "Field(s) of Interest" (field 6). The stored value is the label itself.
 */
function checkedLabels(entry: GFEntry, fieldId: string): string[] {
  const result: string[] = []
  for (const key of AREA_KEYS) {
    if (key.startsWith(`${fieldId}.`) === false) continue
    const v = fieldValue(entry, key)
    if (v.trim() !== "") result.push(v)
  }
  return result
}

function extractName(entry: GFEntry): string {
  const parts = [fieldValue(entry, "1.2"), fieldValue(entry, "1.3"), fieldValue(entry, "1.4"), fieldValue(entry, "1.6"), fieldValue(entry, "1.8")]
  return parts.filter(Boolean).join(" ").trim() || fieldValue(entry, "1.3").trim()
}

function extractCvUrl(entry: GFEntry): string | null {
  const v = fieldValue(entry, "7")
  if (/^https?:\/\/.+/.test(v)) return v
  return null
}

export function buildCareerApplication(entry: GFEntry): CareerApplication {
  return {
    entry,
    name: extractName(entry),
    email: fieldValue(entry, "2"),
    phone: fieldValue(entry, "4"),
    areas: checkedLabels(entry, "6"),
    cvUrl: extractCvUrl(entry),
  }
}

/**
 * The remaining form fields that are already surfaced in the main view —
 * used to render any extra labelled fields. For this fixed form it returns
 * the empty set, but it stays data-driven if the form gains fields.
 */
export function collectFields(entry: GFEntry, excluded: string[] = ["6"]): { label: string; value: string }[] {
  const skip = new Set<string>(["1.2", "1.3", "1.4", "1.6", "1.8", "2", "4", "7", ...excluded])
  const fields: { label: string; value: string }[] = []

  for (const [fieldId, value] of Object.entries(entry)) {
    if (/^\d+(\.\d+)?$/.test(fieldId) === false) continue
    if (skip.has(fieldId)) continue
    if (typeof value !== "string" || value.trim() === "") continue
    const label = FIELD_LABELS[fieldId]
    if (!label) continue
    fields.push({ label, value })
  }

  return fields
}