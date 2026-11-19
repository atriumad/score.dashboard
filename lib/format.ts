import { parseEventDate, parseGfDate } from "./dates"

export function formatReceived(gfDate: string): string {
  const d = parseGfDate(gfDate)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function formatEventDate(value: string): string {
  const d = parseEventDate(value)
  if (!d) return value || "—"
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}
